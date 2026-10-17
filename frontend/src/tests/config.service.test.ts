import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/api", () => ({ api: vi.fn() }));

import { api } from "../services/api";
import { getConfigBranding, toBranding } from "../services/config.service";

const mockApi = vi.mocked(api);

describe("config.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mapea la respuesta snake_case del backend a camelCase", () => {
    const branding = toBranding({
      nombre: "Instituto 9 de Julio",
      logo_url: "https://cdn.edu/logo.png",
      color_primario: "#123456",
      color_secundario: "#654321",
      color_claro: "#abcdef",
    });

    expect(branding).toEqual({
      nombre: "Instituto 9 de Julio",
      logoUrl: "https://cdn.edu/logo.png",
      colorPrimario: "#123456",
      colorSecundario: "#654321",
      colorClaro: "#abcdef",
    });
  });

  it("preserva los nulos cuando la institución no cargó algunos campos", () => {
    const branding = toBranding({
      nombre: "EduAI",
      logo_url: null,
      color_primario: null,
      color_secundario: null,
      color_claro: null,
    });

    expect(branding.logoUrl).toBeNull();
    expect(branding.colorPrimario).toBeNull();
    expect(branding.colorClaro).toBeNull();
  });

  it("getConfigBranding pega al endpoint público y mapea el resultado", async () => {
    mockApi.mockResolvedValue({
      branding: {
        nombre: "Instituto 9 de Julio",
        logo_url: null,
        color_primario: "#003d7a",
        color_secundario: null,
        color_claro: null,
      },
    });

    const branding = await getConfigBranding();

    expect(mockApi).toHaveBeenCalledWith("/api/config/branding");
    expect(branding.nombre).toBe("Instituto 9 de Julio");
    expect(branding.colorPrimario).toBe("#003d7a");
  });
});
