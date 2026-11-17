import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";
import { progresoAlumno } from "../modules/analytics/analytics.service";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const ALUMNO_ID = "22222222-2222-4222-8222-222222222222";
const CAT_TP = "44444444-4444-4444-8444-444444444441";
const CAT_PARCIAL = "44444444-4444-4444-8444-444444444442";

jest.mock("../config/prisma", () => ({
  prisma: {
    inscripcion: { findUnique: jest.fn(), findMany: jest.fn() },
    nota: { findMany: jest.fn() },
    categoriaNota: { findMany: jest.fn() },
    asistencia: { findMany: jest.fn() },
    entrega: { findMany: jest.fn() },
    actividad: { findMany: jest.fn(), count: jest.fn() },
  },
}));

const p = prisma as unknown as Record<string, Record<string, jest.Mock>>;
const dec = (n: number) => ({ toNumber: () => n });

const nota = (id: string, cat: string | null, valor: number, evaluacion: string, periodo = "2026-1") => ({
  id,
  materia_id: MATERIA_ID,
  materia: { id: MATERIA_ID, nombre: "Redes" },
  periodo,
  evaluacion,
  categoria_id: cat,
  calificacion: dec(valor),
  observaciones: null,
  registrado_en: new Date("2026-05-01T10:00:00Z"),
});

describe("Mis estadísticas del alumno: cómo se arma la nota", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    p.inscripcion.findMany.mockResolvedValue([{ materia_id: MATERIA_ID, materia: { id: MATERIA_ID, nombre: "Redes" } }]);
    p.asistencia.findMany.mockResolvedValue([]);
    p.entrega.findMany.mockResolvedValue([]);
    p.actividad.count.mockResolvedValue(0);
    p.categoriaNota.findMany.mockResolvedValue([
      { id: CAT_TP, materia_id: MATERIA_ID, nombre: "TP", peso: dec(40), orden: 0 },
      { id: CAT_PARCIAL, materia_id: MATERIA_ID, nombre: "Parcial", peso: dec(60), orden: 1 },
    ]);
  });

  it("devuelve las categorías con su peso y el promedio del alumno en cada una", async () => {
    p.nota.findMany.mockResolvedValue([
      nota("1", CAT_TP, 10, "TP 1"),
      nota("2", CAT_TP, 6, "TP 2"),
      nota("3", CAT_PARCIAL, 5, "Parcial 1"),
    ]);

    const r = await progresoAlumno(ALUMNO_ID);

    const redes = r.resumen[0];
    expect(redes.categorias).toEqual([
      { id: CAT_TP, nombre: "TP", peso: 40, promedio: 8 },
      { id: CAT_PARCIAL, nombre: "Parcial", peso: 60, promedio: 5 },
    ]);
    expect(redes.promedio).toBe(6.2); // 8*0.4 + 5*0.6
    expect(redes.sin_categoria).toBe(0);
  });

  it("una categoría sin notas queda en null y no baja el promedio", async () => {
    p.nota.findMany.mockResolvedValue([nota("1", CAT_TP, 9, "TP 1")]);

    const redes = (await progresoAlumno(ALUMNO_ID)).resumen[0];

    expect(redes.categorias[1]).toMatchObject({ nombre: "Parcial", promedio: null });
    expect(redes.promedio).toBe(9);
  });

  it("cada nota del detalle trae el nombre de su categoría", async () => {
    p.nota.findMany.mockResolvedValue([nota("1", CAT_PARCIAL, 7, "Parcial 1"), nota("2", null, 3, "Extra")]);

    const { detalle, resumen } = await progresoAlumno(ALUMNO_ID);

    expect(detalle.map((d) => [d.evaluacion, d.categoria])).toEqual([
      ["Parcial 1", "Parcial"],
      ["Extra", null],
    ]);
    expect(resumen[0].sin_categoria).toBe(1);
  });

  it("sin categorías definidas, el desglose queda vacío y el promedio es simple", async () => {
    p.categoriaNota.findMany.mockResolvedValue([]);
    p.nota.findMany.mockResolvedValue([nota("1", null, 6, "A"), nota("2", null, 8, "B")]);

    const redes = (await progresoAlumno(ALUMNO_ID)).resumen[0];

    expect(redes.categorias).toEqual([]);
    expect(redes.promedio).toBe(7);
  });
});

describe("Entregas del alumno: la nota solo se ve si el docente la publicó", () => {
  let server: ReturnType<typeof createServer>;
  const alumno = { Authorization: `Bearer ${signAccessToken({ sub: ALUMNO_ID, email: "a@edu.ai", rol: "ALUMNO" })}` };

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    p.inscripcion.findUnique.mockResolvedValue({ alumno_id: ALUMNO_ID });
  });

  afterEach(() => {
    server.close();
  });

  const entrega = (publicado: boolean) => ({
    id: "e1",
    respuesta_texto: "mi respuesta",
    respuesta_codigo: null,
    archivo_url: null,
    archivo_nombre: null,
    entregado_en: new Date(),
    publicado,
    calificacion_final: dec(9),
    feedback_final: "Muy bien",
  });

  const pedir = async (publicado: boolean) => {
    p.actividad.findMany.mockResolvedValue([{ id: "act1", nombre: "TP 1", entregas: [entrega(publicado)] }]);
    const res = await request(server).get(`/api/materias/${MATERIA_ID}/actividades`).set(alumno);
    return res.body.actividades[0];
  };

  it("sin publicar no manda ni la nota ni el feedback", async () => {
    const a = await pedir(false);
    expect(a.estado_entrega).toBe("ENVIADA");
    expect(a.mi_entrega.calificacion_final).toBeNull();
    expect(a.mi_entrega.feedback_final).toBeNull();
  });

  it("publicada manda la nota y el feedback", async () => {
    const a = await pedir(true);
    expect(a.estado_entrega).toBe("PUBLICADA");
    expect(a.mi_entrega.calificacion_final).toBe(9);
    expect(a.mi_entrega.feedback_final).toBe("Muy bien");
  });
});
