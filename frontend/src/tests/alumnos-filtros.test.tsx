import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { filtrarYOrdenarAlumnos, FILTRO_INICIAL } from "../utils/alumnos";
import type { TeacherStudentRow } from "../types/domain";

const fila = (
  id: string,
  name: string,
  promedio: number | null,
  asistencia: number | null,
  legajo = `${id}@edu.ai`
): TeacherStudentRow => ({
  id,
  name,
  legajo,
  average: promedio === null ? "—" : promedio.toFixed(2),
  averageValue: promedio,
  attendance: asistencia === null ? "—" : `${asistencia}%`,
  attendanceValue: asistencia,
  standing: (promedio ?? 0) >= 7 ? "Regular" : "En riesgo",
});

const ALUMNOS = [
  fila("a", "Ana Pérez", 9, 100),
  fila("b", "Beto Álvarez", 5.5, 60),
  fila("c", "Carla Gómez", 7, 80),
  fila("d", "Dario Sin Notas", null, null),
  fila("e", "Elena Ñandú", 8.25, 90),
];
const nombres = (l: TeacherStudentRow[]) => l.map((a) => a.name);

describe("filtrarYOrdenarAlumnos", () => {
  it("por defecto ordena por nombre y no filtra a nadie", () => {
    expect(nombres(filtrarYOrdenarAlumnos(ALUMNOS, FILTRO_INICIAL))).toEqual([
      "Ana Pérez",
      "Beto Álvarez",
      "Carla Gómez",
      "Dario Sin Notas",
      "Elena Ñandú",
    ]);
  });

  it("promedio de mayor a menor, y quien no tiene notas queda último", () => {
    const r = filtrarYOrdenarAlumnos(ALUMNOS, { ...FILTRO_INICIAL, orden: "promedio-desc" });
    expect(nombres(r)).toEqual(["Ana Pérez", "Elena Ñandú", "Carla Gómez", "Beto Álvarez", "Dario Sin Notas"]);
  });

  it("promedio de menor a mayor, y quien no tiene notas sigue último", () => {
    const r = filtrarYOrdenarAlumnos(ALUMNOS, { ...FILTRO_INICIAL, orden: "promedio-asc" });
    expect(nombres(r)).toEqual(["Beto Álvarez", "Carla Gómez", "Elena Ñandú", "Ana Pérez", "Dario Sin Notas"]);
  });

  it("asistencia de mayor a menor y de menor a mayor", () => {
    expect(nombres(filtrarYOrdenarAlumnos(ALUMNOS, { ...FILTRO_INICIAL, orden: "asistencia-desc" }))).toEqual([
      "Ana Pérez",
      "Elena Ñandú",
      "Carla Gómez",
      "Beto Álvarez",
      "Dario Sin Notas",
    ]);
    expect(nombres(filtrarYOrdenarAlumnos(ALUMNOS, { ...FILTRO_INICIAL, orden: "asistencia-asc" }))).toEqual([
      "Beto Álvarez",
      "Carla Gómez",
      "Elena Ñandú",
      "Ana Pérez",
      "Dario Sin Notas",
    ]);
  });

  it("filtra por estado: Regular (promedio ≥ 7) y En riesgo", () => {
    expect(nombres(filtrarYOrdenarAlumnos(ALUMNOS, { ...FILTRO_INICIAL, estado: "Regular" }))).toEqual([
      "Ana Pérez",
      "Carla Gómez",
      "Elena Ñandú",
    ]);
    expect(nombres(filtrarYOrdenarAlumnos(ALUMNOS, { ...FILTRO_INICIAL, estado: "En riesgo" }))).toEqual([
      "Beto Álvarez",
      "Dario Sin Notas",
    ]);
  });

  it("busca por nombre o legajo sin distinguir acentos ni mayúsculas", () => {
    expect(nombres(filtrarYOrdenarAlumnos(ALUMNOS, { ...FILTRO_INICIAL, busqueda: "alvarez" }))).toEqual(["Beto Álvarez"]);
    expect(nombres(filtrarYOrdenarAlumnos(ALUMNOS, { ...FILTRO_INICIAL, busqueda: "NANDU" }))).toEqual(["Elena Ñandú"]);
    expect(nombres(filtrarYOrdenarAlumnos(ALUMNOS, { ...FILTRO_INICIAL, busqueda: "c@edu" }))).toEqual(["Carla Gómez"]);
  });

  it("combina filtro, búsqueda y orden, y no modifica la lista original", () => {
    const copia = [...ALUMNOS];
    const r = filtrarYOrdenarAlumnos(ALUMNOS, { estado: "Regular", busqueda: "e", orden: "promedio-desc" });

    expect(nombres(r)).toEqual(["Ana Pérez", "Elena Ñandú", "Carla Gómez"]);
    expect(ALUMNOS).toEqual(copia);
  });
});

const apiMock = vi.fn();
vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return { ...real, api: (...a: unknown[]) => apiMock(...a) };
});

vi.mock("../hooks/useTeacherCourses", () => ({
  useTeacherCourses: () => ({
    data: [{ id: "m1", label: "Redes", curso: "3.º A", name: "Redes", color: "#000" }],
  }),
  useTeacherCourseStudents: () => ({ data: ALUMNOS, isLoading: false }),
}));

import { TeacherStudentsPage } from "../pages/teacher/TeacherStudentsPage";

describe("Mis estudiantes: filtros en pantalla (7.5)", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  const montar = () =>
    render(
      <MemoryRouter>
        <TeacherStudentsPage />
      </MemoryRouter>,
    );
  const filasVisibles = () =>
    within(screen.getByRole("table", { name: "Listado de estudiantes" }))
      .getAllByRole("row")
      .slice(1)
      .map((r) => within(r).getAllByRole("cell")[0].textContent);

  it("ordena por promedio de mayor a menor desde el selector", () => {
    montar();

    fireEvent.change(screen.getByLabelText("Ordenar por"), { target: { value: "promedio-desc" } });

    expect(filasVisibles()).toEqual(["Ana Pérez", "Elena Ñandú", "Carla Gómez", "Beto Álvarez", "Dario Sin Notas"]);
  });

  it("filtra por estado, muestra el contador y permite quitar los filtros", () => {
    montar();

    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "En riesgo" } });

    expect(filasVisibles()).toEqual(["Beto Álvarez", "Dario Sin Notas"]);
    expect(screen.getByText(/2 de 5 alumnos/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quitar filtros" }));
    expect(filasVisibles()).toHaveLength(5);
  });

  it("si nada coincide lo dice, en vez de mostrar una tabla vacía", () => {
    montar();

    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "zzz" } });

    expect(screen.getByText("Ningún alumno coincide con los filtros.")).toBeInTheDocument();
  });
});
