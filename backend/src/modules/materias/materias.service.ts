import { randomBytes } from "node:crypto";
import type { Rol } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import type { CreateMateriaInput, CrearClaveInput, UnirseInput } from "./materias.schemas";

// Sin caracteres ambiguos (0/O, 1/I/L) para dictado oral
const CLAVE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generarClaveUnica(): string {
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

export async function crear(input: CreateMateriaInput, usuarioId: string) {
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

  if (yaInscripto) {
    throw new AppError(409, "Ya estas inscripto a esta materia");
  }

  const [, materia] = await prisma.$transaction([
    prisma.inscripcion.create({
      data: {
        alumno_id: alumnoId,
        materia_id: clave.materia_id,
        clave_id: clave.id,
      },
    }),
    prisma.materia.findUniqueOrThrow({ where: { id: clave.materia_id }, include: materiaInclude }),
    prisma.claveMatriculacion.update({
      where: { id: clave.id },
      data: { usos_actuales: { increment: 1 } },
    }),
  ]);

  return toMateriaDto(materia);
}
