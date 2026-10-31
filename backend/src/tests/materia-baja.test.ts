import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const ADMIN_ID = "22222222-2222-4222-8222-222222222222";

jest.mock("../config/prisma", () => ({
  prisma: {
    materia: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    inscripcion: { count: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  materia: { findUnique: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
  inscripcion: { count: jest.Mock };
};

const materia = (activa: boolean) => ({
  id: MATERIA_ID,
  nombre: "Bases de Datos",
  descripcion: null,
  nivel_educativo: "Terciario",
  activa,
  _count: { inscripciones: 0, secciones: 0 },
});

describe("admin: baja de materia (CU-AD01 A3.1)", () => {
  let server: ReturnType<typeof createServer>;

  const tokenAdmin = (): string =>
    signAccessToken({ sub: ADMIN_ID, email: "admin@edu.ai", rol: "ADMIN" });

  const actualizar = (body: Record<string, unknown>) =>
    request(server)
      .put(`/api/admin/materias/${MATERIA_ID}`)
      .set("Authorization", `Bearer ${tokenAdmin()}`)
      .send(body);

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.materia.findUnique.mockResolvedValue(materia(true));
    prismaMock.materia.update.mockResolvedValue(materia(false));
    prismaMock.materia.findFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    server.close();
  });

  it("no desactiva una materia con alumnos inscriptos", async () => {
    prismaMock.inscripcion.count.mockResolvedValue(3);

    const res = await actualizar({ activa: false });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("3 alumnos inscriptos");
    expect(prismaMock.materia.update).not.toHaveBeenCalled();
  });

  it("desactiva una materia sin inscriptos", async () => {
    prismaMock.inscripcion.count.mockResolvedValue(0);

    const res = await actualizar({ activa: false });

    expect(res.status).toBe(200);
    expect(prismaMock.materia.update).toHaveBeenCalledTimes(1);
  });

  it("permite editar los datos de una materia con inscriptos sin desactivarla", async () => {
    prismaMock.inscripcion.count.mockResolvedValue(10);

    const res = await actualizar({ nombre: "Bases de Datos II" });

    expect(res.status).toBe(200);
    expect(prismaMock.inscripcion.count).not.toHaveBeenCalled();
  });

  it("no vuelve a validar inscriptos si la materia ya estaba inactiva", async () => {
    prismaMock.materia.findUnique.mockResolvedValue(materia(false));

    const res = await actualizar({ activa: false });

    expect(res.status).toBe(200);
    expect(prismaMock.inscripcion.count).not.toHaveBeenCalled();
  });
});
