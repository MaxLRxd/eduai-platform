export interface CourseClass {
  id: string;
  title: string;
  date: string;
  content: string;
  studentVisible: boolean;
  materials: CourseMaterial[];
}

export interface CourseUnit {
  title: string;
  status: "Disponible" | "En curso" | "Completada" | "Próxima";
  items: string[];
  materials?: CourseMaterial[];
  classes?: CourseClass[];
}

export interface CourseMaterial {
  id: string;
  titulo: string;
  tipo: string;
  /** El backend solo puede resumir materiales con texto, no archivos binarios. */
  resumible: boolean;
  /** true cuando el contenido ya está vectorizado en el RAG del tutor. */
  ragIndexado: boolean;
  url?: string | null;
  archivo_nombre?: string | null;
  /** Cuerpo de los materiales de texto (se leen dentro de la plataforma). */
  texto?: string | null;
  /** false = el servidor detectó que el archivo ya no está y no se puede servir. null = no se pudo comprobar. */
  disponible?: boolean | null;
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
  materiales: CourseMaterial[];
}

export type AssignmentStatus = "Pendiente" | "En revisión" | "Entregado";

export type AssignmentType = "MULTIPLE_CHOICE" | "DESARROLLO" | "ARCHIVO" | "CODIGO";

export interface AssignmentOption {
  texto: string;
  correcta: boolean;
}

export interface SubmittedAssignment {
  id: string;
  respuesta_texto: string | null;
  respuesta_codigo: string | null;
  archivo_url: string | null;
  archivo_nombre: string | null;
  entregado_en: string;
  calificacion_final: number | null;
  feedback_final: string | null;
  publicado: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  course: string;
  consigna: string;
  tipo: AssignmentType;
  opciones: AssignmentOption[];
  formatosPermitidos: string[];
  dueDate: string;
  dueDateIso: string;
  status: AssignmentStatus;
  submitted: SubmittedAssignment | null;
}

export interface GradeCategoryBreakdown {
  id: string;
  name: string;
  /** Peso de la categoria en la nota final (0-100). */
  weight: number;
  /** Promedio del alumno en la categoria; null si todavia no tiene notas ahi. */
  average: number | null;
}

export interface CourseGradeSummary {
  course: string;
  average: number;
  attendance: number;
  color: string;
  /** Como se arma la nota final: vacio si la materia no definio categorias. */
  categories: GradeCategoryBreakdown[];
  /** Notas sin categoria: no cuentan en la nota final mientras la materia use categorias. */
  uncategorized: number;
}

export interface GradeDetail {
  evaluation: string;
  category: string | null;
  course: string;
  type: string;
  date: string;
  grade: number;
}

export type AttendanceStatus = "Presente" | "Ausente" | "Tardanza" | "Justificado";

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
  id: string;
  name: string;
  legajo: string;
  average: string;
  attendance: string;
  standing: StudentStanding;
}

export type DailyAttendanceStatus = "present" | "absent" | "late";

export interface StudentAttendanceState {
  id: string;
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
  /** URL absoluta del archivo adjunto (si la entrega es un archivo). */
  fileUrl: string | null;
  fileName: string | null;
  aiFeedback: string;
  materiaId: string;
}

export interface RubricCriterion {
  name: string;
  weight: string;
  /** Lo que el docente espera que aparezca en la entrega. Es lo que usa la IA. */
  expected: string;
  /** Qué se ve en la entrega para cada nivel (clave = nombre del nivel). Vacío si no hay. */
  descriptors: Record<string, string>;
}

/** Nivel de desempeño de una rúbrica (Excelente, Bueno...). `score` es el % del peso que se obtiene. */
export interface RubricLevel {
  name: string;
  score: number;
}

export interface Rubric {
  id: string;
  name: string;
  description: string | null;
  criteriaCount: number;
  activitiesCount: number;
  criterios: RubricCriterion[];
  /** Niveles de desempeño, de mejor a peor. Vacío = la rúbrica no usa niveles. */
  levels: RubricLevel[];
}

export interface TopicUnderstanding {
  /** Id de la unidad; null = consultas que no se pudieron ligar a una unidad. */
  id: string | null;
  topic: string;
  /** "Sin evaluar" = hay consultas pero todavia no hay una medicion de comprension. */
  level: "Dominado" | "En proceso" | "Crítico" | "Sin evaluar";
  consultas: number;
  errores: number;
}

/** Una pregunta o error concreto de un tema, con las veces que se repitio. */
export interface TopicDetailItem {
  id: string;
  tipo: "DUDA" | "ERROR";
  descripcion: string;
  frecuencia: number;
}

export interface AnalyticsFilters {
  periodo?: string;
  /** Id de una unidad o "general". */
  seccionId?: string;
}

export type RiskLevel = "Alto" | "Medio" | "Bajo";

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
  url?: string;
}

export interface PlanningClass {
  id?: string;
  date: string;
  title: string;
  course: string;
  material: string;
  studentVisible: boolean;
  aiEnabled: boolean;
  attachments: PlanningAttachment[];
  sectionId?: string | null;
}

export interface InboxMessage {
  id: string;
  from: string;
  participanteId: string | null;
  subject: string;
  when: string;
  unread: boolean;
  noLeidos: number;
}

export type SubjectStatus = "Activa" | "Pendiente" | "Inactiva";

export interface AdminSubject {
  id: string;
  nombre: string;
  descripcion: string | null;
  nivelEducativo: string;
  profesor: string;
  alumnos: number;
  estado: SubjectStatus;
}

export type UserRole = "Alumno" | "Docente" | "Admin";
export type UserStatus = "Activo" | "Inactivo" | "Pendiente";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface EnrollmentKeyAdmin {
  id: string;
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

export interface ReportStat {
  label: string;
  value: string;
}

export interface ReportCard {
  type: string;
  title: string;
  description: string;
  actionLabel: string;
  headline: string;
  stats: ReportStat[];
  footnote: string;
}

export interface ColorPreset {
  id: string;
  name: string;
  inst: string;
  primary: string;
  secondary: string;
  lighter: string;
}

export interface InstitutionBranding {
  nombre: string;
  logoUrl: string | null;
  colorPrimario: string | null;
  colorSecundario: string | null;
  colorClaro: string | null;
}

export type RagStatus = "Indexado" | "Sin indexar" | "Indexando…";

export interface UploadedMaterial {
  id: string;
  name: string;
  fileType: "pdf" | "pptx" | "docx" | "img" | "txt" | "video";
  sizeLabel: string;
  ragStatus: RagStatus;
  date: string;
  url?: string;
  /** Cuerpo de los materiales de texto (no tienen archivo que abrir). */
  text?: string;
}
