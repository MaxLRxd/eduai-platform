import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const ALUMNO_ID = "22222222-2222-4222-8222-222222222222";

jest.mock("../config/prisma", () => ({
  prisma: {
    inscripcion: { findUnique: jest.fn() },
    intentoSimulacro: { create: jest.fn(), findMany: jest.fn() },
  },
}));

jest.mock("../config/aiClient", () => ({
  aiDisponible: jest.fn(() => true),
  corregirExamenIA: jest.fn(),
}));

import { corregirExamenIA } from "../config/aiClient";

const aiMock = corregirExamenIA as jest.Mock;

const prismaMock = prisma as unknown as {
  inscripcion: { findUnique: jest.Mock };
  intentoSimulacro: { create: jest.Mock; findMany: jest.Mock };
};

const preguntas = [
  {
    tipo: "multiple_choice",
    enunciado: "Capital de Francia",
    opciones: ["Madrid", "Paris", "Roma", "Lima"],
    respuesta_modelo: "Paris",
    respuesta_alumno: "Paris",
  },
  {
    tipo: "desarrollo",
    enunciado: "Explique la fotosintesis",
    respuesta_modelo: "Las plantas producen glucosa con luz.",
    respuesta_alumno: "Usan luz.",
  },
  { tipo: "desarrollo", enunciado: "Defina ecosistema", respuesta_modelo: "x", respuesta_alumno: "" },
  { tipo: "multiple_choice", enunciado: "2+2", opciones: ["3", "4"], respuesta_modelo: "4", respuesta_alumno: "3" },
];

const resultadosIA = [
  { indice: 0, veredicto: "correcta", puntaje: 1, feedback: "Correcta." },
  { indice: 1, veredicto: "parcial", puntaje: 0.5, feedback: "Falta el rol de la clorofila." },
  { indice: 2, veredicto: "sin_responder", puntaje: 0, feedback: "No respondiste." },
  { indice: 3, veredicto: "incorrecta", puntaje: 0, feedback: "Era 4." },
];

describe("simulacro: correccion y historial (CU-A11)", () => {
  let server: ReturnType<typeof createServer>;

  const headers = {
    Authorization: `Bearer ${signAccessToken({ sub: ALUMNO_ID, email: "a@edu.ai", rol: "ALUMNO" })}`,
  };

  const corregir = (cuerpo: Record<string, unknown> = {}) =>
    request(server)
      .post(`/api/materias/${MATERIA_ID}/tutor/examen/corregir`)
      .set(headers)
      .send({ titulo: "Simulacro de Biologia", dificultad: "media", preguntas, ...cuerpo });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.inscripcion.findUnique.mockResolvedValue({ alumno_id: ALUMNO_ID });
    prismaMock.intentoSimulacro.create.mockResolvedValue({ id: "intento-1" });
    aiMock.mockResolvedValue(resultadosIA);
  });

  afterEach(() => {
    server.close();
  });

  it("corrige, calcula el puntaje sobre 10 y guarda el intento en el historial", async () => {
    const res = await corregir();

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: "intento-1",
      titulo: "Simulacro de Biologia",
      puntaje: 3.75, // (1 + 0.5 + 0 + 0) / 4 * 10
      correctas: 1,
      parciales: 1,
      incorrectas: 1,
      sin_responder: 1,
    });
    expect(res.body.resultados).toHaveLength(4);
    expect(res.body.resultados[1]).toMatchObject({
      veredicto: "parcial",
      respuesta_alumno: "Usan luz.",
      respuesta_correcta: "Las plantas producen glucosa con luz.",
    });
    expect(prismaMock.intentoSimulacro.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ alumno_id: ALUMNO_ID, materia_id: MATERIA_ID, puntaje: 3.75 }),
    });
  });

  it("le manda a la IA las respuestas del alumno junto con la respuesta modelo", async () => {
    await corregir();

    expect(aiMock).toHaveBeenCalledWith(
      MATERIA_ID,
      "Simulacro de Biologia",
      expect.arrayContaining([
        expect.objectContaining({ enunciado: "Explique la fotosintesis", respuesta_alumno: "Usan luz." }),
      ])
    );
  });

  it("con registrar=false corrige pero no guarda el intento", async () => {
    const res = await corregir({ registrar: false });

    expect(res.status).toBe(200);
    expect(res.body.id).toBeNull();
    expect(prismaMock.intentoSimulacro.create).not.toHaveBeenCalled();
  });

  it("A5: si la IA falla responde 502 con un mensaje para reintentar y no guarda nada", async () => {
    aiMock.mockResolvedValue(null);

    const res = await corregir();

    expect(res.status).toBe(502);
    expect(res.body.error).toContain("reintentar");
    expect(prismaMock.intentoSimulacro.create).not.toHaveBeenCalled();
  });

  it("502 tambien si la IA devuelve menos resultados que preguntas", async () => {
    aiMock.mockResolvedValue(resultadosIA.slice(0, 2));

    expect((await corregir()).status).toBe(502);
  });

  it("rechaza a quien no esta inscripto en la materia", async () => {
    prismaMock.inscripcion.findUnique.mockResolvedValue(null);

    expect((await corregir()).status).toBe(403);
    expect(aiMock).not.toHaveBeenCalled();
  });

  it("valida el cuerpo: sin preguntas no se corrige", async () => {
    expect((await corregir({ preguntas: [] })).status).toBe(400);
  });

  it("lista el historial del alumno, mas reciente primero", async () => {
    prismaMock.intentoSimulacro.findMany.mockResolvedValue([
      {
        id: "i2",
        titulo: "Simulacro 2",
        dificultad: "dificil",
        puntaje: { toNumber: () => 8.5 },
        correctas: 4,
        parciales: 1,
        incorrectas: 0,
        sin_responder: 0,
        creado_en: new Date("2026-10-30T10:00:00Z"),
      },
    ]);

    const res = await request(server).get(`/api/materias/${MATERIA_ID}/tutor/simulacros`).set(headers);

    expect(res.status).toBe(200);
    expect(res.body.simulacros[0]).toMatchObject({ id: "i2", puntaje: 8.5, dificultad: "dificil" });
    expect(prismaMock.intentoSimulacro.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { materia_id: MATERIA_ID, alumno_id: ALUMNO_ID },
        orderBy: { creado_en: "desc" },
      })
    );
  });
});
