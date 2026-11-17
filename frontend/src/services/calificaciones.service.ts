import { api } from "./api";

export interface CategoriaNota {
  id: string;
  nombre: string;
  peso: number;
}

export interface NotaDetalle {
  id: string;
  alumno_id: string;
  periodo: string;
  evaluacion: string;
  categoria_id: string | null;
  actividad_id: string | null;
  calificacion: number;
  observaciones: string | null;
}

export interface AlumnoCalificaciones {
  alumno_id: string;
  nombre: string;
  email: string;
  /** Nota final ponderada por categorías (o promedio simple si la materia no definió categorías). */
  promedio: number | null;
  /** Notas sin categoría: no cuentan en el promedio mientras la materia use categorías. */
  sin_categoria: number;
  por_categoria: Record<string, number | null>;
  notas: NotaDetalle[];
}

export interface ResumenCalificaciones {
  categorias: CategoriaNota[];
  periodos: string[];
  alumnos: AlumnoCalificaciones[];
}

export interface ResultadoImportacion {
  creadas: number;
  actualizadas: number;
  sin_publicar: number;
}

export async function getResumenCalificaciones(courseId: string, periodo?: string): Promise<ResumenCalificaciones> {
  const query = periodo ? `?periodo=${encodeURIComponent(periodo)}` : "";
  const data = await api<ResumenCalificaciones>(`/api/materias/${courseId}/calificaciones${query}`);
  return { categorias: data.categorias ?? [], periodos: data.periodos ?? [], alumnos: data.alumnos ?? [] };
}

/** Reemplaza las categorías de la materia. Lista vacía = promedio simple. */
export async function guardarCategorias(
  courseId: string,
  categorias: { id?: string; nombre: string; peso: number }[]
): Promise<CategoriaNota[]> {
  const data = await api<{ categorias: CategoriaNota[] }>(`/api/materias/${courseId}/categorias-nota`, {
    method: "PUT",
    body: JSON.stringify({ categorias }),
  });
  return data.categorias ?? [];
}

export async function actualizarNota(
  notaId: string,
  input: { calificacion: number; observaciones?: string; evaluacion?: string; categoria_id?: string | null }
): Promise<void> {
  await api(`/api/notas/${notaId}`, { method: "PUT", body: JSON.stringify(input) });
}

/** Trae a Calificaciones las notas ya publicadas de una actividad (repetible: actualiza, no duplica). */
export async function importarNotasDeActividad(
  actividadId: string,
  input: { periodo: string; categoria_id?: string | null }
): Promise<ResultadoImportacion> {
  return api<ResultadoImportacion>(`/api/actividades/${actividadId}/notas/sincronizar`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function formatoNota(n: number | null | undefined): string {
  return n == null ? "—" : n.toFixed(2);
}

/** Suma de pesos y si cierra en 100 (con tolerancia de centésimas, como el backend). */
export function resumenPesos(pesos: number[]): { suma: number; correcto: boolean } {
  const suma = Math.round(pesos.reduce((s, p) => s + (Number.isFinite(p) ? p : 0), 0) * 100) / 100;
  return { suma, correcto: Math.abs(suma - 100) <= 0.01 };
}
