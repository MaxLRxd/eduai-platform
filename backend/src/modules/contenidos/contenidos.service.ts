import { archivoDisponible } from "../../config/storage";
import { crearNoLeidas } from "../notificaciones/notificaciones.service";
import type { Rol, TipoContenido } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { eliminarMaterialRag } from "../../config/aiClient";
import { eliminarArchivo, guardarArchivo } from "../../config/storage";
import { indexarEnSegundoPlano } from "./rag-indexer";
import {
  obtenerInscripcion,
  obtenerProfesorAsignado,
} from "../materias/materias.service";
import type {
  ActualizarContenidoInput,
  CrearContenidoInput,
} from "./contenidos.schemas";

const EXTENSIONES: Record<string, TipoContenido> = {
  pdf: "PDF",
  docx: "DOCX",
  doc: "DOCX",
  pptx: "PPTX",
  ppt: "PPTX",
  txt: "TEXTO",
  md: "TEXTO",
  jpg: "IMAGEN",
  jpeg: "IMAGEN",
  png: "IMAGEN",
  gif: "IMAGEN",
  webp: "IMAGEN",
  svg: "IMAGEN",
  mp4: "VIDEO",
  mov: "VIDEO",
  avi: "VIDEO",
  webm: "VIDEO",
};

export function inferirTipo(nombreArchivo: string): TipoContenido {
  const ext = nombreArchivo.toLowerCase().split(".").pop() ?? "";
  const tipo = EXTENSIONES[ext];
  if (!tipo) {
    throw new AppError(400, `Formato de archivo no soportado (.${ext}). Permitidos: ${Object.keys(EXTENSIONES).join(", ")}`);
  }
  return tipo;
}

function toContenidoDto(contenido: {
  id: string;
  seccion_id: string;
  clase_id: string | null;
  tipo: TipoContenido;
  titulo: string;
  texto_contenido: string | null;
  archivo_url: string | null;
  archivo_nombre: string | null;
  archivo_formato: string | null;
  archivo_tamano_kb: number | null;
  rag_indexado: boolean;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: contenido.id,
    seccion_id: contenido.seccion_id,
    clase_id: contenido.clase_id,
    tipo: contenido.tipo,
    titulo: contenido.titulo,
    texto_contenido: contenido.texto_contenido,
    archivo_url: contenido.archivo_url,
    archivo_nombre: contenido.archivo_nombre,
    archivo_formato: contenido.archivo_formato,
    archivo_tamano_kb: contenido.archivo_tamano_kb,
    rag_indexado: contenido.rag_indexado,
    created_at: contenido.created_at,
    updated_at: contenido.updated_at,
  };
}

async function obtenerSeccionYVerificarAccesoLectura(seccionId: string, usuarioId: string, rol: Rol) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seccionId)) {
    throw new AppError(404, "Seccion no encontrada");
  }

  const seccion = await prisma.seccion.findUnique({ where: { id: seccionId } });

  if (!seccion) {
    throw new AppError(404, "Seccion no encontrada");
  }

  if (rol === "PROFESOR" || rol === "ADMIN") {
    const perfil = await obtenerProfesorAsignado(seccion.materia_id, usuarioId);

    if (!perfil) {
      throw new AppError(403, "No tenes acceso a esta materia");
    }
  } else {
    const inscripcion = await obtenerInscripcion(seccion.materia_id, usuarioId);

    if (!inscripcion) {
      throw new AppError(403, "No tenes acceso a esta materia");
    }
  }

  return seccion;
}

async function obtenerSeccionYVerificarEscritura(seccionId: string, usuarioId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seccionId)) {
    throw new AppError(404, "Seccion no encontrada");
  }

  const seccion = await prisma.seccion.findUnique({ where: { id: seccionId } });

  if (!seccion) {
    throw new AppError(404, "Seccion no encontrada");
  }

  const perfil = await obtenerProfesorAsignado(seccion.materia_id, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  return seccion;
}

async function obtenerContenidoYVerificarEscritura(contenidoId: string, usuarioId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contenidoId)) {
    throw new AppError(404, "Contenido no encontrado");
  }

  const contenido = await prisma.contenido.findUnique({ where: { id: contenidoId } });

  if (!contenido) {
    throw new AppError(404, "Contenido no encontrado");
  }

  await obtenerSeccionYVerificarEscritura(contenido.seccion_id, usuarioId);

  return contenido;
}

