import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../services/config.service", () => ({ getConfigBranding: vi.fn() }));

import { getConfigBranding } from "../services/config.service";
import { BrandingProvider, useBranding } from "../contexts/BrandingContext";
import { BrandLogo } from "../components/ui/BrandLogo";

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

describe("BrandLogo", () => {
  it("muestra la imagen cuando la URL carga", () => {
    render(<BrandLogo src="https://cdn.edu/logo.png" alt="IES Santa Fe" className="w-8 h-8" />);

    const logo = screen.getByAltText("IES Santa Fe");
    expect(logo).toHaveAttribute("src", "https://cdn.edu/logo.png");
    expect(logo).toHaveClass("w-8", "h-8");
  });

  it("resuelve rutas relativas contra la API", () => {
    render(<BrandLogo src="/uploads/logo.png" alt="Logo subido" />);

    expect(screen.getByAltText("Logo subido")).toHaveAttribute("src", "http://localhost:3000/uploads/logo.png");
  });

  it("muestra la marca por defecto si no hay logo", () => {
    render(<BrandLogo alt="EduAI" />);

    expect(screen.getByRole("img", { name: "EduAI" })).toBeInTheDocument();
  });

  it("cae a la marca por defecto cuando la imagen falla", () => {
    render(<BrandLogo src="https://cdn.edu/logo-roto.png" alt="Logo roto" />);

    fireEvent.error(screen.getByAltText("Logo roto"));

    expect(screen.getByRole("img", { name: "Logo roto" })).toBeInTheDocument();
    expect(screen.queryByAltText("Logo roto")).not.toBeInTheDocument();
  });
});
