import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const CONTENIDO_ID = "22222222-2222-4222-8222-222222222222";
const CONTENIDO_2_ID = "22222222-2222-4222-8222-222222222223";
const ALUMNO_ID = "33333333-3333-4333-8333-333333333333";
const ALUMNO_2_ID = "33333333-3333-4333-8333-333333333334";
const PROFESOR_ID = "44444444-4444-4444-8444-444444444444";

jest.mock("../config/prisma", () => ({
  prisma: {
    contenido: { findUnique: jest.fn(), findMany: jest.fn() },
    inscripcion: { findUnique: jest.fn(), count: jest.fn() },
    accesoContenido: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    profesor: { findUnique: jest.fn() },
    materiaProfesor: { findUnique: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  contenido: { findUnique: jest.Mock; findMany: jest.Mock };
  inscripcion: { findUnique: jest.Mock; count: jest.Mock };
  accesoContenido: { findFirst: jest.Mock; create: jest.Mock; findMany: jest.Mock };
  profesor: { findUnique: jest.Mock };
  materiaProfesor: { findUnique: jest.Mock };
};

describe("accesos al contenido (CU-A02)", () => {
  let server: ReturnType<typeof createServer>;

  const token = (sub: string, rol: "ALUMNO" | "PROFESOR") => ({
    Authorization: `Bearer ${signAccessToken({ sub, email: "x@edu.ai", rol })}`,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.contenido.findUnique.mockResolvedValue({ id: CONTENIDO_ID, seccion: { materia_id: MATERIA_ID } });
    prismaMock.inscripcion.findUnique.mockResolvedValue({ alumno_id: ALUMNO_ID });
    prismaMock.accesoContenido.findFirst.mockResolvedValue(null);
    prismaMock.accesoContenido.create.mockResolvedValue({});
    prismaMock.profesor.findUnique.mockResolvedValue({ id: PROFESOR_ID, usuario_id: PROFESOR_ID });
    prismaMock.materiaProfesor.findUnique.mockResolvedValue({ activo: true });
  });

  afterEach(() => {
    server.close();
  });

  describe("registrar acceso", () => {
    const abrir = (headers = token(ALUMNO_ID, "ALUMNO")) =>
      request(server).post(`/api/contenidos/${CONTENIDO_ID}/acceso`).set(headers);

    it("registra el acceso de un alumno inscripto", async () => {
      const res = await abrir();

      expect(res.status).toBe(200);
      expect(res.body.registrado).toBe(true);
      expect(prismaMock.accesoContenido.create).toHaveBeenCalledWith({
        data: { contenido_id: CONTENIDO_ID, alumno_id: ALUMNO_ID },
      });
    });

    it("no vuelve a registrar el mismo material dentro de la ventana de 5 minutos", async () => {
      prismaMock.accesoContenido.findFirst.mockResolvedValue({ id: "previo" });

      const res = await abrir();

      expect(res.body.registrado).toBe(false);
      expect(prismaMock.accesoContenido.create).not.toHaveBeenCalled();
    });

    it("rechaza a un alumno que no esta inscripto en la materia", async () => {
      prismaMock.inscripcion.findUnique.mockResolvedValue(null);

      expect((await abrir()).status).toBe(403);
      expect(prismaMock.accesoContenido.create).not.toHaveBeenCalled();
    });

    it("404 si el contenido no existe y 403 para un docente", async () => {
      prismaMock.contenido.findUnique.mockResolvedValue(null);
      expect((await abrir()).status).toBe(404);

      expect((await abrir(token(PROFESOR_ID, "PROFESOR"))).status).toBe(403);
    });
  });

  describe("estadisticas para el docente", () => {
    const consultar = (headers = token(PROFESOR_ID, "PROFESOR")) =>
      request(server).get(`/api/materias/${MATERIA_ID}/accesos`).set(headers);

    it("cuenta alumnos distintos, accesos totales y ultimo acceso por material", async () => {
      const dia = (n: number) => new Date(Date.UTC(2026, 9, n));
      prismaMock.contenido.findMany.mockResolvedValue([
        { id: CONTENIDO_ID, titulo: "Unidad 1", tipo: "PDF" },
        { id: CONTENIDO_2_ID, titulo: "Unidad 2", tipo: "TEXTO" },
      ]);
      prismaMock.accesoContenido.findMany.mockResolvedValue([
        { contenido_id: CONTENIDO_ID, alumno_id: ALUMNO_ID, accedido_en: dia(1) },
        { contenido_id: CONTENIDO_ID, alumno_id: ALUMNO_ID, accedido_en: dia(5) },
        { contenido_id: CONTENIDO_ID, alumno_id: ALUMNO_2_ID, accedido_en: dia(3) },
      ]);
      prismaMock.inscripcion.count.mockResolvedValue(10);

      const res = await consultar();

      expect(res.status).toBe(200);
      expect(res.body.inscriptos).toBe(10);
      expect(res.body.contenidos).toEqual([
        {
          contenido_id: CONTENIDO_ID,
          titulo: "Unidad 1",
          tipo: "PDF",
          alumnos_distintos: 2,
          accesos: 3,
          ultimo_acceso: dia(5).toISOString(),
        },
        {
          contenido_id: CONTENIDO_2_ID,
          titulo: "Unidad 2",
          tipo: "TEXTO",
          alumnos_distintos: 0,
          accesos: 0,
          ultimo_acceso: null,
        },
      ]);
    });

    it("exige ser docente asignado a la materia", async () => {
      prismaMock.materiaProfesor.findUnique.mockResolvedValue(null);
      expect((await consultar()).status).toBe(403);

      expect((await consultar(token(ALUMNO_ID, "ALUMNO"))).status).toBe(403);
    });
  });
});
