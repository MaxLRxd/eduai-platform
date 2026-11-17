import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

const apiMock = vi.fn();
vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return { ...real, api: (...a: unknown[]) => apiMock(...a) };
});

import { StudentAssignmentsPage } from "../pages/student/StudentAssignmentsPage";
import { StudentProgressPage } from "../pages/student/StudentProgressPage";

function montar(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

const actividad = (id: string, nombre: string, estado: "PENDIENTE" | "ENVIADA" | "PUBLICADA", nota: number | null) => ({
  id,
  nombre,
  consigna: "consigna",
  tipo: "DESARROLLO",
  opciones_mc: null,
  formatos_permitidos: null,
  fecha_limite: "2026-12-10T12:00:00Z",
  seccion: null,
  rubrica: null,
  estado_entrega: estado,
  mi_entrega:
    estado === "PENDIENTE"
      ? null
      : {
          id: `e-${id}`,
          respuesta_texto: "x",
          respuesta_codigo: null,
          archivo_url: null,
          archivo_nombre: null,
          entregado_en: "2026-11-01T10:00:00Z",
          publicado: estado === "PUBLICADA",
          calificacion_final: nota,
          feedback_final: null,
        },
});

describe("Entregas del alumno: columna Nota", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockImplementation(async (ruta: string) => {
      if (ruta === "/api/materias/mias") return { materias: [{ id: "m1", nombre: "Redes" }] };
      if (ruta === "/api/materias/m1/actividades") {
        return {
          actividades: [
            actividad("a1", "TP 1", "PUBLICADA", 8.5),
            actividad("a2", "TP 2", "ENVIADA", null),
            actividad("a3", "TP 3", "PENDIENTE", null),
            actividad("a4", "TP 4", "PUBLICADA", 4),
          ],
        };
      }
      throw new Error(`ruta inesperada ${ruta}`);
    });
  });

  it("las columnas quedan: Actividad, Curso, Vencimiento, Estado, Acciones, Nota", async () => {
    montar(<StudentAssignmentsPage />);
    await screen.findByText("TP 1");

    const encabezados = within(screen.getByRole("table", { name: "Tabla de entregas" }))
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(encabezados).toEqual(["Actividad", "Curso", "Vencimiento", "Estado", "Acciones", "Nota"]);
  });

  it("muestra la nota de las correcciones publicadas, con coma decimal", async () => {
    montar(<StudentAssignmentsPage />);
    await screen.findByText("TP 1");

    const fila = (nombre: string) => screen.getByText(nombre).closest("tr") as HTMLElement;
    const ultimaCelda = (tr: HTMLElement) => within(tr).getAllByRole("cell").at(-1) as HTMLElement;

    expect(ultimaCelda(fila("TP 1")).textContent).toBe("8,50");
    expect(ultimaCelda(fila("TP 4")).textContent).toBe("4,00");
  });

  it("si está en revisión o pendiente no muestra nota, solo un guion", async () => {
    montar(<StudentAssignmentsPage />);
    await screen.findByText("TP 1");

    for (const nombre of ["TP 2", "TP 3"]) {
      const celdas = within(screen.getByText(nombre).closest("tr") as HTMLElement).getAllByRole("cell");
      expect(celdas.at(-1)?.textContent).toBe("—");
    }
  });

  it("la nota ya no se mezcla con el estado", async () => {
    montar(<StudentAssignmentsPage />);
    await screen.findByText("TP 1");

    const celdas = within(screen.getByText("TP 1").closest("tr") as HTMLElement).getAllByRole("cell");
    expect(celdas[3].textContent).toBe("Entregado");
  });
});

describe("Mis estadísticas: cómo se arma la nota", () => {
  const progreso = (categorias: unknown[], sinCategoria = 0) => ({
    periodos: ["2026-1"],
    periodo: null,
    resumen: [
      { materia_id: "m1", materia: "Redes", promedio: 7.1, asistencia: 90, categorias, sin_categoria: sinCategoria },
    ],
    promedio_general: 7.1,
    mejor_nota: 10,
    actividades: { entregadas: 1, total: 2 },
    asistencia_global: 90,
    detalle: [
      { evaluacion: "TP 1", categoria: "TP", materia: "Redes", periodo: "2026-1", fecha: "2026-05-01", nota: 10 },
      { evaluacion: "Extra", categoria: null, materia: "Redes", periodo: "2026-1", fecha: "2026-05-02", nota: 3 },
    ],
    asistencia: [],
  });

  const cats = [
    { id: "c1", nombre: "TP", peso: 30, promedio: 10 },
    { id: "c2", nombre: "Parcial", peso: 40, promedio: 5 },
    { id: "c3", nombre: "Final", peso: 30, promedio: null },
  ];

  const cargar = (datos: unknown) => {
    apiMock.mockReset();
    apiMock.mockResolvedValue(datos);
  };

  it("lista las categorías de la materia con su peso y el promedio del alumno", async () => {
    cargar(progreso(cats));
    montar(<StudentProgressPage />);

    const lista = await screen.findByRole("list", { name: "Categorías de Redes" });
    const items = within(lista).getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toEqual(["TP · vale 30%10,00", "Parcial · vale 40%5,00", "Final · vale 30%sin notas"]);
  });

  it("explica que una categoría sin notas no resta", async () => {
    cargar(progreso(cats));
    montar(<StudentProgressPage />);

    expect(await screen.findByText(/Las categorías sin notas todavía no te restan/)).toBeInTheDocument();
  });

  it("avisa de las notas sin categoría", async () => {
    cargar(progreso(cats, 1));
    montar(<StudentProgressPage />);

    expect(await screen.findByText(/1 nota sin categoría no cuenta todavía/)).toBeInTheDocument();
  });

  it("si la materia no tiene categorías no muestra el desglose", async () => {
    cargar(progreso([]));
    montar(<StudentProgressPage />);

    await screen.findByText("Extra");
    expect(screen.queryByText("Cómo se arma tu nota")).not.toBeInTheDocument();
  });

  it("el detalle muestra la categoría de cada nota", async () => {
    cargar(progreso(cats));
    montar(<StudentProgressPage />);

    await screen.findByText("Extra");
    const fila = (nombre: string) => screen.getAllByText(nombre).map((e) => e.closest("tr")).find(Boolean) as HTMLElement;

    expect(within(fila("TP 1")).getByText("TP", { selector: "td" })).toBeInTheDocument();
    expect(within(fila("Extra")).getByText("—")).toBeInTheDocument();
  });
});
