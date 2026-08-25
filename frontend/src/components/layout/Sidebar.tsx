import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { NAV_BY_ROLE } from "../../router/navConfig";
import { Icon } from "../ui/icons";

const ROLE_LABEL: Record<string, string> = {
  ALUMNO: "Estudiante",
  PROFESOR: "Docente",
  ADMIN: "Administrador",
};

const BADGE_CLASSES: Record<string, string> = {
  amber: "bg-warning text-white",
  danger: "bg-danger text-white",
  green: "bg-success text-white",
};

export function Sidebar(): React.ReactElement {
  const { user, logout } = useAuth();
  if (!user) return <></>;

  const sections = NAV_BY_ROLE[user.role];
  const initials = `${user.name[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <aside className="w-sidebar shrink-0 bg-primary text-white flex flex-col overflow-hidden relative">
      <div className="px-4 pt-5 pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/15 flex items-center justify-center shrink-0">
            <Icon name="dashboard" className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display text-base font-bold tracking-tight">EduAI</div>
            <div className="text-[10px] text-white/50 uppercase tracking-wide font-medium">IES Santa Fe</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3" aria-label="Secciones del sistema">
        {sections.map((section) => (
          <div key={section.section}>
            <span className="block text-[9.5px] font-bold uppercase tracking-wider text-white/35 px-2.5 pt-3.5 pb-1">
              {section.section}
            </span>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path.split("/").length <= 2}
                className={({ isActive }) =>
                  `relative flex items-center gap-2.5 px-2.5 py-2 rounded text-[13px] font-medium mb-px transition-colors ${
                    isActive ? "bg-white/15 text-white font-semibold" : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-white/80 rounded-r" />}
                    <span className="w-5 flex justify-center shrink-0">
                      <Icon name={item.icon} className="w-4 h-4" />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold font-mono px-1.5 py-px rounded-full min-w-[20px] text-center ${
                          BADGE_CLASSES[item.badgeColor ?? "danger"]
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-2.5 py-3 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-2.5 p-2.5 rounded hover:bg-white/10 transition-colors">
          <div className="w-[34px] h-[34px] rounded-full bg-white/20 border-[1.5px] border-white/25 flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold truncate">
              {user.name} {user.lastName}
            </div>
            <div className="text-[10.5px] text-white/55">{ROLE_LABEL[user.role]}</div>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="w-7 h-7 rounded-md bg-white/10 border border-white/15 flex items-center justify-center text-white/60 hover:bg-danger/20 hover:border-danger/40 hover:text-red-300 transition-colors shrink-0"
          >
            <Icon name="logout" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
