import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const USUARIO_ID = "11111111-1111-4111-8111-111111111111";

jest.mock("../config/prisma", () => ({
  prisma: {
    usuario: { findUnique: jest.fn(), update: jest.fn() },
    sesion: { updateMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  usuario: { findUnique: jest.Mock; update: jest.Mock };
  sesion: { updateMany: jest.Mock };
  $transaction: jest.Mock;
};

describe("POST /api/auth/password", () => {
  let server: ReturnType<typeof createServer>;
  let hashActual: string;

  const token = (): string =>
    signAccessToken({ sub: USUARIO_ID, email: "alumno@edu.ai", rol: "ALUMNO" });

  const cambiar = (body: Record<string, unknown>, cookie?: string) => {
    const req = request(server)
      .post("/api/auth/password")
      .set("Authorization", `Bearer ${token()}`);
    if (cookie) req.set("Cookie", `eduai_refresh=${cookie}`);
    return req.send(body);
  };

  beforeAll(async () => {
    hashActual = await bcrypt.hash("ClaveVieja1", 4);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      activo: true,
      password_hash: hashActual,
    });
    prismaMock.usuario.update.mockReturnValue("update");
    prismaMock.sesion.updateMany.mockReturnValue("revocar");
    prismaMock.$transaction.mockResolvedValue([]);
  });

  afterEach(() => {
    server.close();
  });

  it("exige autenticacion", async () => {
    const res = await request(server)
      .post("/api/auth/password")
      .send({ password_actual: "ClaveVieja1", password_nueva: "ClaveNueva1" });

    expect(res.status).toBe(401);
  });

  it("cambia la contrasena y cierra las demas sesiones conservando la actual", async () => {
    const res = await cambiar(
      { password_actual: "ClaveVieja1", password_nueva: "ClaveNueva1" },
      "refresh-token-actual"
    );

    expect(res.status).toBe(200);
    const data = prismaMock.usuario.update.mock.calls[0][0].data;
    expect(await bcrypt.compare("ClaveNueva1", data.password_hash)).toBe(true);
    expect(prismaMock.sesion.updateMany).toHaveBeenCalledWith({
      where: {
        usuario_id: USUARIO_ID,
        revocado: false,
        token_hash: { not: createHash("sha256").update("refresh-token-actual").digest("hex") },
      },
      data: { revocado: true },
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("rechaza si la contrasena actual es incorrecta, sin tocar nada", async () => {
    const res = await cambiar({ password_actual: "otra-cosa", password_nueva: "ClaveNueva1" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("actual es incorrecta");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rechaza una contrasena nueva corta", async () => {
    const res = await cambiar({ password_actual: "ClaveVieja1", password_nueva: "corta" });

    expect(res.status).toBe(400);
    expect(prismaMock.usuario.findUnique).not.toHaveBeenCalled();
  });

  it("rechaza una contrasena nueva igual a la actual", async () => {
    const res = await cambiar({ password_actual: "ClaveVieja1", password_nueva: "ClaveVieja1" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("distinta");
  });
});
