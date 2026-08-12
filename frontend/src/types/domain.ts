export interface CourseUnit {
  title: string;
  status: "Disponible" | "En curso" | "Completada" | "Próxima";
  items: string[];
}

export interface Course {
  id: string;
  name: string;
  professor: string;
  progress: number;
  students: number;
  rating: string;
  color: string;
  intro: string;
  tutorFocus: string;
  units: CourseUnit[];
  latest: string[];
}

export type AssignmentStatus = "Pendiente" | "En revisión" | "Entregado";

export interface Assignment {
  title: string;
  course: string;
  dueDate: string;
  status: AssignmentStatus;
}

export interface CourseGradeSummary {
  course: string;
  average: number;
  attendance: number;
  color: string;
}

export interface GradeDetail {
  evaluation: string;
  course: string;
  type: string;
  date: string;
  grade: number;
}

export type AttendanceStatus = "Presente" | "Ausente" | "Tardanza";

export interface AttendanceRecord {
  date: string;
  course: string;
  status: AttendanceStatus;
}

export interface TutorMessage {
  role: "user" | "tutor";
  content: string;
}

export interface TeacherCourse {
  id: string;
  label: string;
  curso: string;
  studentNames: string[];
}

export type StudentStanding = "Regular" | "En riesgo";

export interface TeacherStudentRow {
  name: string;
  legajo: string;
  average: string;
  attendance: string;
  standing: StudentStanding;
}

export interface TeacherGradeRow {
  name: string;
  tp1: string;
  tp2: string;
  tp3: string;
  parcial: string;
  average: string;
}

export type DailyAttendanceStatus = "present" | "absent" | "late";

export interface StudentAttendanceState {
  name: string;
  status: DailyAttendanceStatus;
  history: boolean[];
  total: number;
  absent: number;
}
