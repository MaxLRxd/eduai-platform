import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/api", () => ({ api: vi.fn() }));

import { api } from "../services/api";
import {
  getBranding,
  getColorPresets,
  saveBranding,
  uploadBrandingLogo,
} from "../services/adminSettings.service";

const mockApi = vi.mocked(api);

const brandingApi = {
  nombre: "Instituto 9 de Julio",
  logo_url: "https://cdn.edu/logo.png",
  color_primario: "#123456",
  color_secundario: "#654321",
  color_claro: "#abcdef",
};

describe("adminSettings.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve los presets de color del backend", async () => {
    const presets = [
      { id: "azul", name: "Azul", inst: "Instituto", primary: "#003d7a", secondary: "#0369a1", lighter: "#dbeafe" },
    ];
    mockApi.mockResolvedValue({ presets });

    await expect(getColorPresets()).resolves.toEqual(presets);
    expect(mockApi).toHaveBeenCalledWith("/api/admin/branding/presets");
  });

  it("mapea el branding del endpoint de admin", async () => {
    mockApi.mockResolvedValue({ branding: brandingApi });

    const branding = await getBranding();

    expect(mockApi).toHaveBeenCalledWith("/api/admin/branding");
    expect(branding.logoUrl).toBe("https://cdn.edu/logo.png");
    expect(branding.colorClaro).toBe("#abcdef");
  });

  it("sube el logo como FormData y devuelve su URL", async () => {
    mockApi.mockResolvedValue({ logo_url: "https://cdn.edu/nuevo.png" });
    const file = new File(["contenido"], "logo.png", { type: "image/png" });

    const url = await uploadBrandingLogo(file);

    expect(url).toBe("https://cdn.edu/nuevo.png");
    const [path, init] = mockApi.mock.calls[0];
    expect(path).toBe("/api/admin/branding/logo");
    expect(init?.method).toBe("POST");
    const body = init?.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("logo")).toBe(file);
  });

  it("guarda el branding con las claves snake_case del backend", async () => {
    mockApi.mockResolvedValue({ branding: brandingApi });

    await saveBranding({
      nombre: "Instituto 9 de Julio",
      colorPrimario: "#123456",
      colorSecundario: "#654321",
      colorClaro: "#abcdef",
      logoUrl: "https://cdn.edu/logo.png",
    });

    const [path, init] = mockApi.mock.calls[0];
    expect(path).toBe("/api/admin/branding");
    expect(init?.method).toBe("PUT");
    expect(JSON.parse(String(init?.body))).toEqual({
      nombre: "Instituto 9 de Julio",
      color_primario: "#123456",
      color_secundario: "#654321",
      color_claro: "#abcdef",
      logo_url: "https://cdn.edu/logo.png",
    });
  });
});
