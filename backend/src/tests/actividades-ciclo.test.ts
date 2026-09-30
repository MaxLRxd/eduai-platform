import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const SECCION_ID = "22222222-2222-4222-8222-222222222222";
const ACTIVIDAD_ID = "33333333-3333-4333-8333-333333333333";
const OTRA_ACTIVIDAD = "55555555-5555-4555-8555-555555555555";
const ALUMNO_ID = "44444444-4444-4444-8444-444444444444";
const PROFESOR_ID = "66666666-6666-4666-8666-666666666666";

jest.mock("../config/prisma", () => ({
  prisma: {
    actividad: { findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    seccion: { findUnique: jest.fn() },
    entrega: { count: jest.fn(), upsert: jest.fn() },
    inscripcion: { findUnique: jest.fn() },
    profesor: { findUnique: jest.fn() },
    materiaProfesor: { findUnique: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  actividad: { findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
  seccion: { findUnique: jest.Mock };
  entrega: { count: jest.Mock; upsert: jest.Mock };
  inscripcion: { findUnique: jest.Mock };
  profesor: { findUnique: jest.Mock };
  materiaProfesor: { findUnique: jest.Mock };
};

const actividad = (activo = true): Record<string, unknown> => ({
  id: ACTIVIDAD_ID,
  seccion_id: SECCION_ID,
  nombre: "TP1",
  consigna: "Resolvelo",
  tipo: "DESARROLLO",
  activo,
});

describe("actividades: ciclo de vida del docente", () => {
  let server: ReturnType<typeof createServer>;

  const tokenProfe = (): string =>
    signAccessToken({ sub: PROFESOR_ID, email: "profe@edu.ai", rol: "PROFESOR" });
  const tokenAlumno = (): string =>
    signAccessToken({ sub: ALUMNO_ID, email: "alumno@edu.ai", rol: "ALUMNO" });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.seccion.findUnique.mockResolvedValue({ id: SECCION_ID, materia_id: MATERIA_ID });
    prismaMock.inscripcion.findUnique.mockResolvedValue({ alumno_id: ALUMNO_ID });
    prismaMock.profesor.findUnique.mockResolvedValue({ id: PROFESOR_ID, usuario_id: PROFESOR_ID });
    prismaMock.materiaProfesor.findUnique.mockResolvedValue({
      materia_id: MATERIA_ID,
      profesor_id: PROFESOR_ID,
      activo: true,
    });
    prismaMock.actividad.findUnique.mockResolvedValue(actividad());
    prismaMock.actividad.update.mockImplementation(({ data }) => Promise.resolve({ ...actividad(), ...data }));
    prismaMock.actividad.delete.mockResolvedValue({});
    prismaMock.entrega.count.mockResolvedValue(0);
  });

  afterEach(() => {
    server.close();
  });

  describe("archivar y restaurar", () => {
    it("archiva la actividad", async () => {
      const res = await request(server)
        .put(`/api/actividades/${ACTIVIDAD_ID}`)
        .set("Authorization", `Bearer ${tokenProfe()}`)
        .send({ activo: false });

      expect(res.status).toBe(200);
      expect(res.body.actividad.activo).toBe(false);
      expect(prismaMock.actividad.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ activo: false }) })
      );
    });

    it("restaura la actividad", async () => {
      const res = await request(server)
        .put(`/api/actividades/${ACTIVIDAD_ID}`)
        .set("Authorization", `Bearer ${tokenProfe()}`)
        .send({ activo: true });

      expect(res.status).toBe(200);
      expect(res.body.actividad.activo).toBe(true);
    });

    it("no deja archivar a un docente sin acceso a la materia", async () => {
      prismaMock.profesor.findUnique.mockResolvedValue(null);

      const res = await request(server)
        .put(`/api/actividades/${ACTIVIDAD_ID}`)
        .set("Authorization", `Bearer ${tokenProfe()}`)
        .send({ activo: false });

      expect(res.status).toBe(403);
      expect(prismaMock.actividad.update).not.toHaveBeenCalled();
    });

    it("rechaza a un alumno", async () => {
      const res = await request(server)
        .put(`/api/actividades/${ACTIVIDAD_ID}`)
        .set("Authorization", `Bearer ${tokenAlumno()}`)
        .send({ activo: false });

      expect(res.status).toBe(403);
      expect(prismaMock.actividad.update).not.toHaveBeenCalled();
    });
  });

  describe("eliminar", () => {
    it("elimina si no tiene entregas", async () => {
      const res = await request(server)
        .delete(`/api/actividades/${ACTIVIDAD_ID}`)
        .set("Authorization", `Bearer ${tokenProfe()}`);

      expect(res.status).toBe(200);
      expect(res.body.eliminada).toBe(true);
      expect(prismaMock.actividad.delete).toHaveBeenCalledTimes(1);
    });

    it("no elimina si tiene entregas y sugiere archivar", async () => {
      prismaMock.entrega.count.mockResolvedValue(1);

      const res = await request(server)
        .delete(`/api/actividades/${ACTIVIDAD_ID}`)
        .set("Authorization", `Bearer ${tokenProfe()}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("Archivala");
      expect(prismaMock.actividad.delete).not.toHaveBeenCalled();
    });

    it("no elimina si tiene varias entregas y lo aclara en plural", async () => {
      prismaMock.entrega.count.mockResolvedValue(3);

      const res = await request(server)
        .delete(`/api/actividades/${ACTIVIDAD_ID}`)
        .set("Authorization", `Bearer ${tokenProfe()}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("3 entregas");
    });

    it("valida el acceso antes de contar entregas", async () => {
      prismaMock.profesor.findUnique.mockResolvedValue(null);

      const res = await request(server)
        .delete(`/api/actividades/${ACTIVIDAD_ID}`)
        .set("Authorization", `Bearer ${tokenProfe()}`);

      expect(res.status).toBe(403);
      expect(prismaMock.entrega.count).not.toHaveBeenCalled();
      expect(prismaMock.actividad.delete).not.toHaveBeenCalled();
    });

    it("devuelve 404 si la actividad no existe", async () => {
      prismaMock.actividad.findUnique.mockResolvedValue(null);

      const res = await request(server)
        .delete(`/api/actividades/${OTRA_ACTIVIDAD}`)
        .set("Authorization", `Bearer ${tokenProfe()}`);

      expect(res.status).toBe(404);
      expect(prismaMock.actividad.delete).not.toHaveBeenCalled();
    });

    it("rechaza a un alumno", async () => {
      const res = await request(server)
        .delete(`/api/actividades/${ACTIVIDAD_ID}`)
        .set("Authorization", `Bearer ${tokenAlumno()}`);

      expect(res.status).toBe(403);
      expect(prismaMock.actividad.delete).not.toHaveBeenCalled();
    });
  });

  describe("el alumno no puede entregar en una actividad archivada", () => {
    it("rechaza la entrega de texto", async () => {
      prismaMock.actividad.findUnique.mockResolvedValue(actividad(false));

      const res = await request(server)
        .post(`/api/actividades/${ACTIVIDAD_ID}/entrega`)
        .set("Authorization", `Bearer ${tokenAlumno()}`)
        .send({ respuesta_texto: "mi respuesta" });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("archivada");
    });
  });
});
