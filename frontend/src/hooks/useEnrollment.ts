import { useMutation } from "@tanstack/react-query";
import { enrollWithCode } from "../services/enrollment.service";

export function useEnrollment() {
  return useMutation({ mutationFn: enrollWithCode });
}
