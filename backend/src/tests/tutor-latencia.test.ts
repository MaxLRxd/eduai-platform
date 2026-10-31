import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";
import { calcularLatencia } from "../modules/tutor/tutor.service";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const PROFESOR_ID = "22222222-2222-4222-8222-222222222222";
const ADMIN_ID = "33333333-3333-4333-8333-333333333333";
const ALUMNO_ID = "44444444-4444-4444-8444-444444444444";

jest.mock("../config/prisma", () => ({
  prisma: {
    mensajeIA: { findMany: jest.fn() },
    profesor: { findUnique: jest.fn() },
    materiaProfesor: { findUnique: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  mensajeIA: { findMany: jest.Mock };
  profesor: { findUnique: jest.Mock };
  materiaProfesor: { findUnique: jest.Mock };
};

const fila = (primer: number | null, total: number | null = primer, modo: string | null = "NORMAL") => ({
  primer_token_ms: primer,
  tiempo_respuesta_ms: total,
  modo,
});

describe("calcularLatencia", () => {
  it("informa percentiles y el porcentaje de respuestas que llegan en menos de 3 s", () => {
    // 10 muestras: 9 rapidas (500..2500 ms) y 1 lenta
    const filas = [500, 800, 1000, 1200, 1500, 1800, 2000, 2200, 2500, 6000].map((ms) => fila(ms, ms + 4000));

    const r = calcularLatencia(filas);

    expect(r.muestras).toBe(10);
    expect(r.umbral_ms).toBe(3000);
    expect(r.porcentaje_bajo_umbral).toBe(90);
    expect(r.cumple).toBe(true);
    expect(r.primera_respuesta).toMatchObject({ p50_ms: 1500, p90_ms: 2500, p95_ms: 6000, max_ms: 6000 });
    expect(r.respuesta_completa.max_ms).toBe(10000);
  });

  it("no cumple si menos del 90% llega antes de 3 s", () => {
    const r = calcularLatencia([fila(1000), fila(2000), fila(4000), fila(5000)]);

    expect(r.porcentaje_bajo_umbral).toBe(50);
    expect(r.cumple).toBe(false);
  });

  it("sin muestras no afirma nada (cumple = null)", () => {
    const r = calcularLatencia([]);

    expect(r.muestras).toBe(0);
    expect(r.cumple).toBeNull();
    expect(r.primera_respuesta.promedio_ms).toBe(0);
  });

  it("ignora filas sin tiempos y separa las estadisticas por modo", () => {
    const r = calcularLatencia([fila(1000, 3000, "NORMAL"), fila(2000, 4000, "SOCRATIC"), fila(null, null, "HINTS")]);

    expect(r.muestras).toBe(2);
    expect(r.por_modo.NORMAL).toMatchObject({ muestras: 1, p50_ms: 1000 });
    expect(r.por_modo.SOCRATIC).toMatchObject({ muestras: 1, p50_ms: 2000 });
    expect(r.por_modo.HINTS.muestras).toBe(0);
  });
});

describe("endpoints de latencia del tutor", () => {
  let server: ReturnType<typeof createServer>;

  const token = (sub: string, rol: "ALUMNO" | "PROFESOR" | "ADMIN") => ({
    Authorization: `Bearer ${signAccessToken({ sub, email: "x@edu.ai", rol })}`,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.mensajeIA.findMany.mockResolvedValue([fila(900), fila(1100)]);
    prismaMock.profesor.findUnique.mockResolvedValue({ id: PROFESOR_ID, usuario_id: PROFESOR_ID });
    prismaMock.materiaProfesor.findUnique.mockResolvedValue({ activo: true });
  });

  afterEach(() => {
    server.close();
  });

  it("el docente ve la latencia de su materia y la consulta se acota a esa materia", async () => {
    const res = await request(server)
      .get(`/api/materias/${MATERIA_ID}/tutor/latencia`)
      .set(token(PROFESOR_ID, "PROFESOR"));

    expect(res.status).toBe(200);
    expect(res.body.muestras).toBe(2);
    expect(res.body.dias).toBe(30);
    expect(prismaMock.mensajeIA.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ sesion: { materia_id: MATERIA_ID } }) })
    );
  });

  it("un docente ajeno a la materia no puede verla", async () => {
    prismaMock.materiaProfesor.findUnique.mockResolvedValue(null);

    const res = await request(server)
      .get(`/api/materias/${MATERIA_ID}/tutor/latencia`)
      .set(token(PROFESOR_ID, "PROFESOR"));

    expect(res.status).toBe(403);
  });

  it("el administrador ve la latencia global, sin filtrar por materia", async () => {
    const res = await request(server).get("/api/admin/tutor/latencia").set(token(ADMIN_ID, "ADMIN"));

    expect(res.status).toBe(200);
    const donde = prismaMock.mensajeIA.findMany.mock.calls[0][0].where;
    expect(donde).not.toHaveProperty("sesion");
  });

  it("un alumno no accede a ninguna de las dos", async () => {
    const a = await request(server).get("/api/admin/tutor/latencia").set(token(ALUMNO_ID, "ALUMNO"));
    const b = await request(server)
      .get(`/api/materias/${MATERIA_ID}/tutor/latencia`)
      .set(token(ALUMNO_ID, "ALUMNO"));

    expect([a.status, b.status]).toEqual([403, 403]);
  });
});
