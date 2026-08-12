import type { TeacherCourse } from "../../types/domain";

// Materias que dicta Prof. Martínez — igual que TEACHER_COURSES en la maqueta.
export const MOCK_TEACHER_COURSES: TeacherCourse[] = [
  {
    id: "prog2",
    label: "Programación II",
    curso: "2° Año A",
    studentNames: ["Acevedo, Lautaro", "Báez, María", "Cardozo, Juan", "Díaz, Lucas", "Espinoza, Ana"],
  },
  {
    id: "prog1",
    label: "Programación I",
    curso: "1° Año A",
    studentNames: ["Fernández, Sofía", "González, Matías", "Herrera, Paula", "Ibáñez, Tomás", "Juárez, Camila"],
  },
  {
    id: "analisis",
    label: "Análisis de Sistemas",
    curso: "3° Año B",
    studentNames: ["Kupfer, Lucas", "López, Ana", "Martín, Diego", "Núñez, Valentina", "Ortiz, Sebastián"],
  },
];
