import bcrypt from "bcryptjs";
import type { TipoProfesor } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import type {
  ActualizarEstadoInput,
  ActualizarMateriaAdminInput,
  AsignarProfesorInput,
  CambiarRolInput,
  CrearMateriaAdminInput,
  CrearUsuarioInput,
  GenerarClaveAdminInput,
} from "./admin.schemas";
import { generarClaveUnica } from "../materias/materias.service";

function toUsuarioDto(u: {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  created_at: Date;
  perfilProfesor?: { id: string; tipo_profesor: TipoProfesor } | null;
  _count?: { inscripciones: number };
}) {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    rol: u.rol,
    activo: u.activo,
    tipo_profesor: u.perfilProfesor?.tipo_profesor ?? null,
    profesor_id: u.perfilProfesor?.id ?? null,
    inscripciones: u._count?.inscripciones ?? 0,
    created_at: u.created_at,
  };
}

function assertUuid(id: string, mensaje: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new AppError(404, mensaje);
  }
}

export async function listarUsuarios(page: number, pageSize: number, rol?: string, activo?: boolean) {
  const skip = (page - 1) * pageSize;

  const [total, usuarios] = await Promise.all([
    prisma.usuario.count({
      where: { rol: rol as never, activo },
    }),
    prisma.usuario.findMany({
      where: { rol: rol as never, activo },
      include: {
        perfilProfesor: { select: { id: true, tipo_profesor: true } },
        _count: { select: { inscripciones: true } },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: usuarios.map(toUsuarioDto),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function crearUsuario(input: CrearUsuarioInput) {
  const existe = await prisma.usuario.findUnique({ where: { email: input.email } });

  if (existe) {
    throw new AppError(409, "Ya existe una cuenta con ese email");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nombre: input.nombre,
      email: input.email,
      password_hash: passwordHash,
      rol: input.rol,
      perfilProfesor:
        input.rol === "PROFESOR"
          ? { create: { tipo_profesor: input.tipo_profesor ?? ("TITULAR" as TipoProfesor) } }
          : undefined,
    },
    include: {
      perfilProfesor: { select: { id: true, tipo_profesor: true } },
      _count: { select: { inscripciones: true } },
    },
  });

  return toUsuarioDto(usuario);
}

export async function actualizarEstado(usuarioId: string, input: ActualizarEstadoInput, solicitanteId: string) {
  assertUuid(usuarioId, "Usuario no encontrado");

  if (usuarioId === solicitanteId) {
    throw new AppError(400, "No podes desactivarte a vos mismo");
  }

  const existente = await prisma.usuario.findUnique({ where: { id: usuarioId } });

  if (!existente) {
    throw new AppError(404, "Usuario no encontrado");
  }

  const actualizado = await prisma.usuario.update({
    where: { id: usuarioId },
    data: { activo: input.activo },
  });

  return toUsuarioDto(actualizado);
}

export async function cambiarRol(usuarioId: string, input: CambiarRolInput) {
  assertUuid(usuarioId, "Usuario no encontrado");

  const existente = await prisma.usuario.findUnique({ where: { id: usuarioId } });

  if (!existente) {
    throw new AppError(404, "Usuario no encontrado");
  }

  const data: Parameters<typeof prisma.usuario.update>[0]["data"] = { rol: input.rol };

  if (input.rol === "PROFESOR") {
    const perfil = await prisma.profesor.findUnique({ where: { usuario_id: usuarioId } });

    if (!perfil) {
      data.perfilProfesor = {
        create: { tipo_profesor: input.tipo_profesor ?? ("TITULAR" as TipoProfesor) },
      };
    } else {
      data["perfilProfesor"] = {
        update: { tipo_profesor: input.tipo_profesor ?? perfil.tipo_profesor },
      };
    }
  }

  const actualizado = await prisma.usuario.update({
    where: { id: usuarioId },
    data,
    include: {
      perfilProfesor: { select: { id: true, tipo_profesor: true } },
      _count: { select: { inscripciones: true } },
    },
  });

  return toUsuarioDto(actualizado);
}

export async function listarMaterias(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;

  const [total, materias] = await Promise.all([
    prisma.materia.count(),
    prisma.materia.findMany({
      include: {
        _count: { select: { inscripciones: true, secciones: true } },
        profesores: {
          where: { activo: true },
          select: { profesor: { select: { usuario: { select: { id: true, nombre: true, email: true } } } } },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: materias.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      descripcion: m.descripcion,
      nivel_educativo: m.nivel_educativo,
      activa: m.activa,
      inscriptos: m._count.inscripciones,
      secciones: m._count.secciones,
      profesores: m.profesores.map((p) => p.profesor.usuario),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function crearMateria(input: CrearMateriaAdminInput) {
  const materia = await prisma.materia.create({
    data: {
      nombre: input.nombre,
      descripcion: input.descripcion,
      nivel_educativo: input.nivel_educativo,
    },
    include: { _count: { select: { inscripciones: true, secciones: true } } },
  });

  return {
    id: materia.id,
    nombre: materia.nombre,
    descripcion: materia.descripcion,
    nivel_educativo: materia.nivel_educativo,
    activa: materia.activa,
    inscriptos: materia._count.inscripciones,
    secciones: materia._count.secciones,
  };
}

export async function actualizarMateria(materiaId: string, input: ActualizarMateriaAdminInput) {
  assertUuid(materiaId, "Materia no encontrada");

  const existente = await prisma.materia.findUnique({ where: { id: materiaId } });

  if (!existente) {
    throw new AppError(404, "Materia no encontrada");
  }

  const materia = await prisma.materia.update({
    where: { id: materiaId },
    data: {
      nombre: input.nombre,
      descripcion: input.descripcion,
      nivel_educativo: input.nivel_educativo,
      activa: input.activa,
    },
    include: { _count: { select: { inscripciones: true, secciones: true } } },
  });

  return {
    id: materia.id,
    nombre: materia.nombre,
    descripcion: materia.descripcion,
    nivel_educativo: materia.nivel_educativo,
    activa: materia.activa,
    inscriptos: materia._count.inscripciones,
    secciones: materia._count.secciones,
  };
}

export async function asignarProfesor(materiaId: string, input: AsignarProfesorInput) {
  assertUuid(materiaId, "Materia no encontrada");

  const materia = await prisma.materia.findUnique({ where: { id: materiaId } });

  if (!materia) {
    throw new AppError(404, "Materia no encontrada");
  }

  const profesor = await prisma.profesor.findUnique({ where: { id: input.profesor_id } });

  if (!profesor) {
    throw new AppError(404, "Profesor no encontrado");
  }

  const asignacion = await prisma.materiaProfesor.upsert({
    where: {
      materia_id_profesor_id: { materia_id: materiaId, profesor_id: input.profesor_id },
    },
    update: { activo: input.activo, desasignado_en: input.activo ? null : new Date() },
    create: { materia_id: materiaId, profesor_id: input.profesor_id, activo: input.activo },
  });

  return {
    materia_id: materiaId,
    profesor_id: input.profesor_id,
    activo: asignacion.activo,
  };
}

function toClaveDto(clave: {
  id: string;
  materia_id: string;
  clave: string;
  activa: boolean;
  vencimiento: Date | null;
  max_usos: number | null;
  usos_actuales: number;
  revocada_en: Date | null;
  materia?: { id: string; nombre: string };
  inscripciones?: { alumno: { nombre: string } }[];
}) {
  return {
    id: clave.id,
    materia_id: clave.materia_id,
    materia_nombre: clave.materia?.nombre ?? "",
    codigo: clave.clave,
    estado: clave.activa && clave.revocada_en === null ? "activa" : "revocada",
    vencimiento: clave.vencimiento,
    max_usos: clave.max_usos,
    usos: clave.usos_actuales,
    inscriptos: (clave.inscripciones ?? []).map((i) => i.alumno.nombre),
  };
}

// GET /admin/enrollment-keys — listado de claves (filtro por materia opcional).
export async function listarClavesAdmin(materiaId?: string) {
  const claves = await prisma.claveMatriculacion.findMany({
    where: materiaId ? { materia_id: materiaId } : undefined,
    include: {
      materia: { select: { id: true, nombre: true } },
      inscripciones: {
        select: { alumno: { select: { nombre: true } } },
        orderBy: { inscripto_en: "desc" },
      },
    },
    orderBy: { created_at: "desc" },
    take: 200,
  });
  return claves.map(toClaveDto);
}

// POST /admin/enrollment-keys — genera una clave para una materia.
export async function generarClaveAdmin(input: GenerarClaveAdminInput) {
  const materia = await prisma.materia.findUnique({ where: { id: input.materia_id } });

  if (!materia) {
    throw new AppError(404, "Materia no encontrada");
  }

  if (!materia.activa) {
    throw new AppError(400, "La materia no está activa");
  }

  const clave = await prisma.claveMatriculacion.create({
    data: {
      materia_id: input.materia_id,
      clave: generarClaveUnica(),
      max_usos: input.max_usos,
      vencimiento: input.vencimiento,
    },
    include: { materia: { select: { id: true, nombre: true } } },
  });

  return toClaveDto(clave);
}

// PATCH /admin/enrollment-keys/:claveId/revocar — revoca una clave activa.
export async function revocarClaveAdmin(claveId: string) {
  assertUuid(claveId, "Clave no encontrada");

  const existente = await prisma.claveMatriculacion.findUnique({ where: { id: claveId } });

  if (!existente) {
    throw new AppError(404, "Clave no encontrada");
  }

  const clave = await prisma.claveMatriculacion.update({
    where: { id: claveId },
    data: { activa: false, revocada_en: new Date() },
    include: { materia: { select: { id: true, nombre: true } } },
  });

  return toClaveDto(clave);
}

interface StatItem {
  label: string;
  value: string;
}

interface Reporte {
  type: string;
  title: string;
  description: string;
  headline: string;
  stats: StatItem[];
  footnote: string;
}

const REPORTES_METADATA: { type: string; title: string; description: string }[] = [
  { type: "asistencia", title: "📊 Asistencia general", description: "Asistencia promedio por materia y período" },
  { type: "notas", title: "📈 Notas y rendimiento", description: "Promedio global y distribución de calificaciones" },
  { type: "tutor", title: "🤖 Uso Tutor IA", description: "Consultas, materias más consultadas y sesiones activas" },
  { type: "retencion", title: "👥 Retención de alumnos", description: "Alumnos activos, inscriptos y en riesgo" },
  { type: "mau", title: "🔑 Consumo MAU", description: "Alumnos activos e inscripciones por período" },
  { type: "ejecutivo", title: "📋 Resumen ejecutivo", description: "Informe completo para dirección institucional" },
];

export async function reportesAdmin() {
  const [usuarios, inscripcionesCount, materiasCount, notas, asistencia, sesionesCount, mensajesCount, alertas, claves, sesionesTop] =
    await Promise.all([
      prisma.usuario.groupBy({ by: ["rol"], _count: { _all: true } }),
      prisma.inscripcion.count(),
      prisma.materia.count(),
      prisma.nota.findMany({
        select: { calificacion: true, materia_id: true },
      }),
      prisma.asistencia.groupBy({ by: ["estado"], _count: { _all: true } }),
      prisma.sesionIA.count(),
      prisma.mensajeIA.count(),
      prisma.alertaRiesgoAcademico.groupBy({ by: ["nivel_severidad"], where: { activa: true }, _count: { _all: true } }),
      prisma.claveMatriculacion.aggregate({ _sum: { usos_actuales: true } }),
      prisma.sesionIA.groupBy({ by: ["materia_id"], _count: { _all: true }, orderBy: { _count: { materia_id: "desc" } }, take: 5 }),
    ]);

  const contarRol = (rol: string) => usuarios.find((u) => u.rol === rol)?._count._all ?? 0;
  const alumnos = contarRol("ALUMNO");
  const docentes = contarRol("PROFESOR");

  const notasCount = notas.length;
  const promedioGlobal = notasCount > 0 ? notas.reduce((a, b) => a + b.calificacion.toNumber(), 0) / notasCount : 0;
  const aprobadas = notas.filter((n) => n.calificacion.toNumber() >= 6).length;
  const tasaAprobacion = notasCount > 0 ? Math.round((aprobadas / notasCount) * 100) : 0;

  const sumaAsistencia = asistencia.reduce((a, b) => a + b._count._all, 0);
  const presentes = asistencia.filter((a) => a.estado === "PRESENTE" || a.estado === "JUSTIFICADO").reduce((a, b) => a + b._count._all, 0);
  const ausentes = asistencia.filter((a) => a.estado === "AUSENTE").reduce((a, b) => a + b._count._all, 0);
  const tardanzas = asistencia.filter((a) => a.estado === "TARDANZA").reduce((a, b) => a + b._count._all, 0);
  const tasaAsistencia = sumaAsistencia > 0 ? Math.round((presentes / sumaAsistencia) * 100) : 0;

  const topMaterias = await prisma.materia.findMany({
    where: { id: { in: sesionesTop.map((s) => s.materia_id) } },
    select: { id: true, nombre: true },
  });
  const nombreMateria = new Map(topMaterias.map((m) => [m.id, m.nombre]));

  const alumnosInscriptos = await prisma.inscripcion.groupBy({ by: ["alumno_id"], _count: { _all: true } });
  const tasaRetencion = alumnos > 0 ? Math.round((alumnosInscriptos.length / alumnos) * 100) : 0;

  const alertasCount = alertas.reduce((a, b) => a + b._count._all, 0);
  const alertasAlta = alertas.find((x) => x.nivel_severidad === "ALTA")?._count._all ?? 0;
  const usosClaves = claves._sum.usos_actuales ?? 0;

  const reports: Record<string, Reporte> = {
    asistencia: {
      type: "asistencia",
      title: "📊 Asistencia general",
      description: "Asistencia promedio por materia y período",
      headline: `${tasaAsistencia}% de asistencia`,
      stats: [
        { label: "Registros totales", value: String(sumaAsistencia) },
        { label: "Presentes", value: String(presentes) },
        { label: "Ausencias", value: String(ausentes) },
        { label: "Tardanzas", value: String(tardanzas) },
      ],
      footnote: "Sobre la totalidad de asistencias registradas en el sistema.",
    },
    notas: {
      type: "notas",
      title: "📈 Notas y rendimiento",
      description: "Promedio global y distribución de calificaciones",
      headline: `Promedio ${promedioGlobal.toFixed(2)}`,
      stats: [
        { label: "Calificaciones cargadas", value: String(notasCount) },
        { label: "Aprobadas (≥6)", value: `${aprobadas} (${tasaAprobacion}%)` },
        { label: "Docentes", value: String(docentes) },
      ],
      footnote: `Tasa de aprobación del ${tasaAprobacion}% sobre las notas registradas.`,
    },
    tutor: {
      type: "tutor",
      title: "🤖 Uso Tutor IA",
      description: "Consultas, materias más consultadas y sesiones activas",
      headline: `${sesionesCount} sesiones de tutor`,
      stats: [
        { label: "Sesiones IA", value: String(sesionesCount) },
        { label: "Mensajes intercambiados", value: String(mensajesCount) },
        ...sesionesTop.slice(0, 3).map((s) => ({
          label: nombreMateria.get(s.materia_id) ?? "Materia",
          value: `${s._count._all} consultas`,
        })),
      ],
      footnote: "Top de materias por cantidad de sesiones del tutor.",
    },
    retencion: {
      type: "retencion",
      title: "👥 Retención de alumnos",
      description: "Alumnos activos, inscriptos y en riesgo",
      headline: `${tasaRetencion}% de retención`,
      stats: [
        { label: "Alumnos registrados", value: String(alumnos) },
        { label: "Alumnos inscriptos a ≥1 materia", value: String(alumnosInscriptos.length) },
        { label: "Alertas académicas activas", value: String(alertasCount) },
        { label: "Alertas de severidad ALTA", value: String(alertasAlta) },
      ],
      footnote: "La retención mide alumnos con al menos una inscripción activa.",
    },
    mau: {
      type: "mau",
      title: "🔑 Consumo MAU",
      description: "Alumnos activos e inscripciones por período",
      headline: `${alumnosInscriptos.length} alumnos activos`,
      stats: [
        { label: "Alumnos con actividad", value: String(alumnosInscriptos.length) },
        { label: "Inscripciones totales", value: String(inscripcionesCount) },
        { label: "Materias registradas", value: String(materiasCount) },
        { label: "Usos de claves de acceso", value: String(usosClaves) },
      ],
      footnote: "Alumno activo = cuenta con al menos una inscripción a materias.",
    },
    ejecutivo: {
      type: "ejecutivo",
      title: "📋 Resumen ejecutivo",
      description: "Informe completo para dirección institucional",
      headline: `${alumnos} alumnos · ${docentes} docentes · ${materiasCount} materias`,
      stats: [
        { label: "Inscripciones totales", value: String(inscripcionesCount) },
        { label: "Asistencia promedio", value: `${tasaAsistencia}%` },
        { label: "Promedio de notas", value: promedioGlobal.toFixed(2) },
        { label: "Tasa de aprobación", value: `${tasaAprobacion}%` },
        { label: "Retención de alumnos", value: `${tasaRetencion}%` },
        { label: "Alertas activas", value: String(alertasCount) },
      ],
      footnote: "Datos globales de la institución al momento de la consulta.",
    },
  };

  return REPORTES_METADATA.map((meta) => ({ ...meta, ...reports[meta.type] }));
}

function escapeCsvCell(cell: string): string {
  return `"${cell.replace(/"/g, '""')}"`;
}

function csvFromReporte(r: Reporte): string {
  const lines: string[][] = [
    [r.title],
    [r.description],
    [],
    ["Métrica", "Valor"],
    ...r.stats.map((s) => [s.label, s.value]),
    [],
    [r.footnote],
  ];
  return lines.map((line) => line.map(escapeCsvCell).join(",")).join("\n");
}

export async function exportarReporteCsv(type: string) {
  const reportes = await reportesAdmin();
  const reporte = reportes.find((r) => r.type === type);

  if (!reporte) {
    throw new AppError(404, "Reporte no encontrado");
  }

  return {
    filename: `reporte-${type}.csv`,
    csv: csvFromReporte(reporte),
  };
}
