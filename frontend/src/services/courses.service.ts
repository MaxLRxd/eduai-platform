import type { Course, CourseUnit } from "../types/domain";
import { api } from "./api";

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
  titulo: string;
  tipo: string;
  texto_contenido: string | null;
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
    latest: [],
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

export async function getCourseById(id: string): Promise<Course | undefined> {
  try {
    const [materia, secciones] = await Promise.all([
      api<MateriaDto>(`/api/materias/${id}`),
      api<{ secciones: SeccionDto[] }>(`/api/materias/${id}/secciones`),
    ]);

    const unidades: CourseUnit[] = [];
    const latest: string[] = [];

    for (const s of secciones.secciones) {
      const data = await api<{ contenidos: ContenidoDto[] }>(`/api/secciones/${s.id}/contenidos`);
      const items = data.contenidos.map((c) => c.titulo);
      latest.push(...items);
      unidades.push({
        title: s.nombre,
        status: estadoUnidad({ ...s, contenidos: items.length }),
        items,
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
      latest,
    };
  } catch {
    return undefined;
  }
}