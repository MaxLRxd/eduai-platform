/**
 * Materia que muestra una pantalla del docente: la pedida por la URL (`?course=`) si es una de
 * sus materias, y si no (id viejo, ajeno o inexistente) la primera de su lista.
 */
export function resolverMateriaActiva(
  pedida: string | null,
  materias: { id: string }[] | undefined
): string | null {
  const lista = materias ?? [];
  if (pedida && lista.some((m) => m.id === pedida)) return pedida;
  return lista[0]?.id ?? null;
}
