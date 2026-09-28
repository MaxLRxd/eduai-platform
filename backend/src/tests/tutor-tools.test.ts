import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const CONTENIDO_ID = "22222222-2222-4222-8222-222222222222";
const CONTENIDO_AJENO_ID = "33333333-3333-4333-8333-333333333333";
const ALUMNO_ID = "44444444-4444-4444-8444-444444444444";

jest.mock("../config/prisma", () => ({
  prisma: {
    contenido: { findUnique: jest.fn() },
    inscripcion: { findUnique: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  contenido: { findUnique: jest.Mock };
  inscripcion: { findUnique: jest.Mock };
};

const resumirDocumentoMock = jest.fn();
const generarExamenMock = jest.fn();

jest.mock("../config/aiClient", () => ({
  resumirDocumento: (...args: unknown[]) => resumirDocumentoMock(...args),
  generarExamen: (...args: unknown[]) => generarExamenMock(...args),
  chatTutor: jest.fn(),
  streamTutor: jest.fn(),
  indexArchivo: jest.fn(),
  indexMaterial: jest.fn(),
  generarMaterialDocente: jest.fn(),
  corregirEntregaIA: jest.fn(),
}));

jest.mock("../modules/analytics/analytics.service", () => ({
  registrarConsultaTutor: jest.fn().mockResolvedValue(undefined),
}));

const TEXTO_LARGO = "a".repeat(300);

describe("tutor: resumen y examen", () => {
  let server: ReturnType<typeof createServer>;

  const tokenAlumno = (): string =>
    signAccessToken({ sub: ALUMNO_ID, email: "alumno@edu.ai", rol: "ALUMNO" });

  const tokenDocente = (): string =>
    signAccessToken({ sub: ALUMNO_ID, email: "doc@edu.ai", rol: "DOCENTE" });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.inscripcion.findUnique.mockResolvedValue({ alumno_id: ALUMNO_ID });
    resumirDocumentoMock.mockResolvedValue({ summary: "Resumen generado por la IA." });
    generarExamenMock.mockResolvedValue({
      titulo: "Simulacro de Matemática",
      dificultad: "media",
      preguntas: [
        {
          tipo: "multiple_choice",
          enunciado: "¿Cuánto es 2 + 2?",
          opciones: ["3", "4", "5"],
          respuesta: "4",
        },
      ],
    });
  });

  afterEach(() => {
    server.close();
  });

  describe("POST /api/materias/:materiaId/tutor/resumen", () => {
    it("resumir un material de la materia", async () => {
      prismaMock.contenido.findUnique.mockResolvedValue({
        id: CONTENIDO_ID,
        titulo: "Unidad 1: Funciones",
        texto_contenido: TEXTO_LARGO,
        seccion: { materia_id: MATERIA_ID },
      });

      const res = await request(server)
        .post(`/api/materias/${MATERIA_ID}/tutor/resumen`)
        .set("Authorization", `Bearer ${tokenAlumno()}`)
        .send({ contenido_id: CONTENIDO_ID });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        resumen: "Resumen generado por la IA.",
        origen: "Unidad 1: Funciones",
        max_palabras: 150,
      });
      expect(resumirDocumentoMock).toHaveBeenCalledWith(TEXTO_LARGO, "es", 150);
    });

    it("resumir texto libre enviado por el alumno", async () => {
      const res = await request(server)
        .post(`/api/materias/${MATERIA_ID}/tutor/resumen`)
        .set("Authorization", `Bearer ${tokenAlumno()}`)
        .send({ texto: TEXTO_LARGO, max_palabras: 80 });

      expect(res.status).toBe(200);
      expect(res.body.origen).toBeNull();
      expect(resumirDocumentoMock).toHaveBeenCalledWith(TEXTO_LARGO, "es", 80);
      expect(prismaMock.contenido.findUnique).not.toHaveBeenCalled();
    });

    it("rechaza un material que pertenece a otra materia", async () => {
      prismaMock.contenido.findUnique.mockResolvedValue({
        id: CONTENIDO_AJENO_ID,
        titulo: "Material ajeno",
        texto_contenido: TEXTO_LARGO,
        seccion: { materia_id: "99999999-9999-4999-8999-999999999999" },
      });

      const res = await request(server)
        .post(`/api/materias/${MATERIA_ID}/tutor/resumen`)
        .set("Authorization", `Bearer ${tokenAlumno()}`)
        .send({ contenido_id: CONTENIDO_AJENO_ID });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Material no encontrado en esta materia");
      expect(resumirDocumentoMock).not.toHaveBeenCalled();
    });

    it("rechaza archivos binarios sin texto extraible", async () => {
      prismaMock.contenido.findUnique.mockResolvedValue({
        id: CONTENIDO_ID,
        titulo: "Foto del pizarrón",
        texto_contenido: null,
        seccion: { materia_id: MATERIA_ID },
      });

      const res = await request(server)
        .post(`/api/materias/${MATERIA_ID}/tutor/resumen`)
        .set("Authorization", `Bearer ${tokenAlumno()}`)
        .send({ contenido_id: CONTENIDO_ID });

      expect(res.status).toBe(400);
      expect(resumirDocumentoMock).not.toHaveBeenCalled();
    });

    it("rechaza al alumno que no esta inscripto", async () => {
      prismaMock.inscripcion.findUnique.mockResolvedValue(null);

      const res = await request(server)
        .post(`/api/materias/${MATERIA_ID}/tutor/resumen`)
        .set("Authorization", `Bearer ${tokenAlumno()}`)
        .send({ texto: TEXTO_LARGO });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("No estas inscripto a esta materia");
      expect(resumirDocumentoMock).not.toHaveBeenCalled();
    });

    it("exige contenido_id o texto, pero no ambos", async () => {
      const sinNada = await request(server)
        .post(`/api/materias/${MATERIA_ID}/tutor/resumen`)
        .set("Authorization", `Bearer ${tokenAlumno()}`)
        .send({});

      const conAmbos = await request(server)
        .post(`/api/materias/${MATERIA_ID}/tutor/resumen`)
        .set("Authorization", `Bearer ${tokenAlumno()}`)
        .send({ contenido_id: CONTENIDO_ID, texto: TEXTO_LARGO });

      expect(sinNada.status).toBe(400);
      expect(conAmbos.status).toBe(400);
    });

    it("no deja usar la herramienta a un docente", async () => {
      const res = await request(server)
        .post(`/api/materias/${MATERIA_ID}/tutor/resumen`)
        .set("Authorization", `Bearer ${tokenDocente()}`)
        .send({ texto: TEXTO_LARGO });

      expect(res.status).toBe(403);
    });

    it("devuelve 502 si la IA no responde", async () => {
      resumirDocumentoMock.mockResolvedValue(null);

      const res = await request(server)
        .post(`/api/materias/${MATERIA_ID}/tutor/resumen`)
        .set("Authorization", `Bearer ${tokenAlumno()}`)
        .send({ texto: TEXTO_LARGO });

      expect(res.status).toBe(502);
    });
  });

  describe("POST /api/materias/:materiaId/tutor/examen", () => {
    it("genera un simulacro con los parametros por defecto", async () => {
      const res = await request(server)
        .post(`/api/materias/${MATERIA_ID}/tutor/examen`)
        .set("Authorization", `Bearer ${tokenAlumno()}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.titulo).toBe("Simulacro de Matemática");
      expect(res.body.preguntas).toHaveLength(1);
      expect(res.body.preguntas[0].opciones).toEqual(["3", "4", "5"]);
      expect(generarExamenMock).toHaveBeenCalledWith(MATERIA_ID, 5, "media");
    });

    it("rechaza una dificultad invalida", async () => {
      const res = await request(server)
        .post(`/api/materias/${MATERIA_ID}/tutor/examen`)
        .set("Authorization", `Bearer ${tokenAlumno()}`)
        .send({ dificultad: "imposible" });

      expect(res.status).toBe(400);
      expect(generarExamenMock).not.toHaveBeenCalled();
    });

    it("rechaza al alumno que no esta inscripto", async () => {
      prismaMock.inscripcion.findUnique.mockResolvedValue(null);

      const res = await request(server)
        .post(`/api/materias/${MATERIA_ID}/tutor/examen`)
        .set("Authorization", `Bearer ${tokenAlumno()}`)
        .send({});

      expect(res.status).toBe(403);
      expect(generarExamenMock).not.toHaveBeenCalled();
    });
  });
});
