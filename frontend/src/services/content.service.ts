import { api, apiUrl } from "./api";
import type { UploadedMaterial } from "../types/domain";

export interface ContentSection {
  id: string;
  nombre: string;
  tipo: string;
}

interface ContenidoApi {
  id: string;
  seccion_id: string;
  clase_id?: string | null;
  tipo: "TEXTO" | "PDF" | "DOCX" | "PPTX" | "IMAGEN" | "VIDEO";
  titulo: string;
  texto_contenido: string | null;
  archivo_url: string | null;
  archivo_nombre: string | null;
  archivo_formato: string | null;
  archivo_tamano_kb: number | null;
  rag_indexado: boolean;
  created_at: string;
}

interface ClaseArbolApi {
  id: string;
  seccion_id: string | null;
  fecha_clase: string;
  titulo: string;
  contenido: string | null;
  estado: "PLANIFICADO" | "PUBLICADO";
  material_url: string | null;
  material_nombre: string | null;
  material_formato: string | null;
  material_tamano_kb: number | null;
  contenidos: ContenidoApi[];
}

interface SeccionArbolApi {
  id: string;
  nombre: string;
  tipo: string;
  contenidos: ContenidoApi[];
  clases: ClaseArbolApi[];
}

export interface ContentClass {
  id: string;
  sectionId: string;
  title: string;
  date: string;
  content: string;
  studentVisible: boolean;
  materials: UploadedMaterial[];
}

export interface ContentTreeSection extends ContentSection {
  materials: UploadedMaterial[];
  classes: ContentClass[];
}

function tipoToFileType(tipo: ContenidoApi["tipo"]): UploadedMaterial["fileType"] {
  switch (tipo) {
    case "PDF":
      return "pdf";
    case "PPTX":
      return "pptx";
    case "DOCX":
      return "docx";
    case "IMAGEN":
      return "img";
    case "VIDEO":
      return "video";
    default:
      return "txt";
  }
}

function sizeLabel(kb: number | null): string {
  if (kb == null) return "—";
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function formatDate(iso: string): string {
  const f = new Date(iso);
  return Number.isNaN(f.getTime())
    ? ""
    : f.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

function toUploadedMaterial(c: ContenidoApi): UploadedMaterial {
  return {
    id: c.id,
    name: c.archivo_nombre ?? c.titulo,
    fileType: tipoToFileType(c.tipo),
    sizeLabel: sizeLabel(c.archivo_tamano_kb),
    ragStatus: c.rag_indexado ? "Indexado" : "Sin indexar",
    date: formatDate(c.created_at),
    // apiUrl respeta las URLs absolutas (R2 u otro almacenamiento): API_URL + ruta las rompia.
    url: apiUrl(c.archivo_url) ?? undefined,
    text: c.texto_contenido?.trim() ? c.texto_contenido : undefined,
  };
}

function toContentClass(c: ClaseArbolApi, sectionId: string): ContentClass {
  const contenidoPlanificacion = c.contenidos.find(
    (x) => x.archivo_url && x.archivo_url === c.material_url
  );
  const materialPlanificacion: UploadedMaterial | null = c.material_url && !contenidoPlanificacion
    ? {
        id: `clase-${c.id}-material`,
        name: c.material_nombre ?? c.titulo,
        fileType: "txt",
        sizeLabel: sizeLabel(c.material_tamano_kb),
        ragStatus: "Sin indexar",
        date: formatDate(c.fecha_clase),
        url: apiUrl(c.material_url) ?? undefined,
      }
    : null;

  return {
    id: c.id,
    sectionId,
    title: c.titulo,
    date: c.fecha_clase,
    content: c.contenido ?? "",
    studentVisible: c.estado === "PUBLICADO",
    materials: [
      ...c.contenidos.map(toUploadedMaterial),
      ...(materialPlanificacion ? [materialPlanificacion] : []),
    ],
  };
}

export async function getCourseContentTree(courseId: string): Promise<ContentTreeSection[]> {
  const data = await api<{ secciones: SeccionArbolApi[] }>(`/api/materias/${courseId}/contenidos`);
  return (data.secciones ?? []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    tipo: s.tipo,
    materials: s.contenidos.map(toUploadedMaterial),
    classes: s.clases.map((c) => toContentClass(c, s.id)),
  }));
}

export async function getCourseSections(courseId: string): Promise<ContentSection[]> {
  const data = await api<{ secciones: ContentSection[] }>(`/api/materias/${courseId}/secciones`);
  return data.secciones ?? [];
}

