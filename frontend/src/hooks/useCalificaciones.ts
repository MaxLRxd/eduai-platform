import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  actualizarNota,
  getResumenCalificaciones,
  guardarCategorias,
  importarNotasDeActividad,
} from "../services/calificaciones.service";

const clave = (courseId: string) => ["teacher-courses", courseId, "calificaciones"] as const;

export function useCalificaciones(courseId: string | null, periodo?: string) {
  return useQuery({
    queryKey: [...clave(courseId ?? ""), periodo ?? "todos"],
    queryFn: () => getResumenCalificaciones(courseId as string, periodo),
    enabled: Boolean(courseId),
  });
}

/** Cualquier cambio de notas o de categorias cambia los promedios que ven docente, alumno y dashboards. */
function useInvalidarPromedios(courseId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: clave(courseId) });
    void queryClient.invalidateQueries({ queryKey: ["teacher-courses", courseId, "students"] });
    void queryClient.invalidateQueries({ queryKey: ["progress"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useGuardarCategorias(courseId: string) {
  const invalidar = useInvalidarPromedios(courseId);
  return useMutation({
    mutationFn: (categorias: { id?: string; nombre: string; peso: number }[]) => guardarCategorias(courseId, categorias),
    onSuccess: invalidar,
  });
}

export function useActualizarNota(courseId: string) {
  const invalidar = useInvalidarPromedios(courseId);
  return useMutation({
    mutationFn: ({ notaId, input }: { notaId: string; input: Parameters<typeof actualizarNota>[1] }) =>
      actualizarNota(notaId, input),
    onSuccess: invalidar,
  });
}

export function useImportarNotasDeActividad(courseId: string) {
  const invalidar = useInvalidarPromedios(courseId);
  return useMutation({
    mutationFn: ({ actividadId, input }: { actividadId: string; input: Parameters<typeof importarNotasDeActividad>[1] }) =>
      importarNotasDeActividad(actividadId, input),
    onSuccess: invalidar,
  });
}
