import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const SECCION_ID = "22222222-2222-4222-8222-222222222222";
const ACTIVIDAD_ID = "33333333-3333-4333-8333-333333333333";
const ALUMNO_ID = "44444444-4444-4444-8444-444444444444";
const RUBRICA_ID = "55555555-5555-4555-8555-555555555555";

jest.mock("../config/prisma", () => ({
  prisma: {
    actividad: { findUnique: jest.fn() },
    seccion: { findUnique: jest.fn() },
    inscripcion: { findUnique: jest.fn() },
    entrega: { upsert: jest.fn() },
    usuario: { findUnique: jest.fn() },
    materiaProfesor: { findMany: jest.fn() },
    rubrica: { findUnique: jest.fn() },
  },
}));

jest.mock("../config/aiClient", () => ({
  aiDisponible: jest.fn(() => true),
  corregirEntregaIA: jest.fn(),
}));

jest.mock("../config/storage", () => ({
  UPLOADS_DIR: "uploads-test",
  asegurarDirectorioUploads: jest.fn(),
  guardarArchivo: jest.fn(),
  eliminarArchivo: jest.fn(),
}));

import { corregirEntregaIA } from "../config/aiClient";

const aiMock = corregirEntregaIA as jest.Mock;

const prismaMock = prisma as unknown as {
  actividad: { findUnique: jest.Mock };
  seccion: { findUnique: jest.Mock };
  inscripcion: { findUnique: jest.Mock };
  entrega: { upsert: jest.Mock };
  usuario: { findUnique: jest.Mock };
  materiaProfesor: { findMany: jest.Mock };
  rubrica: { findUnique: jest.Mock };
};

const HORA = 60 * 60 * 1000;

const actividad = (
  fecha_limite: Date,
  rubrica_id: string | null = null
): Record<string, unknown> => ({
  id: ACTIVIDAD_ID,
  seccion_id: SECCION_ID,
  nombre: "TP1",
  consigna: "Explique el modelo relacional.",
  tipo: "DESARROLLO",
  formatos_permitidos: null,
  activo: true,
  fecha_limite,
  rubrica_id,
});

const entregaGuardada = {
  id: "66666666-6666-4666-8666-666666666666",
  actividad_id: ACTIVIDAD_ID,
  alumno_id: ALUMNO_ID,
  respuesta_texto: "El modelo relacional organiza datos en tablas.",
  respuesta_codigo: null,
  archivo_url: null,
  archivo_nombre: null,
  publicado: false,
};

describe("entregas: plazo y correccion automatica (CU-A03)", () => {
  let server: ReturnType<typeof createServer>;

  const tokenAlumno = (): string =>
    signAccessToken({ sub: ALUMNO_ID, email: "alumno@edu.ai", rol: "ALUMNO" });

  const entregar = () =>
    request(server)
      .post(`/api/actividades/${ACTIVIDAD_ID}/entrega`)
      .set("Authorization", `Bearer ${tokenAlumno()}`)
      .send({ respuesta_texto: "El modelo relacional organiza datos en tablas." });

  const esperarSegundoPlano = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.seccion.findUnique.mockResolvedValue({ id: SECCION_ID, materia_id: MATERIA_ID });
    prismaMock.inscripcion.findUnique.mockResolvedValue({ alumno_id: ALUMNO_ID });
    prismaMock.entrega.upsert.mockResolvedValue(entregaGuardada);
    prismaMock.usuario.findUnique.mockResolvedValue({ nombre: "Alumno" });
    prismaMock.materiaProfesor.findMany.mockResolvedValue([]);
    prismaMock.rubrica.findUnique.mockResolvedValue({
      id: RUBRICA_ID,
      criterios: [{ nombre: "Conceptos", peso: 100, esperado: "Define el modelo." }],
    });
    aiMock.mockResolvedValue(null);
  });

  afterEach(() => {
    server.close();
  });

  it("rechaza una entrega pasada la fecha limite", async () => {
    prismaMock.actividad.findUnique.mockResolvedValue(actividad(new Date(Date.now() - HORA)));

    const res = await entregar();

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("plazo");
    expect(prismaMock.entrega.upsert).not.toHaveBeenCalled();
  });

  it("rechaza la subida de un archivo pasada la fecha limite", async () => {
    prismaMock.actividad.findUnique.mockResolvedValue(actividad(new Date(Date.now() - HORA)));

    const res = await request(server)
      .post(`/api/actividades/${ACTIVIDAD_ID}/entrega/archivo`)
      .set("Authorization", `Bearer ${tokenAlumno()}`)
      .attach("archivo", Buffer.from("x"), "tp1.txt");

    expect(res.status).toBe(409);
  });

  it("acepta la entrega dentro del plazo", async () => {
    prismaMock.actividad.findUnique.mockResolvedValue(actividad(new Date(Date.now() + HORA)));

    const res = await entregar();

    expect(res.status).toBe(201);
    expect(prismaMock.entrega.upsert).toHaveBeenCalledTimes(1);
  });

  it("no corrige automaticamente una actividad sin rubrica", async () => {
    prismaMock.actividad.findUnique.mockResolvedValue(actividad(new Date(Date.now() + HORA), null));

    const res = await entregar();
    await esperarSegundoPlano();

    expect(res.status).toBe(201);
    expect(aiMock).not.toHaveBeenCalled();
  });

  it("corrige automaticamente cuando la actividad tiene rubrica", async () => {
    prismaMock.actividad.findUnique.mockResolvedValue(
      actividad(new Date(Date.now() + HORA), RUBRICA_ID)
    );

    const res = await entregar();
    await esperarSegundoPlano();

    expect(res.status).toBe(201);
    expect(aiMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject_id: MATERIA_ID,
        rubrica: [{ nombre: "Conceptos", peso: 100, esperado: "Define el modelo." }],
      })
    );
  });
});
