import { useQuery } from "@tanstack/react-query";
import { getProgressData } from "../services/progress.service";

export function useProgress(periodo?: string) {
  return useQuery({
    queryKey: ["progress", periodo ?? "todos"],
    queryFn: () => getProgressData(periodo),
  });
}
