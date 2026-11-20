import { createHash } from "node:crypto";
import request from "supertest";
import { createServer } from "http";
import bcrypt from "bcryptjs";
import { createApp } from "../app";
import { prisma } from "../config/prisma";
import { sendEmailSeguro } from "../services/email.service";

const USUARIO_ID = "11111111-1111-4111-8111-111111111111";
const TOKEN = "a".repeat(64);
const hash = (t: string): string => createHash("sha256").update(t).digest("hex");

jest.mock("../config/prisma", () => {
  const tx = {
    tokenRecuperacion: { updateMany: jest.fn(), deleteMany: jest.fn() },
    usuario: { update: jest.fn() },
    sesion: { updateMany: jest.fn() },
  };
  return {
    prisma: {
      usuario: { findUnique: jest.fn() },
      tokenRecuperacion: { findUnique: jest.fn(), deleteMany: jest.fn(), create: jest.fn() },
      $transaction: jest.fn(async (arg: unknown) => (typeof arg === "function" ? arg(tx) : arg)),
      __tx: tx,
    },
  };
});

jest.mock("../services/email.service", () => ({
  isEmailEnabled: jest.fn(() => true),
  sendEmailSeguro: jest.fn(async () => true),
}));

const prismaMock = prisma as unknown as {
  usuario: { findUnique: jest.Mock };
  tokenRecuperacion: { findUnique: jest.Mock; deleteMany: jest.Mock; create: jest.Mock };
  $transaction: jest.Mock;
  __tx: {
    tokenRecuperacion: { updateMany: jest.Mock; deleteMany: jest.Mock };
    usuario: { update: jest.Mock };
    sesion: { updateMany: jest.Mock };
  };
};
const enviarMock = sendEmailSeguro as jest.Mock;

