import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage(): React.ReactElement {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email || !password) {
      setError("Completá email y contraseña para ingresar.");
      return;
    }
    setLoading(true);
    setError(null);
    const ok = await login(email.trim(), password);
    setLoading(false);
    if (!ok) {
      setError("Credenciales incorrectas. Verificá los datos e intentá nuevamente.");
      return;
    }
    // Una vez autenticado, App.tsx redirige desde /login al panel del rol correspondiente.
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#001a3a] via-primary to-[#005fa3]">
      <div className="bg-surface rounded-xl shadow-lg w-full max-w-md p-10 pt-11 pb-9">
        <div className="text-center mb-8">
          <div className="w-[54px] h-[54px] mx-auto mb-3.5 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_8px_20px_rgba(0,61,122,0.3)]">
            <span className="text-2xl">🎓</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-primary tracking-tight">EduAI</h1>
          <p className="text-xs text-text-2 mt-1">Campus educativo integrado con IA</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-[13px] font-semibold text-text-1 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded text-sm focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,61,122,0.1)]"
              placeholder="alumno1@ies.edu"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-[13px] font-semibold text-text-1 mb-1.5">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded text-sm focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,61,122,0.1)]"
            />
          </div>
          {error && (
            <div className="bg-danger-light border border-red-300 rounded px-3.5 py-2.5 text-[13px] text-red-800 font-medium mb-4">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded bg-gradient-to-br from-primary to-secondary text-white font-bold text-sm shadow-[0_4px_12px_rgba(0,61,122,0.25)] hover:shadow-[0_6px_18px_rgba(0,61,122,0.35)] hover:-translate-y-px transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <div className="mt-5 bg-sky-50 border border-sky-200 rounded px-4 py-3.5">
          <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wide mb-2">Credenciales de prueba</div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between border-b border-sky-100 pb-1">
              <span className="font-bold text-primary">Alumno</span>
              <span className="font-mono text-sky-700">alumno1@ies.edu / Clave1234</span>
            </div>
            <div className="flex items-center justify-between border-b border-sky-100 pb-1">
              <span className="font-bold text-primary">Docente</span>
              <span className="font-mono text-sky-700">profe1@ies.edu / Clave1234</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">Admin</span>
              <span className="font-mono text-sky-700">admin@ies.edu / Clave1234</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
