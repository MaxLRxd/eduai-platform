import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const apiMock = vi.fn();
vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return { ...real, api: (...a: unknown[]) => apiMock(...a) };
});

import { AdminReportsPage } from "../pages/admin/AdminReportsPage";

const reporte = {
  type: "notas",
  title: "Notas y rendimiento",
  description: "d",
  headline: "Promedio 7,00",
  stats: [{ label: "Calificaciones cargadas", value: "6" }],
  footnote: "f",
};

function montar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AdminReportsPage />
    </QueryClientProvider>,
  );
}

describe("Reportes del admin: filtros por período y materia (6.2)", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    apiMock.mockReset();
    apiMock.mockImplementation(async (url: string) => {
      if (url.startsWith("/api/admin/materias")) {
        return { items: [{ id: "m1", nombre: "Redes", descripcion: null, nivel_educativo: "T", activa: true, inscriptos: 0, secciones: 0, profesores: [] }] };
      }
      if (url.includes("format=pdf")) return { filename: "reporte-notas.pdf", pdf: btoa("%PDF-1.4") };
      if (url.includes("/export")) return { filename: "reporte-notas.csv", csv: "x" };
      return { reports: [reporte] };
    });
  });

  it("sin filtros pide todos los reportes", async () => {
    montar();

    expect(await screen.findByText("Promedio 7,00")).toBeInTheDocument();
    expect(apiMock).toHaveBeenCalledWith("/api/admin/reports");
  });

  it("al elegir período y materia vuelve a pedir los reportes con esos filtros", async () => {
    montar();
    await screen.findByText("Promedio 7,00");
    await screen.findByRole("option", { name: "Redes" });

    fireEvent.change(screen.getByLabelText("Período"), { target: { value: `${new Date().getFullYear()}-1` } });
    fireEvent.change(screen.getByLabelText("Materia"), { target: { value: "m1" } });

    await waitFor(() =>
      expect(apiMock).toHaveBeenCalledWith(`/api/admin/reports?periodo=${new Date().getFullYear()}-1&materia_id=m1`),
    );
  });

  it("la exportación lleva los mismos filtros que la pantalla", async () => {
    montar();
    await screen.findByText("Promedio 7,00");
    await screen.findByRole("option", { name: "Redes" });
    fireEvent.change(screen.getByLabelText("Materia"), { target: { value: "m1" } });
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/api/admin/reports?materia_id=m1"));

    fireEvent.click(await screen.findByRole("button", { name: "Exportar PDF" }));

    await waitFor(() =>
      expect(apiMock).toHaveBeenCalledWith("/api/admin/reports/notas/export?format=pdf&materia_id=m1"),
    );
  });
});
