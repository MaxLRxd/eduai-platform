/**
 * Criterio institucional de asistencia (el mismo que `backend/src/modules/asistencias/asistencia.calculo.ts`):
 * presente y justificado no restan, la tardanza cuenta como media falta y la ausencia como una falta.
 * % de asistencia = (clases registradas - faltas equivalentes) / clases registradas.
 */
export const PESO_TARDANZA = 0.5;

/** Faltas que suma el alumno: cada ausencia vale 1 y cada tardanza media. */
export function faltasEquivalentes(ausentes: number, tardanzas: number): number {
  return ausentes + PESO_TARDANZA * tardanzas;
}

/** Porcentaje entero de asistencia, o null si todavia no hay clases registradas. */
export function porcentajeAsistencia(total: number, ausentes: number, tardanzas: number): number | null {
  if (total <= 0) return null;
  return Math.round(((total - faltasEquivalentes(ausentes, tardanzas)) / total) * 100);
}

/** Porcentaje de asistencia a partir de los conteos por estado del panel, o null si no hay registros. */
export function tasaAsistencia(asistencia: { estado: string; count: number }[] | undefined): number | null {
  if (!asistencia || asistencia.length === 0) return null;
  const total = asistencia.reduce((sum, a) => sum + a.count, 0);
  const cantidad = (estado: string) => asistencia.find((a) => a.estado === estado)?.count ?? 0;
  return porcentajeAsistencia(total, cantidad("AUSENTE"), cantidad("TARDANZA"));
}
