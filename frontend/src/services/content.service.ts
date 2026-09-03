import { api } from "./api";
import type { UploadedMaterial } from "../types/domain";

export interface ContentSection {
  id: string;
  nombre: string;
  tipo: string;
}

interface ContenidoApi {
  id: string;
  seccion_id: string;
  tipo: "TEXTO" | "PDF" | "DOCX" | "PPTX" | "IMAGEN" | "VIDEO";
  titulo: string;
  texto_contenido: string | null;
  archivo_nombre: string | null;
  archivo_formato: string | null;
  archivo_tamano_kb: number | null;
  rag_indexado: boolean;
  created_at: string;
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

export async function getCourseSections(courseId: string): Promise<ContentSection[]> {
  const data = await api<{ secciones: ContentSection[] }>(`/api/materias/${courseId}/secciones`);
  return data.secciones ?? [];
}

export async function getUploadedMaterials(sectionId: string): Promise<UploadedMaterial[]> {
  const data = await api<{ contenidos: ContenidoApi[] }>(`/api/secciones/${sectionId}/contenidos`);
  return (data.contenidos ?? []).map((c) => ({
    name: c.archivo_nombre ?? c.titulo,
    fileType: tipoToFileType(c.tipo),
    sizeLabel: sizeLabel(c.archivo_tamano_kb),
    ragStatus: c.rag_indexado ? "Indexado" : "Sin indexar",
    date: formatDate(c.created_at),
  }));
}

export async function uploadMaterial(input: {
  sectionId: string;
  title: string;
  body: string;
}): Promise<UploadedMaterial> {
  const data = await api<{ contenido: ContenidoApi }>(`/api/secciones/${input.sectionId}/contenidos`, {
    method: "POST",
    body: JSON.stringify({
      tipo: "TEXTO",
      titulo: input.title,
      texto_contenido: input.body,
    }),
  });
  const c = data.contenido;
  return {
    name: c.titulo,
    fileType: "txt",
    sizeLabel: c.texto_contenido ? `${Math.round(c.texto_contenido.length / 1024)} KB` : "—",
    ragStatus: c.rag_indexado ? "Indexado" : "Sin indexar",
    date: formatDate(c.created_at),
  };
}