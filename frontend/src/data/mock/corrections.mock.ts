import type { CorrectionQueueItem, Rubric, RubricCriterion } from "../../types/domain";

export const MOCK_CORRECTION_QUEUE: CorrectionQueueItem[] = [
  {
    id: "1",
    student: "Acevedo, Lautaro",
    activity: "TP3 — Herencia y Polimorfismo",
    course: "Programación II",
    type: "Desarrollo",
    aiGrade: "8.5",
    submission:
      'La herencia en Java permite que una clase hija extienda una clase padre usando "extends". El polimorfismo se logra sobreescribiendo métodos con "@Override"...',
    aiFeedback:
      'Excelente comprensión del concepto de herencia. La explicación de "extends" es correcta. Sin embargo, falta mencionar la diferencia entre sobrescritura ("@Override") y sobrecarga de métodos, que es central para el tema...',
  },
  {
    id: "2",
    student: "Báez, María",
    activity: "TP3 — Herencia y Polimorfismo",
    course: "Programación II",
    type: "Desarrollo",
    aiGrade: "9.2",
    submission: "La herencia permite reutilizar código de una superclase. El polimorfismo permite que un mismo método se comporte distinto según la clase.",
    aiFeedback: "Muy buena explicación, completa y con ejemplos correctos. Se destaca el uso preciso de la terminología.",
  },
  {
    id: "3",
    student: "Cardozo, Juan",
    activity: "Consultas SQL Avanzadas",
    course: "Bases de Datos",
    type: "Código",
    aiGrade: "6.8",
    submission: "SELECT * FROM alumnos WHERE curso = 'Prog2';",
    aiFeedback: "La consulta funciona pero no usa JOIN, que era parte del enunciado. Falta relacionar con la tabla de materias.",
  },
  {
    id: "4",
    student: "Díaz, Lucas",
    activity: "Multiple Choice — Redes",
    course: "Redes",
    type: "Multiple Choice",
    aiGrade: "7.0",
    submission: "Respuestas seleccionadas: 7/10 correctas.",
    aiFeedback: "Buen desempeño general, con errores concentrados en la capa de transporte.",
  },
  {
    id: "5",
    student: "Espinoza, Ana",
    activity: "Consultas SQL Avanzadas",
    course: "Bases de Datos",
    type: "Archivo",
    aiGrade: "9.5",
    submission: "Archivo adjunto con consultas de JOIN, subconsultas y agregaciones, todas correctas.",
    aiFeedback: "Trabajo sobresaliente, cubre todos los casos pedidos con buena legibilidad.",
  },
];

export const MOCK_RUBRIC_CRITERIA: RubricCriterion[] = [
  { name: "Corrección de conceptos", weight: "40%", level: "Excelente" },
  { name: "Claridad de explicación", weight: "30%", level: "Bueno" },
  { name: "Uso de ejemplos", weight: "20%", level: "Regular" },
  { name: "Estilo de código", weight: "10%", level: "Bueno" },
];

export const MOCK_RUBRICS: Rubric[] = [
  { name: "TP Programación", criteriaCount: 4, activitiesCount: 3 },
  { name: "Parcial teórico", criteriaCount: 3, activitiesCount: 1 },
  { name: "Código SQL", criteriaCount: 5, activitiesCount: 2 },
];
