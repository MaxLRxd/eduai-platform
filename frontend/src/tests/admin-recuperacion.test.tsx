import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminUser } from "../types/domain";

const recoveryMutateMock = vi.fn();
const usuarioBase: AdminUser = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Ana Pérez",
  email: "ana@edu.ai",
  role: "Alumno",
  status: "Activo",
};
let usuariosMock: AdminUser[] = [usuarioBase];

vi.mock("../hooks/useAdminUsers", () => ({
  useAdminUsers: () => ({ data: usuariosMock, isLoading: false }),
  useCreateAdminUser: () => ({ mutate: vi.fn(), isPending: false }),
  useSetAdminUserActive: () => ({ mutate: vi.fn(), isPending: false }),
  useChangeAdminUserRole: () => ({ mutate: vi.fn(), isPending: false }),
  useEmitirTokenRecuperacionAdmin: () => ({ mutate: recoveryMutateMock, isPending: false }),
}));

import { AdminUsuariosPage } from "../pages/admin/AdminUsuariosPage";

const enlace = "http://localhost:5173/restablecer?token=abcdef0123456789";
const expira_en = new Date(Date.now() + 60 * 60 * 1000).toISOString();

describe("admin: enlace de recuperación", () => {
  beforeEach(() => {
    usuariosMock = [usuarioBase];
    recoveryMutateMock.mockReset();
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("pide el enlace al backend y lo muestra una sola vez sin contraseñas", () => {
    render(<AdminUsuariosPage />);

    fireEvent.click(screen.getByRole("button", { name: "Generar enlace de recuperación para Ana Pérez" }));
    expect(recoveryMutateMock).toHaveBeenCalledWith(usuarioBase.id, expect.any(Object));

    act(() => {
      const onSuccess = recoveryMutateMock.mock.calls[0][1].onSuccess as (data: unknown) => void;
      onSuccess({ enlace, expira_en });
    });

    expect(screen.getByLabelText("Enlace de recuperación generado")).toHaveValue(enlace);
    expect(screen.getByText(/sirve una sola vez/)).toBeTruthy();
    expect(screen.queryByLabelText("Contraseña (mín. 8 caracteres)")).toBeNull();
  });

  it("copia el enlace al portapapeles", async () => {
    render(<AdminUsuariosPage />);
    fireEvent.click(screen.getByRole("button", { name: "Generar enlace de recuperación para Ana Pérez" }));
    act(() => {
      const onSuccess = recoveryMutateMock.mock.calls[0][1].onSuccess as (data: unknown) => void;
      onSuccess({ enlace, expira_en });
    });

    fireEvent.click(screen.getByRole("button", { name: "Copiar enlace" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(enlace);
    await waitFor(() => expect(screen.getByRole("button", { name: "Copiado" })).toBeTruthy());
  });

  it("muestra el enlace y un aviso si el portapapeles falla", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error("denegado"));
    render(<AdminUsuariosPage />);
    fireEvent.click(screen.getByRole("button", { name: "Generar enlace de recuperación para Ana Pérez" }));
    act(() => {
      const onSuccess = recoveryMutateMock.mock.calls[0][1].onSuccess as (data: unknown) => void;
      onSuccess({ enlace, expira_en });
    });

    fireEvent.click(screen.getByRole("button", { name: "Copiar enlace" }));

    await waitFor(() =>
      expect(screen.getByText("No se pudo copiar automáticamente. Copiá el enlace manualmente.")).toBeTruthy()
    );
    expect(screen.getByLabelText("Enlace de recuperación generado")).toHaveValue(enlace);
  });

  it("muestra el error del backend y permite cerrar", () => {
    render(<AdminUsuariosPage />);
    fireEvent.click(screen.getByRole("button", { name: "Generar enlace de recuperación para Ana Pérez" }));
    act(() => {
      const onError = recoveryMutateMock.mock.calls[0][1].onError as (error: unknown) => void;
      onError(new Error("No se pudo generar el enlace de recuperación."));
    });

    expect(screen.getByText("No se pudo generar el enlace de recuperación.")).toBeTruthy();
    const botonesCerrar = screen.getAllByRole("button", { name: "Cerrar" });
    fireEvent.click(botonesCerrar[botonesCerrar.length - 1]);
    expect(screen.queryByText("No se pudo generar el enlace de recuperación.")).toBeNull();
  });

  it("deshabilita la acción para usuarios inactivos", () => {
    usuariosMock = [{ ...usuarioBase, status: "Inactivo" }];
    render(<AdminUsuariosPage />);
    expect(screen.getByRole("button", { name: "Generar enlace de recuperación para Ana Pérez" })).toBeDisabled();
  });
});
