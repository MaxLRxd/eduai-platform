import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const SECCION_ID = "22222222-2222-4222-8222-222222222222";
const RUBRICA_ID = "33333333-3333-4333-8333-333333333333";
const ACTIVIDAD_ID = "44444444-4444-4444-8444-444444444444";
const ENTREGA_ID = "55555555-5555-4555-8555-555555555555";
const ALUMNO_ID = "66666666-6666-4666-8666-666666666666";
const PROFESOR_ID = "77777777-7777-4777-8777-777777777777";

jest.mock("../config/prisma", () => ({
  prisma: {
    rubrica: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    actividad: { findUnique: jest.fn(), count: jest.fn() },
    seccion: { findUnique: jest.fn() },
    entrega: { findUnique: jest.fn(), update: jest.fn() },
    profesor: { findUnique: jest.fn() },
    materiaProfesor: { findUnique: jest.fn() },
  },
}));

jest.mock("../config/aiClient", () => ({
  aiDisponible: jest.fn(() => true),
  corregirEntregaIA: jest.fn(),
}));

import { corregirEntregaIA } from "../config/aiClient";

const aiMock = corregirEntregaIA as jest.Mock;

const prismaMock = prisma as unknown as {
  rubrica: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
  actividad: { findUnique: jest.Mock; count: jest.Mock };
  seccion: { findUnique: jest.Mock };
  entrega: { findUnique: jest.Mock; update: jest.Mock };
  profesor: { findUnique: jest.Mock };
  materiaProfesor: { findUnique: jest.Mock };
};

const criteriosValidos = [
  { nombre: "Conceptos", peso: 60, esperado: "Define el modelo relacional." },
  { nombre: "Ejemplos", peso: 40, esperado: "Incluye al menos un ejemplo propio." },
];

