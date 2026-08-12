import type { FrequentError, FrequentQuestion, RiskAlert, TopicUnderstanding } from "../../types/domain";

export const MOCK_TOPIC_UNDERSTANDING: TopicUnderstanding[] = [
  { topic: "Clases y objetos", level: "Dominado" },
  { topic: "Herencia", level: "En proceso" },
  { topic: "Polimorfismo", level: "Crítico" },
  { topic: "Interfaces", level: "Crítico" },
  { topic: "Encapsulamiento", level: "Dominado" },
  { topic: "Colecciones", level: "En proceso" },
  { topic: "Excepciones", level: "En proceso" },
  { topic: "Hilos", level: "Crítico" },
  { topic: "JDBC", level: "En proceso" },
  { topic: "Patrones", level: "Crítico" },
  { topic: "Testing", level: "Dominado" },
  { topic: "Lambda", level: "En proceso" },
];

export const MOCK_RISK_ALERTS: RiskAlert[] = [
  { name: "Cardozo, Juan", issue: "Promedio 6.1 · Asistencia 72%", risk: "Alto" },
  { name: "Díaz, Lucas", issue: "Promedio 6.5 · Sin entregar TP3", risk: "Medio" },
  { name: "Flores, Román", issue: "Sin interacciones con el tutor IA", risk: "Medio" },
];

export const MOCK_FREQUENT_ERRORS: FrequentError[] = [
  { rank: 1, description: "Confundir sobrescritura con sobrecarga", studentCount: 14, topics: "Polimorfismo, Herencia" },
  { rank: 2, description: "No manejar excepciones en JDBC", studentCount: 11, topics: "JDBC, Excepciones" },
  { rank: 3, description: "Usar == en lugar de .equals() para Strings", studentCount: 9, topics: "Clases y objetos" },
  { rank: 4, description: "Confundir clase abstracta con interfaz", studentCount: 8, topics: "Interfaces, Diseño OOP" },
  { rank: 5, description: "No implementar todos los métodos de la interfaz", studentCount: 6, topics: "Interfaces" },
];

export const MOCK_FREQUENT_QUESTIONS: FrequentQuestion[] = [
  { question: "¿Cuál es la diferencia entre clase abstracta e interfaz?", count: 23 },
  { question: "¿Cómo funciona el polimorfismo en Java?", count: 18 },
  { question: "¿Qué es el método equals() y por qué usarlo?", count: 15 },
  { question: "¿Cómo se maneja una excepción con try-catch?", count: 12 },
  { question: "¿Cuándo usar herencia vs composición?", count: 9 },
];
