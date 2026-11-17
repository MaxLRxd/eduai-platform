import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const apiMock = vi.fn();
vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return { ...real, api: (...a: unknown[]) => apiMock(...a) };
});

import { AdminLicenciasPage } from "../pages/admin/AdminLicenciasPage";

const estado = (current: number, plan: string, range: string) => ({
  uso: { current, limit: 500 },
  planes: [
    { name: "Starter", range: "≤ 100 MAU", features: "a", current: plan === "Starter" },
    { name: "Scale", range: "501 – 2K MAU", features: "b", current: plan === "Scale" },
    { name: plan, range, features: "c", current: true },
  ].filter((p, i, a) => a.findIndex((x) => x.name === p.name) === i),
});

function montar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AdminLicenciasPage />
    </QueryClientProvider>,
  );
}

describe("Licencias del admin", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("muestra el plan que informa el servidor, no uno fijo", async () => {
    apiMock.mockResolvedValue(estado(50, "Starter", "≤ 100 MAU"));
    montar();

    await waitFor(() => expect(screen.getByText(/Plan actual:/).textContent).toContain("Starter"));
    expect(screen.getByText(/Plan actual:/).textContent).not.toContain("Growth");
  });

  it("si falla la carga lo avisa y no inventa datos", async () => {
    apiMock.mockRejectedValue(new Error("boom"));
    montar();

    expect(await screen.findByText(/boom/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(screen.queryByText(/de capacidad/)).not.toBeInTheDocument();
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
  });

  it("nunca muestra disponibles negativos ni más de 100%", async () => {
    apiMock.mockResolvedValue({ uso: { current: 600, limit: 500 }, planes: [] });
    montar();

    await waitFor(() => expect(screen.getByText(/^0\s*disponibles$/)).toBeInTheDocument());
    expect(screen.getByText(/100\.0% de capacidad/)).toBeInTheDocument();
  });
});
