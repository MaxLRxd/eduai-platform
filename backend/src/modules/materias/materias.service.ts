import { randomBytes } from "node:crypto";
import type { Rol } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import type { CreateMateriaInput, CrearClaveInput, UnirseInput } from "./materias.schemas";

// Sin caracteres ambiguos (0/O, 1/I/L) para dictado oral
const CLAVE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generarClaveUnica(): string {
  const bytes = randomBytes(8);
  let clave = "";
  for (let i = 0; i < 8; i++) {
    clave += CLAVE_ALPHABET[bytes[i] % CLAVE_ALPHABET.length];
  }
  return clave;
}

const materiaInclude = {
  _count: { select: { inscripciones: true } },
} as const;

function toMateriaDto(materia: {
  id: string;
  nombre: string;
  descripcion: string | null;
  nivel_educativo: string;
  activa: boolean;
  created_at: Date;
  _count?: { inscripciones: number };
}) {
  return {
    id: materia.id,
    nombre: materia.nombre,
    descripcion: materia.descripcion,
    nivel_educativo: materia.nivel_educativo,
    activa: materia.activa,
    inscriptos: materia._count?.inscripciones ?? 0,
    created_at: materia.created_at,
  };
}

/** CU-AD01 (E1): no pueden existir dos materias con el mismo nombre. */
export async function exigirNombreDeMateriaLibre(nombre: string, excluirId?: string) {
  const repetida = await prisma.materia.findFirst({
    where: {
      nombre: { equals: nombre.trim(), mode: "insensitive" },
      ...(excluirId ? { id: { not: excluirId } } : {}),
    },
    select: { id: true },
  });

  if (repetida) {
    throw new AppError(409, "Ya existe una materia con ese nombre");
  }
}

/** CU-AD04 (E5): una clave no puede nacer vencida. */
export function exigirVencimientoFuturo(vencimiento: Date | undefined | null) {
  if (vencimiento && vencimiento.getTime() <= Date.now()) {
    throw new AppError(400, "La fecha de vencimiento no puede estar en el pasado");
  }
}

export async function crear(input: CreateMateriaInput, usuarioId: string) {
  await exigirNombreDeMateriaLibre(input.nombre);

  const perfil = await prisma.profesor.upsert({
    where: { usuario_id: usuarioId },
    update: {},
    create: { usuario_id: usuarioId, tipo_profesor: "TITULAR" },
  });

  const materia = await prisma.materia.create({
    data: {
      nombre: input.nombre,
      descripcion: input.descripcion,
      nivel_educativo: input.nivel_educativo,
      profesores: { create: { profesor_id: perfil.id } },
    },
    include: materiaInclude,
  });

  return toMateriaDto(materia);
}

export async function listarMias(usuarioId: string, rol: Rol) {
  if (rol === "PROFESOR" || rol === "ADMIN") {
    const materias = await prisma.materia.findMany({
      where: {
        profesores: { some: { activo: true, profesor: { usuario_id: usuarioId } } },
      },
      include: materiaInclude,
      orderBy: { created_at: "desc" },
    });
    return materias.map(toMateriaDto);
  }

  const materias = await prisma.materia.findMany({
    where: { inscripciones: { some: { alumno_id: usuarioId } } },
    include: materiaInclude,
    orderBy: { created_at: "desc" },
  });
  return materias.map(toMateriaDto);
}

export async function assertUuid(id: string): Promise<void> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new AppError(404, "Materia no encontrada");
  }
}

export async function obtenerProfesorAsignado(materiaId: string, usuarioId: string) {
  await assertUuid(materiaId);
  const perfil = await prisma.profesor.findUnique({ where: { usuario_id: usuarioId } });

  if (!perfil) {
    return null;
  }

  const asignacion = await prisma.materiaProfesor.findUnique({
    where: { materia_id_profesor_id: { materia_id: materiaId, profesor_id: perfil.id } },
  });

  if (!asignacion?.activo) {
    return null;
  }

  return perfil;
}

export async function obtenerInscripcion(materiaId: string, alumnoId: string) {
  await assertUuid(materiaId);
  return prisma.inscripcion.findUnique({
    where: { alumno_id_materia_id: { alumno_id: alumnoId, materia_id: materiaId } },
  });
}

// Lista de alumnos inscriptos a una materia (para "Mis estudiantes" y Asistencia).
export async function listarInscriptos(materiaId: string, usuarioId: string, rol: Rol) {
  await assertUuid(materiaId);

  if (rol === "PROFESOR" || rol === "ADMIN") {
    const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);
    if (!perfil && rol !== "ADMIN") {
      throw new AppError(403, "No tenes acceso a esta materia");
    }
  } else {
    // El listado expone nombre y email: es solo para el equipo docente, no para los companeros.
    throw new AppError(403, "No tenes acceso a esta informacion");
  }

  const inscripciones = await prisma.inscripcion.findMany({
    where: { materia_id: materiaId },
    include: { alumno: { select: { id: true, nombre: true, email: true } } },
    orderBy: { inscripto_en: "asc" },
  });

  return inscripciones.map((i) => ({
    id: i.alumno.id,
    nombre: i.alumno.nombre,
    email: i.alumno.email,
  }));
}

