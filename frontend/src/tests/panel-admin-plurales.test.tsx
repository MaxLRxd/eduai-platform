import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../contexts/AuthContext", () => ({ useAuth: () => ({ user: { role: "ADMIN" } }) }));
vi.mock("../contexts/BrandingContext", () => ({ useBranding: () => ({ nombre: "IES" }) }));
vi.mock("../components/admin/SuccessMetricsCard", () => ({ SuccessMetricsCard: () => null }));
vi.mock("../components/teacher/TutorLatencyCard", () => ({ TutorLatencyCard: () => null }));
vi.mock("../hooks/useDashboard", () => ({
  useDashboard: () => ({
    data: {
      rol: "ADMIN",
      data: {
        resumen: {
          materias: 3,
          inscripciones: 10,
          entregasPendientes: 0,
          alertasActivas: 0,
          usuarios: [
            { rol: "ALUMNO", count: 16 },
            { rol: "PROFESOR", count: 3 },
            { rol: "ADMIN", count: 1 },
          ],
        },
      },
    },
  }),
}));

import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";

describe("panel del administrador: plurales de los roles (7.1)", () => {
  it("escribe Alumnos, Profesores y Administradores, no «profesors» ni «admins»", () => {
    render(<AdminDashboardPage />);

    expect(screen.getAllByText("Alumnos").length).toBeGreaterThan(0);
    expect(screen.getByText("Profesores")).toBeInTheDocument();
    expect(screen.getByText("Administradores")).toBeInTheDocument();
    expect(screen.queryByText(/profesors|admins\b/i)).not.toBeInTheDocument();
  });
});
