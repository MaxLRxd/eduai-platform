import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

const apiMock = vi.fn();
vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return { ...real, api: (...a: unknown[]) => apiMock(...a) };
});

import { TeacherAnalyticsPage } from "../pages/teacher/TeacherAnalyticsPage";
import { filtrosQuery, nivelComprension } from "../services/analytics.service";

const U1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const U2 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";

describe("helpers del dashboard", () => {
  it("nivelComprension: null es 'Sin evaluar', no 'Crítico'", () => {
    expect(nivelComprension(null)).toBe("Sin evaluar");
    expect(nivelComprension(95)).toBe("Dominado");
    expect(nivelComprension(0.7)).toBe("En proceso");
    expect(nivelComprension(30)).toBe("Crítico");
  });

  it("filtrosQuery arma solo los filtros con valor", () => {
    expect(filtrosQuery()).toBe("");
    expect(filtrosQuery({ periodo: "2026-2" })).toBe("?periodo=2026-2");
    expect(filtrosQuery({ periodo: "2026-1", seccionId: U1 })).toBe(`?periodo=2026-1&seccion_id=${U1}`);
    expect(filtrosQuery({ seccionId: "general" })).toBe("?seccion_id=general");
  });
});

describe("Analytics del docente: filtros y detalle por tema", () => {
  const comprension = [
    { seccion_id: U1, nivel_comprension: 90, total_consultas: 5, total_errores: 0 },
    { seccion_id: U2, nivel_comprension: null, total_consultas: 3, total_errores: 0 },
    { seccion_id: null, nivel_comprension: null, total_consultas: 1, total_errores: 0 },
  ];

  const pedidos = () => apiMock.mock.calls.map((c) => c[0] as string);

  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockImplementation(async (ruta: string) => {
      if (ruta === "/api/materias/mias") {
        return { materias: [{ id: "m1", nombre: "Redes", nivel_educativo: "Terciario", inscriptos: 3 }] };
      }
      if (ruta === "/api/materias/m1/secciones") {
        return { secciones: [{ id: U1, nombre: "Unidad 1", tipo: "TEORIA" }, { id: U2, nombre: "Unidad 2", tipo: "PRACTICA" }] };
      }
      if (ruta.startsWith("/api/materias/m1/analytics/comprension")) {
        return { comprension, periodos: ["2026-1", "2026-2"] };
      }
      if (ruta.startsWith("/api/materias/m1/analytics/riesgo")) return { alertas: [] };
      if (ruta.startsWith("/api/materias/m1/analytics/dudas")) {
        if (ruta.includes(`seccion_id=${U2}`)) {
          return {
            dudas: [
              { id: "d1", seccion_id: U2, tipo: "DUDA", descripcion: "¿Qué es un socket?", frecuencia: 4 },
              { id: "d2", seccion_id: U2, tipo: "ERROR", descripcion: "Confunde TCP con UDP", frecuencia: 7 },
            ],
          };
        }
        return { dudas: [] };
      }
      throw new Error(`ruta inesperada ${ruta}`);
    });
  });

  const montar = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <TeacherAnalyticsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it("ofrece los períodos y las unidades de la materia", async () => {
    montar();

    await screen.findByRole("option", { name: "2026-2" });
    const unidades = within(screen.getByLabelText("Unidad")).getAllByRole("option").map((o) => o.textContent);
    expect(unidades).toEqual(["Todas las unidades", "Unidad 1", "Unidad 2", "General (sin unidad)"]);
  });

  it("un tema sin medición aparece como 'Sin evaluar' con sus consultas, no como crítico", async () => {
    montar();

    const tema = await screen.findByRole("button", { name: /Unidad 2/ });
    expect(tema).toHaveTextContent("Sin evaluar · 3 consultas");
    expect(screen.queryByText(/Crítico ·/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /General \(sin unidad\)/ })).toBeInTheDocument();
  });

  it("al elegir un período vuelve a pedir los datos con ese filtro", async () => {
    montar();
    await screen.findByRole("option", { name: "2026-2" });

    fireEvent.change(screen.getByLabelText("Período"), { target: { value: "2026-2" } });

    await waitFor(() =>
      expect(pedidos()).toContain("/api/materias/m1/analytics/comprension?periodo=2026-2"),
    );
    expect(pedidos()).toContain("/api/materias/m1/analytics/dudas?periodo=2026-2");
  });

  it("al elegir una unidad filtra por esa unidad", async () => {
    montar();
    await screen.findByRole("option", { name: "Unidad 2" });

    fireEvent.change(screen.getByLabelText("Unidad"), { target: { value: U2 } });

    await waitFor(() => expect(pedidos()).toContain(`/api/materias/m1/analytics/comprension?seccion_id=${U2}`));
  });

  it("al tocar un tema muestra sus preguntas y errores concretos, con la frecuencia", async () => {
    montar();

    fireEvent.click(await screen.findByRole("button", { name: /Unidad 2/ }));

    const detalle = await screen.findByRole("region", { name: "Detalle del tema Unidad 2" });
    const filas = await within(detalle).findAllByRole("listitem");
    expect(filas.map((f) => f.textContent)).toEqual([
      "Confunde TCP con UDPError7×", // ordenado por frecuencia
      "¿Qué es un socket?Duda4×",
    ]);
    expect(within(detalle).getByText(/3 consultas al tutor/)).toBeInTheDocument();
    expect(pedidos()).toContain(`/api/materias/m1/analytics/dudas?seccion_id=${U2}`);
  });

  it("el detalle respeta el período elegido y se puede cerrar", async () => {
    montar();
    await screen.findByRole("option", { name: "2026-1" });
    fireEvent.change(screen.getByLabelText("Período"), { target: { value: "2026-1" } });

    fireEvent.click(await screen.findByRole("button", { name: /Unidad 2/ }));
    await screen.findByRole("region", { name: "Detalle del tema Unidad 2" });

    expect(pedidos()).toContain(`/api/materias/m1/analytics/dudas?periodo=2026-1&seccion_id=${U2}`);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("region", { name: "Detalle del tema Unidad 2" })).not.toBeInTheDocument();
  });

  it("un tema sin preguntas registradas lo dice", async () => {
    montar();

    fireEvent.click(await screen.findByRole("button", { name: /Unidad 1/ }));

    expect(await screen.findByText("Todavía no hay preguntas registradas para este tema.")).toBeInTheDocument();
  });
});
