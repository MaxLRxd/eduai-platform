import { useQuery } from "@tanstack/react-query";
import {
  getAttendanceLog,
  getCourseGradeSummary,
  getGradeDetail,
  getProgressOverview,
} from "../services/progress.service";

export function useProgress() {
  const summary = useQuery({ queryKey: ["progress", "summary"], queryFn: getCourseGradeSummary });
  const grades = useQuery({ queryKey: ["progress", "grades"], queryFn: getGradeDetail });
  const attendance = useQuery({ queryKey: ["progress", "attendance"], queryFn: getAttendanceLog });
  const overview = useQuery({ queryKey: ["progress", "overview"], queryFn: getProgressOverview });

  return { summary, grades, attendance, overview };
}