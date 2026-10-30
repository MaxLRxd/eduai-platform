import { prisma } from "../config/prisma";
import { dashboardAlumno } from "../modules/dashboard/dashboard.service";

const ALUMNO_ID = "11111111-1111-4111-8111-111111111111";

jest.mock("../config/prisma", () => ({
  prisma: {
    inscripcion: { count: jest.fn(), findMany: jest.fn() },
    nota: { findMany: jest.fn() },
    asistencia: { groupBy: jest.fn() },
    actividad: { findMany: jest.fn() },
    alertaRiesgoAcademico: { count: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  inscripcion: { count: jest.Mock; findMany: jest.Mock };
  nota: { findMany: jest.Mock };
  asistencia: { groupBy: jest.Mock };
  actividad: { findMany: jest.Mock };
  alertaRiesgoAcademico: { count: jest.Mock };
};

const materia = (id: string, nombre: string) => ({ id, nombre });
const dec = (n: number) => ({ toNumber: () => n });

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
    prismaMock.inscripcion.count.mockResolvedValue(2);
    prismaMock.inscripcion.findMany.mockResolvedValue([
      { materia_id: "m1", materia: materia("m1", "Bases de Datos") },
      { materia_id: "m2", materia: materia("m2", "Redes") },
    ]);
    prismaMock.nota.findMany.mockResolvedValue([
      { materia_id: "m1", calificacion: dec(8), periodo: "2026-1" },
      { materia_id: "m1", calificacion: dec(6), periodo: "2026-1" },
    ]);
    prismaMock.asistencia.groupBy.mockResolvedValue([{ estado: "PRESENTE", _count: { _all: 9 } }]);
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

    expect(d.materias).toEqual([
      { id: "m1", nombre: "Bases de Datos", promedio: 7, progreso: 50 },
      { id: "m2", nombre: "Redes", promedio: null, progreso: 0 },
    ]);
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

  it("devuelve todo en cero para un alumno sin actividades ni notas", async () => {
    prismaMock.actividad.findMany.mockResolvedValue([]);
    prismaMock.nota.findMany.mockResolvedValue([]);

    const d = await dashboardAlumno(ALUMNO_ID);

    expect(d.materias.every((m) => m.progreso === 0 && m.promedio === null)).toBe(true);
    expect(d.resumen).toMatchObject({ entregasPendientes: 0, promedioGlobal: 0, alertasActivas: 1 });
    expect(d.proximasActividades).toEqual([]);
  });
});
