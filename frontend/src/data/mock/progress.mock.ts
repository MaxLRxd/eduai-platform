import type { AttendanceRecord, CourseGradeSummary, GradeDetail } from "../../types/domain";

export const MOCK_COURSE_GRADE_SUMMARY: CourseGradeSummary[] = [
  { course: "Programación II", average: 8.5, attendance: 95, color: "#003d7a" },
  { course: "Bases de Datos", average: 9.0, attendance: 98, color: "#059669" },
  { course: "Redes de Computadoras", average: 7.8, attendance: 90, color: "#d97706" },
  { course: "Matemática Discreta", average: 8.2, attendance: 92, color: "#7c3aed" },
];

export const MOCK_GRADE_DETAIL: GradeDetail[] = [
  { evaluation: "TP3 — Herencia y Polimorfismo", course: "Programación II", type: "TP", date: "12/04", grade: 8.5 },
  { evaluation: "Parcial 1er bimestre", course: "Bases de Datos", type: "Parcial", date: "28/03", grade: 9.0 },
  { evaluation: "Actividad — Subredes", course: "Redes", type: "Actividad", date: "20/03", grade: 7.5 },
  { evaluation: "TP1 — Teoría de grafos", course: "Mat. Discreta", type: "TP", date: "15/03", grade: 8.0 },
  { evaluation: "Consultas SQL — Joins", course: "Bases de Datos", type: "TP", date: "08/04", grade: 9.5 },
];

export const MOCK_ATTENDANCE_LOG: AttendanceRecord[] = [
  { date: "15/04", course: "Programación II", status: "Presente" },
  { date: "14/04", course: "Bases de Datos", status: "Presente" },
  { date: "13/04", course: "Redes", status: "Tardanza" },
  { date: "12/04", course: "Matemática Discreta", status: "Presente" },
  { date: "11/04", course: "Programación II", status: "Ausente" },
  { date: "10/04", course: "Bases de Datos", status: "Presente" },
];
