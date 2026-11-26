import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return {
    ...real,
    api: async (ruta: string) => {
      if (ruta === "/api/materias/mias") return { materias: [] };
      return {};
    },
  };
});
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", name: "Pablo", lastName: "Profe", role: "PROFESOR" }, logout: vi.fn() }),
}));
vi.mock("../contexts/BrandingContext", () => ({ useBranding: () => ({ nombre: "IES", logoUrl: "" }) }));
vi.mock("../hooks/useNotificaciones", () => ({ useNoLeidasCount: () => ({ data: 0 }) }));

import { Sidebar } from "../components/layout/Sidebar";
import { TeacherGradesPage } from "../pages/teacher/TeacherGradesPage";

const montarPagina = (ruta: string, area?: "estudiantes" | "evaluaciones") => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[ruta]}>
        <Sidebar />
        <TeacherGradesPage area={area} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const activo = (nombre: string): boolean =>
  screen.getByRole("link", { name: nombre }).className.includes("bg-white/15");

describe("Calificaciones no cambia de menú según desde dónde se entra (7.4)", () => {
  it("desde Evaluaciones mantiene las pestañas y el ítem de Evaluaciones", () => {
    montarPagina("/teacher/activities/grades", "evaluaciones");

    expect(screen.getByRole("link", { name: "Actividades" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Correcciones" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Asistencia" })).not.toBeInTheDocument();
    expect(activo("Evaluaciones")).toBe(true);
    expect(activo("Mis estudiantes")).toBe(false);
  });

  it("desde Mis estudiantes mantiene sus pestañas y su ítem", () => {
    montarPagina("/teacher/grades");

    expect(screen.getByRole("link", { name: "Estudiantes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Asistencia" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Correcciones" })).not.toBeInTheDocument();
    expect(activo("Mis estudiantes")).toBe(true);
    expect(activo("Evaluaciones")).toBe(false);
  });

  it("la pestaña Calificaciones de cada área apunta a su propia ruta", () => {
    montarPagina("/teacher/activities/grades", "evaluaciones");
    const pestana = screen.getAllByRole("link", { name: "Calificaciones" })[0];

    expect(pestana).toHaveAttribute("href", "/teacher/activities/grades");
  });

  it("Correcciones y Asistencia también dejan activo el ítem de su área", () => {
    montarPagina("/teacher/corrections", "evaluaciones");
    expect(activo("Evaluaciones")).toBe(true);
  });
});
