import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";
import { registrarConsultaTutor, seccionDeFuentes } from "../modules/analytics/analytics.service";
import { contarConsulta } from "../modules/tutor/tutor.service";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const OTRA_MATERIA_ID = "11111111-1111-4111-8111-111111111112";
const PROFESOR_ID = "33333333-3333-4333-8333-333333333333";
const ALUMNO_ID = "22222222-2222-4222-8222-222222222222";
const U1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const U2 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";

jest.mock("../config/prisma", () => ({
  prisma: {
    profesor: { findUnique: jest.fn() },
    materiaProfesor: { findUnique: jest.fn() },
    inscripcion: { findUnique: jest.fn() },
    analyticsComprensionTema: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    errorDudaFrecuente: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    contenido: { findMany: jest.fn() },
  },
}));

const p = prisma as unknown as Record<string, Record<string, jest.Mock>>;
const dec = (n: number) => ({ toNumber: () => n });

describe("dashboard del docente: filtros por período y unidad", () => {
  let server: ReturnType<typeof createServer>;
  const docente = { Authorization: `Bearer ${signAccessToken({ sub: PROFESOR_ID, email: "d@edu.ai", rol: "PROFESOR" })}` };
  const alumno = { Authorization: `Bearer ${signAccessToken({ sub: ALUMNO_ID, email: "a@edu.ai", rol: "ALUMNO" })}` };

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    p.profesor.findUnique.mockResolvedValue({ id: PROFESOR_ID, usuario_id: PROFESOR_ID });
    p.materiaProfesor.findUnique.mockResolvedValue({ activo: true });
    p.analyticsComprensionTema.findMany.mockResolvedValue([]);
    p.errorDudaFrecuente.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    server.close();
  });

  const comprension = (query = "", headers = docente) =>
    request(server).get(`/api/materias/${MATERIA_ID}/analytics/comprension${query}`).set(headers);
  const dudas = (query = "") => request(server).get(`/api/materias/${MATERIA_ID}/analytics/dudas${query}`).set(docente);

  it("sin filtros trae todo y devuelve los períodos disponibles para el selector", async () => {
    p.analyticsComprensionTema.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ periodo: "2026-1" }, { periodo: "2026-2" }]);

    const res = await comprension();

    expect(res.status).toBe(200);
    expect(res.body.periodos).toEqual(["2026-1", "2026-2"]);
    expect(p.analyticsComprensionTema.findMany.mock.calls[0][0].where).toEqual({ materia_id: MATERIA_ID });
  });

  it("filtra por período y por unidad", async () => {
    await comprension(`?periodo=2026-2&seccion_id=${U1}`);

    expect(p.analyticsComprensionTema.findMany.mock.calls[0][0].where).toEqual({
      materia_id: MATERIA_ID,
      periodo: "2026-2",
      seccion_id: U1,
    });
  });

  it("el selector de períodos no se achica al filtrar", async () => {
    await comprension("?periodo=2026-2");

    expect(p.analyticsComprensionTema.findMany.mock.calls[1][0].where).toEqual({ materia_id: MATERIA_ID });
  });

  it('"general" son las consultas que no se pudieron ligar a una unidad', async () => {
    await dudas("?seccion_id=general");

    expect(p.errorDudaFrecuente.findMany.mock.calls[0][0].where).toEqual({ materia_id: MATERIA_ID, seccion_id: null });
  });

  it("las dudas también se filtran por período y unidad (detalle de un tema)", async () => {
    await dudas(`?periodo=2026-1&seccion_id=${U2}`);

    expect(p.errorDudaFrecuente.findMany.mock.calls[0][0].where).toEqual({
      materia_id: MATERIA_ID,
      periodo: "2026-1",
      seccion_id: U2,
    });
  });

  it("un filtro inválido da 400 en lugar de ignorarse en silencio", async () => {
    expect((await comprension("?seccion_id=no-es-uuid")).status).toBe(400);
    expect((await dudas(`?periodo=${"x".repeat(60)}`)).status).toBe(400);
    expect(p.analyticsComprensionTema.findMany).not.toHaveBeenCalled();
  });

  it("un tema sin evaluar llega como null, no como 0 (no figura como crítico)", async () => {
    p.analyticsComprensionTema.findMany.mockResolvedValueOnce([
      {
        id: "c1",
        materia_id: MATERIA_ID,
        seccion_id: U1,
        total_consultas: 4,
        total_errores: 0,
        nivel_comprension: null,
        periodo: "2026-2",
        actualizado_en: new Date(),
      },
      {
        id: "c2",
        materia_id: MATERIA_ID,
        seccion_id: U2,
        total_consultas: 2,
        total_errores: 1,
        nivel_comprension: dec(72),
        periodo: "2026-2",
        actualizado_en: new Date(),
      },
    ]);

    const res = await comprension();

    expect(res.body.comprension.map((c: { nivel_comprension: number | null }) => c.nivel_comprension)).toEqual([null, 72]);
  });

  it("un alumno no puede ver el dashboard del docente", async () => {
    expect((await comprension("", alumno)).status).toBe(403);
  });

  it("un docente ajeno a la materia recibe 403", async () => {
    p.materiaProfesor.findUnique.mockResolvedValue(null);
    expect((await dudas()).status).toBe(403);
  });
});