describe("rúbricas (CU-P04)", () => {
  let server: ReturnType<typeof createServer>;

  const tokenProfe = (): string =>
    signAccessToken({ sub: PROFESOR_ID, email: "profe@edu.ai", rol: "PROFESOR" });
  const tokenAlumno = (): string =>
    signAccessToken({ sub: ALUMNO_ID, email: "alumno@edu.ai", rol: "ALUMNO" });

  const rubrica = () => ({
    id: RUBRICA_ID,
    profesor_id: PROFESOR_ID,
    materia_id: MATERIA_ID,
    nombre: "Ensayo",
    descripcion: null,
    criterios: criteriosValidos,
    _count: { actividades: 0 },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.profesor.findUnique.mockResolvedValue({ id: PROFESOR_ID, usuario_id: PROFESOR_ID });
    prismaMock.materiaProfesor.findUnique.mockResolvedValue({
      materia_id: MATERIA_ID,
      profesor_id: PROFESOR_ID,
      activo: true,
    });
    prismaMock.rubrica.findUnique.mockResolvedValue(rubrica());
    prismaMock.rubrica.create.mockImplementation(({ data }) =>
      Promise.resolve({ ...rubrica(), ...data })
    );
    prismaMock.rubrica.update.mockImplementation(({ data }) =>
      Promise.resolve({ ...rubrica(), ...data })
    );
    prismaMock.rubrica.delete.mockResolvedValue({});
    prismaMock.actividad.count.mockResolvedValue(0);
    aiMock.mockResolvedValue({ calificacion: 7.5, feedback: "Buen trabajo, falta profundidad." });
  });

  afterEach(() => {
    server.close();
  });

  describe("validación de criterios", () => {
    it("rechaza un criterio sin esperado", async () => {
      const res = await request(server)
        .post(`/api/materias/${MATERIA_ID}/rubricas`)
        .set("Authorization", `Bearer ${tokenProfe()}`)
        .send({
          nombre: "Ensayo",
          criterios: [{ nombre: "Conceptos", peso: 100, esperado: "   " }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("esperado");
      expect(prismaMock.rubrica.create).not.toHaveBeenCalled();
    });

    it("rechaza pesos que no suman 100", async () => {
      const res = await request(server)
        .post(`/api/materias/${MATERIA_ID}/rubricas`)
        .set("Authorization", `Bearer ${tokenProfe()}`)
        .send({
          nombre: "Ensayo",
          criterios: [{ nombre: "Conceptos", peso: 70, esperado: "Define el modelo." }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("sumar 100");
      expect(prismaMock.rubrica.create).not.toHaveBeenCalled();
    });

    it("acepta una rubrica válida y la persiste", async () => {
      const res = await request(server)
        .post(`/api/materias/${MATERIA_ID}/rubricas`)
        .set("Authorization", `Bearer ${tokenProfe()}`)
        .send({ nombre: "Ensayo", descripcion: "Para el parcial", criterios: criteriosValidos });

      expect(res.status).toBe(201);
      expect(res.body.rubrica.criterios).toHaveLength(2);
      expect(prismaMock.rubrica.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ criterios: criteriosValidos }) })
      );
    });

    it("no deja crear a un alumno", async () => {
      const res = await request(server)
        .post(`/api/materias/${MATERIA_ID}/rubricas`)
        .set("Authorization", `Bearer ${tokenAlumno()}`)
        .send({ nombre: "Ensayo", criterios: criteriosValidos });

      expect(res.status).toBe(403);
      expect(prismaMock.rubrica.create).not.toHaveBeenCalled();
    });
  });

  describe("editar y eliminar", () => {
    it("actualiza la rubrica", async () => {
      const res = await request(server)
        .put(`/api/rubricas/${RUBRICA_ID}`)
        .set("Authorization", `Bearer ${tokenProfe()}`)
        .send({ nombre: "Ensayo académico" });

      expect(res.status).toBe(200);
      expect(res.body.rubrica.nombre).toBe("Ensayo académico");
    });

    it("rechaza una actualizacion con pesos que no suman 100", async () => {
      const res = await request(server)
        .put(`/api/rubricas/${RUBRICA_ID}`)
        .set("Authorization", `Bearer ${tokenProfe()}`)
        .send({ criterios: [{ nombre: "Conceptos", peso: 30, esperado: "Algo" }] });

      expect(res.status).toBe(400);
      expect(prismaMock.rubrica.update).not.toHaveBeenCalled();
    });

    it("elimina una rubrica sin uso", async () => {
      const res = await request(server)
        .delete(`/api/rubricas/${RUBRICA_ID}`)
        .set("Authorization", `Bearer ${tokenProfe()}`);

      expect(res.status).toBe(200);
      expect(res.body.eliminada).toBe(true);
      expect(prismaMock.rubrica.delete).toHaveBeenCalledTimes(1);
    });

    it("no elimina una rubrica que usa una actividad", async () => {
      prismaMock.actividad.count.mockResolvedValue(2);

      const res = await request(server)
        .delete(`/api/rubricas/${RUBRICA_ID}`)
        .set("Authorization", `Bearer ${tokenProfe()}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("2 actividades");
      expect(prismaMock.rubrica.delete).not.toHaveBeenCalled();
    });

    it("no deja editar una rubrica de otra materia", async () => {
      prismaMock.profesor.findUnique.mockResolvedValue(null);

      const res = await request(server)
        .put(`/api/rubricas/${RUBRICA_ID}`)
        .set("Authorization", `Bearer ${tokenProfe()}`)
        .send({ nombre: "Secuestrada" });

      expect(res.status).toBe(403);
      expect(prismaMock.rubrica.update).not.toHaveBeenCalled();
    });

    it("devuelve 404 con un id invalido", async () => {
      const res = await request(server)
        .delete("/api/rubricas/no-es-uuid")
        .set("Authorization", `Bearer ${tokenProfe()}`);

      expect(res.status).toBe(404);
    });
  });

  describe("corrección con IA (CU-A07)", () => {
    // Prisma devuelve Decimal en las calificaciones y toEntregaDto las convierte con toNumber().
    const dec = (n: number) => ({ toNumber: () => n });
    const sinCalificacion = { toNumber: () => 0 };

    const entrega = (extra: Record<string, unknown> = {}) => ({
      id: ENTREGA_ID,
      actividad_id: ACTIVIDAD_ID,
      alumno_id: ALUMNO_ID,
      respuesta_texto: "El modelo relacional usa tablas.",
      respuesta_codigo: null,
      archivo_url: null,
      archivo_nombre: null,
      entregado_en: new Date(),
      feedback_ia: null,
      calificacion_ia: null,
      feedback_final: null,
      calificacion_final: null,
      publicado: false,
      revision_tipo: null,
      publicado_en: null,
      alumno: { id: ALUMNO_ID, nombre: "Alumno", email: "alumno@edu.ai" },
      ...extra,
    });

    beforeEach(() => {
      prismaMock.seccion.findUnique.mockResolvedValue({ id: SECCION_ID, materia_id: MATERIA_ID });
      prismaMock.actividad.findUnique.mockResolvedValue({
        id: ACTIVIDAD_ID,
        seccion_id: SECCION_ID,
        nombre: "TP1",
        consigna: "Explique el modelo relacional.",
        rubrica_id: RUBRICA_ID,
      });
      prismaMock.entrega.findUnique.mockResolvedValue(entrega());
      prismaMock.entrega.update.mockResolvedValue(
        entrega({
          calificacion_ia: dec(7.5),
          calificacion_final: sinCalificacion,
          feedback_ia: "Buen trabajo, falta profundidad.",
          revision_tipo: "IA",
        })
      );
    });

    it("corrige y guarda el borrador sin publicar", async () => {
      const res = await request(server)
        .post(`/api/entregas/${ENTREGA_ID}/corregir-ia`)
        .set("Authorization", `Bearer ${tokenProfe()}`);

      expect(res.status).toBe(200);
      expect(res.body.entrega.calificacion_ia).toBe(7.5);
      expect(res.body.entrega.feedback_ia).toContain("falta profundidad");
      expect(res.body.entrega.publicado).toBe(false);
      expect(prismaMock.entrega.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ calificacion_ia: 7.5, revision_tipo: "IA" }),
        })
      );
    });

    it("manda a la IA el esperado de cada criterio", async () => {
      await request(server)
        .post(`/api/entregas/${ENTREGA_ID}/corregir-ia`)
        .set("Authorization", `Bearer ${tokenProfe()}`);

      expect(aiMock).toHaveBeenCalledWith(
        expect.objectContaining({
          consigna: "Explique el modelo relacional.",
          rubrica: [
            { nombre: "Conceptos", peso: 60, esperado: "Define el modelo relacional." },
            { nombre: "Ejemplos", peso: 40, esperado: "Incluye al menos un ejemplo propio." },
          ],
        })
      );
    });

    it("tolera una rubrica vieja sin esperado", async () => {
      prismaMock.rubrica.findUnique.mockResolvedValue({
        ...rubrica(),
        criterios: [{ nombre: "Conceptos", peso: 100 }],
      });

      const res = await request(server)
        .post(`/api/entregas/${ENTREGA_ID}/corregir-ia`)
        .set("Authorization", `Bearer ${tokenProfe()}`);

      expect(res.status).toBe(200);
      expect(aiMock).toHaveBeenCalledWith(
        expect.objectContaining({ rubrica: [{ nombre: "Conceptos", peso: 100, esperado: "" }] })
      );
    });

    it("devuelve 502 si el ai-service no responde", async () => {
      aiMock.mockResolvedValue(null);

      const res = await request(server)
        .post(`/api/entregas/${ENTREGA_ID}/corregir-ia`)
        .set("Authorization", `Bearer ${tokenProfe()}`);

      expect(res.status).toBe(502);
      expect(prismaMock.entrega.update).not.toHaveBeenCalled();
    });

    it("no vuelve a corregir una entrega ya publicada", async () => {
      prismaMock.entrega.findUnique.mockResolvedValue(entrega({ publicado: true }));

      const res = await request(server)
        .post(`/api/entregas/${ENTREGA_ID}/corregir-ia`)
        .set("Authorization", `Bearer ${tokenProfe()}`);

      expect(res.status).toBe(409);
      expect(aiMock).not.toHaveBeenCalled();
    });

    it("no deja corregir a un alumno", async () => {
      const res = await request(server)
        .post(`/api/entregas/${ENTREGA_ID}/corregir-ia`)
        .set("Authorization", `Bearer ${tokenAlumno()}`);

      expect(res.status).toBe(403);
      expect(aiMock).not.toHaveBeenCalled();
    });

    it("no deja corregir sin acceso a la materia", async () => {
      prismaMock.profesor.findUnique.mockResolvedValue(null);

      const res = await request(server)
        .post(`/api/entregas/${ENTREGA_ID}/corregir-ia`)
        .set("Authorization", `Bearer ${tokenProfe()}`);

      expect(res.status).toBe(403);
      expect(aiMock).not.toHaveBeenCalled();
    });

    it("rechaza una entrega sin contenido", async () => {
      prismaMock.entrega.findUnique.mockResolvedValue(
        entrega({ respuesta_texto: null, respuesta_codigo: null, archivo_nombre: null })
      );

      const res = await request(server)
        .post(`/api/entregas/${ENTREGA_ID}/corregir-ia`)
        .set("Authorization", `Bearer ${tokenProfe()}`);

      expect(res.status).toBe(422);
      expect(aiMock).not.toHaveBeenCalled();
    });
  });
});

