import { useQuery } from "@tanstack/react-query";
import { getAttendanceLog, getCourseGradeSummary, getGradeDetail } from "../services/progress.service";

export function useProgress() {
  const summary = useQuery({ queryKey: ["progress", "summary"], queryFn: getCourseGradeSummary });
  const grades = useQuery({ queryKey: ["progress", "grades"], queryFn: getGradeDetail });
  const attendance = useQuery({ queryKey: ["progress", "attendance"], queryFn: getAttendanceLog });

  return { summary, grades, attendance };
}
