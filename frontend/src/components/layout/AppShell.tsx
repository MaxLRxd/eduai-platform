import React, { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

/** Bajo este ancho el menu lateral (256 px) le quitaria demasiado lugar al contenido: arranca contraido. */
const ANCHO_MENU_COMPACTO = "(max-width: 1023px)";

function esPantallaCompacta(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(ANCHO_MENU_COMPACTO).matches;
}

export function AppShell({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(esPantallaCompacta);

  // Al achicar la ventana el menu se contrae solo; al agrandarla vuelve a abrirse (el boton del header sigue mandando).
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const consulta = window.matchMedia(ANCHO_MENU_COMPACTO);
    const alCambiar = (e: MediaQueryListEvent): void => setSidebarCollapsed(e.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  return (
    <div className="flex h-screen h-dvh w-full max-w-full overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Header
          title={title}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        />
        <main
          id="main-content"
          className="flex-1 min-h-0 min-w-0 max-w-full overflow-y-auto overflow-x-hidden p-8 bg-bg"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
