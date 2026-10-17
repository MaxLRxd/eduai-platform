import fs from "node:fs";
import path from "node:path";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { env } from "./env";

export const UPLOADS_DIR = path.resolve(process.cwd(), env.UPLOAD_DIR);

export type StorageProvider = "local" | "s3";

export type StoredFile = {
  url: string;
  nombre: string;
  formato: string;
  tamanoKb: number;
  key: string;
};

const usarS3 = Boolean(
  env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME
);

let cliente: S3Client | null = null;

function clienteS3(): S3Client {
  if (!cliente) {
    cliente = new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY as string,
      },
    });
  }
  return cliente;
}

function normalizarEndpoint(): string {
  return (env.R2_ENDPOINT ?? "").replace(/\/+$/, "");
}

function prefijoPublico(): string {
  return `${normalizarEndpoint()}/${env.R2_BUCKET_NAME}`;
}

export function getStorageProvider(): StorageProvider {
  return usarS3 ? "s3" : "local";
}

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
  return `${base || "archivo"}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}${ext}`;
}

function formatoDe(nombre: string): string {
  return path.extname(nombre).replace(".", "").toLowerCase();
}

export async function guardarArchivo(
  buffer: Buffer,
  nombreOriginal: string
): Promise<StoredFile> {
  const key = sanitizarBase(nombreOriginal);
  const formato = formatoDe(nombreOriginal);
  const tamanoKb = Math.max(1, Math.round(buffer.length / 1024));

  if (usarS3) {
    await new Upload({
      client: clienteS3(),
      params: {
        Bucket: env.R2_BUCKET_NAME as string,
        Key: key,
        Body: buffer,
      },
    }).done();
    return {
      url: `${prefijoPublico()}/${key}`,
      nombre: nombreOriginal,
      formato,
      tamanoKb,
      key,
    };
  }

  asegurarDirectorioUploads();
  fs.writeFileSync(path.join(UPLOADS_DIR, key), buffer);
  return { url: `/uploads/${key}`, nombre: nombreOriginal, formato, tamanoKb, key };
}

export async function eliminarArchivo(url: string | null): Promise<void> {
  if (!url) return;

  if (usarS3) {
    const prefijo = `${prefijoPublico()}/`;
    if (!url.startsWith(prefijo)) return;
    const key = decodeURIComponent(url.slice(prefijo.length));
    await clienteS3().send(
      new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME as string, Key: key })
    );
    return;
  }

  if (!url.startsWith("/uploads/")) return;
  const ruta = path.join(UPLOADS_DIR, path.basename(url));
  if (ruta.startsWith(UPLOADS_DIR)) {
    fs.unlink(ruta, () => {});
  }
}
