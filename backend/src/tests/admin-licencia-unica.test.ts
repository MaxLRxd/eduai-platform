import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const ALUMNO_ID = "33333333-3333-4333-8333-333333333333";

jest.mock("../config/prisma", () => ({
  prisma: {
    usuario: { count: jest.fn() },
    materia: { count: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  usuario: { count: jest.Mock };
  materia: { count: jest.Mock };
};

describe("GET /api/admin/license: licencia única", () => {
  let server: ReturnType<typeof createServer>;
  const token = (rol: "ADMIN" | "ALUMNO") =>
    signAccessToken({ sub: rol === "ADMIN" ? ADMIN_ID : ALUMNO_ID, email: "x@edu.ai", rol });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.usuario.count.mockImplementation(async ({ where }: { where: { rol: string } }) =>
      where.rol === "ALUMNO" ? 16 : 5
    );
    prismaMock.materia.count.mockResolvedValue(4);
  });

  afterEach(() => {
    server.close();
  });

  it("devuelve una sola licencia con lo que incluye y el uso informativo", async () => {
    const res = await request(server).get("/api/admin/license").set("Authorization", `Bearer ${token("ADMIN")}`);

    expect(res.status).toBe(200);
    expect(res.body.licencia).toMatchObject({ tipo: "UNICA", estado: "ACTIVA" });
    expect(res.body.licencia.incluye.length).toBeGreaterThan(3);
    expect(res.body.uso).toEqual({ alumnos: 16, docentes: 5, materias: 4 });
  });

  it("es el mismo producto sin importar cuántos alumnos haya: no hay planes, topes ni MAU", async () => {
    prismaMock.usuario.count.mockImplementation(async ({ where }: { where: { rol: string } }) =>
      where.rol === "ALUMNO" ? 12000 : 300
    );

    const res = await request(server).get("/api/admin/license").set("Authorization", `Bearer ${token("ADMIN")}`);

    expect(res.body.licencia.tipo).toBe("UNICA");
    expect(res.body.uso.alumnos).toBe(12000);
    expect(res.body).not.toHaveProperty("planes");
    expect(JSON.stringify(res.body)).not.toMatch(/MAU|limit|Starter|Enterprise/i);
  });

  it("cuenta solo alumnos y docentes con la cuenta activa", async () => {
    await request(server).get("/api/admin/license").set("Authorization", `Bearer ${token("ADMIN")}`);

    expect(prismaMock.usuario.count).toHaveBeenCalledWith({ where: { rol: "ALUMNO", activo: true } });
    expect(prismaMock.usuario.count).toHaveBeenCalledWith({ where: { rol: "PROFESOR", activo: true } });
  });

  it("solo la ve el administrador", async () => {
    const res = await request(server).get("/api/admin/license").set("Authorization", `Bearer ${token("ALUMNO")}`);

    expect(res.status).toBe(403);
  });
});
