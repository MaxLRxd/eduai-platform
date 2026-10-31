import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";

const MATERIA_ID = "11111111-1111-4111-8111-111111111111";
const ALUMNO_ID = "22222222-2222-4222-8222-222222222222";
const OTRO_ALUMNO_ID = "22222222-2222-4222-8222-222222222223";
const PROFESOR_ID = "33333333-3333-4333-8333-333333333333";

jest.mock("../config/prisma", () => ({
  prisma: {
    profesor: { findUnique: jest.fn() },
    materiaProfesor: { findUnique: jest.fn() },
    inscripcion: { findUnique: jest.fn(), findMany: jest.fn() },
    nota: { findMany: jest.fn() },
    asistencia: { groupBy: jest.fn() },
    actividad: { findMany: jest.fn() },
    sesionIA: { count: jest.fn() },
    mensajeIA: { count: jest.fn(), findMany: jest.fn() },
    intentoSimulacro: { findMany: jest.fn() },
    contenido: { count: jest.fn() },
    accesoContenido: { findMany: jest.fn() },
    alertaRiesgoAcademico: { findMany: jest.fn() },
  },
}));

const p = prisma as unknown as Record<string, Record<string, jest.Mock>>;
const dec = (n: number) => ({ toNumber: () => n });

describe("perfil del alumno para el docente", () => {
  let server: ReturnType<typeof createServer>;

  const docente = { Authorization: `Bearer ${signAccessToken({ sub: PROFESOR_ID, email: "d@edu.ai", rol: "PROFESOR" })}` };
  const alumno = { Authorization: `Bearer ${signAccessToken({ sub: ALUMNO_ID, email: "a@edu.ai", rol: "ALUMNO" })}` };

  const pedir = (alumnoId = ALUMNO_ID, headers = docente) =>
    request(server).get(`/api/materias/${MATERIA_ID}/alumnos/${alumnoId}/perfil`).set(headers);

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    p.profesor.findUnique.mockResolvedValue({ id: PROFESOR_ID, usuario_id: PROFESOR_ID });
    p.materiaProfesor.findUnique.mockResolvedValue({ activo: true });
    p.inscripcion.findUnique.mockResolvedValue({
      inscripto_en: new Date("2026-08-01T00:00:00Z"),
      alumno: { id: ALUMNO_ID, nombre: "Ana", email: "ana@edu.ai" },
      materia: { nombre: "Redes" },
    });
    p.nota.findMany.mockResolvedValue([
      { periodo: "2026-1", calificacion: dec(8), observaciones: null },
      { periodo: "2026-2", calificacion: dec(6), observaciones: "Parcial" },
    ]);
    p.asistencia.groupBy.mockResolvedValue([
      { estado: "PRESENTE", _count: { _all: 6 } },
      { estado: "TARDANZA", _count: { _all: 2 } },
      { estado: "AUSENTE", _count: { _all: 2 } },
    ]);
    p.actividad.findMany.mockResolvedValue([
      { id: "a1", nombre: "TP1", fecha_limite: new Date(), entregas: [{ publicado: true, calificacion_final: dec(9), entregado_en: new Date() }] },
      { id: "a2", nombre: "TP2", fecha_limite: new Date(), entregas: [{ publicado: false, calificacion_final: null, entregado_en: new Date() }] },
      { id: "a3", nombre: "TP3", fecha_limite: new Date(), entregas: [] },
    ]);
    p.sesionIA.count.mockResolvedValue(3);
    p.mensajeIA.count.mockResolvedValue(12);
    p.mensajeIA.findMany.mockResolvedValue([
      { id: "m1", contenido: "¿Qué es una VLAN?", modo: "NORMAL", creado_en: new Date("2026-10-29T12:00:00Z") },
    ]);
    p.intentoSimulacro.findMany.mockResolvedValue([
      { id: "s1", titulo: "Simulacro 1", dificultad: "media", puntaje: dec(7.5), creado_en: new Date("2026-10-28T12:00:00Z") },
    ]);
    p.contenido.count.mockResolvedValue(5);
    p.accesoContenido.findMany.mockResolvedValue([{ contenido_id: "c1" }, { contenido_id: "c1" }, { contenido_id: "c2" }]);
    p.alertaRiesgoAcademico.findMany.mockResolvedValue([
      { id: "al1", tipo_alerta: "BAJO_DESEMPENO", nivel_severidad: "MEDIA", descripcion: "Notas bajas" },
    ]);
  });

  afterEach(() => {
    server.close();
  });

  it("resume notas, asistencia, entregas, uso del tutor, simulacros y material visto", async () => {
    const res = await pedir();

    expect(res.status).toBe(200);
    const perfil = res.body.perfil;
    expect(perfil.alumno).toMatchObject({ id: ALUMNO_ID, nombre: "Ana", email: "ana@edu.ai" });
    expect(perfil.notas.promedio).toBe(7);
    expect(perfil.asistencia).toMatchObject({ registros: 10, porcentaje: 80 }); // presente + tardanza
    expect(perfil.entregas).toMatchObject({
      actividades: 3,
      entregadas: 2,
      pendientes: 1,
      calificadas: 1,
      promedio_calificadas: 9,
    });
    expect(perfil.tutor).toMatchObject({ sesiones: 3, consultas: 12 });
    expect(perfil.tutor.ultimas_consultas[0].consulta).toBe("¿Qué es una VLAN?");
    expect(perfil.simulacros[0]).toMatchObject({ titulo: "Simulacro 1", puntaje: 7.5 });
    expect(perfil.material).toEqual({ total: 5, vistos: 2 });
    expect(perfil.alertas[0]).toMatchObject({ tipo: "BAJO_DESEMPENO", severidad: "MEDIA" });
  });

  it("sin datos devuelve porcentajes y promedios nulos en lugar de inventar ceros", async () => {
    p.nota.findMany.mockResolvedValue([]);
    p.asistencia.groupBy.mockResolvedValue([]);
    p.actividad.findMany.mockResolvedValue([]);

    const perfil = (await pedir()).body.perfil;

    expect(perfil.notas.promedio).toBeNull();
    expect(perfil.asistencia.porcentaje).toBeNull();
    expect(perfil.entregas.promedio_calificadas).toBeNull();
  });

  it("404 si el alumno no esta inscripto en esa materia", async () => {
    p.inscripcion.findUnique.mockResolvedValue(null);

    expect((await pedir(OTRO_ALUMNO_ID)).status).toBe(404);
  });

  it("403 para un docente sin acceso a la materia y para un alumno", async () => {
    p.materiaProfesor.findUnique.mockResolvedValue(null);
    expect((await pedir()).status).toBe(403);

    expect((await pedir(ALUMNO_ID, alumno)).status).toBe(403);
  });
});

describe("listado de inscriptos", () => {
  it("un alumno no puede ver el nombre y email de sus companeros", async () => {
    const server = createServer(createApp() as unknown as import("http").RequestListener);
    const headers = { Authorization: `Bearer ${signAccessToken({ sub: ALUMNO_ID, email: "a@edu.ai", rol: "ALUMNO" })}` };

    const res = await request(server).get(`/api/materias/${MATERIA_ID}/inscriptos`).set(headers);
    server.close();

    expect(res.status).toBe(403);
    expect(p.inscripcion.findMany).not.toHaveBeenCalled();
  });
});
