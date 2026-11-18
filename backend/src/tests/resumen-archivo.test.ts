import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";
import { guardarArchivo } from "../config/storage";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const ALUMNO_ID = "44444444-4444-4444-8444-444444444444";

jest.mock("../config/prisma", () => ({
  prisma: {
    inscripcion: { findUnique: jest.fn() },
    contenido: { create: jest.fn() },
  },
}));

// Se espia solo guardarArchivo (que no debe llamarse); el resto del modulo sigue real porque la app lo usa.
jest.mock("../config/storage", () => ({
  ...jest.requireActual("../config/storage"),
  guardarArchivo: jest.fn(),
}));

const extraerTextoArchivoMock = jest.fn();
const resumirDocumentoMock = jest.fn();

jest.mock("../config/aiClient", () => ({
  extraerTextoArchivo: (...args: unknown[]) => extraerTextoArchivoMock(...args),
  resumirDocumento: (...args: unknown[]) => resumirDocumentoMock(...args),
  indexArchivo: jest.fn(),
  indexMaterial: jest.fn(),
  streamTutor: jest.fn(),
  chatTutor: jest.fn(),
}));

jest.mock("../modules/analytics/analytics.service", () => ({
  registrarConsultaTutor: jest.fn().mockResolvedValue(undefined),
  seccionDeFuentes: jest.fn().mockResolvedValue(null),
}));

const p = prisma as unknown as { inscripcion: { findUnique: jest.Mock }; contenido: { create: jest.Mock } };
const TEXTO = "El modelo OSI organiza la comunicacion en siete capas. ".repeat(10);

describe("CU-A05 (A1): resumir un archivo propio del alumno", () => {
  let server: ReturnType<typeof createServer>;
  const alumno = { Authorization: `Bearer ${signAccessToken({ sub: ALUMNO_ID, email: "a@edu.ai", rol: "ALUMNO" })}` };
  const docente = { Authorization: `Bearer ${signAccessToken({ sub: ALUMNO_ID, email: "d@edu.ai", rol: "PROFESOR" })}` };

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    p.inscripcion.findUnique.mockResolvedValue({ alumno_id: ALUMNO_ID });
    extraerTextoArchivoMock.mockResolvedValue({ ok: true, texto: TEXTO });
    resumirDocumentoMock.mockResolvedValue({ summary: "Resumen del archivo." });
  });

  afterEach(() => {
    server.close();
  });

  const enviar = (
    archivo: { contenido?: Buffer; nombre: string } | null = { contenido: Buffer.from("x"), nombre: "apunte.pdf" },
    campos: Record<string, string> = {},
    headers: Record<string, string> = alumno
  ) => {
    let req = request(server).post(`/api/materias/${MATERIA_ID}/tutor/resumen/archivo`).set(headers);
    for (const [k, v] of Object.entries(campos)) req = req.field(k, v);
    if (archivo) req = req.attach("archivo", archivo.contenido ?? Buffer.from("x"), archivo.nombre);
    return req;
  };

  it("lee el archivo, lo resume y devuelve el resumen con el nombre del archivo como origen", async () => {
    const res = await enviar({ contenido: Buffer.from("contenido"), nombre: "apunte.pdf" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ resumen: "Resumen del archivo.", origen: "apunte.pdf", max_palabras: 150, truncado: false });
    expect(extraerTextoArchivoMock).toHaveBeenCalledWith(expect.any(Buffer), "apunte.pdf");
    expect(resumirDocumentoMock).toHaveBeenCalledWith(TEXTO, "es", 150);
  });

  it("respeta el idioma y la cantidad de palabras que manda el alumno", async () => {
    await enviar(undefined, { idioma: "en", max_palabras: "300" });

    expect(resumirDocumentoMock).toHaveBeenCalledWith(TEXTO, "en", 300);
  });

  it("el archivo se descarta: no se guarda en disco ni se crea como material de la materia", async () => {
    await enviar();

    expect(guardarArchivo).not.toHaveBeenCalled();
    expect(p.contenido.create).not.toHaveBeenCalled();
  });

  it("un nombre con acentos llega bien al resumen", async () => {
    const mojibake = Buffer.from("Presentación.pdf", "utf8").toString("latin1");
    const res = await enviar({ nombre: mojibake });

    expect(res.body.origen).toBe("Presentación.pdf");
  });

  it("si el texto es muy largo se recorta al máximo y se avisa", async () => {
    extraerTextoArchivoMock.mockResolvedValue({ ok: true, texto: "a".repeat(70000) });

    const res = await enviar();

    expect(res.status).toBe(200);
    expect(res.body.truncado).toBe(true);
    expect(resumirDocumentoMock.mock.calls[0][0]).toHaveLength(60000);
  });

  describe("rechazos antes de gastar IA", () => {
    it("formato no permitido", async () => {
      const res = await enviar({ nombre: "virus.exe" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Formato no permitido");
      expect(extraerTextoArchivoMock).not.toHaveBeenCalled();
    });

    it("sin archivo adjunto", async () => {
      const res = await enviar(null);

      expect(res.status).toBe(400);
      expect(extraerTextoArchivoMock).not.toHaveBeenCalled();
    });

    it("archivo vacío", async () => {
      const res = await enviar({ contenido: Buffer.alloc(0), nombre: "vacio.txt" });

      expect(res.status).toBe(400);
      expect(extraerTextoArchivoMock).not.toHaveBeenCalled();
    });

    it("archivo de más de 10 MB", async () => {
      const res = await enviar({ contenido: Buffer.alloc(11 * 1024 * 1024, 1), nombre: "enorme.txt" });

      expect(res.status).toBe(413);
      expect(extraerTextoArchivoMock).not.toHaveBeenCalled();
    });

    it("cantidad de palabras fuera de rango", async () => {
      const res = await enviar(undefined, { max_palabras: "5" });

      expect(res.status).toBe(400);
      expect(extraerTextoArchivoMock).not.toHaveBeenCalled();
    });

    it("solo los alumnos inscriptos en la materia", async () => {
      p.inscripcion.findUnique.mockResolvedValue(null);
      expect((await enviar()).status).toBe(403);

      expect((await enviar(undefined, {}, docente)).status).toBe(403);
      expect(extraerTextoArchivoMock).not.toHaveBeenCalled();
    });
  });

  describe("cuando algo falla el alumno sabe qué hacer", () => {
    it("un escaneo o imagen sin texto legible: 422 con una sugerencia", async () => {
      extraerTextoArchivoMock.mockResolvedValue({ ok: false, motivo: "sin_texto" });

      const res = await enviar();

      expect(res.status).toBe(422);
      expect(res.body.error).toContain("pega el texto");
      expect(resumirDocumentoMock).not.toHaveBeenCalled();
    });

    it("el servicio de IA caído al leer el archivo: 502", async () => {
      extraerTextoArchivoMock.mockResolvedValue({ ok: false, motivo: "ia_no_disponible" });

      expect((await enviar()).status).toBe(502);
    });

    it("un texto demasiado corto para resumir: 400 sin llamar a la IA", async () => {
      extraerTextoArchivoMock.mockResolvedValue({ ok: true, texto: "muy corto" });

      const res = await enviar();

      expect(res.status).toBe(400);
      expect(resumirDocumentoMock).not.toHaveBeenCalled();
    });

    it("la IA no logra resumir: 502", async () => {
      resumirDocumentoMock.mockResolvedValue(null);

      expect((await enviar()).status).toBe(502);
    });
  });
});
