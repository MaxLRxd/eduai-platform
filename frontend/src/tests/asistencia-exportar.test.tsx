import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

const apiMock = vi.fn();
vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return { ...real, api: (...a: unknown[]) => apiMock(...a) };
});
const descargarMock = vi.fn();
vi.mock("../utils/descargarCsv", () => ({ descargarCsv: (...a: unknown[]) => descargarMock(...a) }));

import { TeacherAttendancePage } from "../pages/teacher/TeacherAttendancePage";

describe("Asistencia del docente: exportar (7.6)", () => {
  beforeEach(() => {
    apiMock.mockReset();
    descargarMock.mockReset();
    apiMock.mockImplementation(async (ruta: string) => {
      if (ruta === "/api/materias/mias") {
        return { materias: [{ id: "m1", nombre: "Redes", nivel_educativo: "Terciario", inscriptos: 0 }] };
      }
      if (ruta.endsWith("/asistencias/export")) return { filename: "asistencia-redes.csv", csv: "\uFEFF\"Alumno\"" };
      return { alumnos: [], asistencias: [], inscripciones: [], items: [] };
    });
  });

  const montar = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <TeacherAttendancePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it("el botón pide el archivo de la materia elegida y lo descarga", async () => {
    montar();

    const boton = await screen.findByRole("button", { name: "Exportar CSV (Excel)" });
    await waitFor(() => expect(boton).toBeEnabled());
    fireEvent.click(boton);

    await waitFor(() => expect(descargarMock).toHaveBeenCalledWith({ filename: "asistencia-redes.csv", csv: "\uFEFF\"Alumno\"" }));
    expect(apiMock).toHaveBeenCalledWith("/api/materias/m1/asistencias/export");
    expect(await screen.findByText("✅ Archivo descargado")).toBeInTheDocument();
  });

  it("si el backend rechaza (sin registros) muestra el motivo y no descarga nada", async () => {
    const real = apiMock.getMockImplementation()!;
    apiMock.mockImplementation(async (ruta: string) => {
      if (ruta.endsWith("/asistencias/export")) throw new Error("Todavía no hay asistencia registrada para exportar");
      return real(ruta);
    });
    montar();

    const boton = await screen.findByRole("button", { name: "Exportar CSV (Excel)" });
    await waitFor(() => expect(boton).toBeEnabled());
    fireEvent.click(boton);

    expect(await screen.findByText(/no hay asistencia registrada/i)).toBeInTheDocument();
    expect(descargarMock).not.toHaveBeenCalled();
  });
});
