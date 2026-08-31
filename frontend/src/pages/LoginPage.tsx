import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type Role } from "../contexts/AuthContext";
import { DEFAULT_PATH_BY_ROLE } from "../router/navConfig";

const ROLE_TABS: { role: Role; label: string }[] = [
  { role: "ALUMNO", label: "Alumno" },
  { role: "PROFESOR", label: "Docente" },
  { role: "ADMIN", label: "Admin" },
];

export function LoginPage(): React.ReactElement {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("ALUMNO");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectRole = (r: Role): void => {
    setRole(r);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email || !password) {
      setError("Completá email y contraseña para ingresar.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const usuario = await login(email, password);
      navigate(DEFAULT_PATH_BY_ROLE[usuario.role]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error de conexión con el backend";
      const trimmed = message.replace(/^"|"$/g, "");
      try {
        const parsed = JSON.parse(trimmed) as { error?: string };
        setError(parsed.error ?? "No se pudo iniciar sesión.");
      } catch {
        setError(trimmed || "No se pudo iniciar sesión.");
      }
    } finally {
      setSubmitting(false);
    }
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

        <div className="flex bg-surface-2 border border-border rounded p-1 gap-0.5 mb-6" role="tablist">
          {ROLE_TABS.map((t) => (
            <button
              key={t.role}
              type="button"
              role="tab"
              aria-selected={role === t.role}
              onClick={() => selectRole(t.role)}
              className={`flex-1 py-2 px-2.5 rounded-[7px] text-xs font-semibold tracking-wide transition-all ${
                role === t.role ? "bg-surface text-primary shadow-sm" : "text-text-2 hover:bg-white/60"
              }`}
            >
              {t.label}
            </button>
          ))}
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
              placeholder="tu@email.com"
              autoComplete="email"
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
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="bg-danger-light border border-red-300 rounded px-3.5 py-2.5 text-[13px] text-red-800 font-medium mb-4">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded bg-gradient-to-br from-primary to-secondary text-white font-bold text-sm shadow-[0_4px_12px_rgba(0,61,122,0.25)] hover:shadow-[0_6px_18px_rgba(0,61,122,0.35)] hover:-translate-y-px transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <div className="mt-5 bg-sky-50 border border-sky-200 rounded px-4 py-3.5">
          <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wide mb-2">Usuarios de prueba (backend real)</div>
          <Credenciales email="alumno@real.edu" password="Clave1234" rol="Profesor" />
          <Credenciales email="nuevo@test.edu" password="Clave1234" rol="Alumno" />
        </div>
      </div>
    </div>
  );
}

function Credenciales({ email, password, rol }: { email: string; password: string; rol: string }): React.ReactElement {
  return (
    <div className="flex items-center justify-between text-[11px] py-1 border-b border-sky-100 last:border-0">
      <span className="font-bold text-primary">{rol}</span>
      <span className="font-mono bg-sky-500/10 text-sky-700 px-1.5 py-0.5 rounded truncate ml-2">{email}</span>
      <span className="font-mono text-sky-700 ml-2">{password}</span>
    </div>
  );
}
