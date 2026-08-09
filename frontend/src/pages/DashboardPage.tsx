import React from "react";
import { useAuth } from "../contexts/AuthContext";

export function DashboardPage(): React.ReactElement {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">EduAI</h1>
        <button
          onClick={logout}
          className="text-sm text-slate-500 hover:text-red-600"
        >
          Cerrar sesión
        </button>
      </header>
      <p className="text-slate-600">
        Hola, {user?.name} {user?.lastName} ({user?.role}) — panel en construcción.
      </p>
    </div>
  );
}