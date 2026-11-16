import React from "react";
import { NavLink } from "react-router-dom";

export interface TeacherAreaTab {
  label: string;
  path: string;
}

export function TeacherAreaTabs({ tabs }: { tabs: TeacherAreaTab[] }): React.ReactElement {
  return (
    <div className="flex gap-1 flex-wrap border-b border-border mb-5">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end
          className={({ isActive }) =>
            `px-3 py-2 text-[12px] font-semibold border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-text-2 hover:text-text-1"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}

export const STUDENTS_AREA_TABS: TeacherAreaTab[] = [
  { label: "Estudiantes", path: "/teacher/students" },
  { label: "Calificaciones", path: "/teacher/grades" },
  { label: "Asistencia", path: "/teacher/attendance" },
];

export const EVALUATIONS_AREA_TABS: TeacherAreaTab[] = [
  { label: "Actividades", path: "/teacher/activities" },
  { label: "Correcciones", path: "/teacher/corrections" },
  { label: "Calificaciones", path: "/teacher/grades" },
];
