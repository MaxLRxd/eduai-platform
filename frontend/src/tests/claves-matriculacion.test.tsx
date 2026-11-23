import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  revoke: vi.fn(),
}));

const subjects = [
  {
    id: "m1",
    nombre: "Redes",
    descripcion: "Introducción a redes",
    nivelEducativo: "Terciario",
    profesor: "",
    alumnos: 0,
    estado: "Activa" as const,
  },
  {
    id: "m2",
    nombre: "Física",
    descripcion: null,
    nivelEducativo: "Secundario",
    profesor: "",
    alumnos: 0,
    estado: "Inactiva" as const,
  },
];

const keys = [
  {
    id: "k1",
    materiaId: "m1",
    materiaNombre: "Redes",
    codigo: "REDES2026",
    estado: "activa" as const,
    vencimiento: "2026-12-31",
    maxUsos: 10,
    usos: 2,
    inscriptos: ["Ana", "Luis"],
  },
  {
    id: "k2",
    materiaId: "m1",
    materiaNombre: "Redes",
    codigo: "REDESANT",
    estado: "revocada" as const,
    vencimiento: null,
    maxUsos: null,
    usos: 1,
    inscriptos: [],
  },
];

vi.mock("../hooks/useAdminSubjects", () => ({
  useAdminSubjects: () => ({ data: subjects, isLoading: false }),
}));

vi.mock("../hooks/useAdminKeys", () => ({
  useAdminKeys: () => ({ data: keys, isLoading: false }),
  useGenerateAdminKey: () => ({ mutate: mocks.generate, isPending: false }),
  useRevokeAdminKey: () => ({ mutate: mocks.revoke, isPending: false }),
}));

import { AdminClavesPage } from "../pages/admin/AdminClavesPage";

describe("claves de matriculación", () => {
  beforeEach(() => {
    mocks.generate.mockReset();
    mocks.revoke.mockReset();
  });

  it("no genera una clave sin materia seleccionada", () => {
    render(<AdminClavesPage />);

    fireEvent.click(screen.getByRole("button", { name: "Generar clave" }));

    expect(screen.getByText("Seleccioná una materia para generar la clave.")).toBeTruthy();
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("genera la clave con los parámetros del formulario y muestra la confirmación", () => {
    render(<AdminClavesPage />);

    fireEvent.change(screen.getByLabelText("Materia"), { target: { value: "m1" } });
    fireEvent.change(screen.getByLabelText(/Fecha de vencimiento/), { target: { value: "2026-12-31" } });
    fireEvent.change(screen.getByLabelText(/Cantidad máxima de usos/), { target: { value: "15" } });
    fireEvent.click(screen.getByRole("button", { name: "Generar clave" }));

    expect(mocks.generate).toHaveBeenCalledWith(
      { materiaId: "m1", materiaNombre: "Redes", vencimiento: "2026-12-31", maxUsos: 15 },
      expect.any(Object)
    );

    const onSuccess = mocks.generate.mock.calls[0][1].onSuccess;
    act(() => onSuccess({ codigo: "REDESNUEVA" }));
    expect(screen.getByText('✅ Clave "REDESNUEVA" generada para Redes.')).toBeTruthy();
  });

  it("revoca una clave activa", () => {
    render(<AdminClavesPage />);

    fireEvent.click(screen.getByRole("button", { name: "Revocar" }));

    expect(mocks.revoke).toHaveBeenCalledWith("k1");
  });
});