export async function listarPorSeccion(
  seccionId: string,
  usuarioId: string,
  rol: Rol,
  claseId?: string
) {
  await obtenerSeccionYVerificarAccesoLectura(seccionId, usuarioId, rol);

  const contenidos = await prisma.contenido.findMany({
    where: {
      seccion_id: seccionId,
      ...(claseId ? { clase_id: claseId } : {}),
      ...(rol === "ALUMNO"
        ? { OR: [{ clase_id: null }, { clase: { estado: "PUBLICADO" } }] }
        : {}),
    },
    orderBy: { created_at: "asc" },
  });

  return Promise.all(contenidos.map((c) => conDisponibilidad(toContenidoDto(c))));
}

async function verificarAccesoLecturaMateria(materiaId: string, usuarioId: string, rol: Rol) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(materiaId)) {
    throw new AppError(404, "Materia no encontrada");
  }

  if (rol === "PROFESOR" || rol === "ADMIN") {
    const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);
    if (!perfil) {
      throw new AppError(403, "No tenes acceso a esta materia");
    }
  } else {
    const inscripcion = await obtenerInscripcion(materiaId, usuarioId);
    if (!inscripcion) {
      throw new AppError(403, "No tenes acceso a esta materia");
    }
  }
}

/**
 * Árbol de la materia para el aula: unidades con sus archivos propios y sus clases.
 * Los alumnos solo reciben las clases publicadas y los materiales de esas clases.
 */
export async function obtenerArbol(materiaId: string, usuarioId: string, rol: Rol) {
  await verificarAccesoLecturaMateria(materiaId, usuarioId, rol);

  const secciones = await prisma.seccion.findMany({
    where: { materia_id: materiaId },
    orderBy: [{ orden: "asc" }, { created_at: "asc" }],
    include: {
      contenidos: {
        where: { clase_id: null },
        orderBy: { created_at: "asc" },
      },
      clases: {
        where: rol === "ALUMNO" ? { estado: "PUBLICADO" } : {},
        orderBy: { fecha_clase: "asc" },
        include: {
          contenidos: { orderBy: { created_at: "asc" } },
        },
      },
    },
  });

  return {
    secciones: await Promise.all(secciones.map(async (s) => ({
      id: s.id,
      materia_id: s.materia_id,
      nombre: s.nombre,
      descripcion: s.descripcion,
      tipo: s.tipo,
      orden: s.orden,
      contenidos: await Promise.all(s.contenidos.map((c) => conDisponibilidad(toContenidoDto(c)))),
      clases: await Promise.all(s.clases.map(async (c) => ({
        id: c.id,
        materia_id: c.materia_id,
        seccion_id: c.seccion_id,
        fecha_clase: c.fecha_clase,
        titulo: c.titulo,
        contenido: c.contenido,
        estado: c.estado,
        material_url: c.material_url,
        material_nombre: c.material_nombre,
        material_formato: c.material_formato,
        material_tamano_kb: c.material_tamano_kb,
        contenidos: await Promise.all(c.contenidos.map((x) => conDisponibilidad(toContenidoDto(x)))),
      }))),
    }))),
  };
}

async function obtenerClaseDeSeccion(claseId: string, seccionId: string, materiaId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(claseId)) {
    throw new AppError(404, "Clase no encontrada");
  }

  const clase = await prisma.planningClase.findUnique({ where: { id: claseId } });

  if (!clase || clase.materia_id !== materiaId) {
    throw new AppError(404, "Clase no encontrada");
  }

  if (clase.seccion_id && clase.seccion_id !== seccionId) {
    throw new AppError(400, "La clase pertenece a otra unidad");
  }

  if (!clase.seccion_id) {
    await prisma.planningClase.update({ where: { id: clase.id }, data: { seccion_id: seccionId } });
  }

  return clase;
}

