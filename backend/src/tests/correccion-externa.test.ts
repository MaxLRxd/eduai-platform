import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const OTRA_MATERIA_ID = "11111111-1111-4111-8111-111111111112";
const ALUMNO_ID = "44444444-4444-4444-8444-444444444444";
const CONTENIDO_ID = "55555555-5555-4555-8555-555555555555";

jest.mock("../config/prisma", () => ({
  prisma: {
    inscripcion: { findUnique: jest.fn() },
    intentoSimulacro: { create: jest.fn() },
    contenido: { findUnique: jest.fn() },
  },
}));

const corregirExamenIAMock = jest.fn();
const contarFragmentosIAMock = jest.fn();

jest.mock("../config/aiClient", () => ({
  corregirExamenIA: (...args: unknown[]) => corregirExamenIAMock(...args),
  contarFragmentosIA: (...args: unknown[]) => contarFragmentosIAMock(...args),
  indexArchivo: jest.fn(),
  indexMaterial: jest.fn(),
}));

const p = prisma as unknown as {
  inscripcion: { findUnique: jest.Mock };
  intentoSimulacro: { create: jest.Mock };
  contenido: { findUnique: jest.Mock };
};

describe("CU-A11: respuestas propias y material insuficiente", () => {
  let server: ReturnType<typeof createServer>;
  const alumno = { Authorization: `Bearer ${signAccessToken({ sub: ALUMNO_ID, email: "a@edu.ai", rol: "ALUMNO" })}` };
  const docente = { Authorization: `Bearer ${signAccessToken({ sub: ALUMNO_ID, email: "d@edu.ai", rol: "PROFESOR" })}` };

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    p.inscripcion.findUnique.mockResolvedValue({ alumno_id: ALUMNO_ID });
    p.intentoSimulacro.create.mockResolvedValue({ id: "intento-1" });
    corregirExamenIAMock.mockResolvedValue({
      resultados: [{ indice: 0, veredicto: "parcial", puntaje: 0.5, feedback: "Le falta el ejemplo." }],
      material_limitado: false,
    });
  });

  afterEach(() => {
    server.close();
  });

  describe("GET /tutor/material-disponible (A4)", () => {
    const consultar = (headers: Record<string, string> = alumno) =>
      request(server).get(`/api/materias/${MATERIA_ID}/tutor/material-disponible`).set(headers);

    it("con material suficiente dice que alcanza", async () => {
      contarFragmentosIAMock.mockResolvedValue(12);

      const res = await consultar();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ fragmentos: 12, minimo: 3, suficiente: true });
      expect(contarFragmentosIAMock).toHaveBeenCalledWith(MATERIA_ID);
    });

    it("el mínimo exacto alcanza; uno menos no", async () => {
      contarFragmentosIAMock.mockResolvedValue(3);
      expect((await consultar()).body.suficiente).toBe(true);

      contarFragmentosIAMock.mockResolvedValue(2);
      expect((await consultar()).body.suficiente).toBe(false);
    });

    it("sin nada indexado no alcanza", async () => {
      contarFragmentosIAMock.mockResolvedValue(0);

      expect((await consultar()).body).toEqual({ fragmentos: 0, minimo: 3, suficiente: false });
    });

    it("si el servicio de IA no responde no se sabe (null) y no se bloquea al alumno", async () => {
      contarFragmentosIAMock.mockResolvedValue(null);

      const res = await consultar();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ fragmentos: null, minimo: 3, suficiente: null });
    });

    it("solo alumnos inscriptos en la materia", async () => {
      expect((await consultar(docente)).status).toBe(403);

      p.inscripcion.findUnique.mockResolvedValue(null);
      expect((await consultar()).status).toBe(403);
      expect(contarFragmentosIAMock).not.toHaveBeenCalled();
    });
  });

  describe("POST /tutor/examen/corregir con respuestas propias (A2)", () => {
    const propia = { tipo: "desarrollo", enunciado: "¿Para qué sirve el DNS?", respuesta_alumno: "Traduce nombres." };
    const corregir = (cuerpo: Record<string, unknown> = {}) =>
      request(server)
        .post(`/api/materias/${MATERIA_ID}/tutor/examen/corregir`)
        .set(alumno)
        .send({ titulo: "Mis respuestas", preguntas: [propia], ...cuerpo });

    it("acepta una pregunta de desarrollo sin respuesta modelo y la manda a corregir con el material", async () => {
      const res = await corregir();

      expect(res.status).toBe(200);
      expect(corregirExamenIAMock).toHaveBeenCalledWith(
        MATERIA_ID,
        "Mis respuestas",
        [expect.objectContaining({ enunciado: "¿Para qué sirve el DNS?", respuesta_modelo: "" })],
        ""
      );
    });

    it("pasa al alumno el aviso de corrección limitada, sin guardarlo en el historial", async () => {
      corregirExamenIAMock.mockResolvedValue({
        resultados: [{ indice: 0, veredicto: "parcial", puntaje: 0.5, feedback: "limitada" }],
        material_limitado: true,
      });

      const res = await corregir();

      expect(res.body.material_limitado).toBe(true);
      expect(p.intentoSimulacro.create.mock.calls[0][0].data).not.toHaveProperty("material_limitado");
    });

    it("una opción múltiple sin la opción correcta se rechaza (no se podría corregir)", async () => {
      const res = await corregir({
        preguntas: [{ tipo: "multiple_choice", enunciado: "¿Cuál?", opciones: ["a", "b"], respuesta_alumno: "a" }],
      });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain("necesita la opcion correcta");
      expect(corregirExamenIAMock).not.toHaveBeenCalled();
    });

    describe("material de referencia (contenido_id)", () => {
      const material = (extra: Record<string, unknown> = {}) => ({
        id: CONTENIDO_ID,
        texto_contenido: "El DNS traduce nombres de dominio en direcciones IP.",
        rag_indexado: true,
        seccion: { materia_id: MATERIA_ID },
        ...extra,
      });

      it("un material de texto de la materia se manda como referencia", async () => {
        p.contenido.findUnique.mockResolvedValue(material());

        const res = await corregir({ contenido_id: CONTENIDO_ID });

        expect(res.status).toBe(200);
        expect(corregirExamenIAMock.mock.calls[0][3]).toBe("El DNS traduce nombres de dominio en direcciones IP.");
      });

      it("un material que es un archivo (sin texto) se acepta si está indexado, y se corrige con el material indexado", async () => {
        p.contenido.findUnique.mockResolvedValue(material({ texto_contenido: null }));

        const res = await corregir({ contenido_id: CONTENIDO_ID });

        expect(res.status).toBe(200);
        expect(corregirExamenIAMock.mock.calls[0][3]).toBe("");
      });

      it("recorta la referencia a 8000 caracteres", async () => {
        p.contenido.findUnique.mockResolvedValue(material({ texto_contenido: "x".repeat(20000) }));

        await corregir({ contenido_id: CONTENIDO_ID });

        expect(corregirExamenIAMock.mock.calls[0][3]).toHaveLength(8000);
      });

      it("un material de otra materia da 404 y no gasta IA", async () => {
        p.contenido.findUnique.mockResolvedValue(material({ seccion: { materia_id: OTRA_MATERIA_ID } }));

        const res = await corregir({ contenido_id: CONTENIDO_ID });

        expect(res.status).toBe(404);
        expect(corregirExamenIAMock).not.toHaveBeenCalled();
      });

      it("un material inexistente da 404", async () => {
        p.contenido.findUnique.mockResolvedValue(null);

        expect((await corregir({ contenido_id: CONTENIDO_ID })).status).toBe(404);
      });

      it("un material que todavía no está disponible (ni indexado ni con texto) da 409", async () => {
        p.contenido.findUnique.mockResolvedValue(material({ texto_contenido: null, rag_indexado: false }));

        const res = await corregir({ contenido_id: CONTENIDO_ID });

        expect(res.status).toBe(409);
        expect(corregirExamenIAMock).not.toHaveBeenCalled();
      });

      it("un id que no es uuid da 400", async () => {
        expect((await corregir({ contenido_id: "no-es-uuid" })).status).toBe(400);
      });
    });

    it("un alumno no inscripto no puede corregir en esa materia", async () => {
      p.inscripcion.findUnique.mockResolvedValue(null);

      expect((await corregir()).status).toBe(403);
      expect(corregirExamenIAMock).not.toHaveBeenCalled();
    });

    it("si la IA falla se conservan las respuestas (502 con mensaje para reintentar)", async () => {
      corregirExamenIAMock.mockResolvedValue(null);

      const res = await corregir();

      expect(res.status).toBe(502);
      expect(res.body.error).toContain("conservan");
    });
  });
});
