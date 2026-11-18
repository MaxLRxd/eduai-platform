import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const PROFESOR_ID = "33333333-3333-4333-8333-333333333333";
const ALUMNO_ID = "22222222-2222-4222-8222-222222222222";
const S1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const S2 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
const S3 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3";

jest.mock("../config/prisma", () => ({
  prisma: {
    profesor: { findUnique: jest.fn() },
    materiaProfesor: { findUnique: jest.fn() },
    seccion: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const p = prisma as unknown as Record<string, Record<string, jest.Mock>> & { $transaction: jest.Mock };

const fila = (id: string, nombre: string, orden: number) => ({
  id,
  materia_id: MATERIA_ID,
  nombre,
  descripcion: null,
  tipo: "TEORIA",
  orden,
  created_at: new Date("2026-01-01"),
  updated_at: new Date("2026-01-01"),
  _count: { contenidos: 0, actividades: 0, clases: 0 },
});

describe("editar y reordenar unidades (CU-P01)", () => {
  let server: ReturnType<typeof createServer>;
  const docente = { Authorization: `Bearer ${signAccessToken({ sub: PROFESOR_ID, email: "d@edu.ai", rol: "PROFESOR" })}` };
  const alumno = { Authorization: `Bearer ${signAccessToken({ sub: ALUMNO_ID, email: "a@edu.ai", rol: "ALUMNO" })}` };

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    p.profesor.findUnique.mockResolvedValue({ id: PROFESOR_ID, usuario_id: PROFESOR_ID });
    p.materiaProfesor.findUnique.mockResolvedValue({ activo: true });
    p.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
    p.seccion.update.mockImplementation(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => ({
      ...fila(where.id, "x", 0),
      ...data,
    }));
  });

  afterEach(() => {
    server.close();
  });

  describe("PUT /materias/:id/secciones/orden", () => {
    const reordenar = (ids: unknown, headers = docente) =>
      request(server).put(`/api/materias/${MATERIA_ID}/secciones/orden`).set(headers).send({ ids });

    beforeEach(() => {
      p.seccion.findMany.mockResolvedValue([{ id: S1 }, { id: S2 }, { id: S3 }]);
    });

    it("renumera 0..n-1 en el orden recibido, en una sola transacción", async () => {
      const res = await reordenar([S3, S1, S2]);

      expect(res.status).toBe(200);
      expect(p.$transaction).toHaveBeenCalledTimes(1);
      expect(p.seccion.update.mock.calls.map((c) => [c[0].where.id, c[0].data.orden])).toEqual([
        [S3, 0],
        [S1, 1],
        [S2, 2],
      ]);
    });

    it("rechaza una lista incompleta: la pantalla estaba desactualizada", async () => {
      const res = await reordenar([S1, S2]);
      expect(res.status).toBe(409);
      expect(p.seccion.update).not.toHaveBeenCalled();
    });

    it("rechaza ids que no son de la materia", async () => {
      const res = await reordenar([S1, S2, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"]);
      expect(res.status).toBe(409);
      expect(p.seccion.update).not.toHaveBeenCalled();
    });

    it("rechaza repetidos, vacío y ids inválidos", async () => {
      expect((await reordenar([S1, S1, S2])).status).toBe(400);
      expect((await reordenar([])).status).toBe(400);
      expect((await reordenar(["nope"])).status).toBe(400);
      expect(p.$transaction).not.toHaveBeenCalled();
    });

    it("un docente ajeno a la materia recibe 403", async () => {
      p.materiaProfesor.findUnique.mockResolvedValue(null);
      const res = await reordenar([S1, S2, S3]);
      expect(res.status).toBe(403);
      expect(p.seccion.update).not.toHaveBeenCalled();
    });

    it("un alumno no puede reordenar", async () => {
      expect((await reordenar([S1, S2, S3], alumno)).status).toBe(403);
    });
  });

  describe("PUT /secciones/:id (editar)", () => {
    const editar = (body: Record<string, unknown>) => request(server).put(`/api/secciones/${S1}`).set(docente).send(body);

    beforeEach(() => {
      p.seccion.findUnique.mockResolvedValue(fila(S1, "Unidad 1", 0));
      p.seccion.findFirst.mockResolvedValue(null);
    });

    it("renombra y cambia el tipo", async () => {
      const res = await editar({ nombre: "Unidad 1: Redes", tipo: "PRACTICA" });

      expect(res.status).toBe(200);
      expect(p.seccion.update.mock.calls[0][0].data).toMatchObject({ nombre: "Unidad 1: Redes", tipo: "PRACTICA" });
    });

    it("no deja repetir el nombre de otra unidad de la materia", async () => {
      p.seccion.findFirst.mockResolvedValue({ id: S2 });

      const res = await editar({ nombre: "Unidad 2" });

      expect(res.status).toBe(409);
      expect(p.seccion.update).not.toHaveBeenCalled();
    });

    it("el chequeo de nombre repetido excluye a la propia unidad (guardar sin cambiar el nombre)", async () => {
      await editar({ nombre: "Unidad 1" });

      expect(p.seccion.findFirst.mock.calls[0][0].where.id).toEqual({ not: S1 });
    });

    it("rechaza un nombre vacío", async () => {
      expect((await editar({ nombre: "" })).status).toBe(400);
    });
  });

  it("el listado desempata por fecha de creación cuando hay órdenes repetidos", async () => {
    p.seccion.findMany.mockResolvedValue([]);
    await request(server).get(`/api/materias/${MATERIA_ID}/secciones`).set(docente);

    expect(p.seccion.findMany.mock.calls[0][0].orderBy).toEqual([{ orden: "asc" }, { created_at: "asc" }]);
  });
});
