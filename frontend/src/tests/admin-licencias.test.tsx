import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const apiMock = vi.fn();
vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return { ...real, api: (...a: unknown[]) => apiMock(...a) };
});

import { AdminLicenciasPage } from "../pages/admin/AdminLicenciasPage";

const estado = (alumnos: number) => ({
  licencia: {
    nombre: "EduAI — Licencia institucional",
    tipo: "UNICA",
    estado: "ACTIVA",
    incluye: ["Campus virtual", "Tutor IA"],
  },
  uso: { alumnos, docentes: 5, materias: 4 },
});

function montar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AdminLicenciasPage />
    </QueryClientProvider>,
  );
}

describe("Licencia del admin (única, sin importar la cantidad de alumnos)", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("muestra la licencia única, que incluye y el uso informativo", async () => {
    apiMock.mockResolvedValue(estado(16));
    montar();

    expect(await screen.findByText("EduAI — Licencia institucional")).toBeInTheDocument();
    expect(screen.getByText("Campus virtual")).toBeInTheDocument();
    expect(screen.getByText("Tutor IA")).toBeInTheDocument();
    expect(screen.getByText("Alumnos activos").nextSibling).toHaveTextContent("16");
    expect(apiMock).toHaveBeenCalledWith("/api/admin/license");
  });

  it("con 12.000 alumnos es la misma licencia: sin planes, topes ni barra de capacidad", async () => {
    apiMock.mockResolvedValue(estado(12000));
    montar();

    await waitFor(() => expect(screen.getByText("Alumnos activos").nextSibling).toHaveTextContent("12000"));
    expect(screen.queryByText(/MAU|Starter|Growth|Enterprise|de capacidad|Planes disponibles/i)).not.toBeInTheDocument();
    expect(screen.getByText(/no hay topes ni cobro por alumno/i)).toBeInTheDocument();
  });

  it("si falla la carga lo avisa y no inventa datos", async () => {
    apiMock.mockRejectedValue(new Error("boom"));
    montar();

    expect(await screen.findByText(/boom/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
  });
});
