/**
 * Prueba de integración contra un bucket REAL de Cloudflare R2 (o cualquier S3 compatible).
 *
 * Se salta sola: solo corre si se pide con R2_INTEGRATION=1 y están las credenciales. Así `npm test` y el CI
 * no tocan ningún bucket. Para correrla (usar un bucket de pruebas; la prueba borra lo que sube):
 *
 *   R2_INTEGRATION=1 R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=… R2_ENDPOINT=https://<cuenta>.r2.cloudflarestorage.com \
 *   R2_BUCKET_NAME=… [R2_PUBLIC_URL=https://…] npx jest storage-r2
 */
const VARIABLES = ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ENDPOINT", "R2_BUCKET_NAME"];
const configurado = process.env.R2_INTEGRATION === "1" && VARIABLES.every((v) => Boolean(process.env[v]));

const suite = configurado ? describe : describe.skip;

suite("almacenamiento en R2 (bucket real)", () => {
  let storage: typeof import("../config/storage");

  beforeAll(() => {
    // storage.ts decide el proveedor al cargarse: se carga acá, ya con las variables del entorno.
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      storage = require("../config/storage");
    });
  });

  it("usa el proveedor s3 con las credenciales dadas", () => {
    expect(storage.getStorageProvider()).toBe("s3");
  });

  it("sube un archivo, lo lee de vuelta, lo borra y ya no está", async () => {
    const contenido = Buffer.from(`eduai-prueba-r2-${Date.now()}`);
    const guardado = await storage.guardarArchivo(contenido, "prueba-integracion.txt");

    try {
      expect(guardado.key).toMatch(/^prueba-integracion-[0-9a-f]{32}\.txt$/);
      expect(guardado.formato).toBe("txt");

      const leido = await storage.leerArchivo(guardado.url);
      expect(leido).not.toBeNull();
      expect((leido as Buffer).equals(contenido)).toBe(true);
    } finally {
      await storage.eliminarArchivo(guardado.url);
    }

    // Tras borrarlo, leerlo falla (NoSuchKey): no queda basura en el bucket.
    await expect(storage.leerArchivo(guardado.url)).rejects.toThrow();
  });

  const publica = process.env.R2_PUBLIC_URL ? it : it.skip;
  publica("el archivo se sirve desde la URL pública del bucket", async () => {
    const contenido = Buffer.from(`eduai-publico-${Date.now()}`);
    const guardado = await storage.guardarArchivo(contenido, "prueba-publica.txt");

    try {
      expect(guardado.url.startsWith(String(process.env.R2_PUBLIC_URL).replace(/\/+$/, ""))).toBe(true);
      const res = await fetch(guardado.url);
      expect(res.status).toBe(200);
      expect(Buffer.from(await res.arrayBuffer()).equals(contenido)).toBe(true);
    } finally {
      await storage.eliminarArchivo(guardado.url);
    }
  });
});
