/** Porcentaje de presencia (presente + tardanza) o null si todavía no hay registros. */
export function tasaAsistencia(asistencia: { estado: string; count: number }[] | undefined): number | null {
  if (!asistencia || asistencia.length === 0) return null;
  const total = asistencia.reduce((sum, a) => sum + a.count, 0);
  if (total === 0) return null;
  const presente =
    (asistencia.find((a) => a.estado === "PRESENTE")?.count ?? 0) +
    (asistencia.find((a) => a.estado === "TARDANZA")?.count ?? 0);
  return Math.round((presente / total) * 100);
}
