import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";
import { accesoRevocado, permitirAcceso, revocarAcceso } from "../config/cache";
import { env } from "../config/env";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const USUARIO_ID = "22222222-2222-4222-8222-222222222222";

jest.mock("../config/storage", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mkdtempSync } = require("node:fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { tmpdir } = require("node:os");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { join } = require("node:path");
  return {
    UPLOADS_DIR: mkdtempSync(join(tmpdir(), "eduai-uploads-")),
    asegurarDirectorioUploads: jest.fn(),
  };
});

jest.mock("../config/prisma", () => ({
  prisma: {
    usuario: { findUnique: jest.fn(), update: jest.fn() },
    sesion: { updateMany: jest.fn() },
  },
}));

import { UPLOADS_DIR } from "../config/storage";

const prismaMock = prisma as unknown as {
  usuario: { findUnique: jest.Mock; update: jest.Mock };
  sesion: { updateMany: jest.Mock };
};

describe("archivos subidos: no pueden ejecutar scripts en el origen de la API", () => {
  let server: ReturnType<typeof createServer>;

  beforeAll(() => {
    fs.writeFileSync(path.join(UPLOADS_DIR, "malicioso.html"), "<script>alert(1)</script>");
    fs.writeFileSync(path.join(UPLOADS_DIR, "dibujo.svg"), "<svg onload='alert(1)'/>");
    fs.writeFileSync(path.join(UPLOADS_DIR, "apunte.pdf"), "%PDF-1.4");
    fs.writeFileSync(path.join(UPLOADS_DIR, "foto.png"), "png");
  });

  beforeEach(() => {
    server = createServer(createApp() as unknown as import("http").RequestListener);
  });

  afterEach(() => {
    server.close();
  });

  it.each(["malicioso.html", "dibujo.svg"])("%s se descarga y queda en un sandbox", async (nombre) => {
    const res = await request(server).get(`/uploads/${nombre}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toBe("attachment");
    expect(res.headers["content-security-policy"]).toContain("sandbox");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it.each(["apunte.pdf", "foto.png"])("%s se sigue viendo en el navegador", async (nombre) => {
    const res = await request(server).get(`/uploads/${nombre}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toBeUndefined();
    expect(res.headers["content-security-policy"]).toBeUndefined();
  });
});

describe("admin: dar de baja a un usuario", () => {
  let server: ReturnType<typeof createServer>;

  const tokenAdmin = (): string =>
    signAccessToken({ sub: ADMIN_ID, email: "admin@edu.ai", rol: "ADMIN" });

  const cambiarEstado = (activo: boolean) =>
    request(server)
      .patch(`/api/admin/users/${USUARIO_ID}/estado`)
      .set("Authorization", `Bearer ${tokenAdmin()}`)
      .send({ activo });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.usuario.findUnique.mockResolvedValue({ id: USUARIO_ID });
    prismaMock.usuario.update.mockResolvedValue({
      id: USUARIO_ID,
      nombre: "Alumno",
      email: "alumno@edu.ai",
      rol: "ALUMNO",
      activo: false,
      created_at: new Date(),
      _count: { inscripciones: 0 },
    });
  });

  afterEach(() => {
    server.close();
  });

  it("revoca sus sesiones abiertas", async () => {
    const res = await cambiarEstado(false);

    expect(res.status).toBe(200);
    expect(prismaMock.sesion.updateMany).toHaveBeenCalledWith({
      where: { usuario_id: USUARIO_ID, revocado: false },
      data: { revocado: true },
    });
    expect(accesoRevocado(USUARIO_ID)).toBe(true);
  });

  it("no toca las sesiones al reactivarlo", async () => {
    const res = await cambiarEstado(true);

    expect(res.status).toBe(200);
    expect(prismaMock.sesion.updateMany).not.toHaveBeenCalled();
    expect(accesoRevocado(USUARIO_ID)).toBe(false);
  });
});

describe("access tokens de cuentas dadas de baja", () => {
  const REVOCADO_ID = "66666666-6666-4666-8666-666666666666";
  const OTRO_ID = "77777777-7777-4777-8777-777777777777";

  let server: ReturnType<typeof createServer>;

  const pedirMe = (id: string) =>
    request(server)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${signAccessToken({ sub: id, email: "alumno@edu.ai", rol: "ALUMNO" })}`);

  beforeEach(() => {
    jest.clearAllMocks();
    permitirAcceso(REVOCADO_ID);
    permitirAcceso(OTRO_ID);
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: OTRO_ID,
      nombre: "Alumno",
      email: "alumno@edu.ai",
      rol: "ALUMNO",
      activo: true,
    });
  });

  afterEach(() => {
    server.close();
    permitirAcceso(REVOCADO_ID);
    permitirAcceso(OTRO_ID);
    jest.restoreAllMocks();
  });

  it("un token valido deja de servir al revocar el acceso", async () => {
    revocarAcceso(REVOCADO_ID);

    const res = await pedirMe(REVOCADO_ID);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Cuenta desactivada" });
    expect(prismaMock.usuario.findUnique).not.toHaveBeenCalled();
  });

  it("los demas usuarios siguen pudiendo usar su token", async () => {
    revocarAcceso(REVOCADO_ID);

    const res = await pedirMe(OTRO_ID);

    expect(res.status).toBe(200);
    expect(res.body.usuario.id).toBe(OTRO_ID);
  });

  it("la denylist caduca junto con la vida del access token", () => {
    const ahora = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(ahora);
    revocarAcceso(REVOCADO_ID);

    expect(accesoRevocado(REVOCADO_ID)).toBe(true);

    (Date.now as jest.Mock).mockReturnValue(ahora + env.ACCESS_TOKEN_TTL_SECONDS * 1000 + 1);
    expect(accesoRevocado(REVOCADO_ID)).toBe(false);
  });
});
