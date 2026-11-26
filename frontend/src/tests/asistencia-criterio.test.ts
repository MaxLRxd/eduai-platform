import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return { ...real, api: (...a: unknown[]) => apiMock(...a) };
});

import { faltasEquivalentes, PESO_TARDANZA, porcentajeAsistencia, tasaAsistencia } from "../utils/asistencia";
import { getAttendanceState } from "../services/attendance.service";
import { getTeacherCourseStudents } from "../services/teacherCourses.service";

describe("criterio de asistencia en el frontend: la tardanza cuenta como media falta", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("usa el mismo peso que el backend y calcula las faltas equivalentes", () => {
    expect(PESO_TARDANZA).toBe(0.5);
    expect(faltasEquivalentes(2, 3)).toBe(3.5);
  });

  it("10 clases con 6 presentes, 1 justificada, 2 ausentes y 1 tardanza dan 75 %", () => {
    expect(porcentajeAsistencia(10, 2, 1)).toBe(75);
    expect(
      tasaAsistencia([
        { estado: "PRESENTE", count: 6 },
        { estado: "JUSTIFICADO", count: 1 },
        { estado: "AUSENTE", count: 2 },
        { estado: "TARDANZA", count: 1 },
      ])
    ).toBe(75);
  });

  it("sin registros no hay porcentaje", () => {
    expect(porcentajeAsistencia(0, 0, 0)).toBeNull();
    expect(tasaAsistencia([])).toBeNull();
    expect(tasaAsistencia(undefined)).toBeNull();
  });

  it("pantalla de asistencia del docente: las faltas del alumno suman 0,5 por tardanza y 1 por ausencia", async () => {
    apiMock.mockImplementation(async (ruta: string) => {
      if (ruta.endsWith("/inscriptos")) return { alumnos: [{ id: "a1", nombre: "Ana", email: "a@edu.ai" }] };
      return {
        asistencias: [
          { id: "1", alumno_id: "a1", materia_id: "m1", fecha_clase: "2026-10-01", estado: "PRESENTE" },
          { id: "2", alumno_id: "a1", materia_id: "m1", fecha_clase: "2026-10-08", estado: "TARDANZA" },
          { id: "3", alumno_id: "a1", materia_id: "m1", fecha_clase: "2026-10-15", estado: "TARDANZA" },
          { id: "4", alumno_id: "a1", materia_id: "m1", fecha_clase: "2026-10-22", estado: "AUSENTE" },
        ],
      };
    });

    const [ana] = await getAttendanceState("m1");

    expect(ana.total).toBe(4);
    expect(ana.absent).toBe(2); // 1 ausencia + 2 tardanzas × 0,5
  });

  it("Mis estudiantes: el porcentaje de cada alumno sigue el mismo criterio", async () => {
    apiMock.mockImplementation(async (ruta: string) => {
      if (ruta.includes("/calificaciones")) {
        return {
          categorias: [],
          periodos: [],
          alumnos: [
            { alumno_id: "a1", nombre: "Ana", email: "a@edu.ai", promedio: 8, sin_categoria: 0, por_categoria: {}, notas: [] },
            { alumno_id: "a2", nombre: "Beto", email: "b@edu.ai", promedio: 8, sin_categoria: 0, por_categoria: {}, notas: [] },
          ],
        };
      }
      return {
        asistencias: [
          { id: "1", alumno_id: "a1", materia_id: "m1", fecha_clase: "2026-10-01", estado: "PRESENTE" },
          { id: "2", alumno_id: "a1", materia_id: "m1", fecha_clase: "2026-10-08", estado: "TARDANZA" },
          { id: "3", alumno_id: "a1", materia_id: "m1", fecha_clase: "2026-10-15", estado: "JUSTIFICADO" },
          { id: "4", alumno_id: "a1", materia_id: "m1", fecha_clase: "2026-10-22", estado: "AUSENTE" },
        ],
      };
    });

    const filas = await getTeacherCourseStudents("m1");
    const ana = filas.find((f) => f.id === "a1")!;
    const beto = filas.find((f) => f.id === "a2")!;

    expect(ana.attendance).toBe("63%"); // (4 - 1,5) / 4 = 62,5 %
    expect(ana.attendanceValue).toBe(63);
    expect(beto.attendance).toBe("—"); // sin registros no se inventa 0 %
    expect(beto.attendanceValue).toBeNull();
  });
});
