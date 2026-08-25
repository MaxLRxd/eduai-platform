import React from "react";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";

const UPCOMING_CLASSES = [
  { title: "Tema 6: Polimorfismo", when: "15/04/2024 · 09:00", relative: "En 2 días" },
  { title: "Tema 7: Genéricos", when: "17/04/2024 · 09:00", relative: "En 4 días" },
  { title: "Parcial 1", when: "22/04/2024 · 09:00", relative: "En 9 días" },
];

const GRADE_DISTRIBUTION = [
  { value: 8, label: "9-10", color: "#003d7a" },
  { value: 16, label: "8-8.9", color: "#059669" },
  { value: 14, label: "7-7.9", color: "#d97706" },
  { value: 8, label: "< 7", color: "#dc2626" },
  { value: 2, label: "S/N", color: "#94a3b8" },
];

export function TeacherDashboardPage(): React.ReactElement {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Panel docente</h2>
        <p className="text-[13px] text-text-2">Programación II · Turno mañana · Prof. Martínez</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="students" label="Estudiantes" value="48" meta="2 en situación de riesgo" accent="#003d7a" accentLight="#dbeafe" />
        <StatCard icon="attendance" label="Asistencia prom." value="94%" meta="Última clase: 100%" accent="#059669" accentLight="#d1fae5" />
        <StatCard icon="progress" label="Promedio clase" value="8.3" meta="↑ mejora sostenida" accent="#2563eb" accentLight="#dbeafe" />
        <StatCard icon="corrections" label="Por calificar" value="12" meta="Vence en 3 días" accent="#d97706" accentLight="#fef3c7" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Próximas clases" />
          <div className="flex flex-col">
            {UPCOMING_CLASSES.map((c) => (
              <div key={c.title} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-primary" />
                <div>
                  <div className="text-[13px] font-medium text-text-1">{c.title}</div>
                  <div className="text-[11px] text-text-3 mt-0.5">
                    {c.when} · {c.relative}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Distribución de notas" />
          <div className="flex gap-2 items-end h-20 mb-2.5" role="img" aria-label="Gráfico de distribución de calificaciones">
            {GRADE_DISTRIBUTION.map((d) => (
              <div key={d.label} className="flex-1 text-center flex flex-col justify-end gap-1">
                <div className="w-full rounded-t" style={{ background: d.color, height: `${d.value * 4}px` }} />
                <div className="text-[11px] font-bold text-text-1">{d.value}</div>
                <div className="text-[9px] text-text-3">{d.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
