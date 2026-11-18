export interface NivelRubrica {
  nombre: string;
  /** % del peso del criterio que se obtiene en este nivel (el mejor vale 100). */
  puntaje: number;
}

/** Punto de partida habitual: se puede editar, agregar o quitar. */
export const NIVELES_TIPICOS: NivelRubrica[] = [
  { nombre: "Excelente", puntaje: 100 },
  { nombre: "Bueno", puntaje: 75 },
  { nombre: "Regular", puntaje: 50 },
  { nombre: "Insuficiente", puntaje: 25 },
];

export const MIN_NIVELES = 2;
export const MAX_NIVELES = 6;

/**
 * Mismas reglas que el servidor (así el docente ve el problema antes de guardar):
 * entre 2 y 6 niveles, sin nombres repetidos, de mejor a peor y el mejor vale 100.
 * Devuelve la lista de problemas; vacía = válido.
 */
export function validarNiveles(niveles: NivelRubrica[]): string[] {
  const problemas: string[] = [];

  if (niveles.length < MIN_NIVELES) problemas.push(`Definí al menos ${MIN_NIVELES} niveles.`);
  if (niveles.length > MAX_NIVELES) problemas.push(`Máximo ${MAX_NIVELES} niveles.`);

  if (niveles.some((n) => !n.nombre.trim())) problemas.push("Cada nivel necesita un nombre.");

  const nombres = niveles.map((n) => n.nombre.trim().toLowerCase()).filter(Boolean);
  if (new Set(nombres).size !== nombres.length) problemas.push("Hay niveles con el mismo nombre.");

  if (niveles.some((n) => !Number.isFinite(n.puntaje) || n.puntaje < 0 || n.puntaje > 100)) {
    problemas.push("Cada porcentaje tiene que estar entre 0 y 100.");
  } else if (niveles.length > 0) {
    if (niveles[0].puntaje !== 100) problemas.push("El mejor nivel (el primero) tiene que valer 100%.");
    for (let i = 1; i < niveles.length; i++) {
      if (niveles[i].puntaje >= niveles[i - 1].puntaje) {
        problemas.push("Los niveles van de mejor a peor: cada porcentaje debe ser menor al anterior.");
        break;
      }
    }
  }

  return problemas;
}
