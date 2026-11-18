import { AppError } from "../../middlewares/error";

export interface NivelDesempeno {
  nombre: string;
  /** Porcentaje del peso del criterio que se obtiene en este nivel (100 = maximo). */
  puntaje: number;
}

export interface CriterioRubrica {
  nombre: string;
  peso: number;
  esperado?: string;
  /** Texto opcional por nivel: que se ve en la entrega para ese nivel. La clave es el nombre del nivel. */
  descriptores?: Record<string, string>;
}

const normalizar = (s: string): string => s.trim().toLowerCase();

/**
 * Los descriptores solo tienen sentido si existe el nivel al que apuntan: un nombre de nivel
 * que ya no existe dejaria texto huerfano que la IA igual leeria.
 */
export function validarDescriptores(criterios: CriterioRubrica[], niveles: NivelDesempeno[] | null): void {
  const nombres = new Set((niveles ?? []).map((n) => normalizar(n.nombre)));

  for (const criterio of criterios) {
    const claves = Object.keys(criterio.descriptores ?? {});
    if (claves.length === 0) continue;

    if (nombres.size === 0) {
      throw new AppError(400, `El criterio "${criterio.nombre}" tiene descriptores por nivel pero la rubrica no define niveles`);
    }
    const desconocida = claves.find((k) => !nombres.has(normalizar(k)));
    if (desconocida) {
      throw new AppError(400, `El criterio "${criterio.nombre}" tiene un descriptor para un nivel que no existe: "${desconocida}"`);
    }
  }
}

/** Arma lo que necesita el ai-service para corregir con la rubrica (criterios + niveles). */
export function rubricaParaIA(rubrica: { criterios: unknown; niveles?: unknown } | null): {
  rubrica: { nombre: string; peso: number; esperado: string; descriptores: Record<string, string> }[];
  niveles: NivelDesempeno[];
} {
  const criterios = Array.isArray(rubrica?.criterios) ? (rubrica.criterios as CriterioRubrica[]) : [];
  const niveles = Array.isArray(rubrica?.niveles) ? (rubrica.niveles as NivelDesempeno[]) : [];

  return {
    rubrica: criterios.map((c) => ({
      nombre: c.nombre,
      peso: c.peso,
      esperado: c.esperado ?? "",
      descriptores: c.descriptores ?? {},
    })),
    niveles,
  };
}
