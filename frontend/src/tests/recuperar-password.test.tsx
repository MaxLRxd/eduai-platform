import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const forgotMock = vi.fn();
const resetMock = vi.fn();

vi.mock("../services/auth.service", () => ({
  forgotPasswordRequest: (...a: unknown[]) => forgotMock(...a),
  resetPasswordRequest: (...a: unknown[]) => resetMock(...a),
}));

vi.mock("../contexts/BrandingContext", () => ({ useBranding: () => ({ nombre: "EduAI" }) }));

import { ApiError } from "../services/api";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";

function enRuta(ruta: string): void {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/recuperar" element={<ForgotPasswordPage />} />
        <Route path="/restablecer" element={<ResetPasswordPage />} />
        <Route path="/login" element={<p>pantalla de login</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("pedir el enlace de recuperación", () => {
  beforeEach(() => {
    forgotMock.mockReset().mockResolvedValue(undefined);
  });

  it("pide el enlace con el email y muestra el mismo aviso genérico", async () => {
    enRuta("/recuperar");

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: " ana@edu.ai " } });
    fireEvent.click(screen.getByRole("button", { name: "Enviarme el enlace" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/Si el email corresponde a una cuenta/));
    expect(forgotMock).toHaveBeenCalledWith("ana@edu.ai");
  });

  it("no envía el pedido con el email vacío", () => {
    enRuta("/recuperar");

    fireEvent.click(screen.getByRole("button", { name: "Enviarme el enlace" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Ingresá tu email");
    expect(forgotMock).not.toHaveBeenCalled();
  });

  it("muestra el error si el servidor rechaza el pedido (por ejemplo, demasiados intentos)", async () => {
    forgotMock.mockRejectedValue(new ApiError(429, JSON.stringify({ error: "Demasiados intentos" })));
    enRuta("/recuperar");

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ana@edu.ai" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviarme el enlace" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Demasiados intentos"));
  });
});

describe("elegir la contraseña nueva con el enlace", () => {
  beforeEach(() => {
    resetMock.mockReset().mockResolvedValue(undefined);
  });

  const completar = (clave: string, repetida = clave): void => {
    fireEvent.change(screen.getByLabelText("Contraseña nueva"), { target: { value: clave } });
    fireEvent.change(screen.getByLabelText("Repetí la contraseña"), { target: { value: repetida } });
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
  };

  it("envía el token del enlace con la contraseña nueva y avisa que cerró las sesiones", async () => {
    enRuta("/restablecer?token=abc123token");

    completar("NuevaClave2026");

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/cerramos tus sesiones/));
    expect(resetMock).toHaveBeenCalledWith("abc123token", "NuevaClave2026");
  });

  it("no envía si la contraseña es corta o la confirmación no coincide", () => {
    enRuta("/restablecer?token=abc123token");

    completar("corta");
    expect(screen.getByRole("alert")).toHaveTextContent("al menos 8 caracteres");

    completar("NuevaClave2026", "OtraDistinta1");
    expect(screen.getByRole("alert")).toHaveTextContent("no coincide");
    expect(resetMock).not.toHaveBeenCalled();
  });

  it("con un enlace vencido o usado ofrece pedir otro", async () => {
    resetMock.mockRejectedValue(new ApiError(400, JSON.stringify({ error: "El enlace no es válido o ya venció. Pedí uno nuevo." })));
    enRuta("/restablecer?token=abc123token");

    completar("NuevaClave2026");

    await waitFor(() => expect(screen.getByRole("link", { name: "Pedir otro enlace" })).toHaveAttribute("href", "/recuperar"));
  });

  it("sin token en la dirección no muestra el formulario y manda a pedir un enlace", () => {
    enRuta("/restablecer");

    expect(screen.queryByLabelText("Contraseña nueva")).toBeNull();
    expect(screen.getByRole("link", { name: "Pedir un enlace nuevo" })).toBeInTheDocument();
  });
});
