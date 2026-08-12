import type { TeacherStudentRow } from "../../types/domain";

export const MOCK_TEACHER_STUDENTS: Record<string, TeacherStudentRow[]> = {
  prog2: [
    { name: "Acevedo, Lautaro", legajo: "P-2024-001", average: "8.5", attendance: "96%", standing: "Regular" },
    { name: "Báez, María", legajo: "P-2024-002", average: "9.2", attendance: "100%", standing: "Regular" },
    { name: "Cardozo, Juan", legajo: "P-2024-003", average: "7.1", attendance: "85%", standing: "En riesgo" },
    { name: "Díaz, Lucas", legajo: "P-2024-004", average: "6.8", attendance: "75%", standing: "En riesgo" },
    { name: "Espinoza, Ana", legajo: "P-2024-005", average: "8.9", attendance: "98%", standing: "Regular" },
  ],
  prog1: [
    { name: "Fernández, Sofía", legajo: "P-2024-011", average: "7.5", attendance: "90%", standing: "Regular" },
    { name: "González, Matías", legajo: "P-2024-012", average: "8.1", attendance: "95%", standing: "Regular" },
    { name: "Herrera, Paula", legajo: "P-2024-013", average: "6.2", attendance: "72%", standing: "En riesgo" },
    { name: "Ibáñez, Tomás", legajo: "P-2024-014", average: "7.8", attendance: "88%", standing: "Regular" },
    { name: "Juárez, Camila", legajo: "P-2024-015", average: "9.0", attendance: "100%", standing: "Regular" },
  ],
  analisis: [
    { name: "Kupfer, Lucas", legajo: "P-2024-021", average: "8.8", attendance: "94%", standing: "Regular" },
    { name: "López, Ana", legajo: "P-2024-022", average: "7.3", attendance: "82%", standing: "Regular" },
    { name: "Martín, Diego", legajo: "P-2024-023", average: "6.5", attendance: "70%", standing: "En riesgo" },
    { name: "Núñez, Valentina", legajo: "P-2024-024", average: "9.1", attendance: "97%", standing: "Regular" },
    { name: "Ortiz, Sebastián", legajo: "P-2024-025", average: "7.6", attendance: "86%", standing: "Regular" },
  ],
};
