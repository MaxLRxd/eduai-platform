import type { TeacherGradeRow } from "../../types/domain";

export const MOCK_TEACHER_GRADES: Record<string, TeacherGradeRow[]> = {
  prog2: [
    { name: "Acevedo, Lautaro", tp1: "8", tp2: "9", tp3: "—", parcial: "—", average: "8.5" },
    { name: "Báez, María", tp1: "9", tp2: "10", tp3: "9", parcial: "—", average: "9.2" },
    { name: "Cardozo, Juan", tp1: "7", tp2: "6", tp3: "8", parcial: "—", average: "7.1" },
    { name: "Díaz, Lucas", tp1: "6", tp2: "7", tp3: "—", parcial: "—", average: "6.5" },
    { name: "Espinoza, Ana", tp1: "9", tp2: "9", tp3: "9", parcial: "—", average: "9.0" },
  ],
  prog1: [
    { name: "Fernández, Sofía", tp1: "7", tp2: "8", tp3: "—", parcial: "—", average: "7.5" },
    { name: "González, Matías", tp1: "8", tp2: "8", tp3: "9", parcial: "—", average: "8.1" },
    { name: "Herrera, Paula", tp1: "5", tp2: "6", tp3: "7", parcial: "—", average: "6.2" },
    { name: "Ibáñez, Tomás", tp1: "7", tp2: "8", tp3: "8", parcial: "—", average: "7.8" },
    { name: "Juárez, Camila", tp1: "9", tp2: "9", tp3: "9", parcial: "—", average: "9.0" },
  ],
  analisis: [
    { name: "Kupfer, Lucas", tp1: "9", tp2: "9", tp3: "—", parcial: "—", average: "8.8" },
    { name: "López, Ana", tp1: "7", tp2: "7", tp3: "8", parcial: "—", average: "7.3" },
    { name: "Martín, Diego", tp1: "6", tp2: "6", tp3: "7", parcial: "—", average: "6.5" },
    { name: "Núñez, Valentina", tp1: "9", tp2: "10", tp3: "9", parcial: "—", average: "9.1" },
    { name: "Ortiz, Sebastián", tp1: "7", tp2: "8", tp3: "8", parcial: "—", average: "7.6" },
  ],
};
