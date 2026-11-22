import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { generarMaterialDocente } from "../../config/aiClient";
import { obtenerProfesorAsignado } from "../materias/materias.service";
import type {
  CrearSesionDocenteInput,
  GenerarMaterialInput,
  MaterialPdfInput,
  MensajeDocenteInput,
} from "./asistente.schemas";
import { renderMaterialPdf } from "./materialPdf";

function assertUuid(id: string, mensaje: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new AppError(404, mensaje);
  }
}

async function promptConPlanning(materiaId: string, prompt: string, classDate?: string): Promise<string> {
  if (!classDate) return prompt;
  const fecha = new Date(classDate);
  if (Number.isNaN(fecha.getTime())) return prompt;
  const planning = await prisma.planningClase.findUnique({
    where: { materia_id_fecha_clase: { materia_id: materiaId, fecha_clase: fecha } },
  });
  if (!planning?.contenido && !planning?.titulo) return prompt;
  return `${prompt}\n\nPLANIFICACIÓN DE LA CLASE (${classDate}): "${planning.titulo}"\n${planning.contenido ?? ""}`;
}

async function validarContenidos(materiaId: string, contentIds: string[] = []): Promise<void> {
  if (contentIds.length === 0) return;
  const encontrados = await prisma.contenido.findMany({
    where: { id: { in: contentIds }, seccion: { materia_id: materiaId } },
    select: { id: true },
  });
  if (encontrados.length !== new Set(contentIds).size) {
    throw new AppError(400, "Uno de los materiales seleccionados no pertenece a la materia");
  }
}

function sesionDto(s: { id: string; materia_id: string; titulo: string | null; iniciada_en: Date; cerrada_en: Date | null }, mensajes = 0) {
  return {
    id: s.id,
    materia_id: s.materia_id,
    titulo: s.titulo,
    iniciada_en: s.iniciada_en.toISOString(),
    cerrada_en: s.cerrada_en?.toISOString() ?? null,
    mensajes,
  };
}

function mensajeDto(m: { id: string; rol: "USER" | "ASSISTANT"; contenido: string; sources: unknown; creado_en: Date }) {
  return {
    id: m.id,
    rol: m.rol,
    contenido: m.contenido,
    sources: (m.sources ?? []) as { material_id: string; titulo?: string | null; content: string; score: number }[],
    creado_en: m.creado_en.toISOString(),
  };
}

export async function generarMaterial(materiaId: string, input: GenerarMaterialInput, usuarioId: string) {
  assertUuid(materiaId, "Materia no encontrada");

  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  await validarContenidos(materiaId, input.content_ids);
  const prompt = await promptConPlanning(materiaId, input.prompt, input.class_date);
  const resultado = await generarMaterialDocente(materiaId, prompt, input.content_ids);

  if (!resultado) {
    throw new AppError(
      501,
      "El asistente docente no esta disponible todavia. Verificá que AI_SERVICE_URL este configurado."
    );
  }

  return { material: resultado.material, sources: resultado.sources };
}

export async function crearSesionDocente(
  materiaId: string,
  _input: CrearSesionDocenteInput,
  usuarioId: string
) {
  assertUuid(materiaId, "Materia no encontrada");
  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);
  if (!perfil) throw new AppError(403, "No tenes acceso a esta materia");

  const sesion = await prisma.sesionAsistenteDocente.create({
    data: { profesor_id: usuarioId, materia_id: materiaId },
  });
  return sesionDto(sesion);
}

export async function listarSesionesDocente(materiaId: string, usuarioId: string) {
  assertUuid(materiaId, "Materia no encontrada");
  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);
  if (!perfil) throw new AppError(403, "No tenes acceso a esta materia");

  const sesiones = await prisma.sesionAsistenteDocente.findMany({
    where: { profesor_id: usuarioId, materia_id: materiaId },
    include: { _count: { select: { mensajes: true } } },
    orderBy: { iniciada_en: "desc" },
  });
  return sesiones.map((s) => sesionDto(s, s._count.mensajes));
}

async function sesionDelProfesor(sesionId: string, usuarioId: string) {
  assertUuid(sesionId, "Conversación no encontrada");
  const sesion = await prisma.sesionAsistenteDocente.findUnique({ where: { id: sesionId } });
  if (!sesion || sesion.profesor_id !== usuarioId) throw new AppError(404, "Conversación no encontrada");
  return sesion;
}

export async function listarMensajesDocente(sesionId: string, usuarioId: string) {
  await sesionDelProfesor(sesionId, usuarioId);
  const mensajes = await prisma.mensajeAsistenteDocente.findMany({
    where: { sesion_id: sesionId },
    orderBy: { creado_en: "asc" },
  });
  return mensajes.map(mensajeDto);
}

export async function enviarMensajeDocente(sesionId: string, input: MensajeDocenteInput, usuarioId: string) {
  const sesion = await sesionDelProfesor(sesionId, usuarioId);
  const perfil = await obtenerProfesorAsignado(sesion.materia_id, usuarioId);
  if (!perfil) throw new AppError(403, "No tenes acceso a esta materia");

  await validarContenidos(sesion.materia_id, input.content_ids);
  const prompt = await promptConPlanning(sesion.materia_id, input.prompt, input.class_date);

  await prisma.mensajeAsistenteDocente.create({
    data: { sesion_id: sesionId, rol: "USER", contenido: input.prompt },
  });

  const resultado = await generarMaterialDocente(sesion.materia_id, prompt, input.content_ids);
  if (!resultado) {
    throw new AppError(501, "El asistente docente no esta disponible en este momento");
  }

  if (!sesion.titulo) {
    await prisma.sesionAsistenteDocente.update({
      where: { id: sesionId },
      data: { titulo: input.prompt.slice(0, 200) },
    });
  }

  const respuesta = await prisma.mensajeAsistenteDocente.create({
    data: {
      sesion_id: sesionId,
      rol: "ASSISTANT",
      contenido: resultado.material,
      sources: resultado.sources,
    },
  });

  return mensajeDto(respuesta);
}

export async function generarMaterialPdf(input: MaterialPdfInput, usuarioId: string) {
  assertUuid(input.materia_id, "Materia no encontrada");

  const perfil = await obtenerProfesorAsignado(input.materia_id, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const materia = await prisma.materia.findUnique({
    where: { id: input.materia_id },
    select: { nombre: true },
  });

  const titulo = input.titulo?.trim() || "Material de clase";
  const buffer = await renderMaterialPdf({ titulo, materia: materia?.nombre, material: input.material });

  const slug = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return {
    filename: `${slug || "material-de-clase"}.pdf`,
    pdf: buffer.toString("base64"),
  };
}