export async function crear(
  seccionId: string,
  input: CrearContenidoInput,
  usuarioId: string
) {
  const seccion = await obtenerSeccionYVerificarEscritura(seccionId, usuarioId);
  const clase = input.clase_id
    ? await obtenerClaseDeSeccion(input.clase_id, seccionId, seccion.materia_id)
    : null;

  const contenido = await prisma.contenido.create({
    data: {
      seccion_id: seccionId,
      clase_id: clase?.id ?? null,
      tipo: input.tipo,
      titulo: input.titulo,
      texto_contenido: input.texto_contenido,
      archivo_url: input.archivo_url,
      archivo_nombre: input.archivo_nombre,
      archivo_formato: input.archivo_formato,
      archivo_tamano_kb: input.archivo_tamano_kb,
    },
  });

  if (input.tipo === "TEXTO" && input.texto_contenido) {
    indexarEnSegundoPlano(contenido.id, seccion.materia_id, {
      tipo: "texto",
      texto: input.texto_contenido,
    });
  }

  return toContenidoDto(contenido);
}

export async function crearArchivo(
  seccionId: string,
  usuarioId: string,
  archivo: { buffer: Buffer; nombreOriginal: string; titulo: string; claseId?: string }
) {
  const seccion = await obtenerSeccionYVerificarEscritura(seccionId, usuarioId);
  const clase = archivo.claseId
    ? await obtenerClaseDeSeccion(archivo.claseId, seccionId, seccion.materia_id)
    : null;
  const tipo = inferirTipo(archivo.nombreOriginal);
  const guardado = await guardarArchivo(archivo.buffer, archivo.nombreOriginal);

  const contenido = await prisma.contenido.create({
    data: {
      seccion_id: seccionId,
      clase_id: clase?.id ?? null,
      tipo,
      titulo: archivo.titulo,
      archivo_url: guardado.url,
      archivo_nombre: guardado.nombre,
      archivo_formato: guardado.formato,
      archivo_tamano_kb: guardado.tamanoKb,
    },
  });

  // VIDEO sigue sin indexarse: el RAG trabaja con texto. IMAGEN si se indexa
  // desde CU-P02, porque el ai-service le pasa OCR antes de embeber.
  // El indexado corre en segundo plano: un PDF grande tarda minutos.
  if (tipo !== "VIDEO") {
    indexarEnSegundoPlano(contenido.id, seccion.materia_id, {
      tipo: "archivo",
      buffer: archivo.buffer,
      nombre: archivo.nombreOriginal,
    });
  }

  return toContenidoDto(contenido);
}

export async function actualizar(
  contenidoId: string,
  input: ActualizarContenidoInput,
  usuarioId: string
) {
  const contenido = await obtenerContenidoYVerificarEscritura(contenidoId, usuarioId);

  const seccion = await prisma.seccion.findUnique({ where: { id: contenido.seccion_id } });
  const claseFinal =
    input.clase_id === undefined
      ? undefined
      : input.clase_id
        ? await obtenerClaseDeSeccion(input.clase_id, contenido.seccion_id, seccion!.materia_id)
        : null;

  const tipoFinal = input.tipo ?? contenido.tipo;
  const textoFinal = input.texto_contenido !== undefined
    ? input.texto_contenido
    : contenido.texto_contenido;
  const reindexar = tipoFinal === "TEXTO" && Boolean(textoFinal) && Boolean(seccion);

  const actualizado = await prisma.contenido.update({
    where: { id: contenidoId },
    data: {
      tipo: input.tipo,
      clase_id: claseFinal === undefined ? undefined : claseFinal?.id ?? null,
      titulo: input.titulo,
      texto_contenido: input.texto_contenido,
      archivo_url: input.archivo_url,
      archivo_nombre: input.archivo_nombre,
      archivo_formato: input.archivo_formato,
      archivo_tamano_kb: input.archivo_tamano_kb,
      rag_indexado: reindexar || input.tipo === "TEXTO" ? false : contenido.rag_indexado,
    },
  });

  if (reindexar && seccion && textoFinal) {
    indexarEnSegundoPlano(contenidoId, seccion.materia_id, { tipo: "texto", texto: textoFinal });
  }

  return toContenidoDto(actualizado);
}

export async function eliminar(contenidoId: string, usuarioId: string) {
  const contenido = await obtenerContenidoYVerificarEscritura(contenidoId, usuarioId);

  const seccion = await prisma.seccion.findUnique({ where: { id: contenido.seccion_id } });

  await prisma.contenido.delete({ where: { id: contenidoId } });

  await eliminarArchivo(contenido.archivo_url);

  // Sin esto el tutor seguia citando material que ya no existe.
  if (seccion) {
    await eliminarMaterialRag(seccion.materia_id, contenidoId);
  }

  return { ok: true };
}

