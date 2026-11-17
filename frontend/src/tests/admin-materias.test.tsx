import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const saveMock = vi.fn();

const subject = {
  id: "m1",
  nombre: "Redes",
  descripcion: "Introducción a redes",
  nivelEducativo: "Terciario",
  profesor: "",
  alumnos: 0,
  estado: "Activa" as const,
};

vi.mock("../hooks/useAdminSubjects", () => ({
  useAdminSubjects: () => ({ data: [subject], isLoading: false }),
  useSaveAdminSubject: () => ({ mutate: saveMock, isPending: false }),
  useAssignAdminProfessor: () => ({ mutate: vi.fn(), isPending: false }),
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
