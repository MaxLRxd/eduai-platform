import { useQuery } from "@tanstack/react-query";
import type { Role } from "../contexts/AuthContext";
import {
  getDashboardAdmin,
  getDashboardAlumno,
  getDashboardProfesor,
} from "../services/dashboard.service";

export function useDashboard(rol: Role | undefined, periodo?: string) {
  return useQuery({
    queryKey: ["dashboard", rol, periodo ?? "todos"],
    queryFn: async () => {
      if (rol === "ALUMNO") {
        return { rol: "ALUMNO", data: await getDashboardAlumno(periodo) } as const;
      }
      if (rol === "PROFESOR") return { rol: "PROFESOR", data: await getDashboardProfesor() } as const;
      return { rol: "ADMIN", data: await getDashboardAdmin() } as const;
    },
    enabled: Boolean(rol),
  });
}