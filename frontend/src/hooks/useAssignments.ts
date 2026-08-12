import { useQuery } from "@tanstack/react-query";
import { getAssignments } from "../services/assignments.service";

export function useAssignments() {
  return useQuery({ queryKey: ["assignments"], queryFn: getAssignments });
}
