import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const navegar = vi.fn();

vi.mock("react-router-dom", async (original) => ({
  ...(await original<typeof import("react-router-dom")>()),
  useNavigate: () => navegar,
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { name: "Ana", role: "ALUMNO" } }),
}));

vi.mock("../hooks/useCourses", () => ({ useCourses: () => ({ data: [] }) }));

const datos = {
  rol: "ALUMNO" as const,
  periodos: ["2026-1"],
  periodo: null,
  resumen: { materias: 2, entregasPendientes: 0, alertasActivas: 0, promedioGlobal: 7, promedioPeriodoActual: 7 },
  materias: [
    {
      id: "m1",
      nombre: "Redes",
      promedio: 7.5,
      progreso: 40,
      total_notas: 7,
      notas: [
        { id: "n2", evaluacion: "TP Final", categoria: "Trabajo práctico", calificacion: 9, fecha: "2026-05-02T00:00:00.000Z" },
        { id: "n1", evaluacion: "Parcial 1", categoria: "Parcial", calificacion: 4, fecha: "2026-04-10T00:00:00.000Z" },
      ],
    },
    { id: "m2", nombre: "Bases de Datos", promedio: null, progreso: 0, total_notas: 0, notas: [] },
  ],
  asistencia: [],
  proximasActividades: [],
};

vi.mock("../hooks/useDashboard", () => ({
  useDashboard: () => ({ data: { rol: "ALUMNO", data: datos } }),
}));

import { StudentDashboardPage } from "../pages/student/StudentDashboardPage";

describe("dashboard del alumno: Mis notas por materia (6.4)", () => {
  const abrir = () =>
    render(
      <MemoryRouter>
        <StudentDashboardPage />
      </MemoryRouter>
    );

  it("muestra, por materia, el promedio y las últimas notas con su evaluación y categoría", () => {
    abrir();
    const seccion = screen.getByRole("region", { name: "Mis notas" });

    expect(within(seccion).getByText("Redes")).toBeInTheDocument();
    expect(within(seccion).getByText("7.5")).toBeInTheDocument();
    expect(within(seccion).getByText("TP Final")).toBeInTheDocument();
    expect(within(seccion).getByText(/Trabajo práctico/)).toBeInTheDocument();
    expect(within(seccion).getByText("Parcial 1")).toBeInTheDocument();
    expect(within(seccion).getByText("9")).toBeInTheDocument();
    expect(within(seccion).getByText("4")).toBeInTheDocument();
  });

  it("avisa cuántas se muestran cuando hay más de las que entran", () => {
    abrir();

    expect(screen.getByText("Mostrando las 2 más recientes de 7.")).toBeInTheDocument();
  });

  it("una materia sin notas muestra el estado vacío, sin inventar valores", () => {
    abrir();
    const seccion = screen.getByRole("region", { name: "Mis notas" });

    expect(within(seccion).getByText("Bases de Datos")).toBeInTheDocument();
    expect(within(seccion).getByText("Todavía no tenés notas en esta materia.")).toBeInTheDocument();
  });

  it("«Ver todas» lleva al detalle de calificaciones", () => {
    abrir();
    const seccion = screen.getByRole("region", { name: "Mis notas" });

    fireEvent.click(within(seccion).getByRole("button", { name: /Ver todas/ }));

    expect(navegar).toHaveBeenCalledWith("/student/progress");
  });
});
