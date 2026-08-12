export interface EnrollmentKey {
  code: string;
  courseName: string;
  active: boolean;
}

export const MOCK_ENROLLMENT_KEYS: EnrollmentKey[] = [
  { code: "PROG2-2024", courseName: "Programación II", active: true },
  { code: "BD-2024-A", courseName: "Bases de Datos", active: true },
  { code: "DISC-2024", courseName: "Matemática Discreta", active: true },
  { code: "PROG2-OLD", courseName: "Programación II", active: false },
];
