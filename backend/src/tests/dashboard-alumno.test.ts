import { prisma } from "../config/prisma";
import { dashboardAlumno } from "../modules/dashboard/dashboard.service";

const ALUMNO_ID = "11111111-1111-4111-8111-111111111111";

jest.mock("../config/prisma", () => ({
  prisma: {
    inscripcion: { count: jest.fn(), findMany: jest.fn() },
    nota: { findMany: jest.fn() },
    categoriaNota: { findMany: jest.fn() },
    asistencia: { findMany: jest.fn() },
    actividad: { findMany: jest.fn() },
    alertaRiesgoAcademico: { count: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  inscripcion: { count: jest.Mock; findMany: jest.Mock };
  nota: { findMany: jest.Mock };
  categoriaNota: { findMany: jest.Mock };
  asistencia: { findMany: jest.Mock };
  actividad: { findMany: jest.Mock };
  alertaRiesgoAcademico: { count: jest.Mock };
};

const materia = (id: string, nombre: string) => ({ id, nombre });
const dec = (n: number) => ({ toNumber: () => n });

const nota = (
  id: string,
  materiaId: string,
  valor: number,
  periodo: string,
  registrado: Date,
  evaluacion = "",
  categoria: string | null = null
) => ({
  id,
  materia_id: materiaId,
  calificacion: dec(valor),
  periodo,
  categoria_id: null,
  evaluacion,
  registrado_en: registrado,
  categoria: categoria ? { nombre: categoria } : null,
});

const actividad = (id: string, materiaId: string, entregada: boolean, dias: number) => ({
  id,
  nombre: `Actividad ${id}`,
  fecha_limite: new Date(Date.UTC(2026, 11, dias)),
  seccion: { materia: materia(materiaId, `Materia ${materiaId}`) },
  entregas: entregada ? [{ id: `entrega-${id}` }] : [],
});

describe("dashboardAlumno", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.categoriaNota.findMany.mockResolvedValue([]);
    prismaMock.inscripcion.count.mockResolvedValue(2);
    prismaMock.inscripcion.findMany.mockResolvedValue([
      { materia_id: "m1", materia: materia("m1", "Bases de Datos") },
      { materia_id: "m2", materia: materia("m2", "Redes") },
    ]);
    prismaMock.nota.findMany.mockResolvedValue([
      nota("n1", "m1", 8, "2026-1", new Date(Date.UTC(2026, 3, 10)), "Parcial 1", "Parcial"),
      nota("n2", "m1", 6, "2026-1", new Date(Date.UTC(2026, 4, 2)), "", null),
    ]);
    prismaMock.asistencia.findMany.mockResolvedValue([
      {
        estado: "PRESENTE",
        fecha_clase: new Date(Date.UTC(2026, 3, 1)),
      },
    ]);
    prismaMock.alertaRiesgoAcademico.count.mockResolvedValue(1);
    prismaMock.actividad.findMany.mockResolvedValue([
      actividad("a1", "m1", true, 10),
      actividad("a2", "m1", false, 12),
      actividad("a3", "m1", false, 20),
      actividad("a4", "m1", true, 25),
    ]);
  });

  it("calcula el progreso por materia como actividades entregadas sobre activas", async () => {
    const d = await dashboardAlumno(ALUMNO_ID);

    expect(d.materias.map(({ id, nombre, promedio, progreso }) => ({ id, nombre, promedio, progreso }))).toEqual([
      { id: "m1", nombre: "Bases de Datos", promedio: 7, progreso: 50 },
      { id: "m2", nombre: "Redes", promedio: null, progreso: 0 },
    ]);
  });

  it("devuelve las notas propias agrupadas por materia, la mas reciente primero", async () => {
    const d = await dashboardAlumno(ALUMNO_ID);

    const bd = d.materias.find((m) => m.id === "m1");
    expect(bd?.total_notas).toBe(2);
    expect(bd?.notas.map((n) => [n.id, n.evaluacion, n.categoria, n.calificacion])).toEqual([
      ["n2", "Calificación del período", null, 6],
      ["n1", "Parcial 1", "Parcial", 8],
    ]);
    // Una materia sin notas no inventa ninguna.
    expect(d.materias.find((m) => m.id === "m2")).toMatchObject({ total_notas: 0, notas: [] });
  });

  it("muestra solo las 5 ultimas por materia pero informa el total", async () => {
    prismaMock.nota.findMany.mockResolvedValue(
      Array.from({ length: 7 }, (_, i) => nota(`x${i}`, "m1", 5 + i * 0.5, "2026-1", new Date(Date.UTC(2026, 0, i + 1))))
    );

    const d = await dashboardAlumno(ALUMNO_ID);
    const bd = d.materias.find((m) => m.id === "m1");

    expect(bd?.total_notas).toBe(7);
    expect(bd?.notas).toHaveLength(5);
    expect(bd?.notas[0].id).toBe("x6");
  });

  it("consulta solo las notas del alumno autenticado", async () => {
    await dashboardAlumno(ALUMNO_ID);

    expect(prismaMock.nota.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { alumno_id: ALUMNO_ID } })
    );
  });

  it("cuenta como pendientes solo las actividades sin entrega y las lista por fecha", async () => {
    const d = await dashboardAlumno(ALUMNO_ID);

    expect(d.resumen.entregasPendientes).toBe(2);
    expect(d.proximasActividades.map((a) => a.id)).toEqual(["a2", "a3"]);
    expect(d.proximasActividades[0]).toMatchObject({ nombre: "Actividad a2", materia: "Materia m1" });
  });

  it("limita las proximas actividades a 5", async () => {
    prismaMock.actividad.findMany.mockResolvedValue(
      Array.from({ length: 8 }, (_, i) => actividad(`p${i}`, "m1", false, i + 1))
    );

    const d = await dashboardAlumno(ALUMNO_ID);

    expect(d.resumen.entregasPendientes).toBe(8);
    expect(d.proximasActividades).toHaveLength(5);
  });

  it("filtra notas y asistencias por período", async () => {
    prismaMock.nota.findMany.mockResolvedValue([
      nota("p1", "m1", 4, "2026-1", new Date(Date.UTC(2026, 2, 1))),
      nota("p2", "m1", 10, "2026-2", new Date(Date.UTC(2026, 8, 1))),
    ]);
    prismaMock.asistencia.findMany.mockResolvedValue([
      { estado: "AUSENTE", fecha_clase: new Date(Date.UTC(2026, 2, 1)) },
      { estado: "PRESENTE", fecha_clase: new Date(Date.UTC(2026, 7, 1)) },
    ]);

    const d = await dashboardAlumno(ALUMNO_ID, "2026-2");

    expect(d.periodos).toEqual(["2026-1", "2026-2"]);
    expect(d.periodo).toBe("2026-2");
    expect(d.materias.find((m) => m.id === "m1")?.promedio).toBe(10);
    expect(d.resumen.promedioGlobal).toBe(10);
    expect(d.asistencia).toEqual([{ estado: "PRESENTE", count: 1 }]);
    // Las notas de la lista respetan el mismo filtro de periodo.
    expect(d.materias.find((m) => m.id === "m1")?.notas.map((n) => n.id)).toEqual(["p2"]);
  });

  it("devuelve todo en cero para un alumno sin actividades ni notas", async () => {
    prismaMock.actividad.findMany.mockResolvedValue([]);
    prismaMock.nota.findMany.mockResolvedValue([]);

    const d = await dashboardAlumno(ALUMNO_ID);

    expect(d.materias.every((m) => m.progreso === 0 && m.promedio === null)).toBe(true);
    expect(d.resumen).toMatchObject({ entregasPendientes: 0, promedioGlobal: 0, alertasActivas: 1 });
    expect(d.proximasActividades).toEqual([]);
  });
});
