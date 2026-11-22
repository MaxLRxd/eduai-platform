import { env } from "./env";

const revocados = new Map<string, number>();

/** Marca los access tokens ya emitidos de un usuario como inutilizables durante su vida útil. */
export function revocarAcceso(usuarioId: string): void {
  const ahora = Date.now();
  for (const [id, vence] of revocados) {
    if (vence <= ahora) revocados.delete(id);
  }
  revocados.set(usuarioId, ahora + env.ACCESS_TOKEN_TTL_SECONDS * 1000);
}

/** Permite otra vez los tokens del usuario (se usa al reactivar la cuenta). */
export function permitirAcceso(usuarioId: string): void {
  revocados.delete(usuarioId);
}

export function accesoRevocado(usuarioId: string): boolean {
  const vence = revocados.get(usuarioId);
  if (vence === undefined) return false;
  if (vence <= Date.now()) {
    revocados.delete(usuarioId);
    return false;
  }
  return true;
}
