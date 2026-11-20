import type { MateriaIndexada } from "../../config/aiClient";

/**
 * Materias que tienen vectores pero ya no existen en la base de datos (se borraron o eran de
 * pruebas): ocupan lugar en el almacén vectorial y nunca se consultan.
 */
export function materiasHuerfanas(indexadas: MateriaIndexada[], materiaIdsVigentes: string[]): MateriaIndexada[] {
  const vigentes = new Set(materiaIdsVigentes);
  return indexadas.filter((m) => !vigentes.has(m.subject_id));
}
