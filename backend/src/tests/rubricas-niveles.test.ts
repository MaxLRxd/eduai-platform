import request from "supertest";
import { createServer } from "http";
import { Prisma } from "@prisma/client";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";
import { rubricaParaIA, validarDescriptores } from "../modules/actividades/rubricas";

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
const p = prisma as unknown as Record<string, Record<string, jest.Mock>>;

const NIVELES = [
  { nombre: "Excelente", puntaje: 100 },
  { nombre: "Bueno", puntaje: 75 },
  { nombre: "Regular", puntaje: 50 },
  { nombre: "Insuficiente", puntaje: 25 },
];

const CRITERIOS = [
  { nombre: "Conceptos", peso: 60, esperado: "Define el modelo relacional." },
  { nombre: "Ejemplos", peso: 40, esperado: "Incluye un ejemplo propio." },
];

describe("niveles de desempeño de la rúbrica (CU-P04)", () => {
  let server: ReturnType<typeof createServer>;
  const profe = { Authorization: `Bearer ${signAccessToken({ sub: PROFESOR_ID, email: "p@edu.ai", rol: "PROFESOR" })}` };

  const rubricaDb = (extra: Record<string, unknown> = {}) => ({
    id: RUBRICA_ID,
    profesor_id: PROFESOR_ID,
    materia_id: MATERIA_ID,
    nombre: "Ensayo",
    descripcion: null,
    criterios: CRITERIOS,
    niveles: null,
    _count: { actividades: 0 },
    ...extra,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    p.profesor.findUnique.mockResolvedValue({ id: PROFESOR_ID, usuario_id: PROFESOR_ID });
    p.materiaProfesor.findUnique.mockResolvedValue({ materia_id: MATERIA_ID, profesor_id: PROFESOR_ID, activo: true });
    p.rubrica.findUnique.mockResolvedValue(rubricaDb());
    p.rubrica.create.mockImplementation(({ data }) => Promise.resolve({ ...rubricaDb(), ...data }));
    p.rubrica.update.mockImplementation(({ data }) => Promise.resolve({ ...rubricaDb(), ...data }));
  });

  afterEach(() => {
    server.close();
  });

  const crear = (body: Record<string, unknown>) =>
    request(server).post(`/api/materias/${MATERIA_ID}/rubricas`).set(profe).send({ nombre: "Ensayo", criterios: CRITERIOS, ...body });
  const editar = (body: Record<string, unknown>) => request(server).put(`/api/rubricas/${RUBRICA_ID}`).set(profe).send(body);

  describe("crear", () => {
    it("guarda los niveles y los devuelve", async () => {
      const res = await crear({ niveles: NIVELES });

      expect(res.status).toBe(201);
      expect(p.rubrica.create.mock.calls[0][0].data.niveles).toEqual(NIVELES);
      expect(res.body.rubrica.niveles).toEqual(NIVELES);
    });

    it("sin niveles la rúbrica funciona como siempre (niveles null)", async () => {
      const res = await crear({});

      expect(res.status).toBe(201);
      expect(p.rubrica.create.mock.calls[0][0].data).not.toHaveProperty("niveles");
      expect(res.body.rubrica.niveles).toBeNull();
    });

    it("acepta descriptores por nivel cuando el nivel existe", async () => {
      const criterios = [{ ...CRITERIOS[0], descriptores: { Excelente: "Define y relaciona claves.", Regular: "Solo nombra tablas." } }, CRITERIOS[1]];

      const res = await crear({ niveles: NIVELES, criterios });

      expect(res.status).toBe(201);
      expect(p.rubrica.create.mock.calls[0][0].data.criterios[0].descriptores.Excelente).toBe("Define y relaciona claves.");
    });

    describe.each([
      ["menos de 2 niveles", [{ nombre: "Único", puntaje: 100 }], "al menos 2"],
      ["más de 6 niveles", Array.from({ length: 7 }, (_, i) => ({ nombre: `N${i}`, puntaje: 100 - i * 10 })), "Maximo 6"],
      ["nombres repetidos (sin importar mayúsculas)", [{ nombre: "Bueno", puntaje: 100 }, { nombre: "bueno", puntaje: 50 }], "mismo nombre"],
      ["el mejor nivel no vale 100", [{ nombre: "A", puntaje: 90 }, { nombre: "B", puntaje: 50 }], "100%"],
      ["puntajes que no bajan", [{ nombre: "A", puntaje: 100 }, { nombre: "B", puntaje: 100 }], "mejor a peor"],
      ["puntajes desordenados", [{ nombre: "A", puntaje: 100 }, { nombre: "B", puntaje: 40 }, { nombre: "C", puntaje: 60 }], "mejor a peor"],
      ["un puntaje mayor a 100", [{ nombre: "A", puntaje: 120 }, { nombre: "B", puntaje: 50 }], "100"],
      ["un puntaje negativo", [{ nombre: "A", puntaje: 100 }, { nombre: "B", puntaje: -5 }], "negativo"],
      ["un nombre vacío", [{ nombre: "A", puntaje: 100 }, { nombre: "  ", puntaje: 50 }], "nombre"],
    ])("rechaza %s", (_caso, niveles, mensaje) => {
      it("400 y no guarda nada", async () => {
        const res = await crear({ niveles });

        expect(res.status).toBe(400);
        expect(JSON.stringify(res.body)).toContain(mensaje);
        expect(p.rubrica.create).not.toHaveBeenCalled();
      });
    });

    it("rechaza descriptores si la rúbrica no define niveles", async () => {
      const res = await crear({ criterios: [{ ...CRITERIOS[0], descriptores: { Excelente: "x" } }, CRITERIOS[1]] });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain("no define niveles");
    });

    it("rechaza un descriptor para un nivel que no existe", async () => {
      const res = await crear({ niveles: NIVELES, criterios: [{ ...CRITERIOS[0], descriptores: { Genial: "x" } }, CRITERIOS[1]] });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain("no existe");
    });

    it("rechaza un descriptor demasiado largo", async () => {
      const res = await crear({ niveles: NIVELES, criterios: [{ ...CRITERIOS[0], descriptores: { Excelente: "x".repeat(501) } }, CRITERIOS[1]] });

      expect(res.status).toBe(400);
    });
  });

  describe("editar", () => {
    it("agrega niveles a una rúbrica que no tenía", async () => {
      const res = await editar({ niveles: NIVELES });

      expect(res.status).toBe(200);
      expect(p.rubrica.update.mock.calls[0][0].data.niveles).toEqual(NIVELES);
    });

    it("quitar los niveles (null) vuelve a la rúbrica sin niveles", async () => {
      p.rubrica.findUnique.mockResolvedValue(rubricaDb({ niveles: NIVELES }));

      const res = await editar({ niveles: null });

      expect(res.status).toBe(200);
      expect(p.rubrica.update.mock.calls[0][0].data.niveles).toBe(Prisma.DbNull);
    });

    it("editar solo el nombre no toca los niveles", async () => {
      p.rubrica.findUnique.mockResolvedValue(rubricaDb({ niveles: NIVELES }));

      await editar({ nombre: "Otro nombre" });

      expect(p.rubrica.update.mock.calls[0][0].data.niveles).toBeUndefined();
    });

    it("no deja quitar los niveles si algún criterio guardado todavía tiene descriptores", async () => {
      p.rubrica.findUnique.mockResolvedValue(
        rubricaDb({ niveles: NIVELES, criterios: [{ ...CRITERIOS[0], descriptores: { Excelente: "x" } }, CRITERIOS[1]] })
      );

      const res = await editar({ niveles: null });

      expect(res.status).toBe(400);
      expect(p.rubrica.update).not.toHaveBeenCalled();
    });

    it("no deja renombrar un nivel dejando descriptores huérfanos", async () => {
      p.rubrica.findUnique.mockResolvedValue(
        rubricaDb({ niveles: NIVELES, criterios: [{ ...CRITERIOS[0], descriptores: { Excelente: "x" } }, CRITERIOS[1]] })
      );
      const renombrados = [{ nombre: "Sobresaliente", puntaje: 100 }, ...NIVELES.slice(1)];

      const res = await editar({ niveles: renombrados });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain("Excelente");
    });

    it("permite renombrar un nivel si se actualizan también los descriptores", async () => {
      p.rubrica.findUnique.mockResolvedValue(
        rubricaDb({ niveles: NIVELES, criterios: [{ ...CRITERIOS[0], descriptores: { Excelente: "x" } }, CRITERIOS[1]] })
      );
      const renombrados = [{ nombre: "Sobresaliente", puntaje: 100 }, ...NIVELES.slice(1)];

      const res = await editar({
        niveles: renombrados,
        criterios: [{ ...CRITERIOS[0], descriptores: { Sobresaliente: "x" } }, CRITERIOS[1]],
      });

      expect(res.status).toBe(200);
    });

    it("rechaza descriptores nuevos para un nivel que la rúbrica guardada no tiene", async () => {
      p.rubrica.findUnique.mockResolvedValue(rubricaDb({ niveles: NIVELES }));

      const res = await editar({ criterios: [{ ...CRITERIOS[0], descriptores: { Genial: "x" } }, CRITERIOS[1]] });

      expect(res.status).toBe(400);
      expect(p.rubrica.update).not.toHaveBeenCalled();
    });
  });

  describe("corrección con IA", () => {
    const entrega = () => ({
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
    });

    beforeEach(() => {
      p.seccion.findUnique.mockResolvedValue({ id: SECCION_ID, materia_id: MATERIA_ID });
      p.actividad.findUnique.mockResolvedValue({
        id: ACTIVIDAD_ID,
        seccion_id: SECCION_ID,
        nombre: "TP1",
        consigna: "Explique el modelo relacional.",
        rubrica_id: RUBRICA_ID,
      });
      p.entrega.findUnique.mockResolvedValue(entrega());
      p.entrega.update.mockResolvedValue({ ...entrega(), feedback_ia: "ok", calificacion_ia: { toNumber: () => 8 }, calificacion_final: null });
      aiMock.mockResolvedValue({ calificacion: 8, feedback: "ok" });
    });

    it("manda a la IA los niveles y los descriptores de cada criterio", async () => {
      p.rubrica.findUnique.mockResolvedValue(
        rubricaDb({ niveles: NIVELES, criterios: [{ ...CRITERIOS[0], descriptores: { Excelente: "Define y relaciona claves." } }, CRITERIOS[1]] })
      );

      const res = await request(server).post(`/api/entregas/${ENTREGA_ID}/corregir-ia`).set(profe);

      expect(res.status).toBe(200);
      const enviado = aiMock.mock.calls[0][0];
      expect(enviado.niveles).toEqual(NIVELES);
      expect(enviado.rubrica[0].descriptores).toEqual({ Excelente: "Define y relaciona claves." });
      expect(enviado.rubrica[1].descriptores).toEqual({});
    });

    it("una rúbrica sin niveles manda una lista vacía (la IA califica como siempre)", async () => {
      await request(server).post(`/api/entregas/${ENTREGA_ID}/corregir-ia`).set(profe);

      expect(aiMock.mock.calls[0][0].niveles).toEqual([]);
    });
  });
});

describe("helpers de rúbrica", () => {
  it("rubricaParaIA tolera una rúbrica vieja (sin niveles, sin esperado ni descriptores) y la ausencia de rúbrica", () => {
    expect(rubricaParaIA({ criterios: [{ nombre: "A", peso: 100 }] })).toEqual({
      rubrica: [{ nombre: "A", peso: 100, esperado: "", descriptores: {} }],
      niveles: [],
    });
    expect(rubricaParaIA(null)).toEqual({ rubrica: [], niveles: [] });
  });

  it("validarDescriptores ignora criterios sin descriptores aunque no haya niveles", () => {
    expect(() => validarDescriptores([{ nombre: "A", peso: 100 }], null)).not.toThrow();
  });

  it("validarDescriptores compara los niveles sin importar mayúsculas ni espacios", () => {
    expect(() =>
      validarDescriptores([{ nombre: "A", peso: 100, descriptores: { " excelente ": "x" } }], NIVELES)
    ).not.toThrow();
  });
});
