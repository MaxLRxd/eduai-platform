import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const ALUMNO_ID = "22222222-2222-4222-8222-222222222222";

jest.mock("../config/prisma", () => ({
  prisma: {
    inscripcion: { findUnique: jest.fn() },
    materia: { findUnique: jest.fn() },
  },
}));

const p = prisma as unknown as Record<string, Record<string, jest.Mock>>;

describe("resumen en PDF (CU-A05)", () => {
  let server: ReturnType<typeof createServer>;

  const headers = {
    Authorization: `Bearer ${signAccessToken({ sub: ALUMNO_ID, email: "a@edu.ai", rol: "ALUMNO" })}`,
  };

  const descargar = (cuerpo: Record<string, unknown>) =>
    request(server).post(`/api/materias/${MATERIA_ID}/tutor/resumen/pdf`).set(headers).send(cuerpo);

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    p.inscripcion.findUnique.mockResolvedValue({ alumno_id: ALUMNO_ID });
    p.materia.findUnique.mockResolvedValue({ nombre: "Redes de Computadoras" });
  });

  afterEach(() => {
    server.close();
  });

  it("devuelve un PDF valido con nombre de archivo legible", async () => {
    const res = await descargar({ titulo: "Resumen - Unidad 1: Fundamentos", resumen: "# Idea central\n- Punto uno\n- Punto dos" });

    expect(res.status).toBe(200);
    expect(res.body.filename).toBe("resumen-unidad-1-fundamentos.pdf");
    expect(Buffer.from(res.body.pdf, "base64").subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("usa un titulo por defecto cuando no se envia", async () => {
    const res = await descargar({ resumen: "Un resumen cualquiera." });

    expect(res.status).toBe(200);
    expect(res.body.filename).toBe("resumen.pdf");
  });

  it("rechaza un resumen vacio", async () => {
    expect((await descargar({ titulo: "x", resumen: "" })).status).toBe(400);
  });

  it("solo para alumnos inscriptos en la materia", async () => {
    p.inscripcion.findUnique.mockResolvedValue(null);

    expect((await descargar({ resumen: "texto" })).status).toBe(403);
  });
});
