import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";
import { armarCsvAsistencia } from "../modules/asistencias/asistencias.service";

const PROFESOR_USUARIO_ID = "55555555-5555-4555-8555-555555555555";
const PROFESOR_PERFIL_ID = "44444444-4444-4444-8444-444444444444";
const ALUMNO_ID = "33333333-3333-4333-8333-333333333333";
const MATERIA_ID = "22222222-2222-4222-8222-222222222222";
const A1 = "a1111111-1111-4111-8111-111111111111";
const A2 = "a2222222-2222-4222-8222-222222222222";
const BAJA = "a3333333-3333-4333-8333-333333333333";

jest.mock("../config/prisma", () => ({
  prisma: {
    materia: { findUnique: jest.fn() },
    profesor: { findUnique: jest.fn() },
    materiaProfesor: { findUnique: jest.fn() },
    inscripcion: { findMany: jest.fn() },
    asistencia: { findMany: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  materia: { findUnique: jest.Mock };
  profesor: { findUnique: jest.Mock };
  materiaProfesor: { findUnique: jest.Mock };
  inscripcion: { findMany: jest.Mock };
  asistencia: { findMany: jest.Mock };
};

const dia = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("armarCsvAsistencia: formato y cálculo", () => {
  const csv = armarCsvAsistencia(
    ["2026-10-01", "2026-10-08", "2026-10-15"],
    [
      {
        nombre: "Ana Ñandú",
        email: "ana@edu.ai",
        estados: new Map([
          ["2026-10-01", "PRESENTE"],
          ["2026-10-08", "AUSENTE"],
          ["2026-10-15", "JUSTIFICADO"],
        ]),
      },
      { nombre: "Beto", email: "beto@edu.ai", estados: new Map([["2026-10-01", "TARDANZA"]]) },
      { nombre: "Sin clases", email: "s@edu.ai", estados: new Map() },
    ]
  );
  const lineas = csv.replace("﻿", "").split("\r\n");

  it("lleva BOM, separa con «;» y conserva los acentos", () => {
    expect(csv.startsWith("﻿")).toBe(true);
    expect(lineas[1].startsWith('"Ana Ñandú";"ana@edu.ai"')).toBe(true);
  });

  it("una columna por fecha de clase y los totales por estado", () => {
    expect(lineas[0]).toBe(
      '"Alumno";"Email";"2026-10-01";"2026-10-08";"2026-10-15";"Presentes";"Ausentes";"Tardanzas";"Justificados";"% asistencia"'
    );
    expect(lineas[1]).toBe('"Ana Ñandú";"ana@edu.ai";"P";"A";"J";"1";"1";"0";"1";"67%"');
  });

  it("deja vacía la fecha sin registro y una sola tardanza (media falta) da 50 %", () => {
    expect(lineas[2]).toBe('"Beto";"beto@edu.ai";"T";"";"";"0";"0";"1";"0";"50%"');
  });

  it("un alumno sin clases registradas no muestra porcentaje", () => {
    expect(lineas[3]).toBe('"Sin clases";"s@edu.ai";"";"";"";"0";"0";"0";"0";""');
  });
});

describe("GET /api/materias/:id/asistencias/export", () => {
  let server: ReturnType<typeof createServer>;
  const tokenDocente = () => signAccessToken({ sub: PROFESOR_USUARIO_ID, email: "p@edu.ai", rol: "PROFESOR" });
  const tokenAlumno = () => signAccessToken({ sub: ALUMNO_ID, email: "a@edu.ai", rol: "ALUMNO" });
  const pedir = (token: string, consulta = "") =>
    request(server)
      .get(`/api/materias/${MATERIA_ID}/asistencias/export${consulta}`)
      .set("Authorization", `Bearer ${token}`);

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    prismaMock.profesor.findUnique.mockResolvedValue({ id: PROFESOR_PERFIL_ID });
    prismaMock.materiaProfesor.findUnique.mockResolvedValue({ activo: true });
    prismaMock.materia.findUnique.mockResolvedValue({ nombre: "Programación II" });
    prismaMock.inscripcion.findMany.mockResolvedValue([
      { alumno: { id: A2, nombre: "Beto", email: "beto@edu.ai" } },
      { alumno: { id: A1, nombre: "Ana", email: "ana@edu.ai" } },
    ]);
    prismaMock.asistencia.findMany.mockResolvedValue([
      { alumno_id: A1, fecha_clase: dia("2026-10-01"), estado: "PRESENTE" },
      { alumno_id: A2, fecha_clase: dia("2026-10-01"), estado: "AUSENTE" },
      { alumno_id: A1, fecha_clase: dia("2026-10-08"), estado: "PRESENTE" },
      // Un alumno desmatriculado: sus registros no se exportan.
      { alumno_id: BAJA, fecha_clase: dia("2026-10-08"), estado: "AUSENTE" },
    ]);
  });

  afterEach(() => {
    server.close();
  });

  it("devuelve el archivo con los alumnos inscriptos ordenados por nombre y sin los desmatriculados", async () => {
    const res = await pedir(tokenDocente());

    expect(res.status).toBe(200);
    expect(res.body.filename).toBe("asistencia-programacion-ii.csv");
    const lineas = (res.body.csv as string).replace("﻿", "").split("\r\n");
    expect(lineas).toHaveLength(3);
    expect(lineas[1]).toBe('"Ana";"ana@edu.ai";"P";"P";"2";"0";"0";"0";"100%"');
    expect(lineas[2]).toBe('"Beto";"beto@edu.ai";"A";"";"0";"1";"0";"0";"0%"');
    expect(lineas[0]).toContain('"2026-10-01";"2026-10-08"');
  });

  it("aplica el rango de fechas a la consulta", async () => {
    await pedir(tokenDocente(), "?desde=2026-10-01&hasta=2026-10-31");

    expect(prismaMock.asistencia.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          materia_id: MATERIA_ID,
          fecha_clase: { gte: dia("2026-10-01"), lte: dia("2026-10-31") },
        },
      })
    );
  });

  it("400 con fechas mal formadas", async () => {
    expect((await pedir(tokenDocente(), "?desde=ayer")).status).toBe(400);
  });

  it("404 con mensaje claro si no hay registros para exportar", async () => {
    prismaMock.asistencia.findMany.mockResolvedValue([]);

    const res = await pedir(tokenDocente());

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no hay asistencia registrada/i);
  });

  it("403 si el docente no está asignado a la materia y si no es docente", async () => {
    prismaMock.materiaProfesor.findUnique.mockResolvedValue(null);
    expect((await pedir(tokenDocente())).status).toBe(403);

    expect((await pedir(tokenAlumno())).status).toBe(403);
  });
});
