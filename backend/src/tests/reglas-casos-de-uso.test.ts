import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const SECCION_ID = "22222222-2222-4222-8222-222222222222";
const ACTIVIDAD_ID = "33333333-3333-4333-8333-333333333333";
const ALUMNO_ID = "44444444-4444-4444-8444-444444444444";
const PROFESOR_ID = "55555555-5555-4555-8555-555555555555";
const ADMIN_ID = "66666666-6666-4666-8666-666666666666";

jest.mock("../config/prisma", () => ({
  prisma: {
    profesor: { findUnique: jest.fn(), upsert: jest.fn() },
    materiaProfesor: { findUnique: jest.fn(), findMany: jest.fn() },
    seccion: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    materia: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    claveMatriculacion: { create: jest.fn() },
    actividad: { findUnique: jest.fn(), create: jest.fn() },
    inscripcion: { findUnique: jest.fn(), count: jest.fn() },
    entrega: { upsert: jest.fn(), update: jest.fn() },
    usuario: { findUnique: jest.fn() },
    rubrica: { findUnique: jest.fn() },
  },
}));

jest.mock("../config/aiClient", () => ({
  aiDisponible: jest.fn(() => true),
  corregirEntregaIA: jest.fn(),
}));

const p = prisma as unknown as Record<string, Record<string, jest.Mock>>;

const HORA = 60 * 60 * 1000;
const futuro = () => new Date(Date.now() + 24 * HORA).toISOString();
const pasado = () => new Date(Date.now() - HORA).toISOString();

const token = (sub: string, rol: "ALUMNO" | "PROFESOR" | "ADMIN") => ({
  Authorization: `Bearer ${signAccessToken({ sub, email: "x@edu.ai", rol })}`,
});

