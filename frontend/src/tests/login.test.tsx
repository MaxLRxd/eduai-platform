import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { AuthProvider } from "../contexts/AuthContext";
import { loginRequest, meRequest } from "../services/auth.service";

vi.mock("../services/auth.service", () => ({
  loginRequest: vi.fn(),
  meRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));

const mockLogin = vi.mocked(loginRequest);
const mockMe = vi.mocked(meRequest);

function renderLoginPage(): void {
  render(
    <AuthProvider>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMe.mockRejectedValue(new Error("no session"));
    mockLogin.mockRejectedValue(new Error("invalid credentials"));
  });

  it("renders the login form", async () => {
    renderLoginPage();

    expect(await screen.findByText("EduAI")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeInTheDocument();
  });

  it("asks for email and password before calling the api", async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByText(/Completá email y contraseña/)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("shows an error on wrong credentials", async () => {
    renderLoginPage();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alumno1@ies.edu" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByText(/Credenciales incorrectas/)).toBeInTheDocument();
    expect(mockLogin).toHaveBeenCalledWith("alumno1@ies.edu", "wrong-password");
  });
});
