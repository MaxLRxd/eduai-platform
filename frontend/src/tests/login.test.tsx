import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { AuthProvider } from "../contexts/AuthContext";

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: "Credenciales incorrectas" }),
    } as unknown as Response);
  });

  it("renders the login form with role tabs", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );
    expect(screen.getByText("EduAI")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Alumno" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Docente" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Admin" })).toBeInTheDocument();
  });

  it("shows an error on wrong credentials", async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alumno@real.edu" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByText(/Credenciales incorrectas/)).toBeInTheDocument();
  });
});
