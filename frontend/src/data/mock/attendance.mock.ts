import type { StudentAttendanceState } from "../../types/domain";

export const ATTENDANCE_DATES = ["08/04", "10/04", "12/04", "15/04"];

export const MOCK_ATTENDANCE_STATE: StudentAttendanceState[] = [
  { name: "Acevedo, Lautaro", status: "present", history: [true, true, true, true], total: 48, absent: 1 },
  { name: "Báez, María", status: "present", history: [true, true, true, true], total: 48, absent: 0 },
  { name: "Cardozo, Juan", status: "absent", history: [true, false, true, false], total: 40, absent: 8 },
  { name: "Díaz, Lucas", status: "absent", history: [false, true, false, false], total: 36, absent: 12 },
  { name: "Espinoza, Ana", status: "present", history: [true, true, true, true], total: 48, absent: 0 },
];
