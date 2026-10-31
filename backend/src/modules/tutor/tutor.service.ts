import type { ModoSesionIA } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { chatTutor, corregirExamenIA, generarExamen, resumirDocumento } from "../../config/aiClient";
import { registrarConsultaTutor } from "../analytics/analytics.service";
import { renderMaterialPdf } from "../asistente/materialPdf";
import { obtenerInscripcion, obtenerProfesorAsignado } from "../materias/materias.service";
import type {
  CorregirExamenInput,
  CrearSesionInput,
  EnviarMensajeInput,
  ExamenInput,
  ResumenInput,
  ResumenPdfInput,
} from "./tutor.schemas";

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
// en cada mensaje, asi que la IA siempre responde en el modo pedido; el modo
// efectivo se persiste tanto en `sesionIA.modo` como en cada `mensajeIA`, de
// modo que los analytics por modo y el fallback cuando un cliente omite `modo`
// (se usa el modo de la sesion) sean confiables.
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

  const modo = await sincronizarModo(sesionId, sesion.modo, input.modo);

  const usuario = await prisma.mensajeIA.create({
    data: {
      sesion_id: sesionId,
      rol: "USER",
      modo,
      contenido: input.contenido,
      prompt_original: input.contenido,
    },
  });

  try {
    await registrarConsultaTutor(sesion.materia_id, input.contenido, false);
  } catch {
    // los analytics no deben interrumpir el flujo del chat
  }

  // CU-A04 (A5.1): si coincide con una pregunta frecuente de la materia se responde con la
  // respuesta ya preparada por el docente, sin consumir la IA. Solo en modo normal: en los
  // modos socratico y pistas la respuesta directa contradiria el objetivo del modo.
  const frecuente = modo === "NORMAL" ? await buscarPreguntaFrecuente(sesion.materia_id, input.contenido) : null;

  if (frecuente) {
    const respuestaFrecuente = await registrarRespuestaPreguntaFrecuente(sesionId, frecuente, modo);

    return {
      pregunta: {
        id: usuario.id,
        rol: usuario.rol,
        contenido: usuario.contenido,
        creado_en: usuario.creado_en,
      },
      respuesta: {
        id: respuestaFrecuente.id,
        rol: respuestaFrecuente.rol,
        contenido: respuestaFrecuente.contenido,
        sources: [],
        prompt_depurado: null,
        tokens_ahorrados: 0,
        cached: true,
        pregunta_frecuente: true,
        tiempo_respuesta_ms: respuestaFrecuente.tiempo_respuesta_ms,
        creado_en: respuestaFrecuente.creado_en,
      },
    };
  }

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
      modo,
      contenido: resultado.answer,
      prompt_depurado: resultado.prompt_depurado,
      tokens_respuesta: resultado.tokens_ahorrados,
      tiempo_respuesta_ms: tiempoMs,
      // Sin streaming el alumno ve la respuesta recien cuando llega completa.
      primer_token_ms: tiempoMs,
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
): Promise<{
  materiaId: string;
  modo: ModoIA;
  modoSesion: ModoSesionIA;
  history: { role: "user" | "assistant"; content: string }[];
}> {
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
    modoSesion: modoEfectivo,
    history,
  };
}