// Si el alumno reabre el mismo material dentro de esta ventana no se vuelve a registrar:
// evita inflar las estadisticas con recargas de pagina.
const VENTANA_ACCESO_MS = 5 * 60 * 1000;

/** CU-A02: registra que un alumno abrio un material (alimenta las estadisticas del docente). */
/**
 * Agrega `archivo_disponible` (CU-A02 5A): false si el archivo ya no esta en el almacenamiento, para que el
 * alumno vea un aviso en lugar de un enlace roto. null = no se pudo comprobar.
 */
async function conDisponibilidad<T extends { archivo_url: string | null }>(
  dto: T
): Promise<T & { archivo_disponible: boolean | null }> {
  return { ...dto, archivo_disponible: await archivoDisponible(dto.archivo_url) };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * CU-A02 (5A): el alumno avisa que un archivo no abre o esta danado. Hay un reporte por alumno y material:
 * repetirlo mientras sigue abierto no avisa de nuevo al docente; si ya estaba resuelto, se reabre.
 */
export async function reportarProblema(contenidoId: string, alumnoId: string, motivo?: string) {
  if (!UUID_RE.test(contenidoId)) {
    throw new AppError(404, "Contenido no encontrado");
  }

  const contenido = await prisma.contenido.findUnique({
    where: { id: contenidoId },
    include: { seccion: { select: { materia_id: true } } },
  });

  if (!contenido) {
    throw new AppError(404, "Contenido no encontrado");
  }

  const materiaId = contenido.seccion.materia_id;

  if (!(await obtenerInscripcion(materiaId, alumnoId))) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const previo = await prisma.reporteContenido.findUnique({
    where: { contenido_id_alumno_id: { contenido_id: contenidoId, alumno_id: alumnoId } },
  });
  const yaAbierto = previo !== null && previo.resuelto_en === null;
  const datos = { motivo: motivo || null, reportado_en: new Date(), resuelto_en: null };

  await prisma.reporteContenido.upsert({
    where: { contenido_id_alumno_id: { contenido_id: contenidoId, alumno_id: alumnoId } },
    create: { contenido_id: contenidoId, alumno_id: alumnoId, ...datos },
    update: datos,
  });

  if (!yaAbierto) {
    const [alumno, profesores] = await Promise.all([
      prisma.usuario.findUnique({ where: { id: alumnoId }, select: { nombre: true } }),
      prisma.materiaProfesor.findMany({
        where: { materia_id: materiaId, activo: true },
        select: { profesor: { select: { usuario_id: true } } },
      }),
    ]);

    await Promise.all(
      profesores.map((mp) =>
        crearNoLeidas({
          usuario_id: mp.profesor.usuario_id,
          tipo: "ALERTA",
          titulo: "Archivo reportado",
          mensaje: `${alumno?.nombre ?? "Un alumno"} reporto que "${contenido.titulo}" no abre o esta danado`,
          referencia_tipo: "contenido",
          referencia_id: contenidoId,
        })
      )
    );
  }

  return { reportado: true, ya_reportado: yaAbierto };
}

/** Materiales de la materia con reportes abiertos, para que el docente los revise (CU-A02 5A). */
export async function listarReportes(materiaId: string, usuarioId: string) {
  if (!UUID_RE.test(materiaId)) {
    throw new AppError(404, "Materia no encontrada");
  }

  if (!(await obtenerProfesorAsignado(materiaId, usuarioId))) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const reportes = await prisma.reporteContenido.findMany({
    where: { resuelto_en: null, contenido: { seccion: { materia_id: materiaId } } },
    include: { contenido: { select: { id: true, titulo: true, tipo: true, archivo_url: true, archivo_nombre: true } } },
    orderBy: { reportado_en: "desc" },
  });

  const porContenido = new Map<string, typeof reportes>();
  for (const r of reportes) {
    porContenido.set(r.contenido_id, [...(porContenido.get(r.contenido_id) ?? []), r]);
  }

  return Promise.all(
    [...porContenido.values()].map(async (filas) => {
      const { contenido } = filas[0];
      return {
        contenido_id: contenido.id,
        titulo: contenido.titulo,
        tipo: contenido.tipo,
        archivo_nombre: contenido.archivo_nombre,
        archivo_disponible: await archivoDisponible(contenido.archivo_url),
        alumnos: filas.length,
        ultimo_reporte: filas[0].reportado_en,
        motivos: [...new Set(filas.map((f) => f.motivo).filter((m): m is string => Boolean(m)))].slice(0, 5),
      };
    })
  );
}

/** El docente marca como resuelto el problema de un material (lo reemplazo o confirmo que abre) y avisa a quienes reportaron. */
export async function resolverReportes(contenidoId: string, usuarioId: string) {
  if (!UUID_RE.test(contenidoId)) {
    throw new AppError(404, "Contenido no encontrado");
  }

  const contenido = await prisma.contenido.findUnique({
    where: { id: contenidoId },
    include: { seccion: { select: { materia_id: true } } },
  });

  if (!contenido) {
    throw new AppError(404, "Contenido no encontrado");
  }

  if (!(await obtenerProfesorAsignado(contenido.seccion.materia_id, usuarioId))) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const abiertos = await prisma.reporteContenido.findMany({
    where: { contenido_id: contenidoId, resuelto_en: null },
    select: { alumno_id: true },
  });

  await prisma.reporteContenido.updateMany({
    where: { contenido_id: contenidoId, resuelto_en: null },
    data: { resuelto_en: new Date() },
  });

  await Promise.all(
    abiertos.map((r) =>
      crearNoLeidas({
        usuario_id: r.alumno_id,
        tipo: "SISTEMA",
        titulo: "Archivo revisado",
        mensaje: `Tu docente revisó "${contenido.titulo}", que habías reportado. Si todavía no abre, volvé a reportarlo.`,
        referencia_tipo: "contenido",
        referencia_id: contenidoId,
      })
    )
  );

  return { resueltos: abiertos.length };
}

export async function registrarAcceso(contenidoId: string, alumnoId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contenidoId)) {
    throw new AppError(404, "Contenido no encontrado");
  }

  const contenido = await prisma.contenido.findUnique({
    where: { id: contenidoId },
    include: { seccion: { select: { materia_id: true } } },
  });

  if (!contenido) {
    throw new AppError(404, "Contenido no encontrado");
  }

  const inscripcion = await obtenerInscripcion(contenido.seccion.materia_id, alumnoId);

  if (!inscripcion) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const reciente = await prisma.accesoContenido.findFirst({
    where: {
      contenido_id: contenidoId,
      alumno_id: alumnoId,
      accedido_en: { gt: new Date(Date.now() - VENTANA_ACCESO_MS) },
    },
    select: { id: true },
  });

  if (reciente) {
    return { registrado: false };
  }

  await prisma.accesoContenido.create({ data: { contenido_id: contenidoId, alumno_id: alumnoId } });

  return { registrado: true };
}

