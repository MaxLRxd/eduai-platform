import type { StudentStanding, TeacherStudentRow } from "../types/domain";

export type OrdenAlumnos = "nombre" | "promedio-desc" | "promedio-asc" | "asistencia-desc" | "asistencia-asc";

export interface FiltroAlumnos {
  estado: "" | StudentStanding;
  busqueda: string;
  orden: OrdenAlumnos;
}

export const FILTRO_INICIAL: FiltroAlumnos = { estado: "", busqueda: "", orden: "nombre" };

const sinAcentos = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Compara numeros dejando siempre al final a quien no tiene dato (no tiene sentido mostrarlo «mejor» ni «peor»). */
function comparar(a: number | null, b: number | null, descendente: boolean): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return descendente ? b - a : a - b;
}

/** Filtra por estado y por nombre o legajo (sin distinguir acentos ni mayusculas) y ordena la lista. */
export function filtrarYOrdenarAlumnos(alumnos: TeacherStudentRow[], f: FiltroAlumnos): TeacherStudentRow[] {
  const texto = sinAcentos(f.busqueda.trim());
  const filtrados = alumnos.filter(
    (a) =>
      (!f.estado || a.standing === f.estado) &&
      (!texto || sinAcentos(a.name).includes(texto) || sinAcentos(a.legajo).includes(texto))
  );

  const porNombre = (a: TeacherStudentRow, b: TeacherStudentRow) => a.name.localeCompare(b.name, "es");

  return [...filtrados].sort((a, b) => {
    switch (f.orden) {
      case "promedio-desc":
        return comparar(a.averageValue, b.averageValue, true) || porNombre(a, b);
      case "promedio-asc":
        return comparar(a.averageValue, b.averageValue, false) || porNombre(a, b);
      case "asistencia-desc":
        return comparar(a.attendanceValue, b.attendanceValue, true) || porNombre(a, b);
      case "asistencia-asc":
        return comparar(a.attendanceValue, b.attendanceValue, false) || porNombre(a, b);
      default:
        return porNombre(a, b);
    }
  });
}
