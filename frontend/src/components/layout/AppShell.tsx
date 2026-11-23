import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppShell({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full max-w-full overflow-hidden">
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
