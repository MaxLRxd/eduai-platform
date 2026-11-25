import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { calcularPromediosPorMateria } from "../notas/notas.service";

/**
 * Reportes del administrador (CU-AD04). Cada cifra sale de una consulta a la base y se puede reproducir:
 *
 *  - Solo cuentan los alumnos con la cuenta activa (los dados de baja no entran en ningun reporte).
 *  - `periodo` (YYYY-1 = ene-jun, YYYY-2 = jul-dic) recorta notas por su periodo y asistencia y tutor por su fecha.
 *  - `materia_id` recorta todo lo que pertenece a una materia.
 *  - «Retencion» y «Uso de la plataforma» miden la actividad de los ultimos 30 dias: no dependen del periodo.
 */

export interface FiltrosReporte {
  periodo?: string;
  materia_id?: string;
}

export interface StatItem {
  label: string;
  value: string;
}

export interface Reporte {
  type: string;
  title: string;
  description: string;
  headline: string;
  stats: StatItem[];
  footnote: string;
}

/** Umbral de aprobacion (escala 1-10 del sistema). */
export const NOTA_APROBACION = 6;
const MAX_FILAS_POR_MATERIA = 8;
const VENTANA_ACTIVIDAD_DIAS = 30;

export const REPORTES_METADATA: { type: string; title: string; description: string }[] = [
  { type: "asistencia", title: "📊 Asistencia general", description: "Asistencia por materia, con filtro por período" },
  { type: "notas", title: "📈 Notas y rendimiento", description: "Promedio ponderado, distribución de calificaciones y detalle por materia" },
  { type: "tutor", title: "🤖 Uso Tutor IA", description: "Consultas, materias más consultadas y sesiones del período" },
  { type: "retencion", title: "👥 Retención y riesgo", description: "Usuarios que siguen activos mes a mes y alertas académicas" },
  { type: "uso", title: "🔑 Uso de la plataforma", description: "Alumnos que usaron el tutor o entregaron actividades en los últimos 30 días" },
  { type: "ejecutivo", title: "📋 Resumen ejecutivo", description: "Informe completo para dirección institucional" },
];

/** Datos crudos, ya filtrados y sin cuentas dadas de baja, desde los que se arma cada reporte. */
export interface DatosReportes {
  filtroEtiqueta: string;
  alumnosActivos: number;
  docentesActivos: number;
  materiasActivas: number;
  nombreMateria: Map<string, string>;
  inscripciones: number;
  alumnosConInscripcion: number;
  notas: { materia_id: string; calificacion: number }[];
  /** Promedio ponderado por categoria de cada materia (el mismo que ve el alumno). */
  promedioPonderado: Map<string, number>;
  asistencias: { materia_id: string; estado: string; cantidad: number }[];
  sesionesTutor: { materia_id: string; cantidad: number }[];
  mensajesTutor: number;
  alertas: { total: number; alta: number };
  actividad30d: { alumnosConSesion: number; alumnosConTutor: number; alumnosConEntrega: number };
  retencion: { valor: number | null; detalle: string };
}

const MESES_VALIDOS = /^\d{4}-[12]$/;

export function validarPeriodo(periodo: string): void {
  if (!MESES_VALIDOS.test(periodo)) {
    throw new AppError(400, "El período debe tener el formato AAAA-1 o AAAA-2");
  }
}

/** Rango [desde, hasta) de un periodo academico. */
export function rangoDePeriodo(periodo: string): { gte: Date; lt: Date } {
  validarPeriodo(periodo);
  const [anio, mitad] = periodo.split("-").map(Number);
  return mitad === 1
    ? { gte: new Date(Date.UTC(anio, 0, 1)), lt: new Date(Date.UTC(anio, 6, 1)) }
    : { gte: new Date(Date.UTC(anio, 6, 1)), lt: new Date(Date.UTC(anio + 1, 0, 1)) };
}

function pct(parte: number, total: number): number | null {
  return total > 0 ? Math.round((parte / total) * 100) : null;
}

function mostrarPct(valor: number | null): string {
  return valor === null ? "Sin datos" : `${valor}%`;
}

