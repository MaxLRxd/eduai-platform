import type { ModoSesionIA } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { chatTutor, generarExamen, resumirDocumento } from "../../config/aiClient";
import { registrarConsultaTutor } from "../analytics/analytics.service";
import { obtenerInscripcion } from "../materias/materias.service";
import type { CrearSesionInput, EnviarMensajeInput, ExamenInput, ResumenInput } from "./tutor.schemas";

type ModoIA = "normal" | "socratic" | "hints";

const modoAMin = (modo: ModoSesionIA): ModoIA => {
  switch (modo) {
    case "SOCRATIC":
      return "socratic";
    case "HINTS":
      return "hints";
    default:
      return "normal";
  }
};

function toSesionDto(sesion: {
  id: string;
  alumno_id: string;
  materia_id: string;
  modo: ModoSesionIA;
  iniciada_en: Date;
  cerrada_en: Date | null;
  materia?: { id: string; nombre: string };
  _count?: { mensajes: number };
}) {
  return {
    id: sesion.id,
    materia_id: sesion.materia_id,
    materia: sesion.materia,
    modo: sesion.modo,
    iniciada_en: sesion.iniciada_en,
    cerrada_en: sesion.cerrada_en,
    mensajes: sesion._count?.mensajes ?? 0,
  };
}

async function obtenerSesionDeAlumno(sesionId: string, alumnoId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sesionId)) {
    throw new AppError(404, "Sesion no encontrada");
  }

  const sesion = await prisma.sesionIA.findUnique({
    where: { id: sesionId },
    include: { materia: { select: { id: true, nombre: true } } },
  });

  if (!sesion || sesion.alumno_id !== alumnoId) {
    throw new AppError(404, "Sesion no encontrada");
  }

  return sesion;
}

async function exigirInscripcion(materiaId: string, alumnoId: string): Promise<void> {
  const inscripcion = await obtenerInscripcion(materiaId, alumnoId);

  if (!inscripcion) {
    throw new AppError(403, "No estas inscripto a esta materia");
  }
}

// El alumno puede cambiar de modo a mitad de conversacion. El request lo manda
// en cada mensaje, asi que la IA siempre responde en el modo pedido; lo que
// quedaba desalineado era el registro: sesionIA.modo se quedaba clavado en el
// modo del primer mensaje. Eso rompe los analytics por modo y el fallback cuando
// un cliente omite `modo`.
async function sincronizarModo(
  sesionId: string,
  modoSesion: ModoSesionIA,
  modoPedido: ModoSesionIA | undefined
): Promise<ModoSesionIA> {
  if (!modoPedido || modoPedido === modoSesion) {
    return modoSesion;
  }

  await prisma.sesionIA.update({ where: { id: sesionId }, data: { modo: modoPedido } });
  return modoPedido;
}

export async function crearSesion(materiaId: string, input: CrearSesionInput, alumnoId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(materiaId)) {
    throw new AppError(404, "Materia no encontrada");
  }

  const inscripcion = await obtenerInscripcion(materiaId, alumnoId);

  if (!inscripcion) {
    throw new AppError(403, "No estas inscripto a esta materia");
  }

  const sesion = await prisma.sesionIA.create({
    data: {
      alumno_id: alumnoId,
      materia_id: materiaId,
      modo: input.modo,
    },
    include: { materia: { select: { id: true, nombre: true } } },
  });

  return toSesionDto(sesion);
}

export async function listarSesionesMias(alumnoId: string) {
  const sesiones = await prisma.sesionIA.findMany({
    where: { alumno_id: alumnoId },
    include: {
      materia: { select: { id: true, nombre: true } },
      _count: { select: { mensajes: true } },
    },
    orderBy: { iniciada_en: "desc" },
  });

  return sesiones.map(toSesionDto);
}

export async function listarMensajes(sesionId: string, alumnoId: string) {
  await obtenerSesionDeAlumno(sesionId, alumnoId);

  const mensajes = await prisma.mensajeIA.findMany({
    where: { sesion_id: sesionId },
    orderBy: { creado_en: "asc" },
  });

  return mensajes.map((m) => ({
    id: m.id,
    rol: m.rol,
    contenido: m.contenido,
    prompt_depurado: m.prompt_depurado,
    tokens_ahorrados: m.tokens_respuesta,
    creado_en: m.creado_en,
  }));
}

export async function enviarMensaje(
  sesionId: string,
  input: EnviarMensajeInput,
  alumnoId: string
) {
  const sesion = await obtenerSesionDeAlumno(sesionId, alumnoId);

  if (sesion.cerrada_en) {
    throw new AppError(400, "La sesion esta cerrada");
  }

  const preguntas = await prisma.mensajeIA.findMany({
    where: { sesion_id: sesionId },
    select: { rol: true, contenido: true },
    orderBy: { creado_en: "asc" },
  });

  const history = preguntas
    .filter((p) => p.rol === "USER" || p.rol === "ASSISTANT")
    .map((p) => ({ role: p.rol.toLowerCase() as "user" | "assistant", content: p.contenido }));

  const usuario = await prisma.mensajeIA.create({
    data: {
      sesion_id: sesionId,
      rol: "USER",
      contenido: input.contenido,
      prompt_original: input.contenido,
    },
  });

  try {
    await registrarConsultaTutor(sesion.materia_id, input.contenido, false);
  } catch {
    // los analytics no deben interrumpir el flujo del chat
  }

  const modo = await sincronizarModo(sesionId, sesion.modo, input.modo);

  const inicio = Date.now();
  const resultado = await chatTutor(
    sesion.materia_id,
    input.contenido,
    modoAMin(modo),
    history
  );
  const tiempoMs = Date.now() - inicio;

  if (!resultado) {
    throw new AppError(502, "No se pudo obtener respuesta del tutor en este momento");
  }

  const respuesta = await prisma.mensajeIA.create({
    data: {
      sesion_id: sesionId,
      rol: "ASSISTANT",
      contenido: resultado.answer,
      prompt_depurado: resultado.prompt_depurado,
      tokens_respuesta: resultado.tokens_ahorrados,
      tiempo_respuesta_ms: tiempoMs,
    },
  });

  return {
    pregunta: {
      id: usuario.id,
      rol: usuario.rol,
      contenido: usuario.contenido,
      creado_en: usuario.creado_en,
    },
    respuesta: {
      id: respuesta.id,
      rol: respuesta.rol,
      contenido: respuesta.contenido,
      sources: resultado.sources,
      prompt_depurado: respuesta.prompt_depurado,
      tokens_ahorrados: respuesta.tokens_respuesta,
      cached: resultado.cached,
      tiempo_respuesta_ms: respuesta.tiempo_respuesta_ms,
      creado_en: respuesta.creado_en,
    },
  };
}