describe("seccionDeFuentes: a qué unidad pertenece una consulta del tutor", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sin fuentes no hay unidad y ni siquiera consulta la base", async () => {
    expect(await seccionDeFuentes(MATERIA_ID, [])).toBeNull();
    expect(p.contenido.findMany).not.toHaveBeenCalled();
  });

  it("gana la unidad más citada", async () => {
    p.contenido.findMany.mockResolvedValue([
      { id: "m1", seccion_id: U1 },
      { id: "m2", seccion_id: U2 },
      { id: "m3", seccion_id: U2 },
    ]);

    const seccion = await seccionDeFuentes(MATERIA_ID, [
      { material_id: "m1" },
      { material_id: "m2" },
      { material_id: "m3" },
      { material_id: "m3" },
    ]);

    expect(seccion).toBe(U2);
  });

  it("solo mira materiales de la misma materia", async () => {
    p.contenido.findMany.mockResolvedValue([]);

    expect(await seccionDeFuentes(OTRA_MATERIA_ID, [{ material_id: "m1" }])).toBeNull();
    expect(p.contenido.findMany.mock.calls[0][0].where.seccion).toEqual({ materia_id: OTRA_MATERIA_ID });
  });
});

describe("registrarConsultaTutor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2026-11-18T12:00:00Z"));
    p.analyticsComprensionTema.findFirst.mockResolvedValue(null);
    p.errorDudaFrecuente.findFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("crea el tema en la unidad y el período reales, sin inventar un nivel de comprensión", async () => {
    await registrarConsultaTutor(MATERIA_ID, "¿Qué es una clave foránea?", false, U1);

    expect(p.analyticsComprensionTema.create.mock.calls[0][0].data).toMatchObject({
      materia_id: MATERIA_ID,
      seccion_id: U1,
      periodo: "2026-2", // noviembre es el segundo semestre
      nivel_comprension: null,
      total_consultas: 1,
    });
    expect(p.errorDudaFrecuente.create.mock.calls[0][0].data).toMatchObject({
      seccion_id: U1,
      periodo: "2026-2",
      descripcion: "¿Qué es una clave foránea?",
      tipo: "DUDA",
      frecuencia: 1,
    });
  });

  it("busca y suma dentro de la misma unidad y período, sin tocar el nivel", async () => {
    p.analyticsComprensionTema.findFirst.mockResolvedValue({ id: "t1" });
    p.errorDudaFrecuente.findFirst.mockResolvedValue({ id: "d1" });

    await registrarConsultaTutor(MATERIA_ID, "duda", false, U2);

    expect(p.analyticsComprensionTema.findFirst.mock.calls[0][0].where).toEqual({
      materia_id: MATERIA_ID,
      seccion_id: U2,
      periodo: "2026-2",
    });
    expect(p.analyticsComprensionTema.update.mock.calls[0][0].data).not.toHaveProperty("nivel_comprension");
    expect(p.errorDudaFrecuente.update.mock.calls[0][0].data.frecuencia).toEqual({ increment: 1 });
  });

  it("una consulta sin unidad se cuenta como general (seccion_id null)", async () => {
    await registrarConsultaTutor(MATERIA_ID, "duda", false);

    expect(p.analyticsComprensionTema.create.mock.calls[0][0].data.seccion_id).toBeNull();
  });
});

describe("contarConsulta (lo que usa el chat del tutor)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    p.analyticsComprensionTema.findFirst.mockResolvedValue(null);
    p.errorDudaFrecuente.findFirst.mockResolvedValue(null);
  });

  it("liga la consulta a la unidad de las fuentes citadas", async () => {
    p.contenido.findMany.mockResolvedValue([{ id: "m1", seccion_id: U1 }]);

    await contarConsulta(MATERIA_ID, "pregunta", [{ material_id: "m1" }]);

    expect(p.analyticsComprensionTema.create.mock.calls[0][0].data.seccion_id).toBe(U1);
  });

  it("nunca interrumpe el chat: si los analytics fallan, no lanza", async () => {
    p.contenido.findMany.mockRejectedValue(new Error("db caida"));

    await expect(contarConsulta(MATERIA_ID, "pregunta", [{ material_id: "m1" }])).resolves.toBeUndefined();
  });
});
