import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";

const meMock = vi.fn();
const loginMock = vi.fn();
const logoutMock = vi.fn();
const apiMock = vi.fn();

vi.mock("../services/auth.service", () => ({
  meRequest: (...a: unknown[]) => meMock(...a),
  loginRequest: (...a: unknown[]) => loginMock(...a),
  logoutRequest: (...a: unknown[]) => logoutMock(...a),
}));

vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return { ...real, api: (...a: unknown[]) => apiMock(...a) };
});

import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { queryClient } from "../queryClient";

const ana = { id: "a", username: "ana@edu.ai", name: "Ana", lastName: "A", role: "ALUMNO" as const };
const beto = { id: "b", username: "beto@edu.ai", name: "Beto", lastName: "B", role: "ALUMNO" as const };

let auth!: ReturnType<typeof useAuth>;
function Espia(): null {
  auth = useAuth();
  return null;
}

describe("cambio de usuario en el mismo navegador", () => {
  beforeEach(() => {
    window.localStorage.clear();
    queryClient.clear();
    meMock.mockReset().mockResolvedValue(ana);
    loginMock.mockReset();
    logoutMock.mockReset().mockResolvedValue(undefined);
    apiMock.mockReset();
  });

  const montar = async (): Promise<void> => {
    render(
      <AuthProvider>
        <Espia />
        <span>listo</span>
      </AuthProvider>,
    );
    await waitFor(() => expect(auth.isAuthenticating).toBe(false));
  };

  it("al cerrar sesión se vacía la caché de consultas y la última conversación del tutor", async () => {
    await montar();
    queryClient.setQueryData(["dashboard"], { promedio: 9 });
    window.localStorage.setItem("tutor:ultima-sesion:m1", "sesion-de-ana");

    await act(async () => {
      await auth.logout();
    });

    expect(queryClient.getQueryData(["dashboard"])).toBeUndefined();
    expect(window.localStorage.getItem("tutor:ultima-sesion:m1")).toBeNull();
  });

  it("si entra otro usuario no ve los datos del anterior", async () => {
    await montar();
    queryClient.setQueryData(["dashboard"], { promedio: 9 });
    loginMock.mockResolvedValue(beto);

    await act(async () => {
      await auth.login("beto@edu.ai", "x");
    });

    expect(auth.user?.id).toBe("b");
    expect(queryClient.getQueryData(["dashboard"])).toBeUndefined();
  });

  it("si es el mismo usuario (por ejemplo al restaurar la sesión) no borra nada", async () => {
    await montar();
    queryClient.setQueryData(["dashboard"], { promedio: 9 });
    loginMock.mockResolvedValue(ana);

    await act(async () => {
      await auth.login("ana@edu.ai", "x");
    });

    expect(queryClient.getQueryData(["dashboard"])).toEqual({ promedio: 9 });
    expect(screen.getByText("listo")).toBeInTheDocument();
  });
});
