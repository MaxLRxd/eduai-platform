import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollWithCode } from "../services/enrollment.service";

export function useEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enrollWithCode,
    // La materia nueva tiene que aparecer enseguida en "Mis cursos", inicio y entregas.
    onSuccess: (resultado) => {
      if (!resultado.success) return;
      for (const clave of ["courses", "assignments", "dashboard"]) {
        void queryClient.invalidateQueries({ queryKey: [clave] });
      }
    },
  });
}
