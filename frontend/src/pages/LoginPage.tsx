import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type Role } from "../contexts/AuthContext";
import { DEFAULT_PATH_BY_ROLE } from "../router/navConfig";

const ROLE_TABS: { role: Role; label: string }[] = [
  { role: "ALUMNO", label: "Alumno" },
  { role: "PROFESOR", label: "Docente" },
  { role: "ADMIN", label: "Admin" },
];

const CREDS_HINT: Record<Role, string> = {
  ALUMNO: "alumno / alumno123",
  PROFESOR: "docente / docente123",
  ADMIN: "admin / admin123",
};

export function LoginPage(): React.ReactElement {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("ALUMNO");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectRole = (r: Role): void => {
    setRole(r);
    setUsername("");
    setPassword("");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!username || !password) {
      setError("Completá usuario y contraseña para ingresar.");
      return;
    }
    const ok = login(role, username, password);
    if (!ok) {
      setError("Credenciales incorrectas. Verificá los datos e intentá nuevamente.");
      return;
    }
    navigate(DEFAULT_PATH_BY_ROLE[role]);
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
            <label htmlFor="username" className="block text-[13px] font-semibold text-text-1 mb-1.5">
              Usuario
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded text-sm focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,61,122,0.1)]"
              placeholder={CREDS_HINT[role].split(" / ")[0]}
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
            className="w-full py-3 rounded bg-gradient-to-br from-primary to-secondary text-white font-bold text-sm shadow-[0_4px_12px_rgba(0,61,122,0.25)] hover:shadow-[0_6px_18px_rgba(0,61,122,0.35)] hover:-translate-y-px transition-all"
          >
            Ingresar
          </button>
        </form>

        <div className="mt-5 bg-sky-50 border border-sky-200 rounded px-4 py-3.5">
          <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wide mb-2">Credenciales demo</div>
          {ROLE_TABS.map((t) => (
            <div key={t.role} className="flex items-center justify-between text-[11px] py-1 border-b border-sky-100 last:border-0">
              <span className="font-bold text-primary">{t.label}</span>
              <span className="font-mono bg-sky-500/10 text-sky-700 px-1.5 py-0.5 rounded">{CREDS_HINT[t.role]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
