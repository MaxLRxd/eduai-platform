/**
 * Prueba de humo de TODAS las páginas: monta la app real (rutas, guardas y layout) en cada ruta de
 * cada rol, con la red simulada, y verifica que la página aparece sin romperse.
 *
 * No prueba el comportamiento de cada pantalla (eso lo hacen los demás tests): detecta páginas que
 * explotan al renderizar, rutas mal cableadas y accesos que dejan de respetar el rol.
 */
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const usuarios = {
  ALUMNO: {
    id: "u-alu",
    username: "ana@edu.ai",
    name: "Ana",
    lastName: "Alumna",
    role: "ALUMNO",
  },
  PROFESOR: {
    id: "u-pro",
    username: "pablo@edu.ai",
    name: "Pablo",
    lastName: "Profe",
    role: "PROFESOR",
  },
  ADMIN: {
    id: "u-adm",
    username: "root@edu.ai",
    name: "Rita",
    lastName: "Admin",
    role: "ADMIN",
  },
} as const;

let rolActual: keyof typeof usuarios = "ALUMNO";
let haySesion = true;

vi.mock("../services/auth.service", () => ({
  meRequest: () =>
    haySesion
      ? Promise.resolve(usuarios[rolActual])
      : Promise.reject(new Error("sin sesión")),
  loginRequest: vi.fn(),
  logoutRequest: () => Promise.resolve(),
}));

import { App } from "../App";
import { AuthProvider } from "../contexts/AuthContext";
import { BrandingProvider } from "../contexts/BrandingContext";

const rutas: { rol: keyof typeof usuarios; ruta: string }[] = [
  ...[
    "",
    "/courses",
    "/courses/m1",
    "/assignments",
    "/progress",
    "/enroll",
    "/messages",
    "/profile",
  ].map((r) => ({ rol: "ALUMNO" as const, ruta: `/student${r}` })),
  ...[
    "",
    "/courses",
    "/students",
    "/students/a1",
    "/grades",
    "/attendance",
    "/activities",
    "/corrections",
    "/analytics",
    "/ai",
    "/planning",
    "/messages",
    "/content",
    "/profile",
  ].map((r) => ({ rol: "PROFESOR" as const, ruta: `/teacher${r}` })),
  ...[
    "",
    "/materias",
    "/claves",
    "/usuarios",
    "/licencias",
    "/reports",
    "/settings",
  ].map((r) => ({
    rol: "ADMIN" as const,
    ruta: `/admin${r}`,
  })),
  { rol: "ALUMNO", ruta: "/notificaciones" },
  { rol: "PROFESOR", ruta: "/notificaciones" },
  { rol: "ADMIN", ruta: "/notificaciones" },
];

const comun = { materias: 0, entregasPendientes: 0, alertasActivas: 0 };

/** Respuesta del "backend sin datos" para cada endpoint: objetos vacíos donde se espera un objeto. */
function respuestaVacia(url: string): unknown {
  if (url.includes("/api/dashboard/alumno")) {
    return {
      rol: "ALUMNO",
      periodos: [],
      periodo: null,
      resumen: { ...comun, promedioGlobal: 0, promedioPeriodoActual: null },
      materias: [],
      asistencia: [],
      proximasActividades: [],
    };
  }
  if (url.includes("/api/dashboard/profesor")) {
    return {
      rol: "PROFESOR",
      resumen: { ...comun, actividades: 0, alumnos: 0 },
      materias: [],
    };
  }
  if (url.endsWith("/api/dashboard")) {
    return {
      rol: "ADMIN",
      resumen: { ...comun, inscripciones: 0, usuarios: [] },
    };
  }
  if (url.includes("/metricas-exito")) {
    const sinDatos = {
      valor: null,
      objetivo: 1,
      cumple: null,
      detalle: "Sin datos",
    };
    return {
      ventana_dias: 30,
      uso_tutor: sinDatos,
      feedback_revisado: sinDatos,
      retencion_mensual: sinDatos,
      reduccion_tiempo_docente: sinDatos,
    };
  }
  if (url.includes("/no-leidas")) return { count: 0 };
  return [];
}

function Ruta(): React.ReactElement {
  return <span data-testid="ruta">{useLocation().pathname}</span>;
}

function montar(ruta: string): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ruta]}>
        <AuthProvider>
          <BrandingProvider>
            <App />
            <Ruta />
          </BrandingProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("prueba de humo: cada página carga sin romperse", () => {
  beforeEach(() => {
    haySesion = true;
    window.localStorage.clear();
    // El backend "no tiene datos": listas vacías.
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve(
          new Response(JSON.stringify(respuestaVacia(String(url))), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      ),
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each(rutas)("$rol en $ruta", async ({ rol, ruta }) => {
    rolActual = rol;
    window.localStorage.setItem("eduai.session", JSON.stringify(usuarios[rol]));

    montar(ruta);

    // La barra de la aplicación aparece solo si la ruta existe, el rol puede entrar y la página no explotó.
    await waitFor(() =>
      expect(screen.getAllByRole("heading").length).toBeGreaterThan(0),
    );
    expect(document.body.textContent?.trim().length).toBeGreaterThan(20);
  });

  it("un alumno que entra a una ruta de administración es redirigido a la suya", async () => {
    rolActual = "ALUMNO";
    window.localStorage.setItem(
      "eduai.session",
      JSON.stringify(usuarios.ALUMNO),
    );

    montar("/admin/usuarios");

    await waitFor(() =>
      expect(screen.getByTestId("ruta")).toHaveTextContent("/student"),
    );
    expect(screen.getByTestId("ruta").textContent).not.toContain("/admin");
  });

  it("sin sesión cualquier ruta lleva al login", async () => {
    haySesion = false;

    montar("/teacher/grades");

    await waitFor(() =>
      expect(screen.getByTestId("ruta")).toHaveTextContent("/login"),
    );
  });
});
