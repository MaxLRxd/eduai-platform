import { useMutation, useQuery } from "@tanstack/react-query";
import { getPlanning, savePlanning } from "../services/planning.service";

export function usePlanning() {
  return useQuery({ queryKey: ["planning"], queryFn: getPlanning });
}

export function useSavePlanning() {
  return useMutation({ mutationFn: savePlanning });
}
