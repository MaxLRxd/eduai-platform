import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

jest.mock("../config/prisma", () => ({
  prisma: {
    institution: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  institution: {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
};

const guardarArchivoMock = jest.fn();
const eliminarArchivoMock = jest.fn();

jest.mock("../config/storage", () => ({
  UPLOADS_DIR: "uploads-test",
  asegurarDirectorioUploads: jest.fn(),
  guardarArchivo: (...args: unknown[]) => guardarArchivoMock(...args),
  eliminarArchivo: (...args: unknown[]) => eliminarArchivoMock(...args),
}));

const ADMIN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function institucion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    nombre: "IES Santa Fe",
    logo_url: "/uploads/logo-viejo.png",
    color_primario: "#003d7a",
    color_secundario: "#005fa3",
    color_claro: "#dbeafe",
    updated_at: new Date(),
    ...overrides,
  };
}

describe("branding institucional", () => {
  let server: ReturnType<typeof createServer>;

  const tokenAdmin = (): string =>
    signAccessToken({ sub: ADMIN_ID, email: "admin@edu.ai", rol: "ADMIN" });

  const tokenAlumno = (): string =>
    signAccessToken({ sub: ADMIN_ID, email: "alumno@edu.ai", rol: "ALUMNO" });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.institution.findFirst.mockResolvedValue(institucion());
    prismaMock.institution.update.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      institucion(data)
    );
    guardarArchivoMock.mockResolvedValue({
      url: "/uploads/logo-nuevo.png",
      nombre: "logo.png",
      formato: "png",
      tamanoKb: 3,
      key: "logo-nuevo.png",
    });
  });

  afterEach(() => {
    server.close();
  });

  describe("GET /api/admin/branding/presets", () => {
    it("devuelve los esquemas de color al ADMIN", async () => {
      const res = await request(server)
        .get("/api/admin/branding/presets")
        .set("Authorization", `Bearer ${tokenAdmin()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.presets)).toBe(true);
      expect(res.body.presets.length).toBeGreaterThan(0);
      expect(res.body.presets[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          primary: expect.stringMatching(/^#/),
          secondary: expect.stringMatching(/^#/),
          lighter: expect.stringMatching(/^#/),
        })
      );
    });

    it("rechaza sin token", async () => {
      const res = await request(server).get("/api/admin/branding/presets");
      expect(res.status).toBe(401);
    });

    it("rechaza a un rol que no es ADMIN", async () => {
      const res = await request(server)
        .get("/api/admin/branding/presets")
        .set("Authorization", `Bearer ${tokenAlumno()}`);
      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/admin/branding/logo", () => {
    it("sube una imagen al storage y devuelve la url", async () => {
      const res = await request(server)
        .post("/api/admin/branding/logo")
        .set("Authorization", `Bearer ${tokenAdmin()}`)
        .attach("logo", Buffer.from("png-bytes"), {
          filename: "logo.png",
          contentType: "image/png",
        });

      expect(res.status).toBe(201);
      expect(res.body.logo_url).toBe("/uploads/logo-nuevo.png");
      expect(guardarArchivoMock).toHaveBeenCalledTimes(1);
    });

    it("rechaza un archivo que no es imagen", async () => {
      const res = await request(server)
        .post("/api/admin/branding/logo")
        .set("Authorization", `Bearer ${tokenAdmin()}`)
        .attach("logo", Buffer.from("no soy imagen"), {
          filename: "notas.txt",
          contentType: "text/plain",
        });

      expect(res.status).toBe(400);
      expect(guardarArchivoMock).not.toHaveBeenCalled();
    });

    it("devuelve 400 si falta el archivo", async () => {
      const res = await request(server)
        .post("/api/admin/branding/logo")
        .set("Authorization", `Bearer ${tokenAdmin()}`);

      expect(res.status).toBe(400);
      expect(guardarArchivoMock).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/config/branding (publico)", () => {
    it("devuelve el branding sin token", async () => {
      const res = await request(server).get("/api/config/branding");

      expect(res.status).toBe(200);
      expect(res.body.branding).toEqual(
        expect.objectContaining({
          nombre: "IES Santa Fe",
          logo_url: "/uploads/logo-viejo.png",
          color_primario: "#003d7a",
          color_secundario: "#005fa3",
          color_claro: "#dbeafe",
        })
      );
    });
  });

  describe("PUT /api/admin/branding", () => {
    it("persiste color_claro", async () => {
      const res = await request(server)
        .put("/api/admin/branding")
        .set("Authorization", `Bearer ${tokenAdmin()}`)
        .send({ color_claro: "#fee2e2" });

      expect(res.status).toBe(200);
      expect(res.body.branding.color_claro).toBe("#fee2e2");
      expect(prismaMock.institution.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ color_claro: "#fee2e2" }) })
      );
    });

    it("borra el logo anterior al reemplazarlo", async () => {
      const res = await request(server)
        .put("/api/admin/branding")
        .set("Authorization", `Bearer ${tokenAdmin()}`)
        .send({ logo_url: "/uploads/logo-nuevo.png" });

      expect(res.status).toBe(200);
      expect(eliminarArchivoMock).toHaveBeenCalledWith("/uploads/logo-viejo.png");
    });

    it("borra el archivo al quitar el logo", async () => {
      const res = await request(server)
        .put("/api/admin/branding")
        .set("Authorization", `Bearer ${tokenAdmin()}`)
        .send({ logo_url: null });

      expect(res.status).toBe(200);
      expect(eliminarArchivoMock).toHaveBeenCalledWith("/uploads/logo-viejo.png");
      expect(prismaMock.institution.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ logo_url: null }) })
      );
    });

    it("no toca el logo si no viene en el body", async () => {
      const res = await request(server)
        .put("/api/admin/branding")
        .set("Authorization", `Bearer ${tokenAdmin()}`)
        .send({ nombre: "Nuevo nombre" });

      expect(res.status).toBe(200);
      expect(eliminarArchivoMock).not.toHaveBeenCalled();
    });
  });
});
