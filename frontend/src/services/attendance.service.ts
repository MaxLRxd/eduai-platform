import type { StudentAttendanceState } from "../types/domain";
import { MOCK_ATTENDANCE_STATE } from "../data/mock/attendance.mock";

// TODO(backend): GET /api/courses/:id/attendance?date=... (attendance.service.ts).
export async function getAttendanceState(): Promise<StudentAttendanceState[]> {
  return Promise.resolve(MOCK_ATTENDANCE_STATE);
}

// TODO(backend): POST /api/courses/:id/attendance con la fecha y el estado final de cada alumno.
export async function saveAttendance(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { success: true };
}
