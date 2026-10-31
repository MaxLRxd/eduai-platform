import bcrypt from "bcryptjs";
import type { TipoProfesor } from "@prisma/client";
import { renderReportePdf } from "./reportsPdf";
import { prisma } from "../../config/prisma";
import { logger } from "../../config/logger";
import { AppError } from "../../middlewares/error";
import { crearNoLeidas } from "../notificaciones/notificaciones.service";
import type { CrearNotificacionInput } from "../notificaciones/notificaciones.schemas";
import type {
  ActualizarEstadoInput,
  ActualizarMateriaAdminInput,
  AsignarProfesorInput,
  CambiarRolInput,
  CrearMateriaAdminInput,
  CrearUsuarioInput,
  GenerarClaveAdminInput,
} from "./admin.schemas";
import { exigirNombreDeMateriaLibre, exigirVencimientoFuturo, generarClaveUnica } from "../materias/materias.service";

/** Aviso in-app que nunca debe tumbar la operacion administrativa que lo origina. */
async function avisar(input: CrearNotificacionInput): Promise<void> {
  try {
    await crearNoLeidas(input);
  } catch (err) {
    logger.warn({ err, usuarioId: input.usuario_id }, "No se pudo crear la notificacion");
  }
}

const ROL_LEGIBLE: Record<string, string> = { ALUMNO: "alumno", PROFESOR: "docente", ADMIN: "administrador" };

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
  const existe = await prisma.usuario.findFirst({
    where: { email: { equals: input.email, mode: "insensitive" } },
  });

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

  // CU-AD03: el nuevo usuario recibe el aviso de alta dentro de la plataforma. La contraseña
  // temporal no se guarda ni se envia en el aviso: el administrador se la entrega aparte.
  await avisar({
    usuario_id: usuario.id,
    tipo: "SISTEMA",
    titulo: "Tu cuenta fue creada",
    mensaje: `Te dieron de alta como ${ROL_LEGIBLE[usuario.rol] ?? "usuario"}. Ingresá con tu email (${usuario.email}) y la contraseña temporal que te indicó el administrador, y cambiala desde "Mi perfil".`,
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

  // Dar de baja corta tambien las sesiones abiertas: sin esto el refresh token seguiria
  // vivo hasta su vencimiento (el token de acceso dura 15 minutos).
  if (!input.activo) {
    await prisma.sesion.updateMany({
      where: { usuario_id: usuarioId, revocado: false },
      data: { revocado: true },
    });
  }

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
  await exigirNombreDeMateriaLibre(input.nombre);

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

  if (input.nombre && input.nombre.trim().toLowerCase() !== existente.nombre.trim().toLowerCase()) {
    await exigirNombreDeMateriaLibre(input.nombre, materiaId);
  }

  // CU-AD01 (A3.1): una materia con alumnos inscriptos no se da de baja.
  if (input.activa === false && existente.activa) {
    const inscriptos = await prisma.inscripcion.count({ where: { materia_id: materiaId } });

    if (inscriptos > 0) {
      throw new AppError(
        409,
        `No se puede desactivar la materia: tiene ${inscriptos} ${inscriptos === 1 ? "alumno inscripto" : "alumnos inscriptos"}. Desmatricularlos antes de darla de baja`
      );
    }
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

  const previa = await prisma.materiaProfesor.findUnique({
    where: { materia_id_profesor_id: { materia_id: materiaId, profesor_id: input.profesor_id } },
  });

  // CU-AD02 (E1): no se duplica una asignacion vigente.
  if (input.activo && previa?.activo) {
    throw new AppError(409, "El profesor ya se encuentra asignado a esta materia");
  }

  if (!input.activo && !previa?.activo) {
    throw new AppError(409, "El profesor no se encuentra asignado a esta materia");
  }

  const asignacion = await prisma.materiaProfesor.upsert({
    where: {
      materia_id_profesor_id: { materia_id: materiaId, profesor_id: input.profesor_id },
    },
    update: { activo: input.activo, desasignado_en: input.activo ? null : new Date() },
    create: { materia_id: materiaId, profesor_id: input.profesor_id, activo: input.activo },
  });

  await avisar({
    usuario_id: profesor.usuario_id,
    tipo: "SISTEMA",
    titulo: input.activo ? "Nueva materia asignada" : "Materia desasignada",
    mensaje: input.activo
      ? `Te asignaron la materia "${materia.nombre}". Ya podés gestionar su contenido y sus alumnos.`
      : `Ya no estás asignado a la materia "${materia.nombre}" y perdiste el acceso a su gestión.`,
    referencia_tipo: "materia",
    referencia_id: materiaId,
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

  exigirVencimientoFuturo(input.vencimiento);

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

export async function exportarReportePdf(type: string) {
  const reportes = await reportesAdmin();
  const reporte = reportes.find((r) => r.type === type);

  if (!reporte) {
    throw new AppError(404, "Reporte no encontrado");
  }

  const buffer = await renderReportePdf(reporte);

  return {
    filename: `reporte-${type}.pdf`,
    pdf: buffer.toString("base64"),
  };
}

export async function exportarReporte(type: string, formato: "csv" | "pdf" = "csv") {
  return formato === "pdf" ? exportarReportePdf(type) : exportarReporteCsv(type);
}

const PLANES_LICENCIA: {
  name: string;
  maxMau: number;
  range: string;
  features: string;
}[] = [
  { name: "Starter", maxMau: 100, range: "≤ 100 MAU", features: "LMS + IA básico" },
  { name: "Growth", maxMau: 500, range: "101 – 500 MAU", features: "+ Corrección + Analítica" },
  { name: "Scale", maxMau: 2000, range: "501 – 2K MAU", features: "+ SSO + Integración" },
  { name: "Enterprise", maxMau: Number.POSITIVE_INFINITY, range: "2K+ MAU", features: "Personalizado" },
];

const LIMITE_MAU = 5000;

export async function obtenerEstadoLicencia() {
  const maus = await prisma.usuario.count({
    where: { rol: "ALUMNO", activo: true },
  });

  const planActual = PLANES_LICENCIA.find((p) => maus <= p.maxMau) ?? PLANES_LICENCIA[PLANES_LICENCIA.length - 1];
  const limite = Number.isFinite(planActual.maxMau) ? planActual.maxMau : LIMITE_MAU;

  return {
    uso: {
      current: maus,
      limit: limite,
    },
    planes: PLANES_LICENCIA.map((p) => ({
      name: p.name,
      range: p.range,
      features: p.features,
      current: p.name === planActual.name,
    })),
  };
}

/**
 * CU-AD01 (A3.1): un alumno se desmatricula para poder dar de baja una materia. Se conserva su
 * historial (notas, entregas, asistencia); solo pierde el acceso. Libera su lugar en la clave.
 */
export async function desmatricular(materiaId: string, alumnoId: string) {
  assertUuid(materiaId, "Materia no encontrada");
  assertUuid(alumnoId, "Alumno no encontrado");

  const inscripcion = await prisma.inscripcion.findUnique({
    where: { alumno_id_materia_id: { alumno_id: alumnoId, materia_id: materiaId } },
    include: { materia: { select: { nombre: true } } },
  });

  if (!inscripcion) {
    throw new AppError(404, "El alumno no esta inscripto en esta materia");
  }

  await prisma.$transaction([
    prisma.inscripcion.delete({ where: { id: inscripcion.id } }),
    prisma.claveMatriculacion.updateMany({
      where: { id: inscripcion.clave_id, usos_actuales: { gt: 0 } },
      data: { usos_actuales: { decrement: 1 } },
    }),
  ]);

  await avisar({
    usuario_id: alumnoId,
    tipo: "SISTEMA",
    titulo: "Baja de matrícula",
    mensaje: `Fuiste desmatriculado de "${inscripcion.materia.nombre}". Ya no tenés acceso a su contenido ni al tutor IA.`,
    referencia_tipo: "materia",
    referencia_id: materiaId,
  });

  return { desmatriculado: true };
}

/** Desmatricula a todos los alumnos de la materia (paso previo a darla de baja). */
export async function desmatricularTodos(materiaId: string) {
  assertUuid(materiaId, "Materia no encontrada");

  const materia = await prisma.materia.findUnique({ where: { id: materiaId } });

  if (!materia) {
    throw new AppError(404, "Materia no encontrada");
  }

  const inscripciones = await prisma.inscripcion.findMany({ where: { materia_id: materiaId } });

  if (inscripciones.length === 0) {
    return { cantidad: 0 };
  }

  const usosPorClave = new Map<string, number>();
  for (const i of inscripciones) {
    usosPorClave.set(i.clave_id, (usosPorClave.get(i.clave_id) ?? 0) + 1);
  }

  await prisma.$transaction([
    prisma.inscripcion.deleteMany({ where: { materia_id: materiaId } }),
    ...[...usosPorClave].map(([claveId, cantidad]) =>
      prisma.claveMatriculacion.updateMany({
        where: { id: claveId, usos_actuales: { gte: cantidad } },
        data: { usos_actuales: { decrement: cantidad } },
      })
    ),
  ]);

  await Promise.all(
    inscripciones.map((i) =>
      avisar({
        usuario_id: i.alumno_id,
        tipo: "SISTEMA",
        titulo: "Baja de matrícula",
        mensaje: `Fuiste desmatriculado de "${materia.nombre}". Ya no tenés acceso a su contenido ni al tutor IA.`,
        referencia_tipo: "materia",
        referencia_id: materiaId,
      })
    )
  );

  return { cantidad: inscripciones.length };
}

const VENTANA_METRICAS_DIAS = 30;

/** Porcentaje con un decimal; `null` cuando no hay base sobre la cual calcularlo. */
export function porcentaje(parte: number, total: number): number | null {
  return total > 0 ? Math.round((parte / total) * 1000) / 10 : null;
}

function evaluar(valor: number | null, objetivo: number) {
  return { valor, objetivo, cumple: valor === null ? null : valor >= objetivo };
}

/**
 * Metricas de exito del proyecto (Delimitacion del problema, 1.1), calculadas con datos reales:
 *  - uso del tutor IA por alumno activo >= 40%
 *  - actividades con feedback revisado por el alumno >= 60%
 *  - retencion mensual de usuarios activos >= 70%
 * La reduccion del tiempo de preparacion docente (>= 30%) sale de una encuesta, no del sistema.
 * "Activo" = inicio sesion en la ventana de 30 dias.
 */
export async function metricasDeExito() {
  const ahora = Date.now();
  const desde = new Date(ahora - VENTANA_METRICAS_DIAS * 24 * 60 * 60 * 1000);
  const desdeAnterior = new Date(ahora - 2 * VENTANA_METRICAS_DIAS * 24 * 60 * 60 * 1000);

  const [activosAlumnos, usaronTutor, feedbackPublicado, feedbackRevisado, activosAnterior, activosActual] =
    await Promise.all([
      prisma.sesion.findMany({
        where: { created_at: { gte: desde }, usuario: { rol: "ALUMNO" } },
        select: { usuario_id: true },
        distinct: ["usuario_id"],
      }),
      prisma.sesionIA.findMany({
        where: { iniciada_en: { gte: desde }, mensajes: { some: { rol: "USER" } } },
        select: { alumno_id: true },
        distinct: ["alumno_id"],
      }),
      prisma.entrega.count({ where: { publicado: true, feedback_final: { not: null } } }),
      prisma.entrega.count({ where: { publicado: true, feedback_final: { not: null }, feedback_revisado_alumno: true } }),
      prisma.sesion.findMany({
        where: { created_at: { gte: desdeAnterior, lt: desde } },
        select: { usuario_id: true },
        distinct: ["usuario_id"],
      }),
      prisma.sesion.findMany({
        where: { created_at: { gte: desde } },
        select: { usuario_id: true },
        distinct: ["usuario_id"],
      }),
    ]);

  const activos = new Set(activosAlumnos.map((s) => s.usuario_id));
  const conTutor = usaronTutor.filter((s) => activos.has(s.alumno_id)).length;

  const actuales = new Set(activosActual.map((s) => s.usuario_id));
  const quedaron = activosAnterior.filter((s) => actuales.has(s.usuario_id)).length;

  return {
    ventana_dias: VENTANA_METRICAS_DIAS,
    uso_tutor: {
      ...evaluar(porcentaje(conTutor, activos.size), 40),
      detalle: `${conTutor} de ${activos.size} alumnos activos usaron el tutor`,
    },
    feedback_revisado: {
      ...evaluar(porcentaje(feedbackRevisado, feedbackPublicado), 60),
      detalle: `${feedbackRevisado} de ${feedbackPublicado} correcciones publicadas fueron abiertas por el alumno`,
    },
    retencion_mensual: {
      ...evaluar(porcentaje(quedaron, activosAnterior.length), 70),
      detalle: `${quedaron} de ${activosAnterior.length} usuarios activos el mes anterior volvieron este mes`,
    },
    reduccion_tiempo_docente: {
      valor: null,
      objetivo: 30,
      cumple: null,
      detalle: "Se mide con la encuesta post-lanzamiento a docentes (no se calcula desde el sistema)",
    },
  };
}