describe("recuperación de contraseña", () => {
  let server: ReturnType<typeof createServer>;

  const olvide = (email: string) => request(server).post("/api/auth/password/olvide").send({ email });
  const restablecer = (body: Record<string, unknown>) =>
    request(server).post("/api/auth/password/restablecer").send(body);

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      nombre: "Ana",
      email: "ana@edu.ai",
      activo: true,
    });
    prismaMock.tokenRecuperacion.deleteMany.mockReturnValue("borrar");
    prismaMock.tokenRecuperacion.create.mockReturnValue("crear");
    prismaMock.__tx.tokenRecuperacion.updateMany.mockResolvedValue({ count: 1 });
  });

  afterEach(() => server.close());

  describe("POST /password/olvide", () => {
    it("crea un enlace de un solo uso, guarda solo su hash y manda el correo", async () => {
      const res = await olvide("ana@edu.ai");

      expect(res.status).toBe(200);
      const guardado = prismaMock.tokenRecuperacion.create.mock.calls[0][0].data;
      expect(guardado.usuario_id).toBe(USUARIO_ID);
      expect(guardado.token_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(guardado.expires_at.getTime()).toBeGreaterThan(Date.now());

      const correo = enviarMock.mock.calls[0][0];
      expect(correo.to).toBe("ana@edu.ai");
      const token = /token=([0-9a-f]+)/.exec(correo.text)?.[1] ?? "";
      expect(token).toHaveLength(64);
      // En la base está el hash del token, nunca el token.
      expect(guardado.token_hash).toBe(hash(token));
      expect(JSON.stringify(guardado)).not.toContain(token);
    });

    it("pedir otro enlace invalida el anterior sin usar", async () => {
      await olvide("ana@edu.ai");

      expect(prismaMock.tokenRecuperacion.deleteMany).toHaveBeenCalledWith({
        where: { usuario_id: USUARIO_ID, usado_at: null },
      });
    });

    it("responde igual (y no manda nada) si la cuenta no existe: no revela quién tiene cuenta", async () => {
      const existente = await olvide("ana@edu.ai");
      prismaMock.usuario.findUnique.mockResolvedValue(null);
      jest.clearAllMocks();

      const inexistente = await olvide("nadie@edu.ai");

      expect(inexistente.status).toBe(existente.status);
      expect(inexistente.body).toEqual(existente.body);
      expect(enviarMock).not.toHaveBeenCalled();
      expect(prismaMock.tokenRecuperacion.create).not.toHaveBeenCalled();
    });

    it("no manda nada a una cuenta desactivada", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue({ id: USUARIO_ID, activo: false, email: "x@edu.ai" });

      const res = await olvide("x@edu.ai");

      expect(res.status).toBe(200);
      expect(enviarMock).not.toHaveBeenCalled();
    });

    it("rechaza un email mal formado", async () => {
      expect((await olvide("no-es-un-mail")).status).toBe(400);
    });
  });

  describe("POST /password/restablecer", () => {
    const registro = (extra: Record<string, unknown> = {}) => ({
      id: "t1",
      usuario_id: USUARIO_ID,
      usado_at: null,
      expires_at: new Date(Date.now() + 60_000),
      usuario: { id: USUARIO_ID, nombre: "Ana", email: "ana@edu.ai", activo: true },
      ...extra,
    });

    it("cambia la contraseña, consume el enlace y cierra TODAS las sesiones", async () => {
      prismaMock.tokenRecuperacion.findUnique.mockResolvedValue(registro());

      const res = await restablecer({ token: TOKEN, password_nueva: "NuevaClave2026" });

      expect(res.status).toBe(200);
      expect(prismaMock.tokenRecuperacion.findUnique.mock.calls[0][0].where).toEqual({ token_hash: hash(TOKEN) });
      const nuevoHash = prismaMock.__tx.usuario.update.mock.calls[0][0].data.password_hash;
      expect(await bcrypt.compare("NuevaClave2026", nuevoHash)).toBe(true);
      expect(prismaMock.__tx.sesion.updateMany).toHaveBeenCalledWith({
        where: { usuario_id: USUARIO_ID, revocado: false },
        data: { revocado: true },
      });
      expect(prismaMock.__tx.tokenRecuperacion.updateMany.mock.calls[0][0].data.usado_at).toBeInstanceOf(Date);
      expect(enviarMock.mock.calls[0][0].subject).toMatch(/cambiada/);
    });

    it.each([
      ["no existe", null],
      ["ya se usó", registro({ usado_at: new Date() })],
      ["venció", registro({ expires_at: new Date(Date.now() - 1000) })],
      ["la cuenta está desactivada", registro({ usuario: { id: USUARIO_ID, activo: false } })],
    ])("rechaza un enlace que %s", async (_caso, valor) => {
      prismaMock.tokenRecuperacion.findUnique.mockResolvedValue(valor);

      const res = await restablecer({ token: TOKEN, password_nueva: "NuevaClave2026" });

      expect(res.status).toBe(400);
      expect(prismaMock.__tx.usuario.update).not.toHaveBeenCalled();
      expect(prismaMock.__tx.sesion.updateMany).not.toHaveBeenCalled();
    });

    it("si dos pedidos usan el mismo enlace a la vez, el segundo pierde y no cambia nada", async () => {
      prismaMock.tokenRecuperacion.findUnique.mockResolvedValue(registro());
      prismaMock.__tx.tokenRecuperacion.updateMany.mockResolvedValue({ count: 0 });

      const res = await restablecer({ token: TOKEN, password_nueva: "NuevaClave2026" });

      expect(res.status).toBe(400);
      expect(prismaMock.__tx.usuario.update).not.toHaveBeenCalled();
    });

    it("exige una contraseña de al menos 8 caracteres y un token con forma de token", async () => {
      expect((await restablecer({ token: TOKEN, password_nueva: "corta" })).status).toBe(400);
      expect((await restablecer({ token: "x", password_nueva: "NuevaClave2026" })).status).toBe(400);
      expect(prismaMock.tokenRecuperacion.findUnique).not.toHaveBeenCalled();
    });
  });
});
