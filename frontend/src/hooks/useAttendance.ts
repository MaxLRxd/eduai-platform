import { useQuery } from "@tanstack/react-query";
import { getAttendanceState } from "../services/attendance.service";

export function useAttendanceState() {
  return useQuery({ queryKey: ["attendance"], queryFn: getAttendanceState });
}