/** Cuantos alumnos abrieron cada material de la materia (vista del docente). */
export async function estadisticasDeAcceso(materiaId: string, usuarioId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(materiaId)) {
    throw new AppError(404, "Materia no encontrada");
  }

  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const [contenidos, accesos, inscriptos] = await Promise.all([
    prisma.contenido.findMany({
      where: { seccion: { materia_id: materiaId } },
      select: { id: true, titulo: true, tipo: true },
      orderBy: { created_at: "asc" },
    }),
    prisma.accesoContenido.findMany({
      where: { contenido: { seccion: { materia_id: materiaId } } },
      select: { contenido_id: true, alumno_id: true, accedido_en: true },
    }),
    prisma.inscripcion.count({ where: { materia_id: materiaId } }),
  ]);

  const porContenido = new Map<string, { alumnos: Set<string>; total: number; ultimo: Date | null }>();

  for (const a of accesos) {
    const fila = porContenido.get(a.contenido_id) ?? { alumnos: new Set<string>(), total: 0, ultimo: null };
    fila.alumnos.add(a.alumno_id);
    fila.total += 1;
    if (!fila.ultimo || a.accedido_en > fila.ultimo) fila.ultimo = a.accedido_en;
    porContenido.set(a.contenido_id, fila);
  }

  return {
    inscriptos,
    contenidos: contenidos.map((c) => {
      const fila = porContenido.get(c.id);
      return {
        contenido_id: c.id,
        titulo: c.titulo,
        tipo: c.tipo,
        alumnos_distintos: fila?.alumnos.size ?? 0,
        accesos: fila?.total ?? 0,
        ultimo_acceso: fila?.ultimo ?? null,
      };
    }),
  };
}
