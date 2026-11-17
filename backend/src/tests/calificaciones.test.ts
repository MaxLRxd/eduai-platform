import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";
import { promedioPonderado, promedioPorCategoria } from "../modules/notas/notas.promedio";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const OTRA_MATERIA_ID = "11111111-1111-4111-8111-111111111112";
const PROFESOR_ID = "33333333-3333-4333-8333-333333333333";
const ALUMNO_ID = "22222222-2222-4222-8222-222222222222";
const CAT_TP = "44444444-4444-4444-8444-444444444441";
const CAT_PARCIAL = "44444444-4444-4444-8444-444444444442";
const CAT_AJENA = "44444444-4444-4444-8444-444444444449";
const ACTIVIDAD_ID = "55555555-5555-4555-8555-555555555555";

jest.mock("../config/prisma", () => ({
  prisma: {
    profesor: { findUnique: jest.fn() },
    materiaProfesor: { findUnique: jest.fn() },
    inscripcion: { findUnique: jest.fn(), findMany: jest.fn() },
    categoriaNota: { findMany: jest.fn(), findUnique: jest.fn(), deleteMany: jest.fn(), update: jest.fn(), create: jest.fn() },
    nota: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    actividad: { findUnique: jest.fn() },
    entrega: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const p = prisma as unknown as Record<string, Record<string, jest.Mock>>;
const dec = (n: number) => ({ toNumber: () => n });

describe("promedio ponderado (función pura)", () => {
  const cats = [
    { id: "tp", peso: 30 },
    { id: "parcial", peso: 40 },
    { id: "final", peso: 30 },
  ];

  it("sin categorías es el promedio simple de siempre", () => {
    const r = promedioPonderado([{ categoria_id: null, calificacion: 6 }, { categoria_id: null, calificacion: 8 }], []);
    expect(r).toEqual({ promedio: 7, sin_categoria: 0 });
  });

  it("sin notas no inventa un promedio", () => {
    expect(promedioPonderado([], cats).promedio).toBeNull();
    expect(promedioPonderado([], []).promedio).toBeNull();
  });

  it("pondera por el peso de cada categoría", () => {
    const r = promedioPonderado(
      [
        { categoria_id: "tp", calificacion: 10 },
        { categoria_id: "parcial", calificacion: 5 },
        { categoria_id: "final", calificacion: 7 },
      ],
      cats
    );
    // 10*0.3 + 5*0.4 + 7*0.3 = 7.1
    expect(r.promedio).toBe(7.1);
  });

  it("promedia varias notas de una misma categoría antes de ponderar", () => {
    const r = promedioPonderado(
      [
        { categoria_id: "tp", calificacion: 10 },
        { categoria_id: "tp", calificacion: 6 },
        { categoria_id: "parcial", calificacion: 5 },
        { categoria_id: "final", calificacion: 7 },
      ],
      cats
    );
    // tp = 8 -> 8*0.3 + 5*0.4 + 7*0.3 = 6.5
    expect(r.promedio).toBe(6.5);
  });

  it("una categoría sin notas no penaliza: los pesos se reparten entre las que sí tienen", () => {
    const r = promedioPonderado(
      [
        { categoria_id: "tp", calificacion: 10 },
        { categoria_id: "parcial", calificacion: 6 },
      ],
      cats
    );
    // (10*30 + 6*40) / 70 = 7.71
    expect(r.promedio).toBe(7.71);
  });

  it("las notas sin categoría no cuentan y se informan", () => {
    const r = promedioPonderado(
      [
        { categoria_id: "tp", calificacion: 8 },
        { categoria_id: null, calificacion: 2 },
        { categoria_id: "borrada", calificacion: 1 },
      ],
      cats
    );
    expect(r).toEqual({ promedio: 8, sin_categoria: 2 });
  });

  it("promedioPorCategoria devuelve null donde no hay notas", () => {
    const r = promedioPorCategoria([{ categoria_id: "tp", calificacion: 9 }], cats);
    expect(r).toEqual({ tp: 9, parcial: null, final: null });
  });
});

describe("categorías de calificación y notas ligadas a actividades", () => {
  let server: ReturnType<typeof createServer>;

  const docente = { Authorization: `Bearer ${signAccessToken({ sub: PROFESOR_ID, email: "d@edu.ai", rol: "PROFESOR" })}` };
  const alumno = { Authorization: `Bearer ${signAccessToken({ sub: ALUMNO_ID, email: "a@edu.ai", rol: "ALUMNO" })}` };

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    p.profesor.findUnique.mockResolvedValue({ id: PROFESOR_ID, usuario_id: PROFESOR_ID });
    p.materiaProfesor.findUnique.mockResolvedValue({ activo: true });
    p.inscripcion.findUnique.mockResolvedValue({ alumno_id: ALUMNO_ID });
    p.categoriaNota.findMany.mockResolvedValue([]);
    p.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(prisma));
  });

  afterEach(() => {
    server.close();
  });

  const guardarCategorias = (categorias: unknown, headers = docente) =>
    request(server).put(`/api/materias/${MATERIA_ID}/categorias-nota`).set(headers).send({ categorias });

  describe("PUT /categorias-nota", () => {
    it("rechaza pesos que no suman 100", async () => {
      const res = await guardarCategorias([
        { nombre: "TP", peso: 30 },
        { nombre: "Parcial", peso: 40 },
      ]);
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain("sumar 100");
      expect(p.$transaction).not.toHaveBeenCalled();
    });

    it("rechaza nombres repetidos y pesos en cero", async () => {
      const repetidos = await guardarCategorias([
        { nombre: "TP", peso: 50 },
        { nombre: "tp", peso: 50 },
      ]);
      expect(repetidos.status).toBe(400);

      const cero = await guardarCategorias([
        { nombre: "TP", peso: 0 },
        { nombre: "Final", peso: 100 },
      ]);
      expect(cero.status).toBe(400);
    });

    it("un alumno no puede definir categorías", async () => {
      const res = await guardarCategorias([{ nombre: "TP", peso: 100 }], alumno);
      expect(res.status).toBe(403);
    });

    it("un docente que no es de la materia recibe 403", async () => {
      p.materiaProfesor.findUnique.mockResolvedValue(null);
      const res = await guardarCategorias([{ nombre: "TP", peso: 100 }]);
      expect(res.status).toBe(403);
    });

    it("no deja usar el id de una categoría de otra materia", async () => {
      p.categoriaNota.findMany.mockResolvedValueOnce([{ id: CAT_TP, materia_id: MATERIA_ID }]);
      const res = await guardarCategorias([{ id: CAT_AJENA, nombre: "TP", peso: 100 }]);
      expect(res.status).toBe(400);
      expect(p.$transaction).not.toHaveBeenCalled();
    });

    it("guarda categorías nuevas y borra las que se quitan", async () => {
      p.categoriaNota.findMany
        .mockResolvedValueOnce([
          { id: CAT_TP, materia_id: MATERIA_ID },
          { id: CAT_PARCIAL, materia_id: MATERIA_ID },
        ])
        .mockResolvedValueOnce([{ id: CAT_TP, nombre: "TP", peso: dec(100), orden: 0 }]);

      const res = await guardarCategorias([{ id: CAT_TP, nombre: "TP", peso: 100 }]);

      expect(res.status).toBe(200);
      expect(p.categoriaNota.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [CAT_PARCIAL] } } });
      expect(p.categoriaNota.update).toHaveBeenCalledWith({
        where: { id: CAT_TP },
        data: { nombre: "TP", peso: 100, orden: 0 },
      });
      expect(res.body.categorias).toEqual([{ id: CAT_TP, nombre: "TP", peso: 100, orden: 0 }]);
    });

    it("una lista vacía vuelve al promedio simple", async () => {
      const res = await guardarCategorias([]);
      expect(res.status).toBe(200);
    });
  });

  describe("POST /notas con categoría", () => {
    const cargar = (body: Record<string, unknown>) =>
      request(server)
        .post(`/api/materias/${MATERIA_ID}/notas`)
        .set(docente)
        .send({ alumno_id: ALUMNO_ID, periodo: "2026-1", calificacion: 8, ...body });

    const notaDb = (extra: Record<string, unknown> = {}) => ({
      id: "n1",
      alumno_id: ALUMNO_ID,
      materia_id: MATERIA_ID,
      periodo: "2026-1",
      evaluacion: "",
      categoria_id: null,
      actividad_id: null,
      calificacion: dec(8),
      observaciones: null,
      registrado_en: new Date(),
      editado_en: null,
      ...extra,
    });

    it("no acepta una categoría de otra materia", async () => {
      p.categoriaNota.findUnique.mockResolvedValue({ id: CAT_AJENA, materia_id: OTRA_MATERIA_ID });
      const res = await cargar({ categoria_id: CAT_AJENA });
      expect(res.status).toBe(400);
      expect(p.nota.create).not.toHaveBeenCalled();
    });

    it("crea una nota con evaluación y categoría", async () => {
      p.categoriaNota.findUnique.mockResolvedValue({ id: CAT_PARCIAL, materia_id: MATERIA_ID });
      p.nota.findFirst.mockResolvedValue(null);
      p.nota.create.mockResolvedValue(notaDb({ evaluacion: "Parcial 1", categoria_id: CAT_PARCIAL }));

      const res = await cargar({ categoria_id: CAT_PARCIAL, evaluacion: "Parcial 1" });

      expect(res.status).toBe(201);
      expect(p.nota.create.mock.calls[0][0].data).toMatchObject({ evaluacion: "Parcial 1", categoria_id: CAT_PARCIAL });
      expect(res.body.nota).toMatchObject({ evaluacion: "Parcial 1", categoria_id: CAT_PARCIAL });
    });

    it("cargar de nuevo la misma evaluación del mismo período la actualiza, no la duplica", async () => {
      p.nota.findFirst.mockResolvedValue(notaDb({ evaluacion: "Parcial 1" }));
      p.nota.update.mockResolvedValue(notaDb({ evaluacion: "Parcial 1", calificacion: dec(9) }));

      const res = await cargar({ evaluacion: "Parcial 1", calificacion: 9 });

      expect(res.status).toBe(201);
      expect(p.nota.create).not.toHaveBeenCalled();
      expect(p.nota.update).toHaveBeenCalled();
    });

    it("dos evaluaciones distintas del mismo período son dos notas", async () => {
      p.nota.findFirst.mockResolvedValue(null);
      p.nota.create.mockResolvedValue(notaDb());
      await cargar({ evaluacion: "TP 1" });
      await cargar({ evaluacion: "TP 2" });
      expect(p.nota.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("POST /actividades/:id/notas/sincronizar", () => {
    const sincronizar = (body: Record<string, unknown> = { periodo: "2026-1", categoria_id: CAT_TP }, headers = docente) =>
      request(server).post(`/api/actividades/${ACTIVIDAD_ID}/notas/sincronizar`).set(headers).send(body);

    const entrega = (alumnoId: string, publicado: boolean, nota: number | null) => ({
      alumno_id: alumnoId,
      publicado,
      calificacion_final: nota == null ? null : dec(nota),
    });

    beforeEach(() => {
      p.actividad.findUnique.mockResolvedValue({ id: ACTIVIDAD_ID, nombre: "TP 1", seccion: { materia_id: MATERIA_ID } });
      p.categoriaNota.findUnique.mockResolvedValue({ id: CAT_TP, materia_id: MATERIA_ID });
    });

    it("importa solo las correcciones publicadas", async () => {
      p.entrega.findMany.mockResolvedValue([
        entrega("a1", true, 9),
        entrega("a2", false, 7), // borrador de la IA: no se importa
        entrega("a3", true, null),
      ]);
      p.nota.findUnique.mockResolvedValue(null);
      p.nota.create.mockResolvedValue({});

      const res = await sincronizar();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ creadas: 1, actualizadas: 0, sin_publicar: 2 });
      expect(p.nota.create).toHaveBeenCalledTimes(1);
      expect(p.nota.create.mock.calls[0][0].data).toMatchObject({
        alumno_id: "a1",
        materia_id: MATERIA_ID,
        actividad_id: ACTIVIDAD_ID,
        evaluacion: "TP 1",
        categoria_id: CAT_TP,
        periodo: "2026-1",
      });
    });

    it("repetirla actualiza las notas ya importadas en lugar de duplicarlas", async () => {
      const filas = [entrega("a1", true, 10)];
      p.entrega.findMany.mockResolvedValue(filas);
      p.nota.findUnique.mockResolvedValue({ id: "n1" });
      p.nota.update.mockResolvedValue({});

      const res = await sincronizar();

      expect(res.body).toEqual({ creadas: 0, actualizadas: 1, sin_publicar: 0 });
      expect(p.nota.create).not.toHaveBeenCalled();
      expect(p.nota.update.mock.calls[0][0].data).toMatchObject({ calificacion: filas[0].calificacion_final, periodo: "2026-1" });
    });

    it("un docente ajeno a la materia no puede importar", async () => {
      p.materiaProfesor.findUnique.mockResolvedValue(null);
      const res = await sincronizar();
      expect(res.status).toBe(403);
      expect(p.nota.create).not.toHaveBeenCalled();
    });

    it("un alumno no puede importar", async () => {
      const res = await sincronizar(undefined, alumno);
      expect(res.status).toBe(403);
    });

    it("la actividad inexistente da 404 y pide período", async () => {
      p.actividad.findUnique.mockResolvedValue(null);
      expect((await sincronizar()).status).toBe(404);
      expect((await sincronizar({})).status).toBe(400);
    });

    it("no acepta una categoría de otra materia", async () => {
      p.categoriaNota.findUnique.mockResolvedValue({ id: CAT_AJENA, materia_id: OTRA_MATERIA_ID });
      const res = await sincronizar({ periodo: "2026-1", categoria_id: CAT_AJENA });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /calificaciones (tabla del docente)", () => {
    it("devuelve el promedio ponderado por alumno y avisa las notas sin categoría", async () => {
      p.categoriaNota.findMany.mockResolvedValue([
        { id: CAT_TP, nombre: "TP", peso: dec(40), orden: 0 },
        { id: CAT_PARCIAL, nombre: "Parcial", peso: dec(60), orden: 1 },
      ]);
      p.inscripcion.findMany.mockResolvedValue([
        { alumno_id: ALUMNO_ID, alumno: { id: ALUMNO_ID, nombre: "Ana", email: "ana@edu.ai" } },
        { alumno_id: "otro", alumno: { id: "otro", nombre: "Beto", email: "beto@edu.ai" } },
      ]);
      const nota = (id: string, alumnoId: string, cat: string | null, valor: number, periodo = "2026-1") => ({
        id,
        alumno_id: alumnoId,
        materia_id: MATERIA_ID,
        periodo,
        evaluacion: "x",
        categoria_id: cat,
        actividad_id: null,
        calificacion: dec(valor),
        observaciones: null,
        registrado_en: new Date(),
        editado_en: null,
      });
      p.nota.findMany.mockResolvedValue([
        nota("1", ALUMNO_ID, CAT_TP, 10),
        nota("2", ALUMNO_ID, CAT_PARCIAL, 5),
        nota("3", ALUMNO_ID, null, 1, "2026-2"),
      ]);

      const res = await request(server).get(`/api/materias/${MATERIA_ID}/calificaciones`).set(docente);

      expect(res.status).toBe(200);
      expect(res.body.periodos).toEqual(["2026-1", "2026-2"]);
      const [ana, beto] = res.body.alumnos;
      expect(ana).toMatchObject({ nombre: "Ana", promedio: 7, sin_categoria: 1 }); // 10*.4 + 5*.6
      expect(ana.por_categoria).toEqual({ [CAT_TP]: 10, [CAT_PARCIAL]: 5 });
      expect(beto).toMatchObject({ nombre: "Beto", promedio: null }); // inscripto sin notas
    });

    it("un alumno no puede ver la tabla del docente", async () => {
      const res = await request(server).get(`/api/materias/${MATERIA_ID}/calificaciones`).set(alumno);
      expect(res.status).toBe(403);
    });
  });
});
