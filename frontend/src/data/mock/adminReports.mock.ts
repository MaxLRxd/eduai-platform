import type { ReportCard } from "../../types/domain";

export const MOCK_REPORTS: ReportCard[] = [
  { title: "📊 Asistencia general", description: "Asistencia promedio por materia y período", actionLabel: "Exportar" },
  { title: "📈 Notas y rendimiento", description: "Distribución de calificaciones por curso", actionLabel: "Exportar" },
  { title: "🤖 Uso Tutor IA", description: "Consultas, materias más consultadas y sesiones activas", actionLabel: "Exportar" },
  { title: "👥 Retención de alumnos", description: "Tasa de retención, bajas y reingresos", actionLabel: "Exportar" },
  { title: "🔑 Consumo MAU", description: "Detalle de alumnos activos por período", actionLabel: "Exportar" },
  { title: "📋 Resumen ejecutivo", description: "Informe completo para dirección institucional", actionLabel: "Generar" },
];
