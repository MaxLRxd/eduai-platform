/**
 * Criterio institucional de asistencia (una sola definicion para todo el sistema):
 *  - Presente: no resta.
 *  - Justificado: no resta.
 *  - Tardanza: cuenta como media falta (PESO_TARDANZA).
 *  - Ausente: una falta.
 *
 * % de asistencia = (clases registradas - faltas equivalentes) / clases registradas.
 * El frontend tiene la misma regla en `frontend/src/utils/asistencia.ts`: si se cambia aca, cambiarla alla.
 */
export const PESO_TARDANZA = 0.5;

export interface ConteoAsistencia {
  total: number;
  ausentes: number;
  tardanzas: number;
}

/** Faltas que suma el alumno: cada ausencia vale 1 y cada tardanza media. */
export function faltasEquivalentes(c: Pick<ConteoAsistencia, "ausentes" | "tardanzas">): number {
  return c.ausentes + PESO_TARDANZA * c.tardanzas;
}

/** Porcentaje entero de asistencia, o `null` si todavia no hay clases registradas. */
export function porcentajeAsistencia(c: ConteoAsistencia): number | null {
  if (c.total <= 0) return null;
  return Math.round(((c.total - faltasEquivalentes(c)) / c.total) * 100);
}

/** Arma el conteo a partir de una lista de estados (PRESENTE, AUSENTE, TARDANZA, JUSTIFICADO). */
export function conteoDeEstados(estados: Iterable<string>): ConteoAsistencia {
  const c: ConteoAsistencia = { total: 0, ausentes: 0, tardanzas: 0 };
  for (const e of estados) {
    c.total += 1;
    if (e === "AUSENTE") c.ausentes += 1;
    if (e === "TARDANZA") c.tardanzas += 1;
  }
  return c;
}