export async function prepararStream(
  sesionId: string,
  contenido: string,
  alumnoId: string,
  modo: ModoSesionIA | undefined
): Promise<{ materiaId: string; modo: ModoIA; history: { role: "user" | "assistant"; content: string }[] }> {
  const sesion = await obtenerSesionDeAlumno(sesionId, alumnoId);

  if (sesion.cerrada_en) {
    throw new AppError(400, "La sesion esta cerrada");
  }

  const preguntas = await prisma.mensajeIA.findMany({
    where: { sesion_id: sesionId },
    select: { rol: true, contenido: true },
    orderBy: { creado_en: "asc" },
  });

  const history = preguntas
    .filter((p) => p.rol === "USER" || p.rol === "ASSISTANT")
    .map((p) => ({ role: p.rol.toLowerCase() as "user" | "assistant", content: p.contenido }));

  const modoEfectivo = await sincronizarModo(sesionId, sesion.modo, modo);

  return {
    materiaId: sesion.materia_id,
    modo: modoAMin(modoEfectivo),
    history,
  };
}

export async function registrarMensajeUsuario(sesionId: string, contenido: string, alumnoId: string) {
  const sesion = await obtenerSesionDeAlumno(sesionId, alumnoId);

  const usuario = await prisma.mensajeIA.create({
    data: {
      sesion_id: sesionId,
      rol: "USER",
      contenido,
      prompt_original: contenido,
    },
  });

  try {
    await registrarConsultaTutor(sesion.materia_id, contenido, false);
  } catch {
    // los analytics no deben interrumpir el flujo del chat
  }

  return {
    id: usuario.id,
    rol: usuario.rol,
    contenido: usuario.contenido,
    creado_en: usuario.creado_en,
  };
}

export async function registrarRespuestaStream(
  sesionId: string,
  contenido: string,
  tiempoMs: number,
  alumnoId: string
) {
  await obtenerSesionDeAlumno(sesionId, alumnoId);

  const respuesta = await prisma.mensajeIA.create({
    data: {
      sesion_id: sesionId,
      rol: "ASSISTANT",
      contenido,
      tiempo_respuesta_ms: tiempoMs,
    },
  });

  return {
    id: respuesta.id,
    rol: respuesta.rol,
    contenido: respuesta.contenido,
    creado_en: respuesta.creado_en,
  };
}

async function textoDelContenido(contenidoId: string, materiaId: string) {
  const contenido = await prisma.contenido.findUnique({
    where: { id: contenidoId },
    include: { seccion: { select: { materia_id: true } } },
  });

  // El contenido puede ser de cualquier materia: se compara la seccion contra
  // la materia pedida para no filtrar la existencia de material ajeno.
  if (!contenido || contenido.seccion.materia_id !== materiaId) {
    throw new AppError(404, "Material no encontrado en esta materia");
  }

  const texto = contenido.texto_contenido?.trim();

  if (!texto) {
    throw new AppError(
      400,
      "Este material es un archivo binario y todavia no se puede resumir. Subi un material de texto."
    );
  }

  return { texto, titulo: contenido.titulo };
}

export async function resumir(materiaId: string, input: ResumenInput, alumnoId: string) {
  await exigirInscripcion(materiaId, alumnoId);

  const fuente = input.contenido_id
    ? await textoDelContenido(input.contenido_id, materiaId)
    : { texto: input.texto ?? "", titulo: null };

  if (fuente.texto.trim().length < 200) {
    throw new AppError(400, "El texto es muy corto para generar un resumen util");
  }

  const resultado = await resumirDocumento(fuente.texto, input.idioma, input.max_palabras);

  if (!resultado) {
    throw new AppError(502, "No se pudo generar el resumen en este momento");
  }

  try {
    await registrarConsultaTutor(materiaId, "resumen de material", false);
  } catch {
    // los analytics no deben interrumpir el flujo
  }

  return {
    resumen: resultado.summary,
    origen: fuente.titulo,
    max_palabras: input.max_palabras,
  };
}

export async function generarSimulacro(materiaId: string, input: ExamenInput, alumnoId: string) {
  await exigirInscripcion(materiaId, alumnoId);

  const resultado = await generarExamen(materiaId, input.n_preguntas, input.dificultad);

  if (!resultado) {
    throw new AppError(502, "No se pudo generar el simulacro en este momento");
  }

  return {
    titulo: resultado.titulo,
    dificultad: resultado.dificultad,
    preguntas: resultado.preguntas.map((p) => ({
      tipo: p.tipo,
      enunciado: p.enunciado,
      opciones: p.opciones ?? [],
      respuesta: p.respuesta,
    })),
  };
}