export interface CreateSectionInput {
  nombre: string;
  descripcion?: string;
  tipo: "TEORIA" | "PRACTICA";
  orden: number;
}

export async function createSection(courseId: string, input: CreateSectionInput): Promise<ContentSection> {
  const data = await api<{ seccion: ContentSection }>(`/api/materias/${courseId}/secciones`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.seccion;
}

export async function updateSection(
  sectionId: string,
  input: { nombre?: string; tipo?: "TEORIA" | "PRACTICA" }
): Promise<ContentSection> {
  const data = await api<{ seccion: ContentSection }>(`/api/secciones/${sectionId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return data.seccion;
}

/** Guarda el orden de las unidades: recibe TODOS los ids de la materia en el orden nuevo. */
export async function reorderSections(courseId: string, ids: string[]): Promise<void> {
  await api(`/api/materias/${courseId}/secciones/orden`, { method: "PUT", body: JSON.stringify({ ids }) });
}

/** Devuelve los ids con la unidad de `indice` movida una posicion (-1 sube, +1 baja), o null si no se puede. */
export function moverUnidad(ids: string[], indice: number, delta: -1 | 1): string[] | null {
  const destino = indice + delta;
  if (indice < 0 || indice >= ids.length || destino < 0 || destino >= ids.length) return null;
  const copia = [...ids];
  [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
  return copia;
}

export async function deleteSection(sectionId: string): Promise<void> {
  await api(`/api/secciones/${sectionId}`, { method: "DELETE" });
}

export async function deleteMaterial(contenidoId: string): Promise<void> {
  await api(`/api/contenidos/${contenidoId}`, { method: "DELETE" });
}

export async function getUploadedMaterials(sectionId: string): Promise<UploadedMaterial[]> {
  const data = await api<{ contenidos: ContenidoApi[] }>(`/api/secciones/${sectionId}/contenidos`);
  return (data.contenidos ?? []).map(toUploadedMaterial);
}

export async function uploadMaterial(input: {
  sectionId: string;
  title: string;
  body: string;
  classId?: string | null;
}): Promise<UploadedMaterial> {
  const data = await api<{ contenido: ContenidoApi }>(`/api/secciones/${input.sectionId}/contenidos`, {
    method: "POST",
    body: JSON.stringify({
      tipo: "TEXTO",
      titulo: input.title,
      texto_contenido: input.body,
      clase_id: input.classId ?? undefined,
    }),
  });
  return toUploadedMaterial(data.contenido);
}

export async function uploadMaterialFile(input: {
  sectionId: string;
  file: File;
  title?: string;
  classId?: string | null;
}): Promise<UploadedMaterial> {
  const form = new FormData();
  form.append("archivo", input.file);
  form.append("titulo", input.title?.trim() || input.file.name);
  if (input.classId) form.append("clase_id", input.classId);
  const data = await api<{ contenido: ContenidoApi }>(`/api/secciones/${input.sectionId}/contenidos/archivo`, {
    method: "POST",
    body: form,
  });
  return toUploadedMaterial(data.contenido);
}
// ─────────── CU-A02 (5A): archivos que no abren o están dañados ───────────

/** El alumno avisa que un archivo no abre o está dañado. Devuelve si ya había un reporte abierto suyo. */
export async function reportarProblemaMaterial(
  contenidoId: string,
  motivo?: string
): Promise<{ reportado: boolean; ya_reportado: boolean }> {
  return api(`/api/contenidos/${contenidoId}/reportes`, {
    method: "POST",
    body: JSON.stringify(motivo?.trim() ? { motivo: motivo.trim() } : {}),
  });
}

export interface ReporteMaterial {
  contenido_id: string;
  titulo: string;
  tipo: string;
  archivo_nombre: string | null;
  /** false = el archivo ya no está en el almacenamiento; null = no se pudo comprobar. */
  archivo_disponible: boolean | null;
  alumnos: number;
  ultimo_reporte: string;
  motivos: string[];
}

export async function getReportesMaterial(materiaId: string): Promise<ReporteMaterial[]> {
  const data = await api<{ reportes: ReporteMaterial[] }>(`/api/materias/${materiaId}/reportes-contenido`);
  return data.reportes ?? [];
}

export async function resolverReportesMaterial(contenidoId: string): Promise<{ resueltos: number }> {
  return api(`/api/contenidos/${contenidoId}/reportes/resolver`, { method: "POST" });
}