export async function registrarMensajeUsuario(
  sesionId: string,
  contenido: string,
  alumnoId: string,
  modo?: ModoSesionIA
) {
  const sesion = await obtenerSesionDeAlumno(sesionId, alumnoId);

  const usuario = await prisma.mensajeIA.create({
    data: {
      sesion_id: sesionId,
      rol: "USER",
      modo,
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
  alumnoId: string,
  modo?: ModoSesionIA,
  primerTokenMs?: number
) {
  await obtenerSesionDeAlumno(sesionId, alumnoId);

  const respuesta = await prisma.mensajeIA.create({
    data: {
      sesion_id: sesionId,
      rol: "ASSISTANT",
      modo,
      contenido,
      tiempo_respuesta_ms: tiempoMs,
      primer_token_ms: primerTokenMs ?? tiempoMs,
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

/**
 * CU-A11: corrige las respuestas de un simulacro y, si el alumno lo confirma, guarda el
 * intento en su historial. Si el servicio de IA falla no se pierde nada: el cliente conserva
 * las respuestas y puede reintentar (A5).
 */
export async function corregirSimulacro(materiaId: string, input: CorregirExamenInput, alumnoId: string) {
  await exigirInscripcion(materiaId, alumnoId);

  const resultados = await corregirExamenIA(
    materiaId,
    input.titulo,
    input.preguntas.map((p) => ({
      tipo: p.tipo,
      enunciado: p.enunciado,
      opciones: p.opciones,
      respuesta_modelo: p.respuesta_modelo,
      respuesta_alumno: p.respuesta_alumno,
    }))
  );

  if (!resultados || resultados.length !== input.preguntas.length) {
    throw new AppError(
      502,
      "No fue posible corregir el simulacro en este momento. Tus respuestas se conservan: podés reintentar más tarde"
    );
  }

  const ordenados = [...resultados].sort((a, b) => a.indice - b.indice);
  const cuenta = (v: string) => ordenados.filter((r) => r.veredicto === v).length;
  const puntaje = Math.round((ordenados.reduce((s, r) => s + r.puntaje, 0) / ordenados.length) * 1000) / 100;

  const detalle = ordenados.map((r) => ({
    indice: r.indice,
    enunciado: input.preguntas[r.indice]?.enunciado ?? "",
    veredicto: r.veredicto,
    puntaje: r.puntaje,
    feedback: r.feedback,
    respuesta_alumno: input.preguntas[r.indice]?.respuesta_alumno ?? "",
    respuesta_correcta: input.preguntas[r.indice]?.respuesta_modelo ?? "",
  }));

  const resumen = {
    titulo: input.titulo,
    dificultad: input.dificultad,
    puntaje,
    correctas: cuenta("correcta"),
    parciales: cuenta("parcial"),
    incorrectas: cuenta("incorrecta"),
    sin_responder: cuenta("sin_responder"),
  };

  let id: string | null = null;

  if (input.registrar) {
    const intento = await prisma.intentoSimulacro.create({
      data: { alumno_id: alumnoId, materia_id: materiaId, ...resumen, detalle },
    });
    id = intento.id;
  }

  return { id, ...resumen, resultados: detalle };
}

/** Historial de simulacros corregidos del alumno en la materia (mas recientes primero). */
export async function listarSimulacros(materiaId: string, alumnoId: string) {
  await exigirInscripcion(materiaId, alumnoId);

  const intentos = await prisma.intentoSimulacro.findMany({
    where: { materia_id: materiaId, alumno_id: alumnoId },
    orderBy: { creado_en: "desc" },
    take: 20,
  });

  return intentos.map((i) => ({
    id: i.id,
    titulo: i.titulo,
    dificultad: i.dificultad,
    puntaje: i.puntaje.toNumber(),
    correctas: i.correctas,
    parciales: i.parciales,
    incorrectas: i.incorrectas,
    sin_responder: i.sin_responder,
    creado_en: i.creado_en,
  }));
}

export const UMBRAL_PRIMERA_RESPUESTA_MS = 3000;
const OBJETIVO_PORCENTAJE_BAJO_UMBRAL = 90;

function percentil(ordenados: number[], p: number): number {
  if (ordenados.length === 0) return 0;
  const indice = Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1);
  return ordenados[Math.max(0, indice)];
}

function resumirTiempos(valores: number[]) {
  const ordenados = [...valores].sort((a, b) => a - b);
  const suma = ordenados.reduce((s, v) => s + v, 0);
  return {
    promedio_ms: ordenados.length ? Math.round(suma / ordenados.length) : 0,
    p50_ms: percentil(ordenados, 50),
    p90_ms: percentil(ordenados, 90),
    p95_ms: percentil(ordenados, 95),
    max_ms: ordenados.length ? ordenados[ordenados.length - 1] : 0,
  };
}

/** Calcula las metricas de latencia a partir de las respuestas registradas del tutor. */
export function calcularLatencia(
  filas: { primer_token_ms: number | null; tiempo_respuesta_ms: number | null; modo: string | null }[]
) {
  const primeras = filas.map((f) => f.primer_token_ms).filter((v): v is number => v !== null);
  const totales = filas.map((f) => f.tiempo_respuesta_ms).filter((v): v is number => v !== null);
  const bajoUmbral = primeras.filter((v) => v <= UMBRAL_PRIMERA_RESPUESTA_MS).length;
  const porcentaje = primeras.length ? Math.round((bajoUmbral / primeras.length) * 1000) / 10 : 0;

  const porModo: Record<string, ReturnType<typeof resumirTiempos> & { muestras: number }> = {};
  for (const modo of new Set(filas.map((f) => f.modo ?? "SIN_MODO"))) {
    const delModo = filas
      .filter((f) => (f.modo ?? "SIN_MODO") === modo)
      .map((f) => f.primer_token_ms)
      .filter((v): v is number => v !== null);
    porModo[modo] = { muestras: delModo.length, ...resumirTiempos(delModo) };
  }

  return {
    muestras: primeras.length,
    umbral_ms: UMBRAL_PRIMERA_RESPUESTA_MS,
    objetivo_porcentaje: OBJETIVO_PORCENTAJE_BAJO_UMBRAL,
    porcentaje_bajo_umbral: porcentaje,
    // Sin muestras no se puede afirmar nada: se informa null en vez de "cumple".
    cumple: primeras.length ? porcentaje >= OBJETIVO_PORCENTAJE_BAJO_UMBRAL : null,
    primera_respuesta: resumirTiempos(primeras),
    respuesta_completa: resumirTiempos(totales),
    por_modo: porModo,
  };
}

/** Latencia real del tutor (ultimos 30 dias). Sin `materiaId` agrega toda la plataforma. */
export async function latenciaTutor(materiaId: string | null) {
  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const filas = await prisma.mensajeIA.findMany({
    where: {
      rol: "ASSISTANT",
      primer_token_ms: { not: null },
      creado_en: { gte: desde },
      ...(materiaId ? { sesion: { materia_id: materiaId } } : {}),
    },
    select: { primer_token_ms: true, tiempo_respuesta_ms: true, modo: true },
    orderBy: { creado_en: "desc" },
    take: 5000,
  });

  return { dias: 30, ...calcularLatencia(filas) };
}

export async function exigirDocenteDeMateria(materiaId: string, usuarioId: string): Promise<void> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(materiaId)) {
    throw new AppError(404, "Materia no encontrada");
  }

  if (!(await obtenerProfesorAsignado(materiaId, usuarioId))) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }
}

// ───────────────────────── Preguntas frecuentes (CU-A04 A5.1) ─────────────────────────

const PALABRAS_VACIAS = new Set([
  "que", "los", "las", "del", "una", "uno", "unos", "unas", "por", "para", "con", "como", "cual",
  "cuales", "sobre", "este", "esta", "esto", "ese", "esa", "son", "ser", "hay", "mas", "muy",
  "pero", "sus", "les", "nos", "the", "and", "donde", "cuando", "quien", "puedo", "podes",
  "explicame", "decime", "dime", "favor", "porfa",
  // Palabras de dos letras que no aportan (las siglas como "ip" o "so" si cuentan).
  "es", "la", "el", "un", "de", "en", "lo", "se", "al", "ya", "no", "si", "me", "mi", "tu", "su", "le",
]);

/** Minusculas, sin tildes ni signos, para comparar preguntas escritas de distinta forma. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function palabrasClave(texto: string): Set<string> {
  return new Set(
    normalizarTexto(texto)
      .split(" ")
      .filter((p) => p.length >= 2 && !PALABRAS_VACIAS.has(p))
  );
}

/** Similitud de Jaccard entre las palabras clave de dos preguntas (0 a 1). */
export function similitudDePreguntas(a: string, b: string): number {
  const A = palabrasClave(a);
  const B = palabrasClave(b);
  if (A.size === 0 || B.size === 0) return 0;
  let comunes = 0;
  for (const palabra of A) if (B.has(palabra)) comunes += 1;
  return comunes / (A.size + B.size - comunes);
}

const UMBRAL_PREGUNTA_FRECUENTE = 0.75;
const MINIMO_PALABRAS_COMUNES = 2;

/** Devuelve la respuesta de la pregunta frecuente que coincide con la consulta, o null. */
export async function buscarPreguntaFrecuente(materiaId: string, consulta: string): Promise<string | null> {
  let candidatas: { pregunta: string; respuesta: string }[];
  try {
    candidatas = await prisma.preguntaFrecuente.findMany({
      where: { materia_id: materiaId, activa: true },
      select: { pregunta: true, respuesta: true },
      take: 200,
    });
  } catch {
    // Sin FAQ el tutor responde con la IA: este atajo nunca debe romper el chat.
    return null;
  }

  const normalizada = normalizarTexto(consulta);
  let mejor: { respuesta: string; similitud: number } | null = null;

  for (const c of candidatas) {
    const exacta = normalizarTexto(c.pregunta) === normalizada;
    const similitud = exacta ? 1 : similitudDePreguntas(consulta, c.pregunta);
    const comunes = [...palabrasClave(consulta)].filter((p) => palabrasClave(c.pregunta).has(p)).length;

    if ((exacta || (similitud >= UMBRAL_PREGUNTA_FRECUENTE && comunes >= MINIMO_PALABRAS_COMUNES)) &&
        (!mejor || similitud > mejor.similitud)) {
      mejor = { respuesta: c.respuesta, similitud };
    }
  }

  return mejor?.respuesta ?? null;
}

/**
 * Guarda la respuesta de una pregunta frecuente. No lleva `primer_token_ms`: es una respuesta
 * instantanea que no refleja el rendimiento del tutor, asi que no entra en esa metrica.
 */
export async function registrarRespuestaPreguntaFrecuente(
  sesionId: string,
  respuesta: string,
  modo: ModoSesionIA
) {
  return prisma.mensajeIA.create({
    data: {
      sesion_id: sesionId,
      rol: "ASSISTANT",
      modo,
      contenido: respuesta,
      tokens_respuesta: 0,
      tiempo_respuesta_ms: 0,
    },
  });
}

/** CU-A05: el alumno descarga su resumen como PDF (el texto ya lo tiene en pantalla). */
export async function resumenAPdf(materiaId: string, input: ResumenPdfInput, alumnoId: string) {
  await exigirInscripcion(materiaId, alumnoId);

  const materia = await prisma.materia.findUnique({ where: { id: materiaId }, select: { nombre: true } });
  const buffer = await renderMaterialPdf({ titulo: input.titulo, materia: materia?.nombre, material: input.resumen });

  const slug = input.titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return { filename: `${slug || "resumen"}.pdf`, pdf: buffer.toString("base64") };
}
