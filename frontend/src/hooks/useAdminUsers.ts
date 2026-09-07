import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeAdminUserRole,
  createAdminUser,
  getAdminProfessors,
  getAdminUsers,
  setAdminUserActive,
} from "../services/adminUsers.service";

export function useAdminUsers() {
  return useQuery({ queryKey: ["admin", "users"], queryFn: getAdminUsers });
}

export function useAdminProfessors() {
  return useQuery({ queryKey: ["admin", "professors"], queryFn: getAdminProfessors });
}

function invalidateUsers(queryClient: ReturnType<typeof useQueryClient>): void {
  queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "professors"] });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => invalidateUsers(queryClient),
  });
}

export function useSetAdminUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ usuarioId, activo }: { usuarioId: string; activo: boolean }) => setAdminUserActive(usuarioId, activo),
    onSuccess: () => invalidateUsers(queryClient),
  });
}

export function useChangeAdminUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      usuarioId,
      rol,
      tipoProfesor,
    }: {
      usuarioId: string;
      rol: "ALUMNO" | "PROFESOR" | "ADMIN";
      tipoProfesor?: string;
    }) => changeAdminUserRole(usuarioId, rol, tipoProfesor),
    onSuccess: () => invalidateUsers(queryClient),
  });
}