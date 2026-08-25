import type { AttendanceRecord, CourseGradeSummary, GradeDetail } from "../types/domain";
import { MOCK_ATTENDANCE_LOG, MOCK_COURSE_GRADE_SUMMARY, MOCK_GRADE_DETAIL } from "../data/mock/progress.mock";

// TODO(backend): estos tres endpoints hoy viven en el Analytics Engine (Sprint 5, aún sin construir).
export async function getCourseGradeSummary(): Promise<CourseGradeSummary[]> {
  return Promise.resolve(MOCK_COURSE_GRADE_SUMMARY);
}

export async function getGradeDetail(): Promise<GradeDetail[]> {
  return Promise.resolve(MOCK_GRADE_DETAIL);
}

export async function getAttendanceLog(): Promise<AttendanceRecord[]> {
  return Promise.resolve(MOCK_ATTENDANCE_LOG);
}