describe("reglas de los casos de uso", () => {
  let server: ReturnType<typeof createServer>;
  const esperarSegundoPlano = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    p.profesor.findUnique.mockResolvedValue({ id: PROFESOR_ID, usuario_id: PROFESOR_ID });
    p.materiaProfesor.findUnique.mockResolvedValue({ activo: true });
    p.seccion.findFirst.mockResolvedValue(null);
    p.materia.findFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    server.close();
  });

  describe("CU-P01 (E1): secciones con nombre duplicado", () => {
    const crear = (nombre: string) =>
      request(server)
        .post(`/api/materias/${MATERIA_ID}/secciones`)
        .set(token(PROFESOR_ID, "PROFESOR"))
        .send({ nombre, tipo: "TEORIA", orden: 1 });

    it("rechaza una seccion con el nombre de otra de la misma materia", async () => {
      p.seccion.findFirst.mockResolvedValue({ id: "otra" });

      const res = await crear("Unidad 1");

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("Ya existe una seccion");
      expect(p.seccion.create).not.toHaveBeenCalled();
      expect(p.seccion.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ materia_id: MATERIA_ID, nombre: { equals: "Unidad 1", mode: "insensitive" } }),
        })
      );
    });

    it("crea la seccion si el nombre esta libre", async () => {
      p.seccion.create.mockResolvedValue({
        id: SECCION_ID,
        materia_id: MATERIA_ID,
        nombre: "Unidad 2",
        descripcion: null,
        tipo: "TEORIA",
        orden: 1,
        created_at: new Date(),
        updated_at: new Date(),
        _count: { contenidos: 0, actividades: 0 },
      });

      expect((await crear("Unidad 2")).status).toBe(201);
    });

    it("al renombrar excluye a la propia seccion de la comparacion", async () => {
      p.seccion.findUnique.mockResolvedValue({ id: SECCION_ID, materia_id: MATERIA_ID });
      p.seccion.findFirst.mockResolvedValue({ id: "otra" });

      const res = await request(server)
        .put(`/api/secciones/${SECCION_ID}`)
        .set(token(PROFESOR_ID, "PROFESOR"))
        .send({ nombre: "Unidad 1" });

      expect(res.status).toBe(409);
      expect(p.seccion.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: { not: SECCION_ID } }) })
      );
    });
  });

  describe("CU-AD01 (E1): materias con nombre duplicado", () => {
    it("el administrador no puede crear una materia repetida", async () => {
      p.materia.findFirst.mockResolvedValue({ id: "existente" });

      const res = await request(server)
        .post("/api/admin/materias")
        .set(token(ADMIN_ID, "ADMIN"))
        .send({ nombre: "Redes", nivel_educativo: "Terciario" });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Ya existe una materia con ese nombre");
      expect(p.materia.create).not.toHaveBeenCalled();
    });

    it("tampoco puede renombrar una materia con el nombre de otra", async () => {
      p.materia.findUnique.mockResolvedValue({ id: MATERIA_ID, nombre: "Bases de Datos", activa: true });
      p.materia.findFirst.mockResolvedValue({ id: "otra" });

      const res = await request(server)
        .put(`/api/admin/materias/${MATERIA_ID}`)
        .set(token(ADMIN_ID, "ADMIN"))
        .send({ nombre: "Redes" });

      expect(res.status).toBe(409);
      expect(p.materia.update).not.toHaveBeenCalled();
    });

    it("guardar una materia sin cambiarle el nombre no dispara la validacion", async () => {
      p.materia.findUnique.mockResolvedValue({ id: MATERIA_ID, nombre: "Redes", activa: true });
      p.materia.update.mockResolvedValue({
        id: MATERIA_ID,
        nombre: "REDES",
        descripcion: null,
        nivel_educativo: "Terciario",
        activa: true,
        _count: { inscripciones: 0, secciones: 0 },
      });

      const res = await request(server)
        .put(`/api/admin/materias/${MATERIA_ID}`)
        .set(token(ADMIN_ID, "ADMIN"))
        .send({ nombre: "REDES" });

      expect(res.status).toBe(200);
      expect(p.materia.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("CU-AD04 (E5): claves con vencimiento en el pasado", () => {
    it("el administrador no puede generar una clave ya vencida", async () => {
      p.materia.findUnique.mockResolvedValue({ id: MATERIA_ID, nombre: "Redes", activa: true });

      const res = await request(server)
        .post("/api/admin/enrollment-keys")
        .set(token(ADMIN_ID, "ADMIN"))
        .send({ materia_id: MATERIA_ID, vencimiento: pasado() });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("pasado");
      expect(p.claveMatriculacion.create).not.toHaveBeenCalled();
    });

    it("el docente tampoco", async () => {
      const res = await request(server)
        .post(`/api/materias/${MATERIA_ID}/claves`)
        .set(token(PROFESOR_ID, "PROFESOR"))
        .send({ vencimiento: pasado() });

      expect(res.status).toBe(400);
      expect(p.claveMatriculacion.create).not.toHaveBeenCalled();
    });

    it("una clave con vencimiento futuro se genera", async () => {
      p.materia.findUnique.mockResolvedValue({ id: MATERIA_ID, nombre: "Redes", activa: true });
      p.claveMatriculacion.create.mockResolvedValue({
        id: "c1",
        materia_id: MATERIA_ID,
        clave: "ABCD1234",
        activa: true,
        vencimiento: new Date(futuro()),
        max_usos: null,
        usos_actuales: 0,
        revocada_en: null,
        materia: { id: MATERIA_ID, nombre: "Redes" },
      });

      const res = await request(server)
        .post("/api/admin/enrollment-keys")
        .set(token(ADMIN_ID, "ADMIN"))
        .send({ materia_id: MATERIA_ID, vencimiento: futuro() });

      expect(res.status).toBe(201);
    });
  });

  describe("CU-P03 (E1): fecha limite en el pasado", () => {
    const crearActividad = (fecha_limite: string) =>
      request(server)
        .post(`/api/materias/${MATERIA_ID}/actividades`)
        .set(token(PROFESOR_ID, "PROFESOR"))
        .send({
          seccion_id: SECCION_ID,
          nombre: "TP1",
          consigna: "Resolver el TP",
          tipo: "DESARROLLO",
          fecha_limite,
        });

    beforeEach(() => {
      p.seccion.findUnique.mockResolvedValue({ id: SECCION_ID, materia_id: MATERIA_ID });
      p.actividad.create.mockResolvedValue({ id: ACTIVIDAD_ID });
    });

    it("no se publica una actividad vencida", async () => {
      const res = await crearActividad(pasado());

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("pasado");
      expect(p.actividad.create).not.toHaveBeenCalled();
    });

    it("una actividad con fecha futura se crea", async () => {
      expect((await crearActividad(futuro())).status).toBe(201);
    });
  });

  describe("CU-P05: correccion automatica de opcion multiple", () => {
    const opciones = [
      { texto: "Paris", correcta: true },
      { texto: "Roma", correcta: false },
    ];

    const entregar = (respuesta_texto: string, opcionesMc: unknown = opciones) => {
      p.seccion.findUnique.mockResolvedValue({ id: SECCION_ID, materia_id: MATERIA_ID });
      p.actividad.findUnique.mockResolvedValue({
        id: ACTIVIDAD_ID,
        seccion_id: SECCION_ID,
        nombre: "Quiz",
        consigna: "Capital de Francia",
        tipo: "MULTIPLE_CHOICE",
        opciones_mc: opcionesMc,
        activo: true,
        fecha_limite: new Date(Date.now() + 24 * HORA),
        rubrica_id: null,
      });
      p.inscripcion.findUnique.mockResolvedValue({ alumno_id: ALUMNO_ID });
      p.entrega.upsert.mockResolvedValue({ id: "e1", respuesta_texto, publicado: false, archivo_nombre: null });
      p.entrega.update.mockResolvedValue({});
      p.usuario.findUnique.mockResolvedValue({ nombre: "Ana" });
      p.materiaProfesor.findMany.mockResolvedValue([]);

      return request(server)
        .post(`/api/actividades/${ACTIVIDAD_ID}/entrega`)
        .set(token(ALUMNO_ID, "ALUMNO"))
        .send({ respuesta_texto });
    };

    it("deja un borrador con 10 si eligio la opcion correcta", async () => {
      const res = await entregar("Paris");
      await esperarSegundoPlano();

      expect(res.status).toBe(201);
      expect(p.entrega.update).toHaveBeenCalledWith({
        where: { id: "e1" },
        data: { calificacion_ia: 10, feedback_ia: "Respuesta correcta.", revision_tipo: "IA" },
      });
    });

    it("deja 0 e indica la opcion correcta si se equivoco", async () => {
      await entregar("Roma");
      await esperarSegundoPlano();

      const data = p.entrega.update.mock.calls[0][0].data;
      expect(data.calificacion_ia).toBe(0);
      expect(data.feedback_ia).toContain("Paris");
    });

    it("no califica si el docente no marco una opcion correcta", async () => {
      await entregar("Paris", [{ texto: "Paris" }, { texto: "Roma" }]);
      await esperarSegundoPlano();

      expect(p.entrega.update).not.toHaveBeenCalled();
    });

    it("no se publica sola: solo guarda el borrador", async () => {
      await entregar("Paris");
      await esperarSegundoPlano();

      expect(p.entrega.update.mock.calls[0][0].data).not.toHaveProperty("publicado");
    });
  });
});
