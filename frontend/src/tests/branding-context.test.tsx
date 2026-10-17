import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../services/config.service", () => ({ getConfigBranding: vi.fn() }));

import { getConfigBranding } from "../services/config.service";
import { BrandingProvider, useBranding } from "../contexts/BrandingContext";

const mockGetBranding = vi.mocked(getConfigBranding);

function Consumidor() {
  const { nombre, logoUrl } = useBranding();
  return (
    <div>
      <span data-testid="nombre">{nombre ?? "sin-nombre"}</span>
      <span data-testid="logo">{logoUrl ?? "sin-logo"}</span>
    </div>
  );
}

function renderProvider(): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <BrandingProvider>
        <Consumidor />
      </BrandingProvider>
    </QueryClientProvider>
  );
}

describe("BrandingProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const root = document.documentElement;
    root.style.removeProperty("--color-primary");
    root.style.removeProperty("--color-secondary");
    root.style.removeProperty("--color-primary-light");
  });

  it("expone nombre y logo a los consumidores", async () => {
    mockGetBranding.mockResolvedValue({
      nombre: "Instituto 9 de Julio",
      logoUrl: "https://cdn.edu/logo.png",
      colorPrimario: "#123456",
      colorSecundario: "#654321",
      colorClaro: "#abcdef",
    });

    renderProvider();

    expect(await screen.findByText("Instituto 9 de Julio")).toBeInTheDocument();
    expect(screen.getByTestId("logo").textContent).toBe("https://cdn.edu/logo.png");
  });

  it("aplica los colores de la institución como variables CSS", async () => {
    mockGetBranding.mockResolvedValue({
      nombre: "Instituto 9 de Julio",
      logoUrl: null,
      colorPrimario: "#123456",
      colorSecundario: "#654321",
      colorClaro: "#abcdef",
    });

    renderProvider();
    await screen.findByText("Instituto 9 de Julio");

    const root = document.documentElement;
    expect(root.style.getPropertyValue("--color-primary")).toBe("#123456");
    expect(root.style.getPropertyValue("--color-secondary")).toBe("#654321");
    expect(root.style.getPropertyValue("--color-primary-light")).toBe("#abcdef");
  });

  it("usa los defaults del tema si la institución no define colores", async () => {
    mockGetBranding.mockResolvedValue({
      nombre: "EduAI",
      logoUrl: null,
      colorPrimario: null,
      colorSecundario: null,
      colorClaro: null,
    });

    renderProvider();
    await screen.findByText("EduAI");

    const root = document.documentElement;
    expect(root.style.getPropertyValue("--color-primary")).toBe("#003d7a");
    expect(root.style.getPropertyValue("--color-primary-light")).toBe("#dbeafe");
  });
});
