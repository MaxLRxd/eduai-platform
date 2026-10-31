import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const MATERIA_ID = "22222222-2222-4222-8222-222222222222";
const ALUMNO_ID = "33333333-3333-4333-8333-333333333333";
const PROFESOR_ID = "44444444-4444-4444-8444-444444444444";
const PROFESOR_USUARIO_ID = "55555555-5555-4555-8555-555555555555";
const CLAVE_ID = "66666666-6666-4666-8666-666666666666";

jest.mock("../config/prisma", () => ({
  prisma: {
    materia: { findUnique: jest.fn() },
    profesor: { findUnique: jest.fn() },
    materiaProfesor: { findUnique: jest.fn(), upsert: jest.fn() },
    inscripcion: { findUnique: jest.fn(), findMany: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
    claveMatriculacion: { updateMany: jest.fn() },
    notificacion: { create: jest.fn() },
    usuario: { findFirst: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  materia: { findUnique: jest.Mock };
  profesor: { findUnique: jest.Mock };
  materiaProfesor: { findUnique: jest.Mock; upsert: jest.Mock };
  inscripcion: { findUnique: jest.Mock; findMany: jest.Mock; delete: jest.Mock; deleteMany: jest.Mock };
  claveMatriculacion: { updateMany: jest.Mock };
  notificacion: { create: jest.Mock };
  usuario: { findFirst: jest.Mock; create: jest.Mock; findUnique: jest.Mock };
  $transaction: jest.Mock;
};

const notificacionCreada = {
  id: "n1",
  usuario_id: ALUMNO_ID,
  tipo: "SISTEMA",
  titulo: "t",
  mensaje: "m",
  referencia_tipo: null,
  referencia_id: null,
  leida: false,
  creada_en: new Date(),
  leida_en: null,
};

describe("admin: desmatriculacion, asignacion de docentes y avisos in-app", () => {
  let server: ReturnType<typeof createServer>;

  const tokenAdmin = (): string => signAccessToken({ sub: ADMIN_ID, email: "admin@edu.ai", rol: "ADMIN" });
  const tokenAlumno = (): string => signAccessToken({ sub: ALUMNO_ID, email: "a@edu.ai", rol: "ALUMNO" });
  const con = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.notificacion.create.mockResolvedValue(notificacionCreada);
    prismaMock.$transaction.mockResolvedValue([]);
    prismaMock.inscripcion.delete.mockReturnValue("delete");
    prismaMock.inscripcion.deleteMany.mockReturnValue("deleteMany");
    prismaMock.claveMatriculacion.updateMany.mockReturnValue("updateMany");
  });

  afterEach(() => {
    server.close();
  });

  describe("desmatricular un alumno (CU-AD01 A3.1)", () => {
    const inscripcion = { id: "i1", alumno_id: ALUMNO_ID, materia_id: MATERIA_ID, clave_id: CLAVE_ID, materia: { nombre: "Redes" } };

    it("lo da de baja, libera su lugar en la clave y le avisa", async () => {
      prismaMock.inscripcion.findUnique.mockResolvedValue(inscripcion);

      const res = await request(server)
        .delete(`/api/admin/materias/${MATERIA_ID}/inscripciones/${ALUMNO_ID}`)
        .set(con(tokenAdmin()));

      expect(res.status).toBe(200);
      expect(prismaMock.inscripcion.delete).toHaveBeenCalledWith({ where: { id: "i1" } });
      expect(prismaMock.claveMatriculacion.updateMany).toHaveBeenCalledWith({
        where: { id: CLAVE_ID, usos_actuales: { gt: 0 } },
        data: { usos_actuales: { decrement: 1 } },
      });
      expect(prismaMock.notificacion.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ usuario_id: ALUMNO_ID, tipo: "SISTEMA" }) })
      );
    });

    it("404 si el alumno no estaba inscripto", async () => {
      prismaMock.inscripcion.findUnique.mockResolvedValue(null);

      const res = await request(server)
        .delete(`/api/admin/materias/${MATERIA_ID}/inscripciones/${ALUMNO_ID}`)
        .set(con(tokenAdmin()));

      expect(res.status).toBe(404);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it("solo el administrador puede desmatricular", async () => {
      const res = await request(server)
        .delete(`/api/admin/materias/${MATERIA_ID}/inscripciones/${ALUMNO_ID}`)
        .set(con(tokenAlumno()));

      expect(res.status).toBe(403);
    });
  });

  describe("desmatricular a todos", () => {
    it("borra todas las inscripciones, libera los usos por clave y avisa a cada alumno", async () => {
      prismaMock.materia.findUnique.mockResolvedValue({ id: MATERIA_ID, nombre: "Redes" });
      prismaMock.inscripcion.findMany.mockResolvedValue([
        { alumno_id: "a1", clave_id: CLAVE_ID },
        { alumno_id: "a2", clave_id: CLAVE_ID },
        { alumno_id: "a3", clave_id: "otra-clave" },
      ]);

      const res = await request(server)
        .delete(`/api/admin/materias/${MATERIA_ID}/inscripciones`)
        .set(con(tokenAdmin()));

      expect(res.status).toBe(200);
      expect(res.body.cantidad).toBe(3);
      expect(prismaMock.claveMatriculacion.updateMany).toHaveBeenCalledWith({
        where: { id: CLAVE_ID, usos_actuales: { gte: 2 } },
        data: { usos_actuales: { decrement: 2 } },
      });
      expect(prismaMock.notificacion.create).toHaveBeenCalledTimes(3);
    });

    it("sin inscriptos no hace nada", async () => {
      prismaMock.materia.findUnique.mockResolvedValue({ id: MATERIA_ID, nombre: "Redes" });
      prismaMock.inscripcion.findMany.mockResolvedValue([]);

      const res = await request(server)
        .delete(`/api/admin/materias/${MATERIA_ID}/inscripciones`)
        .set(con(tokenAdmin()));

      expect(res.body.cantidad).toBe(0);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("asignar profesores (CU-AD02)", () => {
    const asignar = (activo = true) =>
      request(server)
        .post(`/api/admin/materias/${MATERIA_ID}/profesores`)
        .set(con(tokenAdmin()))
        .send({ profesor_id: PROFESOR_ID, activo });

    beforeEach(() => {
      prismaMock.materia.findUnique.mockResolvedValue({ id: MATERIA_ID, nombre: "Redes" });
      prismaMock.profesor.findUnique.mockResolvedValue({ id: PROFESOR_ID, usuario_id: PROFESOR_USUARIO_ID });
      prismaMock.materiaProfesor.upsert.mockResolvedValue({ activo: true });
    });

    it("E1: rechaza asignar a un profesor que ya esta asignado", async () => {
      prismaMock.materiaProfesor.findUnique.mockResolvedValue({ activo: true });

      const res = await asignar();

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("ya se encuentra asignado");
      expect(prismaMock.materiaProfesor.upsert).not.toHaveBeenCalled();
    });

    it("asigna y le avisa al profesor dentro de la plataforma", async () => {
      prismaMock.materiaProfesor.findUnique.mockResolvedValue(null);

      const res = await asignar();

      expect(res.status).toBe(201);
      expect(prismaMock.notificacion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ usuario_id: PROFESOR_USUARIO_ID, titulo: "Nueva materia asignada" }),
        })
      );
    });

    it("permite reasignar a un profesor que habia sido desasignado", async () => {
      prismaMock.materiaProfesor.findUnique.mockResolvedValue({ activo: false });

      expect((await asignar()).status).toBe(201);
    });

    it("desasignar avisa al profesor y exige que estuviera asignado", async () => {
      prismaMock.materiaProfesor.findUnique.mockResolvedValue({ activo: true });
      prismaMock.materiaProfesor.upsert.mockResolvedValue({ activo: false });

      const ok = await asignar(false);
      expect(ok.status).toBe(201);
      expect(prismaMock.notificacion.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ titulo: "Materia desasignada" }) })
      );

      prismaMock.materiaProfesor.findUnique.mockResolvedValue(null);
      expect((await asignar(false)).status).toBe(409);
    });

    it("si falla el aviso igual se completa la asignacion", async () => {
      prismaMock.materiaProfesor.findUnique.mockResolvedValue(null);
      prismaMock.notificacion.create.mockRejectedValue(new Error("db caida"));

      expect((await asignar()).status).toBe(201);
    });
  });

  describe("alta de usuario (CU-AD03)", () => {
    it("avisa al nuevo usuario dentro de la plataforma sin incluir la contrasena", async () => {
      prismaMock.usuario.findFirst.mockResolvedValue(null);
      prismaMock.usuario.create.mockResolvedValue({
        id: ALUMNO_ID,
        nombre: "Ana",
        email: "ana@edu.ai",
        rol: "ALUMNO",
        activo: true,
        created_at: new Date(),
        perfilProfesor: null,
        _count: { inscripciones: 0 },
      });

      const res = await request(server)
        .post("/api/admin/users")
        .set(con(tokenAdmin()))
        .send({ nombre: "Ana", email: "ana@edu.ai", password: "ClaveTemporal1", rol: "ALUMNO" });

      expect(res.status).toBe(201);
      const data = prismaMock.notificacion.create.mock.calls[0][0].data;
      expect(data.usuario_id).toBe(ALUMNO_ID);
      expect(data.tipo).toBe("SISTEMA");
      expect(data.mensaje).toContain("ana@edu.ai");
      expect(JSON.stringify(data)).not.toContain("ClaveTemporal1");
    });
  });
});
