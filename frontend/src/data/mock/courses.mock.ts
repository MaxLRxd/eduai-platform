import type { Course } from "../../types/domain";

// Datos de ejemplo — misma info que STUDENT_COURSES en la maqueta.
// TODO(backend): reemplazar por GET /api/courses cuando exista materials.service.ts.
export const MOCK_COURSES: Course[] = [
  {
    id: "prog2",
    name: "Programación II",
    professor: "Prof. Martínez",
    progress: 67,
    students: 48,
    rating: "4.5",
    color: "#003d7a",
    intro: "Espacio de cursado con materiales, actividades y tutor IA entrenado con la planificación del docente.",
    tutorFocus: "programación orientada a objetos, clases, objetos, herencia, polimorfismo y trabajos prácticos cargados por el docente",
    units: [
      { title: "Unidad 1 · Clases y objetos", status: "Disponible", items: ["Presentación: conceptos de POO", "Guía de ejercicios resueltos", "Foro de dudas de la unidad"] },
      { title: "Unidad 2 · Herencia y polimorfismo", status: "En curso", items: ["PDF: jerarquías de clases", "Actividad: modelar una biblioteca", "Autoevaluación con devolución"] },
      { title: "Unidad 3 · Interfaces y clases abstractas", status: "Próxima", items: ["Material habilitado por fecha", "Ejemplos en Java", "Trabajo integrador"] },
    ],
    latest: ["TP3 — Herencia y Polimorfismo", "Resumen docente: diferencias entre clase abstracta e interfaz", "Archivo: Guia_actividades.docx"],
  },
  {
    id: "db",
    name: "Bases de Datos",
    professor: "Prof. García",
    progress: 85,
    students: 35,
    rating: "4.8",
    color: "#059669",
    intro: "Aula virtual con consultas SQL, actividades prácticas y materiales de modelado de datos.",
    tutorFocus: "modelo entidad-relación, consultas SQL, joins, claves primarias, claves foráneas y normalización",
    units: [
      { title: "Unidad 1 · Modelo entidad-relación", status: "Completada", items: ["Video: entidades y atributos", "Lectura: cardinalidad", "Práctica: diseño de DER"] },
      { title: "Unidad 2 · SQL básico y avanzado", status: "En curso", items: ["Guía SELECT, WHERE y ORDER BY", "Actividad: consultas con JOIN", "Banco de ejercicios"] },
      { title: "Unidad 3 · Normalización", status: "Disponible", items: ["Apunte 1FN, 2FN y 3FN", "Casos para analizar", "Cuestionario de repaso"] },
    ],
    latest: ["Consultas SQL Avanzadas", "Archivo: DER_ejemplos.pdf", "Rúbrica del parcial práctico"],
  },
  {
    id: "redes",
    name: "Redes de Computadoras",
    professor: "Prof. López",
    progress: 72,
    students: 42,
    rating: "4.2",
    color: "#d97706",
    intro: "Material organizado por capas, protocolos y prácticas de análisis de red.",
    tutorFocus: "modelo OSI, TCP/IP, direccionamiento IP, protocolos y prácticas cargadas por el profesor",
    units: [
      { title: "Unidad 1 · Modelo OSI", status: "Completada", items: ["Infografía de las 7 capas", "Guía de lectura", "Preguntas de repaso"] },
      { title: "Unidad 2 · TCP/IP", status: "En curso", items: ["Cuadro comparativo OSI/TCP-IP", "Actividad: identificar protocolos", "Simulación de paquetes"] },
      { title: "Unidad 3 · Direccionamiento IP", status: "Disponible", items: ["Apunte IPv4", "Ejercicios de subredes", "Práctica integradora"] },
    ],
    latest: ["Protocolo TCP/IP", "Archivo: modelo_OSI.pdf", "Actividad: análisis de red doméstica"],
  },
  {
    id: "discreta",
    name: "Matemática Discreta",
    professor: "Prof. Sánchez",
    progress: 60,
    students: 38,
    rating: "4.6",
    color: "#7c3aed",
    intro: "Curso con teoría, ejemplos resueltos y actividades de práctica progresiva.",
    tutorFocus: "lógica proposicional, conjuntos, combinatoria, grafos y ejercicios habilitados por la cátedra",
    units: [
      { title: "Unidad 1 · Lógica proposicional", status: "Disponible", items: ["Apunte: conectores lógicos", "Ejercicios con tablas de verdad", "Autoevaluación"] },
      { title: "Unidad 2 · Conjuntos y relaciones", status: "En curso", items: ["Presentación de conjuntos", "Problemas de pertenencia e inclusión", "Guía práctica"] },
      { title: "Unidad 3 · Combinatoria", status: "Próxima", items: ["Material pendiente de habilitación", "Ejemplos de conteo", "Trabajo práctico"] },
    ],
    latest: ["Ejercicios de Lógica", "Archivo: tablas_verdad.pdf", "Cuestionario de práctica"],
  },
];
