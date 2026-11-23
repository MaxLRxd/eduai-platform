import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", name: "Pablo", lastName: "Profe", role: "PROFESOR" },
    logout: vi.fn(),
  }),
}));

vi.mock("../contexts/BrandingContext", () => ({
  useBranding: () => ({ nombre: "Colegio", logoUrl: "" }),
}));

vi.mock("../hooks/useNotificaciones", () => ({
  useNoLeidasCount: () => ({ data: 0 }),
}));

import { AppShell } from "../components/layout/AppShell";
import { useScrollLock } from "../hooks/useScrollLock";
import { NAV_BY_ROLE } from "../router/navConfig";

function ScrollHarness({ active }: { active: boolean }): null {
  useScrollLock(active);
  return null;
}

describe("layout: sidebar colapsable", () => {
  it("contrae y expande el menú desde el header", () => {
    const etiquetaMenu = NAV_BY_ROLE.PROFESOR[0].items.find((item) => item.label !== "Inicio")?.label ?? "Mis materias";
    render(
      <MemoryRouter>
        <AppShell title="Inicio">
          <p>Contenido de prueba</p>
        </AppShell>
      </MemoryRouter>,
    );

    const aside = screen.getByRole("complementary");
    expect(aside.className).toContain("w-sidebar");
    expect(screen.getByText(etiquetaMenu)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Contraer menú" }));

    expect(aside.className).toContain("w-sidebar-collapsed");
    expect(screen.queryByText(etiquetaMenu)).not.toBeInTheDocument();
    expect(screen.queryByText("EduAI")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expandir menú" }));

    expect(aside.className).toContain("w-sidebar");
    expect(screen.getByText(etiquetaMenu)).toBeInTheDocument();
  });

  it("el main queda identificado y contenido para el scroll", () => {
    render(
      <MemoryRouter>
        <AppShell title="Inicio">
          <p>Contenido de prueba</p>
        </AppShell>
      </MemoryRouter>,
    );

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main.className).toContain("min-w-0");
    expect(main.className).toContain("min-h-0");
  });
});

describe("layout: bloqueo de scroll del main", () => {
  it("bloquea mientras está activo y restaura el valor anterior", () => {
    const main = document.createElement("main");
    main.id = "main-content";
    main.style.overflow = "auto";
    document.body.appendChild(main);

    const vista = render(<ScrollHarness active={false} />);
    expect(main.style.overflow).toBe("auto");

    vista.rerender(<ScrollHarness active />);
    expect(main.style.overflow).toBe("hidden");

    vista.rerender(<ScrollHarness active={false} />);
    expect(main.style.overflow).toBe("auto");

    vista.unmount();
    main.remove();
  });
});