function dec(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

function porMateria<T>(items: T[], nombres: Map<string, string>, idDe: (i: T) => string) {
  const grupos = new Map<string, T[]>();
  for (const i of items) grupos.set(idDe(i), [...(grupos.get(idDe(i)) ?? []), i]);
  return [...grupos.entries()]
    .map(([id, valores]) => ({ id, nombre: nombres.get(id) ?? "Materia", valores }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

function limitar<T>(filas: T[]): T[] {
  return filas.slice(0, MAX_FILAS_POR_MATERIA);
}

/** Arma los seis reportes a partir de datos ya consultados. Es pura: mismos datos, mismos numeros. */
export function armarReportes(d: DatosReportes): Reporte[] {
  const sufijo = d.filtroEtiqueta ? ` · ${d.filtroEtiqueta}` : "";

  // --- Asistencia ---
  const total = d.asistencias.reduce((a, r) => a + r.cantidad, 0);
  const sumar = (estados: string[]) =>
    d.asistencias.filter((r) => estados.includes(r.estado)).reduce((a, r) => a + r.cantidad, 0);
  const presentes = sumar(["PRESENTE", "JUSTIFICADO"]);
  const ausentes = sumar(["AUSENTE"]);
  const tardanzas = sumar(["TARDANZA"]);
  const tasaAsistencia = pct(presentes, total);
  const asistenciaPorMateria = porMateria(d.asistencias, d.nombreMateria, (r) => r.materia_id).map((g) => {
    const tot = g.valores.reduce((a, r) => a + r.cantidad, 0);
    const pres = g.valores.filter((r) => r.estado === "PRESENTE" || r.estado === "JUSTIFICADO").reduce((a, r) => a + r.cantidad, 0);
    return { label: g.nombre, value: `${mostrarPct(pct(pres, tot))} (${tot} registros)` };
  });

  // --- Notas ---
  const notasCount = d.notas.length;
  const aprobadas = d.notas.filter((n) => n.calificacion >= NOTA_APROBACION).length;
  const tasaAprobacion = pct(aprobadas, notasCount);
  const promedios = [...d.promedioPonderado.values()];
  const promedioGeneral = promedios.length > 0 ? promedios.reduce((a, b) => a + b, 0) / promedios.length : null;
  const rango = (min: number, max: number) => d.notas.filter((n) => n.calificacion >= min && n.calificacion < max).length;
  const notasPorMateria = [...d.promedioPonderado.entries()]
    .map(([id, promedio]) => ({ nombre: d.nombreMateria.get(id) ?? "Materia", promedio }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .map((m) => ({ label: m.nombre, value: `promedio ${dec(m.promedio)}` }));

  // --- Tutor ---
  const sesiones = d.sesionesTutor.reduce((a, s) => a + s.cantidad, 0);
  const topTutor = [...d.sesionesTutor]
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 3)
    .map((s) => ({ label: d.nombreMateria.get(s.materia_id) ?? "Materia", value: `${s.cantidad} consultas` }));

  // --- Retencion y riesgo ---
  const retencionTexto = d.retencion.valor === null ? "Sin datos" : `${d.retencion.valor}%`;

  const reports: Record<string, Reporte> = {
    asistencia: {
      type: "asistencia",
      title: "📊 Asistencia general",
      description: `Asistencia por materia${sufijo}`,
      headline: `${mostrarPct(tasaAsistencia)} de asistencia`,
      stats: [
        { label: "Registros totales", value: String(total) },
        { label: "Presentes (incluye justificados)", value: String(presentes) },
        { label: "Ausencias", value: String(ausentes) },
        { label: "Tardanzas", value: String(tardanzas) },
        ...limitar(asistenciaPorMateria),
      ],
      footnote: "Asistencia = (presentes + justificados) / registros. Solo alumnos con cuenta activa.",
    },
    notas: {
      type: "notas",
      title: "📈 Notas y rendimiento",
      description: `Promedio ponderado y distribución de calificaciones${sufijo}`,
      headline: promedioGeneral === null ? "Sin notas" : `Promedio ${dec(promedioGeneral)}`,
      stats: [
        { label: "Calificaciones cargadas", value: String(notasCount) },
        { label: `Aprobadas (≥${NOTA_APROBACION})`, value: `${aprobadas} (${mostrarPct(tasaAprobacion)})` },
        { label: "Menos de 4", value: String(rango(0, 4)) },
        { label: "De 4 a 5,99", value: String(rango(4, 6)) },
        { label: "De 6 a 7,99", value: String(rango(6, 8)) },
        { label: "De 8 a 10", value: String(d.notas.filter((n) => n.calificacion >= 8).length) },
        ...limitar(notasPorMateria),
      ],
      footnote:
        "El promedio es la media de los promedios ponderados por categoría de cada materia (el mismo cálculo que ve el alumno).",
    },
    tutor: {
      type: "tutor",
      title: "🤖 Uso Tutor IA",
      description: `Consultas y materias más consultadas${sufijo}`,
      headline: `${sesiones} sesiones de tutor`,
      stats: [
        { label: "Sesiones IA", value: String(sesiones) },
        { label: "Mensajes intercambiados", value: String(d.mensajesTutor) },
        ...topTutor,
      ],
      footnote: "Top de materias por cantidad de sesiones del tutor. Solo alumnos con cuenta activa.",
    },
    retencion: {
      type: "retencion",
      title: "👥 Retención y riesgo",
      description: "Usuarios que siguen activos mes a mes y alertas académicas",
      headline: `${retencionTexto} de retención mensual`,
      stats: [
        { label: "Detalle", value: d.retencion.detalle },
        { label: "Alumnos con cuenta activa", value: String(d.alumnosActivos) },
        { label: "Alertas académicas activas", value: String(d.alertas.total) },
        { label: "Alertas de severidad ALTA", value: String(d.alertas.alta) },
      ],
      footnote:
        "Retención mensual = usuarios con sesión en los últimos 30 días que ya tenían sesión en los 30 anteriores (la misma de «Métricas de éxito»). No depende del período.",
    },
    uso: {
      type: "uso",
      title: "🔑 Uso de la plataforma",
      description: "Actividad real de los alumnos en los últimos 30 días",
      headline: `${d.actividad30d.alumnosConSesion} de ${d.alumnosActivos} alumnos activos`,
      stats: [
        { label: "Alumnos que ingresaron", value: String(d.actividad30d.alumnosConSesion) },
        { label: "Alumnos que consultaron al tutor", value: String(d.actividad30d.alumnosConTutor) },
        { label: "Alumnos que entregaron una actividad", value: String(d.actividad30d.alumnosConEntrega) },
        { label: "Inscripciones vigentes", value: String(d.inscripciones) },
        { label: "Materias activas", value: String(d.materiasActivas) },
      ],
      footnote: "Alumno activo = tuvo al menos una sesión de ingreso en los últimos 30 días.",
    },
    ejecutivo: {
      type: "ejecutivo",
      title: "📋 Resumen ejecutivo",
      description: `Informe completo para dirección institucional${sufijo}`,
      headline: `${d.alumnosActivos} alumnos · ${d.docentesActivos} docentes · ${d.materiasActivas} materias`,
      stats: [
        { label: "Inscripciones vigentes", value: String(d.inscripciones) },
        { label: "Asistencia promedio", value: mostrarPct(tasaAsistencia) },
        { label: "Promedio de notas", value: promedioGeneral === null ? "Sin datos" : dec(promedioGeneral) },
        { label: "Tasa de aprobación", value: mostrarPct(tasaAprobacion) },
        { label: "Retención mensual", value: retencionTexto },
        { label: "Alertas activas", value: String(d.alertas.total) },
      ],
      footnote: "Datos de la institución al momento de la consulta; asistencia, notas y alertas respetan el filtro elegido.",
    },
  };

  return REPORTES_METADATA.map((meta) => ({ ...meta, ...reports[meta.type] }));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Consulta la base con los filtros pedidos y devuelve los seis reportes. */
export async function reportesAdmin(
  filtros: FiltrosReporte = {},
  retencionMensual: () => Promise<{ valor: number | null; detalle: string }>
): Promise<Reporte[]> {
  const { periodo, materia_id: materiaId } = filtros;
  const rango = periodo ? rangoDePeriodo(periodo) : undefined;

  let nombreFiltro = "";
  if (materiaId) {
    if (!UUID.test(materiaId)) throw new AppError(404, "Materia no encontrada");
    const materia = await prisma.materia.findUnique({ where: { id: materiaId }, select: { nombre: true } });
    if (!materia) throw new AppError(404, "Materia no encontrada");
    nombreFiltro = materia.nombre;
  }
  const etiqueta = [periodo ? `Período ${periodo}` : "", nombreFiltro].filter(Boolean).join(" · ");

  const delAlumno = { alumno: { activo: true } };
  const enMateria = materiaId ? { materia_id: materiaId } : {};
  const desde = new Date(Date.now() - VENTANA_ACTIVIDAD_DIAS * 24 * 60 * 60 * 1000);
  const alumnoActivo = { rol: "ALUMNO" as const, activo: true };

  const [
    alumnosActivos,
    docentesActivos,
    materias,
    inscripciones,
    notas,
    asistencias,
    sesiones,
    mensajes,
    alertas,
    conSesion,
    conTutor,
    conEntrega,
    retencion,
  ] = await Promise.all([
    prisma.usuario.count({ where: alumnoActivo }),
    prisma.usuario.count({ where: { rol: "PROFESOR", activo: true } }),
    prisma.materia.findMany({ select: { id: true, nombre: true, activa: true } }),
    prisma.inscripcion.findMany({ where: { ...delAlumno, ...enMateria }, select: { alumno_id: true } }),
    prisma.nota.findMany({
      where: { ...delAlumno, ...enMateria, ...(periodo ? { periodo } : {}) },
      select: { materia_id: true, categoria_id: true, calificacion: true },
    }),
    prisma.asistencia.groupBy({
      by: ["materia_id", "estado"],
      where: { ...delAlumno, ...enMateria, ...(rango ? { fecha_clase: rango } : {}) },
      _count: { _all: true },
    }),
    prisma.sesionIA.groupBy({
      by: ["materia_id"],
      where: { ...delAlumno, ...enMateria, ...(rango ? { iniciada_en: rango } : {}) },
      _count: { _all: true },
    }),
    prisma.mensajeIA.count({
      where: { sesion: { ...delAlumno, ...enMateria, ...(rango ? { iniciada_en: rango } : {}) } },
    }),
    prisma.alertaRiesgoAcademico.groupBy({
      by: ["nivel_severidad"],
      where: { activa: true, ...delAlumno, ...enMateria },
      _count: { _all: true },
    }),
    prisma.sesion.findMany({
      where: { created_at: { gte: desde }, usuario: alumnoActivo },
      select: { usuario_id: true },
      distinct: ["usuario_id"],
    }),
    prisma.sesionIA.findMany({
      where: { iniciada_en: { gte: desde }, ...delAlumno, mensajes: { some: { rol: "USER" } } },
      select: { alumno_id: true },
      distinct: ["alumno_id"],
    }),
    prisma.entrega.findMany({
      where: { entregado_en: { gte: desde }, ...delAlumno },
      select: { alumno_id: true },
      distinct: ["alumno_id"],
    }),
    retencionMensual(),
  ]);

  const promedios = await calcularPromediosPorMateria(
    notas.map((n) => ({ materia_id: n.materia_id, categoria_id: n.categoria_id, calificacion: n.calificacion.toNumber() }))
  );

  return armarReportes({
    filtroEtiqueta: etiqueta,
    alumnosActivos,
    docentesActivos,
    materiasActivas: materias.filter((m) => m.activa).length,
    nombreMateria: new Map(materias.map((m) => [m.id, m.nombre])),
    inscripciones: inscripciones.length,
    alumnosConInscripcion: new Set(inscripciones.map((i) => i.alumno_id)).size,
    notas: notas.map((n) => ({ materia_id: n.materia_id, calificacion: n.calificacion.toNumber() })),
    promedioPonderado: new Map(
      [...promedios.entries()].flatMap(([id, r]) => (r.promedio === null ? [] : [[id, r.promedio] as [string, number]]))
    ),
    asistencias: asistencias.map((a) => ({ materia_id: a.materia_id, estado: a.estado, cantidad: a._count._all })),
    sesionesTutor: sesiones.map((s) => ({ materia_id: s.materia_id, cantidad: s._count._all })),
    mensajesTutor: mensajes,
    alertas: {
      total: alertas.reduce((a, b) => a + b._count._all, 0),
      alta: alertas.find((x) => x.nivel_severidad === "ALTA")?._count._all ?? 0,
    },
    actividad30d: {
      alumnosConSesion: conSesion.length,
      alumnosConTutor: conTutor.length,
      alumnosConEntrega: conEntrega.length,
    },
    retencion,
  });
}
