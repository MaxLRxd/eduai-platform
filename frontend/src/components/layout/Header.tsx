import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Icon } from "../ui/icons";

const PROFILE_PATH_BY_ROLE: Record<string, string> = {
  ALUMNO: "/student/profile",
  PROFESOR: "/teacher/profile",
  ADMIN: "/admin/settings",
};

export function Header({ title }: { title: string }): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-header shrink-0 bg-surface border-b border-border flex items-center justify-between px-7 shadow-xs">
      <h1 className="font-display text-[17px] font-bold text-text-1 tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Buscar en la plataforma..."
          aria-label="Buscar"
          className="w-64 px-3.5 py-2 bg-surface-2 border-[1.5px] border-border rounded text-[13px] transition-all focus:outline-none focus:bg-surface focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,61,122,0.1)] focus:w-72"
        />
        <button
          aria-label="Notificaciones"
          className="relative w-9 h-9 bg-surface-2 border-[1.5px] border-border rounded flex items-center justify-center text-text-2 hover:bg-primary-light hover:border-primary hover:text-primary transition-colors"
        >
          <Icon name="bell" className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full border-2 border-surface" />
        </button>
        <button
          aria-label="Perfil"
          onClick={() => user && navigate(PROFILE_PATH_BY_ROLE[user.role])}
          className="w-9 h-9 bg-surface-2 border-[1.5px] border-border rounded flex items-center justify-center text-text-2 hover:bg-primary-light hover:border-primary hover:text-primary transition-colors"
        >
          <Icon name="profile" className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
