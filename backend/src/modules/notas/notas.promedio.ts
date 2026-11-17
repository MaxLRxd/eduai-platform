export interface CategoriaPeso {
  id: string;
  peso: number;
}

export interface NotaParaPromedio {
  categoria_id: string | null;
  calificacion: number;
}

export interface ResultadoPromedio {
  /** Promedio final de la materia (0-10, dos decimales) o null si todavia no hay notas que cuenten. */
  promedio: number | null;
  /** Notas que no tienen categoria y por eso NO cuentan cuando la materia usa categorias. */
  sin_categoria: number;
}

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

function media(valores: number[]): number {
  return valores.reduce((s, v) => s + v, 0) / valores.length;
}

/**
 * Promedio final de un alumno en una materia.
 *
 * - Sin categorias configuradas: promedio simple de todas las notas (es lo que se hacia antes).
 * - Con categorias: se promedia cada categoria y se ponderan por su peso. Si el alumno todavia
 *   no tiene notas en una categoria, esa categoria no cuenta y los pesos se reparten entre las
 *   que si tienen notas (si no, el alumno quedaria penalizado por lo que aun no se evaluo).
 *   Las notas sin categoria no entran al calculo; se informan aparte para que el docente las asigne.
 */
export function promedioPonderado(notas: NotaParaPromedio[], categorias: CategoriaPeso[]): ResultadoPromedio {
  if (categorias.length === 0) {
    return {
      promedio: notas.length > 0 ? redondear(media(notas.map((n) => n.calificacion))) : null,
      sin_categoria: 0,
    };
  }

  const ids = new Set(categorias.map((c) => c.id));
  const sinCategoria = notas.filter((n) => !n.categoria_id || !ids.has(n.categoria_id)).length;

  let sumaPonderada = 0;
  let sumaPesos = 0;
  for (const categoria of categorias) {
    const delaCategoria = notas.filter((n) => n.categoria_id === categoria.id).map((n) => n.calificacion);
    if (delaCategoria.length === 0 || categoria.peso <= 0) continue;
    sumaPonderada += media(delaCategoria) * categoria.peso;
    sumaPesos += categoria.peso;
  }

  return {
    promedio: sumaPesos > 0 ? redondear(sumaPonderada / sumaPesos) : null,
    sin_categoria: sinCategoria,
  };
}

/** Promedio por categoria (para mostrar el desglose en las tablas). */
export function promedioPorCategoria(
  notas: NotaParaPromedio[],
  categorias: CategoriaPeso[]
): Record<string, number | null> {
  const resultado: Record<string, number | null> = {};
  for (const categoria of categorias) {
    const valores = notas.filter((n) => n.categoria_id === categoria.id).map((n) => n.calificacion);
    resultado[categoria.id] = valores.length > 0 ? redondear(media(valores)) : null;
  }
  return resultado;
}
