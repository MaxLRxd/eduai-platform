import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";
import { porcentaje } from "../modules/admin/admin.service";

const ENTREGA_ID = "11111111-1111-4111-8111-111111111111";
const ALUMNO_ID = "22222222-2222-4222-8222-222222222222";
const OTRO_ALUMNO_ID = "22222222-2222-4222-8222-222222222223";
const ADMIN_ID = "33333333-3333-4333-8333-333333333333";

jest.mock("../config/prisma", () => ({
  prisma: {
    entrega: { findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
    sesion: { findMany: jest.fn() },
    sesionIA: { findMany: jest.fn() },
  },
}));

const p = prisma as unknown as Record<string, Record<string, jest.Mock>>;

const token = (sub: string, rol: "ALUMNO" | "ADMIN") => ({
  Authorization: `Bearer ${signAccessToken({ sub, email: "x@edu.ai", rol })}`,
});

describe("porcentaje", () => {
  it("redondea a un decimal y no inventa un valor sin base", () => {
    expect(porcentaje(1, 3)).toBe(33.3);
    expect(porcentaje(2, 3)).toBe(66.7);
    expect(porcentaje(5, 5)).toBe(100);
    expect(porcentaje(0, 0)).toBeNull();
  });
});

describe("feedback revisado por el alumno (CU-A07)", () => {
  let server: ReturnType<typeof createServer>;

  const abrir = (headers = token(ALUMNO_ID, "ALUMNO")) =>
    request(server).post(`/api/entregas/${ENTREGA_ID}/feedback-visto`).set(headers);

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    p.entrega.findUnique.mockResolvedValue({
      id: ENTREGA_ID,
      alumno_id: ALUMNO_ID,
      publicado: true,
      feedback_revisado_alumno: false,
    });
    p.entrega.update.mockResolvedValue({});
  });

  afterEach(() => {
    server.close();
  });

  it("marca el feedback como revisado", async () => {
    const res = await abrir();

    expect(res.status).toBe(200);
    expect(p.entrega.update).toHaveBeenCalledWith({
      where: { id: ENTREGA_ID },
      data: { feedback_revisado_alumno: true },
    });
  });

  it("es idempotente: reabrirlo no vuelve a escribir", async () => {
    p.entrega.findUnique.mockResolvedValue({
      id: ENTREGA_ID,
      alumno_id: ALUMNO_ID,
      publicado: true,
      feedback_revisado_alumno: true,
    });

    expect((await abrir()).status).toBe(200);
    expect(p.entrega.update).not.toHaveBeenCalled();
  });

  it("no se puede marcar un feedback que todavia no fue publicado", async () => {
    p.entrega.findUnique.mockResolvedValue({ id: ENTREGA_ID, alumno_id: ALUMNO_ID, publicado: false });

    expect((await abrir()).status).toBe(409);
    expect(p.entrega.update).not.toHaveBeenCalled();
  });

  it("la entrega de otro alumno responde 404 y no se modifica", async () => {
    const res = await abrir(token(OTRO_ALUMNO_ID, "ALUMNO"));

    expect(res.status).toBe(404);
    expect(p.entrega.update).not.toHaveBeenCalled();
  });

  it("un administrador no puede usar este endpoint", async () => {
    expect((await abrir(token(ADMIN_ID, "ADMIN"))).status).toBe(403);
  });
});

describe("metricas de exito del proyecto", () => {
  let server: ReturnType<typeof createServer>;

  const consultar = (headers = token(ADMIN_ID, "ADMIN")) =>
    request(server).get("/api/admin/metricas-exito").set(headers);

  const ids = (...usuarios: string[]) => usuarios.map((usuario_id) => ({ usuario_id }));

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
  });

  afterEach(() => {
    server.close();
  });

  it("calcula uso del tutor, feedback revisado y retencion con los umbrales del proyecto", async () => {
    // sesion.findMany se llama 3 veces, en este orden: alumnos activos, mes anterior, mes actual
    p.sesion.findMany
      .mockResolvedValueOnce(ids("a1", "a2", "a3", "a4", "a5"))
      .mockResolvedValueOnce(ids("a1", "a2", "d1", "d2"))
      .mockResolvedValueOnce(ids("a1", "a2", "a3", "a4", "a5", "d1"));
    // 2 de 5 alumnos activos usaron el tutor (otro alumno inactivo no cuenta)
    p.sesionIA.findMany.mockResolvedValue([{ alumno_id: "a1" }, { alumno_id: "a2" }, { alumno_id: "inactivo" }]);
    p.entrega.count.mockResolvedValueOnce(10).mockResolvedValueOnce(7);

    const res = await consultar();

    expect(res.status).toBe(200);
    expect(res.body.uso_tutor).toMatchObject({ valor: 40, objetivo: 40, cumple: true });
    expect(res.body.feedback_revisado).toMatchObject({ valor: 70, objetivo: 60, cumple: true });
    // del mes anterior (a1, a2, d1, d2) volvieron a1, a2 y d1: 3 de 4
    expect(res.body.retencion_mensual).toMatchObject({ valor: 75, objetivo: 70, cumple: true });
    expect(res.body.reduccion_tiempo_docente).toMatchObject({ valor: null, cumple: null });
  });

  it("marca como por debajo del objetivo lo que no llega", async () => {
    p.sesion.findMany
      .mockResolvedValueOnce(ids("a1", "a2", "a3", "a4"))
      .mockResolvedValueOnce(ids("a1", "a2"))
      .mockResolvedValueOnce(ids("a1"));
    p.sesionIA.findMany.mockResolvedValue([{ alumno_id: "a1" }]);
    p.entrega.count.mockResolvedValueOnce(10).mockResolvedValueOnce(2);

    const res = await consultar();

    expect(res.body.uso_tutor).toMatchObject({ valor: 25, cumple: false });
    expect(res.body.feedback_revisado).toMatchObject({ valor: 20, cumple: false });
    expect(res.body.retencion_mensual).toMatchObject({ valor: 50, cumple: false });
  });

  it("sin actividad no afirma nada (sin datos en lugar de 0% o 100%)", async () => {
    p.sesion.findMany.mockResolvedValue([]);
    p.sesionIA.findMany.mockResolvedValue([]);
    p.entrega.count.mockResolvedValue(0);

    const res = await consultar();

    for (const clave of ["uso_tutor", "feedback_revisado", "retencion_mensual"]) {
      expect(res.body[clave]).toMatchObject({ valor: null, cumple: null });
    }
  });

  it("solo el administrador puede verlas", async () => {
    expect((await consultar(token(ALUMNO_ID, "ALUMNO"))).status).toBe(403);
  });
});