export async function obtenerDetalle(materiaId: string, usuarioId: string, rol: Rol) {
  await assertUuid(materiaId);

  const materia = await prisma.materia.findUnique({
    where: { id: materiaId },
    include: {
      ...materiaInclude,
      clavesMatriculacion: {
        where: { activa: true, revocada_en: null },
        select: { id: true, clave: true, usos_actuales: true, max_usos: true, vencimiento: true },
      },
      profesores: { where: { activo: true }, select: { profesor: { select: { usuario_id: true } } } },
    },
  });

  if (!materia) {
    throw new AppError(404, "Materia no encontrada");
  }

  const esProfesorAsignado =
    rol === "PROFESOR" || rol === "ADMIN"
      ? materia.profesores.some((mp) => mp.profesor.usuario_id === usuarioId)
      : false;

  if (!esProfesorAsignado && rol !== "ADMIN") {
    const inscripto = await prisma.inscripcion.findUnique({
      where: { alumno_id_materia_id: { alumno_id: usuarioId, materia_id: materiaId } },
    });

    if (!inscripto) {
      throw new AppError(403, "No tenes acceso a esta materia");
    }
  }

  return {
    ...toMateriaDto(materia),
    claves: esProfesorAsignado || rol === "ADMIN" ? materia.clavesMatriculacion : undefined,
  };
}

export async function crearClave(materiaId: string, input: CrearClaveInput, usuarioId: string) {
  await assertUuid(materiaId);

  const perfil = await prisma.profesor.findUnique({ where: { usuario_id: usuarioId } });

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const asignacion = await prisma.materiaProfesor.findUnique({
    where: { materia_id_profesor_id: { materia_id: materiaId, profesor_id: perfil.id } },
  });

  if (!asignacion?.activo) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  exigirVencimientoFuturo(input.vencimiento);

  const clave = generarClaveUnica();
  const claveCreada = await prisma.claveMatriculacion.create({
    data: {
      materia_id: materiaId,
      clave,
      max_usos: input.max_usos,
      vencimiento: input.vencimiento,
    },
  });

  return {
    clave: claveCreada.clave,
    max_usos: claveCreada.max_usos,
    vencimiento: claveCreada.vencimiento,
    activa: claveCreada.activa,
  };
}

export async function unirse(input: UnirseInput, alumnoId: string) {
  const claveNormalizada = input.clave.trim().toUpperCase();

  const clave = await prisma.claveMatriculacion.findUnique({
    where: { clave: claveNormalizada },
    include: { materia: true },
  });

  if (!clave || !clave.activa || clave.revocada_en) {
    throw new AppError(400, "Clave invalida");
  }

  if (clave.vencimiento && clave.vencimiento < new Date()) {
    throw new AppError(400, "La clave esta vencida");
  }

  if (clave.max_usos !== null && clave.usos_actuales >= clave.max_usos) {
    throw new AppError(400, "La clave alcanzo su limite de usos");
  }

  if (!clave.materia.activa) {
    throw new AppError(400, "La materia no acepta inscripciones");
  }

  const yaInscripto = await prisma.inscripcion.findUnique({
    where: { alumno_id_materia_id: { alumno_id: alumnoId, materia_id: clave.materia_id } },
  });

  // CU-A01 (A1) y CU-AD04 (E6): no se genera una inscripcion nueva; se avisa y se lleva al
  // alumno a la materia en la que ya esta. La clave no gasta ningun uso.
  if (yaInscripto) {
    const existente = await prisma.materia.findUniqueOrThrow({
      where: { id: clave.materia_id },
      include: materiaInclude,
    });
    return { ...toMateriaDto(existente), ya_inscripto: true };
  }

  // El cupo se reserva con un UPDATE condicional dentro de la transaccion: si dos
  // alumnos usan la ultima plaza a la vez, solo uno logra incrementar el contador.
  const materia = await prisma.$transaction(async (tx) => {
    const reservada = await tx.claveMatriculacion.updateMany({
      where: {
        id: clave.id,
        activa: true,
        revocada_en: null,
        ...(clave.max_usos !== null ? { usos_actuales: { lt: clave.max_usos } } : {}),
      },
      data: { usos_actuales: { increment: 1 } },
    });

    if (reservada.count === 0) {
      throw new AppError(400, "La clave alcanzo su limite de usos");
    }

    await tx.inscripcion.create({
      data: {
        alumno_id: alumnoId,
        materia_id: clave.materia_id,
        clave_id: clave.id,
      },
    });

    return tx.materia.findUniqueOrThrow({ where: { id: clave.materia_id }, include: materiaInclude });
  });

  return { ...toMateriaDto(materia), ya_inscripto: false };
}
