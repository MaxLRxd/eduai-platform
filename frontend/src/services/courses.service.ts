import type { Course, CourseMaterial, CourseUnit } from "../types/domain";
import { api, apiUrl } from "./api";

interface MateriaDto {
  id: string;
  nombre: string;
  descripcion: string | null;
  nivel_educativo: string;
  activa: boolean;
  inscriptos: number;
  created_at: string;
}

interface SeccionDto {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: "TEORIA" | "PRACTICA";
  orden: number;
  contenidos?: number;
}

interface ContenidoDto {
  id: string;
  seccion_id: string;
  clase_id?: string | null;
  titulo: string;
  tipo: string;
  texto_contenido: string | null;
  rag_indexado: boolean;
  archivo_url?: string | null;
  url?: string | null;
  archivo_nombre?: string | null;
  archivo_disponible?: boolean | null;
}

interface ClaseArbolDto {
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
  contenidos: ContenidoDto[];
}

interface SeccionArbolDto {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: "TEORIA" | "PRACTICA";
  orden: number;
  contenidos: ContenidoDto[];
  clases: ClaseArbolDto[];
}

const COLOR_PALETTE = ["#003d7a", "#059669", "#2563eb", "#d97706", "#7c3aed", "#db2777"];

function colorDeMateria(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLOR_PALETTE[h % COLOR_PALETTE.length];
}

function toCourseDto(m: MateriaDto): Course {
  return {
    id: m.id,
    name: m.nombre,
    professor: m.nivel_educativo,
    progress: 0,
    students: m.inscriptos,
    rating: "—",
    color: colorDeMateria(m.id),
    intro: m.descripcion ?? m.nombre,
    tutorFocus: m.descripcion ?? m.nombre,
    units: [],
    materiales: [],
  };
}

function estadoUnidad(seccion: SeccionDto): CourseUnit["status"] {
  const items = seccion.contenidos ?? 0;
  if (items === 0) return "Próxima";
  if (seccion.tipo === "PRACTICA") return "En curso";
  return "Disponible";
}

export async function getCourses(): Promise<Course[]> {
  const data = await api<{ materias: MateriaDto[] }>("/api/materias/mias");
  return data.materias.filter((m) => m.activa).map(toCourseDto);
}

function toCourseMaterial(c: ContenidoDto): CourseMaterial {
  return {
    id: c.id,
    titulo: c.titulo,
    tipo: c.tipo,
    resumible: Boolean(c.texto_contenido?.trim()),
    ragIndexado: c.rag_indexado,
    // La ruta guardada es relativa (/uploads/...): sin esto el navegador la pide al frontend, no al backend.
    url: apiUrl(c.archivo_url ?? c.url),
    archivo_nombre: c.archivo_nombre ?? null,
    texto: c.texto_contenido?.trim() ? c.texto_contenido : null,
    disponible: c.archivo_disponible ?? null,
  };
}

function materialDePlanificacion(clase: ClaseArbolDto): CourseMaterial | null {
  if (!clase.material_url) return null;
  return {
    id: `clase-${clase.id}-material`,
    titulo: clase.material_nombre ?? clase.titulo,
    tipo: clase.material_formato ?? "ARCHIVO",
    resumible: false,
    ragIndexado: false,
    url: apiUrl(clase.material_url),
    archivo_nombre: clase.material_nombre,
    texto: null,
  };
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  try {
    const [respuesta, arbol] = await Promise.all([
      api<{ materia: MateriaDto }>(`/api/materias/${id}`),
      api<{ secciones: SeccionArbolDto[] }>(`/api/materias/${id}/contenidos`),
    ]);
    const materia = respuesta.materia;

    const unidades: CourseUnit[] = [];
    const materiales: CourseMaterial[] = [];

    for (const s of arbol.secciones) {
      const materialesUnidad = s.contenidos.map(toCourseMaterial);
      const clases = s.clases.map((c) => {
        const adjunto = materialDePlanificacion(c);
        const materialesClase = [...c.contenidos.map(toCourseMaterial), ...(adjunto ? [adjunto] : [])];
        return {
          id: c.id,
          title: c.titulo,
          date: c.fecha_clase,
          content: c.contenido ?? "",
          studentVisible: c.estado === "PUBLICADO",
          materials: materialesClase,
        };
      });

      const items = [
        ...materialesUnidad.map((m) => m.titulo),
        ...clases.map((c) => c.title),
      ];

      materiales.push(...materialesUnidad, ...clases.flatMap((c) => c.materials));
      unidades.push({
        title: s.nombre,
        status: estadoUnidad({ ...s, contenidos: items.length } as SeccionDto),
        items,
        materials: materialesUnidad,
        classes: clases,
      });
    }

    return {
      id: materia.id,
      name: materia.nombre,
      professor: materia.nivel_educativo,
      progress: 0,
      students: materia.inscriptos,
      rating: "—",
      color: colorDeMateria(materia.id),
      intro: materia.descripcion ?? materia.nombre,
      tutorFocus: materia.descripcion ?? materia.nombre,
      units: unidades,
      materiales,
    };
  } catch {
    return undefined;
  }
}