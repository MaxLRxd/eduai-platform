import bcrypt from "bcryptjs";
import type { TipoProfesor } from "@prisma/client";
import { renderReportePdf } from "./reportsPdf";
import { reportesAdmin as consultarReportes, type FiltrosReporte, type Reporte } from "./admin.reportes";
import { prisma } from "../../config/prisma";
import { permitirAcceso, revocarAcceso } from "../../config/cache";
import { logger } from "../../config/logger";
import { AppError } from "../../middlewares/error";
import { crearNoLeidas } from "../notificaciones/notificaciones.service";
import { emitirTokenRecuperacionAdmin } from "../auth/recuperacion.service";
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

export async function emitirTokenRecuperacion(usuarioId: string) {
  assertUuid(usuarioId, "Usuario no encontrado");
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, activo: true },
  });
  if (!usuario || !usuario.activo) {
    throw new AppError(404, "Usuario no encontrado");
  }
  return emitirTokenRecuperacionAdmin(usuario.id);
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
  // vivo hasta su vencimiento. Las sesiones revocadas no impiden que un access token ya
  // emitido siga sirviendo, asi que tambien se inhabilita al usuario en la cache de acceso.
  if (!input.activo) {
    await prisma.sesion.updateMany({
      where: { usuario_id: usuarioId, revocado: false },
      data: { revocado: true },
    });
    revocarAcceso(usuarioId);
  } else {
    permitirAcceso(usuarioId);
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
          select: {
            profesor: { select: { id: true, usuario: { select: { id: true, nombre: true, email: true } } } },
          },
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
      // `profesor_id` es el id del perfil docente (el que piden asignar y quitar); `id` es el del usuario.
      profesores: m.profesores.map((p) => ({ ...p.profesor.usuario, profesor_id: p.profesor.id })),
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

/**
 * CU-AD02: quita a un docente de una materia sin tocar su usuario ni nada de lo que hizo
 * (actividades, rubricas, notas y entregas se conservan; solo pierde el acceso).
 */
export async function desasignarProfesor(materiaId: string, profesorId: string) {
  assertUuid(materiaId, "Materia no encontrada");
  assertUuid(profesorId, "Profesor no encontrado");

  const previa = await prisma.materiaProfesor.findUnique({
    where: { materia_id_profesor_id: { materia_id: materiaId, profesor_id: profesorId } },
  });

  if (!previa?.activo) {
    throw new AppError(404, "El profesor no está asignado a esta materia");
  }

  return asignarProfesor(materiaId, { profesor_id: profesorId, activo: false });
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

export type { Reporte, FiltrosReporte } from "./admin.reportes";

/** Los reportes usan la misma retencion mensual que «Metricas de exito»: una sola definicion. */
export async function reportesAdmin(filtros: FiltrosReporte = {}) {
  return consultarReportes(filtros, async () => {
    const m = await metricasDeExito();
    return { valor: m.retencion_mensual.valor, detalle: m.retencion_mensual.detalle };
  });
}

function escapeCsvCell(cell: string): string {
  return `"${cell.replace(/"/g, '""')}"`;
}

export function csvFromReporte(r: Reporte): string {
  const lines: string[][] = [
    [r.title],
    [r.description],
    [],
    ["Métrica", "Valor"],
    ...r.stats.map((s) => [s.label, s.value]),
    [],
    [r.footnote],
  ];
  // BOM para que Excel lo abra como UTF-8 y ";" para la configuración regional es-AR.
  return "\uFEFF" + lines.map((line) => line.map(escapeCsvCell).join(";")).join("\r\n");
}

function sufijoArchivo(filtros: FiltrosReporte): string {
  return [filtros.periodo, filtros.materia_id ? "materia" : ""].filter(Boolean).map((s) => `-${s}`).join("");
}

export async function exportarReporteCsv(type: string, filtros: FiltrosReporte = {}) {
  const reportes = await reportesAdmin(filtros);
  const reporte = reportes.find((r) => r.type === type);

  if (!reporte) {
    throw new AppError(404, "Reporte no encontrado");
  }

  return {
    filename: `reporte-${type}${sufijoArchivo(filtros)}.csv`,
    csv: csvFromReporte(reporte),
  };
}

export async function exportarReportePdf(type: string, filtros: FiltrosReporte = {}) {
  const reportes = await reportesAdmin(filtros);
  const reporte = reportes.find((r) => r.type === type);

  if (!reporte) {
    throw new AppError(404, "Reporte no encontrado");
  }

  const buffer = await renderReportePdf(reporte);

  return {
    filename: `reporte-${type}${sufijoArchivo(filtros)}.pdf`,
    pdf: buffer.toString("base64"),
  };
}

export async function exportarReporte(type: string, formato: "csv" | "pdf" = "csv", filtros: FiltrosReporte = {}) {
  return formato === "pdf" ? exportarReportePdf(type, filtros) : exportarReporteCsv(type, filtros);
}

/** Lo que incluye la licencia: es el mismo producto completo para todas las instituciones. */
const LICENCIA_INCLUYE = [
  "Campus virtual: materias, contenidos, actividades y calificaciones",
  "Tutor IA con respuestas basadas en el material de la materia",
  "Corrección asistida por IA con revisión del docente",
  "Asistente de planificación para docentes",
  "Analítica académica y alertas de riesgo",
  "Reportes institucionales (CSV y PDF)",
  "Recuperación de contraseña y administración de usuarios",
] as const;

/**
 * Licencia unica: se vende un solo producto, sin importar la cantidad de alumnos. El uso se informa
 * pero no hay topes, planes ni cobro por alumno activo.
 */
export async function obtenerEstadoLicencia() {
  const [alumnos, docentes, materias] = await Promise.all([
    prisma.usuario.count({ where: { rol: "ALUMNO", activo: true } }),
    prisma.usuario.count({ where: { rol: "PROFESOR", activo: true } }),
    prisma.materia.count({ where: { activa: true } }),
  ]);

  return {
    licencia: {
      nombre: "EduAI — Licencia institucional",
      tipo: "UNICA" as const,
      estado: "ACTIVA" as const,
      incluye: [...LICENCIA_INCLUYE],
    },
    uso: { alumnos, docentes, materias },
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
