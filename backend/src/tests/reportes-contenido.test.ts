import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";
import { UPLOADS_DIR, archivoDisponible } from "../config/storage";
import { crearNoLeidas } from "../modules/notificaciones/notificaciones.service";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const CONTENIDO_ID = "55555555-5555-4555-8555-555555555555";
const CONTENIDO_2_ID = "55555555-5555-4555-8555-555555555556";
const ALUMNO_ID = "44444444-4444-4444-8444-444444444444";
const ALUMNO_2_ID = "44444444-4444-4444-8444-444444444445";
const PROFESOR_ID = "77777777-7777-4777-8777-777777777777";
const PROFE_USUARIO_ID = "88888888-8888-4888-8888-888888888888";

jest.mock("../config/prisma", () => ({
  prisma: {
    contenido: { findUnique: jest.fn(), findMany: jest.fn() },
    inscripcion: { findUnique: jest.fn() },
    reporteContenido: { findUnique: jest.fn(), upsert: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
    usuario: { findUnique: jest.fn() },
    materiaProfesor: { findMany: jest.fn(), findUnique: jest.fn() },
    profesor: { findUnique: jest.fn() },
    seccion: { findMany: jest.fn() },
  },
}));

jest.mock("../modules/notificaciones/notificaciones.service", () => ({
  crearNoLeidas: jest.fn().mockResolvedValue({}),
}));

const p = prisma as unknown as Record<string, Record<string, jest.Mock>>;
const crearNoLeidasMock = crearNoLeidas as jest.Mock;

describe("CU-A02 (5A): archivo no disponible o dañado", () => {
  let server: ReturnType<typeof createServer>;
  const alumno = { Authorization: `Bearer ${signAccessToken({ sub: ALUMNO_ID, email: "a@edu.ai", rol: "ALUMNO" })}` };
  const profe = { Authorization: `Bearer ${signAccessToken({ sub: PROFE_USUARIO_ID, email: "p@edu.ai", rol: "PROFESOR" })}` };

  const contenido = (extra: Record<string, unknown> = {}) => ({
    id: CONTENIDO_ID,
    titulo: "Apunte de DNS",
    tipo: "PDF",
    archivo_url: "/uploads/no-existe-0000.pdf",
    archivo_nombre: "apunte.pdf",
    seccion: { materia_id: MATERIA_ID },
    ...extra,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    p.contenido.findUnique.mockResolvedValue(contenido());
    p.inscripcion.findUnique.mockResolvedValue({ alumno_id: ALUMNO_ID });
    p.reporteContenido.findUnique.mockResolvedValue(null);
    p.reporteContenido.upsert.mockResolvedValue({});
    p.usuario.findUnique.mockResolvedValue({ nombre: "Ana" });
    p.materiaProfesor.findMany.mockResolvedValue([{ profesor: { usuario_id: PROFE_USUARIO_ID } }]);
    p.profesor.findUnique.mockResolvedValue({ id: PROFESOR_ID, usuario_id: PROFE_USUARIO_ID });
    p.materiaProfesor.findUnique.mockResolvedValue({ activo: true });
  });

  afterEach(() => {
    server.close();
  });

  describe("POST /contenidos/:id/reportes", () => {
    const reportar = (cuerpo: Record<string, unknown> = {}, id = CONTENIDO_ID, headers = alumno) =>
      request(server).post(`/api/contenidos/${id}/reportes`).set(headers).send(cuerpo);

    it("registra el reporte y avisa a los docentes de la materia", async () => {
      const res = await reportar({ motivo: "  No abre en el celular  " });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ reportado: true, ya_reportado: false });
      expect(p.reporteContenido.upsert.mock.calls[0][0].create).toMatchObject({
        contenido_id: CONTENIDO_ID,
        alumno_id: ALUMNO_ID,
        motivo: "No abre en el celular",
        resuelto_en: null,
      });
      expect(crearNoLeidasMock).toHaveBeenCalledTimes(1);
      expect(crearNoLeidasMock.mock.calls[0][0]).toMatchObject({
        usuario_id: PROFE_USUARIO_ID,
        tipo: "ALERTA",
        titulo: "Archivo reportado",
        referencia_tipo: "contenido",
        referencia_id: CONTENIDO_ID,
      });
      expect(crearNoLeidasMock.mock.calls[0][0].mensaje).toContain("Ana");
      expect(crearNoLeidasMock.mock.calls[0][0].mensaje).toContain("Apunte de DNS");
    });

    it("el motivo es opcional", async () => {
      const res = await reportar();

      expect(res.status).toBe(201);
      expect(p.reporteContenido.upsert.mock.calls[0][0].create.motivo).toBeNull();
    });

    it("avisa a todos los docentes asignados", async () => {
      p.materiaProfesor.findMany.mockResolvedValue([
        { profesor: { usuario_id: PROFE_USUARIO_ID } },
        { profesor: { usuario_id: "99999999-9999-4999-8999-999999999999" } },
      ]);

      await reportar();

      expect(crearNoLeidasMock).toHaveBeenCalledTimes(2);
    });

    it("repetir un reporte que sigue abierto no vuelve a molestar al docente", async () => {
      p.reporteContenido.findUnique.mockResolvedValue({ resuelto_en: null });

      const res = await reportar();

      expect(res.status).toBe(201);
      expect(res.body.ya_reportado).toBe(true);
      expect(crearNoLeidasMock).not.toHaveBeenCalled();
    });

    it("si el reporte anterior ya estaba resuelto, se reabre y se avisa de nuevo", async () => {
      p.reporteContenido.findUnique.mockResolvedValue({ resuelto_en: new Date() });

      const res = await reportar({ motivo: "Sigue sin abrir" });

      expect(res.body.ya_reportado).toBe(false);
      expect(p.reporteContenido.upsert.mock.calls[0][0].update).toMatchObject({ resuelto_en: null, motivo: "Sigue sin abrir" });
      expect(crearNoLeidasMock).toHaveBeenCalledTimes(1);
    });

    it("rechaza un motivo de más de 300 caracteres", async () => {
      const res = await reportar({ motivo: "x".repeat(301) });

      expect(res.status).toBe(400);
      expect(p.reporteContenido.upsert).not.toHaveBeenCalled();
    });

    it("un alumno no inscripto en la materia no puede reportar", async () => {
      p.inscripcion.findUnique.mockResolvedValue(null);

      expect((await reportar()).status).toBe(403);
      expect(p.reporteContenido.upsert).not.toHaveBeenCalled();
    });

    it("un docente no reporta archivos (son los alumnos)", async () => {
      expect((await reportar({}, CONTENIDO_ID, profe)).status).toBe(403);
    });

    it("un material inexistente o un id inválido dan 404", async () => {
      p.contenido.findUnique.mockResolvedValue(null);
      expect((await reportar()).status).toBe(404);
      expect((await reportar({}, "no-es-uuid")).status).toBe(404);
    });
  });

  describe("GET /materias/:id/reportes-contenido", () => {
    const listar = (headers = profe) => request(server).get(`/api/materias/${MATERIA_ID}/reportes-contenido`).set(headers);

    const fila = (alumnoId: string, motivo: string | null, contenidoId = CONTENIDO_ID, fecha = "2026-11-18T10:00:00Z") => ({
      contenido_id: contenidoId,
      alumno_id: alumnoId,
      motivo,
      reportado_en: new Date(fecha),
      contenido: contenido({ id: contenidoId, titulo: contenidoId === CONTENIDO_ID ? "Apunte de DNS" : "Guía 2" }),
    });

    it("agrupa por material con la cantidad de alumnos y los motivos sin repetir", async () => {
      p.reporteContenido.findMany.mockResolvedValue([
        fila(ALUMNO_ID, "No abre", CONTENIDO_ID, "2026-11-18T12:00:00Z"),
        fila(ALUMNO_2_ID, "No abre", CONTENIDO_ID, "2026-11-18T11:00:00Z"),
        fila("44444444-4444-4444-8444-444444444446", null, CONTENIDO_ID, "2026-11-18T10:00:00Z"),
        fila(ALUMNO_ID, "Dice error", CONTENIDO_2_ID),
      ]);

      const res = await listar();

      expect(res.status).toBe(200);
      expect(res.body.reportes).toHaveLength(2);
      const dns = res.body.reportes.find((r: { contenido_id: string }) => r.contenido_id === CONTENIDO_ID);
      expect(dns).toMatchObject({ titulo: "Apunte de DNS", alumnos: 3, motivos: ["No abre"], archivo_nombre: "apunte.pdf" });
      expect(new Date(dns.ultimo_reporte).toISOString()).toBe("2026-11-18T12:00:00.000Z");
    });

    it("solo trae los reportes abiertos de ESA materia", async () => {
      p.reporteContenido.findMany.mockResolvedValue([]);

      await listar();

      expect(p.reporteContenido.findMany.mock.calls[0][0].where).toEqual({
        resuelto_en: null,
        contenido: { seccion: { materia_id: MATERIA_ID } },
      });
    });

    it("indica si el archivo realmente falta en el almacenamiento (para saber qué hacer)", async () => {
      p.reporteContenido.findMany.mockResolvedValue([fila(ALUMNO_ID, null)]);

      const res = await listar();

      expect(res.body.reportes[0].archivo_disponible).toBe(false); // /uploads/no-existe-0000.pdf no está en disco
    });

    it("sin reportes devuelve una lista vacía", async () => {
      p.reporteContenido.findMany.mockResolvedValue([]);

      expect((await listar()).body).toEqual({ reportes: [] });
    });

    it("un docente ajeno a la materia y un alumno reciben 403", async () => {
      p.materiaProfesor.findUnique.mockResolvedValue(null);
      expect((await listar()).status).toBe(403);
      expect((await listar(alumno)).status).toBe(403);
    });
  });

  describe("POST /contenidos/:id/reportes/resolver", () => {
    const resolver = (headers = profe, id = CONTENIDO_ID) =>
      request(server).post(`/api/contenidos/${id}/reportes/resolver`).set(headers);

    beforeEach(() => {
      p.reporteContenido.findMany.mockResolvedValue([{ alumno_id: ALUMNO_ID }, { alumno_id: ALUMNO_2_ID }]);
      p.reporteContenido.updateMany.mockResolvedValue({ count: 2 });
    });

    it("cierra los reportes abiertos y avisa a cada alumno que reportó", async () => {
      const res = await resolver();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ resueltos: 2 });
      expect(p.reporteContenido.updateMany.mock.calls[0][0].where).toEqual({ contenido_id: CONTENIDO_ID, resuelto_en: null });
      expect(p.reporteContenido.updateMany.mock.calls[0][0].data.resuelto_en).toBeInstanceOf(Date);
      expect(crearNoLeidasMock).toHaveBeenCalledTimes(2);
      expect(crearNoLeidasMock.mock.calls.map((c) => c[0].usuario_id)).toEqual([ALUMNO_ID, ALUMNO_2_ID]);
      expect(crearNoLeidasMock.mock.calls[0][0]).toMatchObject({ tipo: "SISTEMA", titulo: "Archivo revisado" });
    });

    it("un docente ajeno a la materia no puede resolver", async () => {
      p.materiaProfesor.findUnique.mockResolvedValue(null);

      expect((await resolver()).status).toBe(403);
      expect(p.reporteContenido.updateMany).not.toHaveBeenCalled();
    });

    it("un alumno no puede resolver; un material inexistente da 404", async () => {
      expect((await resolver(alumno)).status).toBe(403);
      p.contenido.findUnique.mockResolvedValue(null);
      expect((await resolver()).status).toBe(404);
    });
  });

  describe("el alumno ve el aviso en el material (archivo_disponible)", () => {
    it("el árbol de la materia marca como no disponible un archivo que ya no está", async () => {
      p.seccion.findMany.mockResolvedValue([
        {
          id: "s1",
          materia_id: MATERIA_ID,
          nombre: "Unidad 1",
          descripcion: null,
          tipo: "TEORIA",
          orden: 0,
          contenidos: [
            {
              id: CONTENIDO_ID,
              seccion_id: "s1",
              clase_id: null,
              tipo: "PDF",
              titulo: "Apunte de DNS",
              texto_contenido: null,
              archivo_url: "/uploads/no-existe-0000.pdf",
              archivo_nombre: "apunte.pdf",
              archivo_formato: "pdf",
              archivo_tamano_kb: 10,
              rag_indexado: true,
              created_at: new Date(),
              updated_at: new Date(),
            },
            {
              id: CONTENIDO_2_ID,
              seccion_id: "s1",
              clase_id: null,
              tipo: "TEXTO",
              titulo: "Resumen",
              texto_contenido: "hola",
              archivo_url: null,
              archivo_nombre: null,
              archivo_formato: null,
              archivo_tamano_kb: null,
              rag_indexado: true,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
          clases: [],
        },
      ]);

      const res = await request(server).get(`/api/materias/${MATERIA_ID}/contenidos`).set(alumno);

      expect(res.status).toBe(200);
      const [archivo, texto] = res.body.secciones[0].contenidos;
      expect(archivo.archivo_disponible).toBe(false);
      expect(texto.archivo_disponible).toBeNull(); // un texto no tiene archivo: nada que comprobar
    });
  });
});

describe("archivoDisponible", () => {
  const nombre = `prueba-disponibilidad-${Date.now()}.txt`;
  const ruta = path.join(UPLOADS_DIR, nombre);

  beforeAll(() => {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    fs.writeFileSync(ruta, "hola");
  });

  afterAll(() => {
    fs.rmSync(ruta, { force: true });
  });

  it("true si el archivo está en el almacenamiento y false si falta", async () => {
    expect(await archivoDisponible(`/uploads/${nombre}`)).toBe(true);
    expect(await archivoDisponible("/uploads/borrado-1234.pdf")).toBe(false);
  });

  it("null cuando no se puede comprobar (sin archivo, URL externa u otra ruta)", async () => {
    expect(await archivoDisponible(null)).toBeNull();
    expect(await archivoDisponible("https://cdn.ejemplo.com/a.pdf")).toBeNull();
    expect(await archivoDisponible("/otra-ruta/a.pdf")).toBeNull();
  });

  it("no se deja engañar por rutas que intentan salir de la carpeta de archivos", async () => {
    expect(await archivoDisponible("/uploads/../../package.json")).toBe(false);
  });
});
