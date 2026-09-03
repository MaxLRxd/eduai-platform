import { useMutation, useQuery } from "@tanstack/react-query";
import { getAttendanceState, saveAttendance } from "../services/attendance.service";
import type { DailyAttendanceStatus } from "../types/domain";

export function useAttendanceState(courseId: string | null) {
  return useQuery({
    queryKey: ["attendance", courseId ?? ""],
    queryFn: () => getAttendanceState(courseId as string),
    enabled: Boolean(courseId),
  });
}

export function useSaveAttendance() {
  return useMutation({
    mutationFn: ({
      courseId,
      fechaClase,
      registros,
    }: {
      courseId: string;
      fechaClase: string;
      registros: { alumno_id: string; estado: DailyAttendanceStatus }[];
    }) => saveAttendance(courseId, fechaClase, registros),
  });
}