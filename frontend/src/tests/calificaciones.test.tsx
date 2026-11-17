import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

const apiMock = vi.fn();
vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return { ...real, api: (...a: unknown[]) => apiMock(...a) };
});

import { CategoriasNotaEditor } from "../components/teacher/CategoriasNotaEditor";
import { TeacherGradesPage } from "../pages/teacher/TeacherGradesPage";
import { resumenPesos } from "../services/calificaciones.service";

describe("resumenPesos", () => {
  it("suma y marca correcto solo cuando cierra en 100", () => {
    expect(resumenPesos([30, 40, 30])).toEqual({ suma: 100, correcto: true });
    expect(resumenPesos([30, 40])).toEqual({ suma: 70, correcto: false });
    expect(resumenPesos([33.33, 33.33, 33.34])).toEqual({ suma: 100, correcto: true });
    expect(resumenPesos([Number.NaN, 100]).correcto).toBe(true);
  });
});

describe("editor de categorías", () => {
  const cats = [
    { id: "c1", nombre: "TP", peso: 40 },
    { id: "c2", nombre: "Parcial", peso: 60 },
  ];
  const montar = (categorias = cats) => {
    const onGuardar = vi.fn();
    render(<CategoriasNotaEditor categorias={categorias} guardando={false} error={null} onGuardar={onGuardar} />);
    return onGuardar;
  };

  it("no deja guardar si los pesos no suman 100 y lo dice", () => {
    montar();
    fireEvent.change(screen.getByLabelText("Peso de la categoría 1"), { target: { value: "30" } });

    expect(screen.getByText(/Suman 90%/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar categorías" })).toBeDisabled();
  });

  it("guarda con los ids de las existentes y sin id las nuevas", () => {
    const onGuardar = montar();
    fireEvent.change(screen.getByLabelText("Peso de la categoría 2"), { target: { value: "50" } });
    fireEvent.change(screen.getByLabelText("Peso de la categoría 1"), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Categoría" }));
    fireEvent.change(screen.getByLabelText("Nombre de la categoría 3"), { target: { value: "Final" } });
    fireEvent.change(screen.getByLabelText("Peso de la categoría 3"), { target: { value: "20" } });

    fireEvent.click(screen.getByRole("button", { name: "Guardar categorías" }));

    expect(onGuardar).toHaveBeenCalledWith([
      { id: "c1", nombre: "TP", peso: 30 },
      { id: "c2", nombre: "Parcial", peso: 50 },
      { id: undefined, nombre: "Final", peso: 20 },
    ]);
  });

  it("rechaza nombres repetidos", () => {
    montar();
    fireEvent.change(screen.getByLabelText("Nombre de la categoría 2"), { target: { value: "tp" } });

    expect(screen.getByText("Hay categorías con el mismo nombre.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar categorías" })).toBeDisabled();
  });

  it("repartir en partes iguales cierra siempre en 100", () => {
    montar([
      { id: "a", nombre: "A", peso: 1 },
      { id: "b", nombre: "B", peso: 1 },
      { id: "c", nombre: "C", peso: 1 },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Repartir en partes iguales" }));

    expect(screen.getByText(/Suman 100%/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar categorías" })).toBeEnabled();
  });

  it("quitar todas las categorías es válido: vuelve al promedio simple", () => {
    const onGuardar = montar([{ id: "c1", nombre: "TP", peso: 100 }]);
    fireEvent.click(screen.getByRole("button", { name: "Quitar la categoría TP" }));

    expect(screen.getByText(/Sin categorías: la nota final/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Guardar categorías" }));
    expect(onGuardar).toHaveBeenCalledWith([]);
  });
});

describe("pantalla de Calificaciones del docente", () => {
  const nota = (id: string, cat: string | null, valor: number, extra: Record<string, unknown> = {}) => ({
    id,
    alumno_id: "a1",
    periodo: "2026-1",
    evaluacion: "Parcial 1",
    categoria_id: cat,
    actividad_id: null,
    calificacion: valor,
    observaciones: null,
    ...extra,
  });

  const resumen = {
    categorias: [
      { id: "c1", nombre: "TP", peso: 40 },
      { id: "c2", nombre: "Parcial", peso: 60 },
    ],
    periodos: ["2026-1"],
    alumnos: [
      {
        alumno_id: "a1",
        nombre: "Ana",
        email: "ana@edu.ai",
        promedio: 7,
        sin_categoria: 1,
        por_categoria: { c1: 10, c2: 5 },
        notas: [
          nota("n1", "c1", 10, { evaluacion: "TP 1", actividad_id: "act1" }),
          nota("n2", "c2", 5),
          nota("n3", null, 1, { evaluacion: "Extra" }),
        ],
      },
      { alumno_id: "a2", nombre: "Beto", email: "beto@edu.ai", promedio: null, sin_categoria: 0, por_categoria: { c1: null, c2: null }, notas: [] },
    ],
  };

  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockImplementation(async (ruta: string, init?: { method?: string; body?: string }) => {
      if (ruta === "/api/materias/mias") {
        return { materias: [{ id: "m1", nombre: "Redes", nivel_educativo: "Terciario", inscriptos: 2 }] };
      }
      if (ruta.startsWith("/api/materias/m1/calificaciones/fuentes")) return { alumnos: [] };
      if (ruta.startsWith("/api/materias/m1/calificaciones")) return resumen;
      if (ruta === "/api/materias/m1/actividades") return { actividades: [] };
      if (ruta === "/api/materias/m1/notas" && init?.method === "POST") return { nota: {} };
      throw new Error(`ruta inesperada ${ruta}`);
    });
  });

  const montar = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <TeacherGradesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it("muestra una columna por categoría con su peso y la nota final ponderada", async () => {
    montar();

    await screen.findByText("Beto");
    const tabla = screen.getByRole("table", { name: "Tabla de calificaciones" });
    expect(within(tabla).getByText("TP (40%)")).toBeInTheDocument();
    expect(within(tabla).getByText("Parcial (60%)")).toBeInTheDocument();
    expect(within(tabla).getByText("Nota final")).toBeInTheDocument();

    const fila = within(tabla).getByText("Ana").closest("tr") as HTMLElement;
    expect(within(fila).getByText("7.00")).toBeInTheDocument(); // final
    expect(within(fila).getByText("10.00")).toBeInTheDocument();
    expect(within(fila).getByText("5.00")).toBeInTheDocument();
  });

  it("avisa de las notas sin categoría, que no cuentan en la nota final", async () => {
    montar();

    expect(await screen.findByText(/no cuentan en la nota final hasta que/)).toBeInTheDocument();
    expect(screen.getByText("1 sin categoría")).toBeInTheDocument();
  });

  it("un alumno sin notas muestra guiones, no ceros", async () => {
    montar();

    await screen.findByText("Beto");
    const tabla = screen.getByRole("table", { name: "Tabla de calificaciones" });
    const fila = within(tabla).getByText("Beto").closest("tr") as HTMLElement;
    expect(within(fila).getAllByText("—").length).toBeGreaterThanOrEqual(3);
    expect(within(fila).queryByText("0.00")).not.toBeInTheDocument();
  });

  it("desplegar las notas de un alumno muestra evaluación, categoría y de dónde viene", async () => {
    montar();

    fireEvent.click(await screen.findByRole("button", { name: "Ver notas (3)" }));

    expect(screen.getByText("TP 1")).toBeInTheDocument();
    expect(screen.getByText("(de una actividad)")).toBeInTheDocument();
    expect(screen.getByText("Sin categoría")).toBeInTheDocument();
  });

  it("al cargar una nota manda evaluación y categoría", async () => {
    montar();
    await screen.findByText("Beto");

    fireEvent.click(screen.getAllByRole("button", { name: "+ Nota" })[0]);
    fireEvent.change(screen.getByLabelText("Evaluación"), { target: { value: "Parcial 2" } });
    fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "c2" } });
    fireEvent.change(screen.getByLabelText("Nota (0-10)"), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar nota" }));

    await waitFor(() =>
      expect(apiMock).toHaveBeenCalledWith(
        "/api/materias/m1/notas",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    const llamada = apiMock.mock.calls.find((c) => c[0] === "/api/materias/m1/notas");
    expect(JSON.parse(llamada![1].body)).toMatchObject({
      alumno_id: "a1",
      evaluacion: "Parcial 2",
      categoria_id: "c2",
      calificacion: 8,
    });
  });
});
