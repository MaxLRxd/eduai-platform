import { useQuery } from "@tanstack/react-query";
import { getAdminUsers } from "../services/adminUsers.service";

export function useAdminUsers() {
  return useQuery({ queryKey: ["admin", "users"], queryFn: getAdminUsers });
}
