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
  alumnos: number;
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

export interface CorrectionQueueItem {
  id: string;
  student: string;
  activity: string;
  course: string;
  type: string;
  aiGrade: string;
  submission: string;
  aiFeedback: string;
}

export interface RubricCriterion {
  name: string;
  weight: string;
  level: "Excelente" | "Bueno" | "Regular";
}

export interface Rubric {
  name: string;
  criteriaCount: number;
  activitiesCount: number;
}

export interface TopicUnderstanding {
  topic: string;
  level: "Dominado" | "En proceso" | "Crítico";
}

export type RiskLevel = "Alto" | "Medio";

export interface RiskAlert {
  name: string;
  issue: string;
  risk: RiskLevel;
}

export interface FrequentError {
  rank: number;
  description: string;
  studentCount: number;
  topics: string;
}

export interface FrequentQuestion {
  question: string;
  count: number;
}

export interface PlanningAttachment {
  name: string;
  sizeLabel: string;
}

export interface PlanningClass {
  date: string;
  title: string;
  course: string;
  material: string;
  studentVisible: boolean;
  aiEnabled: boolean;
  attachments: PlanningAttachment[];
}

export interface InboxMessage {
  id: string;
  from: string;
  subject: string;
  when: string;
  unread: boolean;
}

export type SubjectStatus = "Activa" | "Pendiente" | "Inactiva";

export interface AdminSubject {
  id: string;
  nombre: string;
  profesor: string;
  alumnos: number;
  estado: SubjectStatus;
}

export type UserRole = "Alumno" | "Docente" | "Admin";
export type UserStatus = "Activo" | "Inactivo" | "Pendiente";

export interface AdminUser {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface EnrollmentKeyAdmin {
  id: number;
  materiaId: string;
  materiaNombre: string;
  codigo: string;
  estado: "activa" | "revocada";
  vencimiento: string | null;
  maxUsos: number | null;
  usos: number;
  inscriptos: string[];
}

export interface LicensePlan {
  name: string;
  range: string;
  features: string;
  current: boolean;
}

export interface ReportCard {
  title: string;
  description: string;
  actionLabel: string;
}

export interface ColorPreset {
  id: string;
  name: string;
  inst: string;
  primary: string;
  secondary: string;
  lighter: string;
}

export type RagStatus = "Indexado" | "Sin indexar" | "Indexando…";

export interface UploadedMaterial {
  name: string;
  fileType: "pdf" | "pptx" | "docx" | "img" | "txt";
  sizeLabel: string;
  ragStatus: RagStatus;
  date: string;
}
