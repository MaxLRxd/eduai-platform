import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export interface EnrolledStudent {
  id: string;
  nombre: string;
  email: string;
}

export function useEnrolledStudents(materiaId: string | null) {
  return useQuery({
    queryKey: ["admin", "enrolled", materiaId],
    queryFn: async () => {
      const data = await api<{ alumnos: EnrolledStudent[] }>(`/api/materias/${materiaId}/inscriptos`);
      return data.alumnos ?? [];
    },
    enabled: Boolean(materiaId),
  });
}

function useRefreshEnrollment(materiaId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "enrolled", materiaId] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "keys"] });
  };
}

// DELETE /api/admin/materias/:id/inscripciones/:alumnoId — CU-AD01 (A3.1).
export function useUnenrollStudent(materiaId: string) {
  const refresh = useRefreshEnrollment(materiaId);
  return useMutation({
    mutationFn: (alumnoId: string) =>
      api<{ desmatriculado: boolean }>(`/api/admin/materias/${materiaId}/inscripciones/${alumnoId}`, {
        method: "DELETE",
      }),
    onSuccess: refresh,
  });
}

// DELETE /api/admin/materias/:id/inscripciones — desmatricula a todos.
export function useUnenrollAll(materiaId: string) {
  const refresh = useRefreshEnrollment(materiaId);
  return useMutation({
    mutationFn: () =>
      api<{ cantidad: number }>(`/api/admin/materias/${materiaId}/inscripciones`, { method: "DELETE" }),
    onSuccess: refresh,
  });
}
