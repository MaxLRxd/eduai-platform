import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppShell({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-8 bg-bg" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
