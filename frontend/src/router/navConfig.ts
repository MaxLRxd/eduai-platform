import type { IconKey } from "../components/ui/icons";
import type { Role } from "../contexts/AuthContext";

export interface NavItem {
  icon: IconKey;
  label: string;
  path: string;
  badge?: string;
  badgeColor?: "amber" | "danger" | "green";
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

// Espeja ROLES.nav de la maqueta (maqueta-corregida.html). Los badges ya no
// se precargan: quedan para uso dinámico cuando haya una fuente de notificaciones.
export const NAV_BY_ROLE: Record<Role, NavSection[]> = {
  ALUMNO: [
    {
      section: "Académico",
      items: [
        { icon: "dashboard", label: "Inicio", path: "/student" },
        { icon: "courses", label: "Mis cursos", path: "/student/courses" },
        { icon: "assignments", label: "Entregas", path: "/student/assignments" },
        { icon: "progress", label: "Mis estadísticas", path: "/student/progress" },
        { icon: "licencias", label: "Inscribirse a materia", path: "/student/enroll" },
      ],
    },
    {
      section: "Mi cuenta",
      items: [{ icon: "profile", label: "Mi perfil", path: "/student/profile" }],
    },
  ],
  PROFESOR: [
    {
      section: "Docencia",
      items: [
        { icon: "panel", label: "Inicio", path: "/teacher" },
        { icon: "courses", label: "Mis materias", path: "/teacher/courses" },
        { icon: "students", label: "Mis estudiantes", path: "/teacher/students" },
        { icon: "grades", label: "Calificaciones", path: "/teacher/grades" },
        { icon: "attendance", label: "Asistencia", path: "/teacher/attendance" },
        { icon: "planning", label: "Planificación", path: "/teacher/planning" },
        { icon: "assignments", label: "Actividades", path: "/teacher/activities" },
        { icon: "corrections", label: "Correcciones", path: "/teacher/corrections" },
        { icon: "analytics", label: "Analytics", path: "/teacher/analytics" },
        { icon: "ai", label: "Asistente IA", path: "/teacher/ai" },
        { icon: "content", label: "Contenidos", path: "/teacher/content" },
        { icon: "messages", label: "Mensajes", path: "/teacher/messages" },
      ],
    },
    {
      section: "Mi cuenta",
      items: [{ icon: "profile", label: "Mi perfil", path: "/teacher/profile" }],
    },
  ],
  ADMIN: [
    {
      section: "Gestión",
      items: [
        { icon: "panel", label: "Panel", path: "/admin" },
        { icon: "materias", label: "Materias", path: "/admin/materias" },
        { icon: "licencias", label: "Claves de Matriculación", path: "/admin/claves" },
        { icon: "usuarios", label: "Usuarios", path: "/admin/usuarios" },
        { icon: "licencias", label: "Licencias", path: "/admin/licencias" },
        { icon: "reports", label: "Reportes", path: "/admin/reports" },
      ],
    },
    {
      section: "Sistema",
      items: [{ icon: "appearance", label: "Apariencia", path: "/admin/settings" }],
    },
  ],
};

export const DEFAULT_PATH_BY_ROLE: Record<Role, string> = {
  ALUMNO: "/student",
  PROFESOR: "/teacher",
  ADMIN: "/admin",
};
