import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const CLAVE_ID = "22222222-2222-4222-8222-222222222222";
const ALUMNO_ID = "33333333-3333-4333-8333-333333333333";

jest.mock("../config/prisma", () => ({
  prisma: {
    claveMatriculacion: { findUnique: jest.fn() },
    inscripcion: { findUnique: jest.fn() },
    materia: { findUniqueOrThrow: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const tx = {
  claveMatriculacion: { updateMany: jest.fn() },
  inscripcion: { create: jest.fn() },
  materia: { findUniqueOrThrow: jest.fn() },
};

const prismaMock = prisma as unknown as {
  claveMatriculacion: { findUnique: jest.Mock };
  inscripcion: { findUnique: jest.Mock };
  materia: { findUniqueOrThrow: jest.Mock };
  $transaction: jest.Mock;
};

const clave = (max_usos: number | null, usos_actuales: number) => ({
  id: CLAVE_ID,
  materia_id: MATERIA_ID,
  clave: "ABCD1234",
  activa: true,
  revocada_en: null,
  vencimiento: null,
  max_usos,
  usos_actuales,
  materia: { id: MATERIA_ID, activa: true },
});

describe("inscripcion con clave: limite de usos (CU-AD04)", () => {
  let server: ReturnType<typeof createServer>;

  const tokenAlumno = (): string =>
    signAccessToken({ sub: ALUMNO_ID, email: "alumno@edu.ai", rol: "ALUMNO" });

  const unirse = () =>
    request(server)
      .post("/api/materias/unirse")
      .set("Authorization", `Bearer ${tokenAlumno()}`)
      .send({ clave: "abcd1234" });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.inscripcion.findUnique.mockResolvedValue(null);
    prismaMock.$transaction.mockImplementation((fn: (t: typeof tx) => unknown) => fn(tx));
    tx.inscripcion.create.mockResolvedValue({});
    tx.materia.findUniqueOrThrow.mockResolvedValue({
      id: MATERIA_ID,
      nombre: "Bases de Datos",
      descripcion: null,
      nivel_educativo: "Terciario",
      activa: true,
      created_at: new Date(),
      _count: { inscripciones: 1, secciones: 0 },
      profesores: [],
    });
  });

  afterEach(() => {
    server.close();
  });

  it("reserva el cupo con un UPDATE condicional por usos_actuales < max_usos", async () => {
    prismaMock.claveMatriculacion.findUnique.mockResolvedValue(clave(5, 4));
    tx.claveMatriculacion.updateMany.mockResolvedValue({ count: 1 });

    const res = await unirse();

    expect(res.status).toBeLessThan(300);
    expect(tx.claveMatriculacion.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: CLAVE_ID, usos_actuales: { lt: 5 } }),
        data: { usos_actuales: { increment: 1 } },
      })
    );
    expect(tx.inscripcion.create).toHaveBeenCalledTimes(1);
  });

  it("no inscribe si otro alumno tomo el ultimo cupo entre la lectura y la reserva", async () => {
    prismaMock.claveMatriculacion.findUnique.mockResolvedValue(clave(5, 4));
    tx.claveMatriculacion.updateMany.mockResolvedValue({ count: 0 });

    const res = await unirse();

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("limite de usos");
    expect(tx.inscripcion.create).not.toHaveBeenCalled();
  });

  it("si el alumno ya esta inscripto no es un error: lo lleva a la materia y no gasta un uso", async () => {
    prismaMock.claveMatriculacion.findUnique.mockResolvedValue(clave(5, 4));
    prismaMock.inscripcion.findUnique.mockResolvedValue({ alumno_id: ALUMNO_ID });
    prismaMock.materia.findUniqueOrThrow.mockResolvedValue({
      id: MATERIA_ID,
      nombre: "Bases de Datos",
      descripcion: null,
      nivel_educativo: "Terciario",
      activa: true,
      created_at: new Date(),
      _count: { inscripciones: 1, secciones: 0 },
      profesores: [],
    });

    const res = await unirse();

    expect(res.status).toBe(200);
    expect(res.body.materia).toMatchObject({ id: MATERIA_ID, ya_inscripto: true });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("una inscripcion nueva responde 201 e indica que no estaba inscripto", async () => {
    prismaMock.claveMatriculacion.findUnique.mockResolvedValue(clave(5, 1));
    tx.claveMatriculacion.updateMany.mockResolvedValue({ count: 1 });

    const res = await unirse();

    expect(res.status).toBe(201);
    expect(res.body.materia.ya_inscripto).toBe(false);
  });

  it("no pone tope de usos cuando la clave no tiene max_usos", async () => {
    prismaMock.claveMatriculacion.findUnique.mockResolvedValue(clave(null, 999));
    tx.claveMatriculacion.updateMany.mockResolvedValue({ count: 1 });

    await unirse();

    const donde = tx.claveMatriculacion.updateMany.mock.calls[0][0].where;
    expect(donde).not.toHaveProperty("usos_actuales");
  });
});
