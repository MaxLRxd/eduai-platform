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
} from "./admin.schemas";

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
