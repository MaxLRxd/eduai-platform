import { queryClient } from "../queryClient";
import { reiniciarCacheDeLicencias } from "../services/adminLicensing.service";

const PREFIJO_ULTIMA_SESION_TUTOR = "tutor:ultima-sesion:";

/**
 * Borra todo lo que quedó en memoria o en el navegador de la sesión anterior, para que el
 * siguiente usuario (en el mismo navegador) no vea datos ajenos.
 */
export function limpiarEstadoDeSesion(): void {
  queryClient.clear();
  reiniciarCacheDeLicencias();
  try {
    const claves: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const clave = window.localStorage.key(i);
      if (clave?.startsWith(PREFIJO_ULTIMA_SESION_TUTOR)) claves.push(clave);
    }
    claves.forEach((c) => window.localStorage.removeItem(c));
  } catch {
    // sin localStorage no hay nada que limpiar
  }
}
