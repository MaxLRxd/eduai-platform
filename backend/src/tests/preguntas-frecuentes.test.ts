import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";
import { normalizarTexto, similitudDePreguntas } from "../modules/tutor/tutor.service";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const SESION_ID = "22222222-2222-4222-8222-222222222222";
const ALUMNO_ID = "33333333-3333-4333-8333-333333333333";

jest.mock("../config/prisma", () => ({
  prisma: {
    sesionIA: { findUnique: jest.fn(), update: jest.fn() },
    mensajeIA: { findMany: jest.fn(), create: jest.fn() },
    preguntaFrecuente: { findMany: jest.fn() },
    analyticsComprensionTema: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    errorDudaFrecuente: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  },
}));

jest.mock("../config/aiClient", () => ({
  aiDisponible: jest.fn(() => true),
  chatTutor: jest.fn(),
}));

import { chatTutor } from "../config/aiClient";

const chatMock = chatTutor as jest.Mock;
const p = prisma as unknown as Record<string, Record<string, jest.Mock>>;

describe("coincidencia de preguntas", () => {
  it("normaliza tildes, mayusculas y signos", () => {
    expect(normalizarTexto("¿Cuál ES la Diferencia, entre LAN y WAN?")).toBe("cual es la diferencia entre lan y wan");
  });

  it("detecta la misma pregunta escrita distinto", () => {
    expect(similitudDePreguntas("¿Qué es una dirección IP?", "que es la direccion ip")).toBeGreaterThanOrEqual(0.75);
    expect(similitudDePreguntas("Diferencia entre LAN y WAN", "¿Cuál es la diferencia entre una LAN y una WAN?")).toBeGreaterThanOrEqual(0.75);
  });

  it("no confunde temas distintos", () => {
    expect(similitudDePreguntas("¿Qué es una dirección IP?", "¿Qué es un router?")).toBeLessThan(0.75);
    expect(similitudDePreguntas("hola", "¿Qué es una dirección IP?")).toBe(0);
  });
});

describe("preguntas frecuentes en el tutor (CU-A04 A5.1)", () => {
  let server: ReturnType<typeof createServer>;

  const headers = {
    Authorization: `Bearer ${signAccessToken({ sub: ALUMNO_ID, email: "a@edu.ai", rol: "ALUMNO" })}`,
  };

  const preguntar = (contenido: string, modo?: string) =>
    request(server)
      .post(`/api/tutor/sesiones/${SESION_ID}/mensajes`)
      .set(headers)
      .send({ contenido, ...(modo ? { modo } : {}) });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    p.sesionIA.findUnique.mockResolvedValue({
      id: SESION_ID,
      alumno_id: ALUMNO_ID,
      materia_id: MATERIA_ID,
      modo: "NORMAL",
      cerrada_en: null,
    });
    p.sesionIA.update.mockResolvedValue({});
    p.mensajeIA.findMany.mockResolvedValue([]);
    p.mensajeIA.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: `m-${data.rol}`,
      creado_en: new Date(),
      tokens_respuesta: data.tokens_respuesta ?? null,
      prompt_depurado: null,
      tiempo_respuesta_ms: data.tiempo_respuesta_ms ?? null,
      ...data,
    }));
    p.analyticsComprensionTema.findFirst.mockResolvedValue(null);
    p.analyticsComprensionTema.create.mockResolvedValue({});
    p.errorDudaFrecuente.findFirst.mockResolvedValue(null);
    p.preguntaFrecuente.findMany.mockResolvedValue([
      { pregunta: "¿Qué es una dirección IP?", respuesta: "Una IP identifica a un dispositivo en la red." },
    ]);
    chatMock.mockResolvedValue({
      answer: "Respuesta de la IA",
      mode: "normal",
      sources: [],
      prompt_depurado: null,
      tokens_ahorrados: 0,
      cached: false,
    });
  });

  afterEach(() => {
    server.close();
  });

  it("responde con la respuesta preparada por el docente, sin llamar a la IA", async () => {
    const res = await preguntar("que es la direccion IP");

    expect(res.status).toBe(200);
    expect(res.body.respuesta.contenido).toBe("Una IP identifica a un dispositivo en la red.");
    expect(res.body.respuesta.pregunta_frecuente).toBe(true);
    expect(chatMock).not.toHaveBeenCalled();
  });

  it("la respuesta instantanea no entra en la metrica de latencia del tutor", async () => {
    await preguntar("que es la direccion IP");

    const guardada = p.mensajeIA.create.mock.calls.map((c) => c[0].data).find((d) => d.rol === "ASSISTANT");
    expect(guardada).not.toHaveProperty("primer_token_ms");
  });

  it("una pregunta distinta va a la IA", async () => {
    const res = await preguntar("¿Qué es un router y para qué sirve?");

    expect(res.body.respuesta.contenido).toBe("Respuesta de la IA");
    expect(chatMock).toHaveBeenCalledTimes(1);
  });

  it("en modo socratico o pistas no se usa la respuesta preparada", async () => {
    const res = await preguntar("que es la direccion IP", "SOCRATIC");

    expect(res.body.respuesta.contenido).toBe("Respuesta de la IA");
    expect(p.preguntaFrecuente.findMany).not.toHaveBeenCalled();
  });

  it("si falla la consulta de preguntas frecuentes sigue funcionando con la IA", async () => {
    p.preguntaFrecuente.findMany.mockRejectedValue(new Error("db caida"));

    const res = await preguntar("que es la direccion IP");

    expect(res.status).toBe(200);
    expect(chatMock).toHaveBeenCalledTimes(1);
  });
});
