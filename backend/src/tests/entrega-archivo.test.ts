import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const SECCION_ID = "22222222-2222-4222-8222-222222222222";
const ACTIVIDAD_ID = "33333333-3333-4333-8333-333333333333";
const ALUMNO_ID = "44444444-4444-4444-8444-444444444444";

jest.mock("../config/prisma", () => ({
  prisma: {
    actividad: { findUnique: jest.fn() },
    seccion: { findUnique: jest.fn() },
    inscripcion: { findUnique: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  actividad: { findUnique: jest.Mock };
  seccion: { findUnique: jest.Mock };
  inscripcion: { findUnique: jest.Mock };
};

const guardarArchivoMock = jest.fn();

jest.mock("../config/storage", () => ({
  UPLOADS_DIR: "uploads-test",
  asegurarDirectorioUploads: jest.fn(),
  guardarArchivo: (...args: unknown[]) => guardarArchivoMock(...args),
  eliminarArchivo: jest.fn(),
}));

const actividad = (formatos_permitidos: string | null = null): Record<string, unknown> => ({
  id: ACTIVIDAD_ID,
  seccion_id: SECCION_ID,
  nombre: "TP1",
  tipo: "ARCHIVO",
  formatos_permitidos,
  activo: true,
});

describe("entregas: subida de archivo del alumno", () => {
  let server: ReturnType<typeof createServer>;

  const tokenAlumno = (): string =>
    signAccessToken({ sub: ALUMNO_ID, email: "alumno@edu.ai", rol: "ALUMNO" });

  const tokenProfesor = (): string =>
    signAccessToken({ sub: ALUMNO_ID, email: "doc@edu.ai", rol: "PROFESOR" });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.seccion.findUnique.mockResolvedValue({ id: SECCION_ID, materia_id: MATERIA_ID });
    prismaMock.inscripcion.findUnique.mockResolvedValue({ alumno_id: ALUMNO_ID });
    prismaMock.actividad.findUnique.mockResolvedValue(actividad());
    guardarArchivoMock.mockImplementation((_buffer: Buffer, original: string) => ({
      url: "/uploads/tp1-sanitizado.txt",
      nombre: original,
      formato: "txt",
      tamanoKb: 1,
    }));
  });

  afterEach(() => {
    server.close();
  });

  it("sube un archivo y devuelve la url sanitizada", async () => {
    const res = await request(server)
      .post(`/api/actividades/${ACTIVIDAD_ID}/entrega/archivo`)
      .set("Authorization", `Bearer ${tokenAlumno()}`)
      .attach("archivo", Buffer.from("contenido"), "tp1.txt");

    expect(res.status).toBe(201);
    expect(res.body.archivo.archivo_url).toBe("/uploads/tp1-sanitizado.txt");
    expect(res.body.archivo.archivo_nombre).toBe("tp1.txt");
    expect(guardarArchivoMock).toHaveBeenCalledTimes(1);
  });

  it("rechaza un formato fuera de formatos_permitidos", async () => {
    prismaMock.actividad.findUnique.mockResolvedValue(actividad("pdf,docx"));

    const res = await request(server)
      .post(`/api/actividades/${ACTIVIDAD_ID}/entrega/archivo`)
      .set("Authorization", `Bearer ${tokenAlumno()}`)
      .attach("archivo", Buffer.from("png"), "imagen.png");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("pdf");
    expect(guardarArchivoMock).not.toHaveBeenCalled();
  });

  it("acepta cualquier formato si la actividad no define formatos_permitidos", async () => {
    const res = await request(server)
      .post(`/api/actividades/${ACTIVIDAD_ID}/entrega/archivo`)
      .set("Authorization", `Bearer ${tokenAlumno()}`)
      .attach("archivo", Buffer.from("x"), "cualquiera.bin");

    expect(res.status).toBe(201);
    expect(guardarArchivoMock).toHaveBeenCalledTimes(1);
  });

  it("no guarda el archivo si el alumno no esta inscripto", async () => {
    prismaMock.inscripcion.findUnique.mockResolvedValue(null);

    const res = await request(server)
      .post(`/api/actividades/${ACTIVIDAD_ID}/entrega/archivo`)
      .set("Authorization", `Bearer ${tokenAlumno()}`)
      .attach("archivo", Buffer.from("x"), "tp1.txt");

    expect(res.status).toBe(403);
    expect(guardarArchivoMock).not.toHaveBeenCalled();
  });

  it("rechaza a un docente", async () => {
    const res = await request(server)
      .post(`/api/actividades/${ACTIVIDAD_ID}/entrega/archivo`)
      .set("Authorization", `Bearer ${tokenProfesor()}`)
      .attach("archivo", Buffer.from("x"), "tp1.txt");

    expect(res.status).toBe(403);
    expect(guardarArchivoMock).not.toHaveBeenCalled();
  });

  it("rechaza la peticion sin archivo", async () => {
    const res = await request(server)
      .post(`/api/actividades/${ACTIVIDAD_ID}/entrega/archivo`)
      .set("Authorization", `Bearer ${tokenAlumno()}`);

    expect(res.status).toBe(400);
    expect(guardarArchivoMock).not.toHaveBeenCalled();
  });

  it("rechaza la subida si el docente archivo la actividad", async () => {
    prismaMock.actividad.findUnique.mockResolvedValue({ ...actividad(), activo: false });

    const res = await request(server)
      .post(`/api/actividades/${ACTIVIDAD_ID}/entrega/archivo`)
      .set("Authorization", `Bearer ${tokenAlumno()}`)
      .attach("archivo", Buffer.from("x"), "tp1.txt");

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("archivada");
    expect(guardarArchivoMock).not.toHaveBeenCalled();
  });
});
