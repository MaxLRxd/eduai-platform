import { createHash } from "node:crypto";
import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { prisma } from "../config/prisma";
import { logger } from "../config/logger";
import { sendEmailSeguro } from "../services/email.service";
import { signAccessToken } from "../middlewares/auth";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const USUARIO_ID = "22222222-2222-4222-8222-222222222222";
const hash = (t: string): string => createHash("sha256").update(t).digest("hex");

jest.mock("../config/prisma", () => {
  const tx = {
    tokenRecuperacion: { updateMany: jest.fn(), deleteMany: jest.fn() },
    usuario: { update: jest.fn() },
    sesion: { updateMany: jest.fn() },
  };
  return {
    prisma: {
      usuario: { findUnique: jest.fn(), update: jest.fn() },
      tokenRecuperacion: { findUnique: jest.fn(), deleteMany: jest.fn(), create: jest.fn() },
      sesion: { updateMany: jest.fn() },
      $transaction: jest.fn(async (arg: unknown) => (typeof arg === "function" ? arg(tx) : arg)),
      __tx: tx,
    },
  };
});

jest.mock("../services/email.service", () => ({
  isEmailEnabled: jest.fn(() => true),
  sendEmailSeguro: jest.fn(async () => true),
  enviarCorreo: jest.fn(async () => true),
}));

const prismaMock = prisma as unknown as {
  usuario: { findUnique: jest.Mock; update: jest.Mock };
  tokenRecuperacion: { findUnique: jest.Mock; deleteMany: jest.Mock; create: jest.Mock };
  sesion: { updateMany: jest.Mock };
  $transaction: jest.Mock;
  __tx: {
    tokenRecuperacion: { updateMany: jest.Mock; deleteMany: jest.Mock };
    usuario: { update: jest.Mock };
    sesion: { updateMany: jest.Mock };
  };
};
const enviarMock = sendEmailSeguro as jest.Mock;

describe("recuperación emitida por el administrador", () => {
  let server: ReturnType<typeof createServer>;
  let infoSpy: jest.SpyInstance;

  const tokenAdmin = (): string => signAccessToken({ sub: ADMIN_ID, email: "admin@edu.ai", rol: "ADMIN" });
  const tokenAlumno = (): string => signAccessToken({ sub: USUARIO_ID, email: "a@edu.ai", rol: "ALUMNO" });
  const emitir = (usuarioId: string, token = tokenAdmin()) =>
    request(server).post(`/api/admin/users/${usuarioId}/recuperacion-token`).set({ Authorization: `Bearer ${token}` });

  beforeEach(() => {
    jest.clearAllMocks();
    infoSpy = jest.spyOn(logger, "info").mockImplementation(() => undefined as never);
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.usuario.findUnique.mockResolvedValue({ id: USUARIO_ID, activo: true });
    prismaMock.tokenRecuperacion.deleteMany.mockReturnValue("borrar");
    prismaMock.tokenRecuperacion.create.mockReturnValue("crear");
    prismaMock.__tx.tokenRecuperacion.updateMany.mockResolvedValue({ count: 1 });
  });

  afterEach(() => {
    infoSpy.mockRestore();
    server.close();
  });

  it("entrega el enlace una sola vez, guarda solo el hash y nunca lo loguea ni lo maillea", async () => {
    const res = await emitir(USUARIO_ID);

    expect(res.status).toBe(201);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.body.enlace).toMatch(/\/restablecer\?token=[0-9a-f]{64}$/);
    const token = /token=([0-9a-f]{64})/.exec(res.body.enlace)?.[1] ?? "";
    expect(token).toHaveLength(64);
    expect(prismaMock.tokenRecuperacion.create.mock.calls[0][0].data).toEqual(
      expect.objectContaining({ usuario_id: USUARIO_ID, token_hash: hash(token) })
    );
    expect(prismaMock.tokenRecuperacion.deleteMany).toHaveBeenCalledWith({
      where: { usuario_id: USUARIO_ID, usado_at: null },
    });
    expect(Date.parse(res.body.expira_en)).toBeGreaterThan(Date.now());
    expect(enviarMock).not.toHaveBeenCalled();
    const logs = infoSpy.mock.calls
      .map((call) => call.map((valor) => (typeof valor === "string" ? valor : "")).join(" "))
      .join("\n");
    expect(logs).not.toContain(token);
    expect(logs).not.toContain(res.body.enlace);
  });

  it("el enlace sirve para restablecer una vez y deja de servir", async () => {
    const emitida = await emitir(USUARIO_ID);
    const token = /token=([0-9a-f]{64})/.exec(emitida.body.enlace)?.[1] ?? "";
    prismaMock.tokenRecuperacion.findUnique.mockResolvedValue({
      id: "token1",
      usuario_id: USUARIO_ID,
      usado_at: null,
      expires_at: new Date(Date.now() + 60_000),
      usuario: { id: USUARIO_ID, nombre: "Ana", email: "ana@edu.ai", activo: true },
    });

    const primera = await request(server)
      .post("/api/auth/password/restablecer")
      .send({ token, password_nueva: "NuevaClave2026" });
    expect(primera.status).toBe(200);
    expect(prismaMock.__tx.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: USUARIO_ID } })
    );

    prismaMock.__tx.tokenRecuperacion.updateMany.mockResolvedValue({ count: 0 });
    const segunda = await request(server)
      .post("/api/auth/password/restablecer")
      .send({ token, password_nueva: "OtraClave2026" });
    expect(segunda.status).toBe(400);
  });

  it("404 si el usuario no existe o está desactivado", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    expect((await emitir(USUARIO_ID)).status).toBe(404);

    prismaMock.usuario.findUnique.mockResolvedValue({ id: USUARIO_ID, activo: false });
    expect((await emitir(USUARIO_ID)).status).toBe(404);
  });

  it("404 para un id inválido y 403/401 según el rol", async () => {
    expect((await emitir("no-uuid")).status).toBe(404);
    expect((await emitir(USUARIO_ID, tokenAlumno())).status).toBe(403);

    const sinToken = await request(server).post(`/api/admin/users/${USUARIO_ID}/recuperacion-token`);
    expect(sinToken.status).toBe(401);
  });
});
