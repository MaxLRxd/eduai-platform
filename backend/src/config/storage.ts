import fs from "node:fs";
import path from "node:path";
import { env } from "./env";

export const UPLOADS_DIR = path.resolve(process.cwd(), env.UPLOAD_DIR);

export function asegurarDirectorioUploads(): void {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function sanitizarBase(original: string): string {
  const ext = path.extname(original).toLowerCase();
  const base = path.basename(original, ext)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const nombre = `${base || "archivo"}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}${ext}`;
  return nombre;
}

export function guardarArchivo(buffer: Buffer, nombreOriginal: string): {
  url: string;
  nombre: string;
  formato: string;
  tamanoKb: number;
} {
  asegurarDirectorioUploads();
  const nombre = sanitizarBase(nombreOriginal);
  fs.writeFileSync(path.join(UPLOADS_DIR, nombre), buffer);
  return {
    url: `/uploads/${nombre}`,
    nombre: nombreOriginal,
    formato: path.extname(nombreOriginal).replace(".", "").toLowerCase(),
    tamanoKb: Math.max(1, Math.round(buffer.length / 1024)),
  };
}

export function eliminarArchivo(url: string | null): void {
  if (!url || !url.startsWith("/uploads/")) return;
  const ruta = path.join(UPLOADS_DIR, path.basename(url));
  if (ruta.startsWith(UPLOADS_DIR)) {
    fs.unlink(ruta, () => {});
  }
}