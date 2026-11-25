import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const saveMock = vi.fn();
const unassignMock = vi.fn();

const subject = {
  id: "m1",
  nombre: "Redes",
  descripcion: "Introducción a redes",
  nivelEducativo: "Terciario",
  profesor: "Ana Pérez",
  profesores: [{ profesorId: "p1", nombre: "Ana Pérez" }],
  alumnos: 0,
  estado: "Activa" as const,
};

vi.mock("../hooks/useAdminSubjects", () => ({
  useAdminSubjects: () => ({ data: [subject], isLoading: false }),
  useSaveAdminSubject: () => ({ mutate: saveMock, isPending: false }),
  useAssignAdminProfessor: () => ({ mutate: vi.fn(), isPending: false }),
  useUnassignAdminProfessor: () => ({ mutate: unassignMock, isPending: false }),
}));

vi.mock("../hooks/useAdminUsers", () => ({
  useAdminProfessors: () => ({ data: [] }),
}));

import { AdminMateriasPage } from "../pages/admin/AdminMateriasPage";

describe("admin: editar materia", () => {
  beforeEach(() => {
    saveMock.mockReset();
  });

  it("carga descripción y nivel educativo en el formulario al editar", () => {
    render(<AdminMateriasPage />);

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    expect(screen.getByLabelText("Nivel educativo")).toHaveValue("Terciario");
    expect(screen.getByLabelText(/Descripción/)).toHaveValue("Introducción a redes");
  });

  it("envía descripción y nivel educativo al guardar sin borrar la descripción", () => {
    render(<AdminMateriasPage />);

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "m1",
        nombre: "Redes",
        descripcion: "Introducción a redes",
        nivelEducativo: "Terciario",
      }),
      expect.any(Object)
    );
  });
});

describe("admin: quitar un docente de una materia (6.3)", () => {
  beforeEach(() => {
    unassignMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pide confirmación y, si se acepta, llama a la API con la materia y el docente", () => {
    const confirmar = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminMateriasPage />);

    fireEvent.click(screen.getByRole("button", { name: "Quitar a Ana Pérez de Redes" }));

    expect(confirmar).toHaveBeenCalledWith(expect.stringContaining("su usuario y su historial se conservan"));
    expect(unassignMock).toHaveBeenCalledWith({ materiaId: "m1", profesorId: "p1" }, expect.any(Object));
  });

  it("si se cancela la confirmación no se quita a nadie", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<AdminMateriasPage />);

    fireEvent.click(screen.getByRole("button", { name: "Quitar a Ana Pérez de Redes" }));

    expect(unassignMock).not.toHaveBeenCalled();
  });
});
