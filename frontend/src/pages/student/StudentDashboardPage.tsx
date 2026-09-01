import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCourses } from "../../hooks/useCourses";
import { useDashboard } from "../../hooks/useDashboard";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Tag } from "../../components/ui/Tag";

const UPCOMING = [
  { title: "📝 Entrega TP3", course: "Programación II", when: "Mañana", color: "amber" as const },
  { title: "🧪 Parcial Teórico", course: "Bases de Datos", when: "En 3 días", color: "blue" as const },
  { title: "💬 Debate grupal", course: "Redes", when: "En 5 días", color: "gray" as const },
];

function tasaAsistencia(asistencia: { estado: string; count: number }[] | undefined): number {
  if (!asistencia || asistencia.length === 0) return 0;
  const total = asistencia.reduce((sum, a) => sum + a.count, 0);
  if (total === 0) return 0;
  const presente = (asistencia.find((a) => a.estado === "PRESENTE")?.count ?? 0) +
    (asistencia.find((a) => a.estado === "TARDANZA")?.count ?? 0);
  return Math.round((presente / total) * 100);
}

export function StudentDashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: courses } = useCourses();
  const { data: dashboard } = useDashboard(user?.role);

  const d = dashboard?.rol === "ALUMNO" ? dashboard.data : undefined;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">
          Bienvenido, {user?.name} 👋
        </h2>
        <p className="text-[13px] text-text-2">Semestre 2024 · Tecnicatura en Desarrollo de Software · IES Santa Fe</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="progress" label="Promedio general" value={d?.resumen.promedioGlobal ?? "—"} meta="Todos los periodos" accent="#003d7a" accentLight="#dbeafe" />
        <StatCard icon="attendance" label="Asistencia" value={d ? `${tasaAsistencia(d.asistencia)}%` : "—"} meta="Basado en registros de clase" accent="#059669" accentLight="#d1fae5" />
        <StatCard icon="assignments" label="Entregas pendientes" value={d?.resumen.entregasPendientes ?? "—"} meta="Sin corregir" accent="#2563eb" accentLight="#dbeafe" />
        <StatCard icon="grades" label="Alertas activas" value={d?.resumen.alertasActivas ?? "—"} meta="Atención académica" accent="#d97706" accentLight="#fef3c7" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader
            title="Cursos activos"
            action={
              <button className="text-xs font-semibold text-primary hover:text-primary-hover" onClick={() => navigate("/student/courses")}>
                Ver todos →
              </button>
            }
          />
          <div className="flex flex-col gap-3.5">
            {(courses ?? []).slice(0, 3).map((c) => (
              <div key={c.id}>
                <div className="flex justify-between mb-1.5">
                  <span className="font-semibold text-[13px]">{c.name}</span>
                  <span className="text-xs text-text-3">
                    <strong style={{ color: c.color }}>{c.progress}%</strong>
                  </span>
                </div>
                <ProgressBar value={c.progress} color={c.color} />
              </div>
            ))}
            {d && d.materias.length > 0 && (
              <div className="mt-1 pt-3.5 border-t border-border flex flex-col gap-2">
                {d.materias.map((m) => (
                  <div key={m.id} className="flex justify-between text-[12.5px]">
                    <span className="text-text-2">{m.nombre}</span>
                    <strong className="text-text-1">{m.promedio != null ? m.promedio : "—"}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Próximas actividades" />
          <div className="flex flex-col">
            {UPCOMING.map((a) => (
              <div key={a.title} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-warning" />
                <div>
                  <div className="text-[13px] font-medium text-text-1">{a.title}</div>
                  <div className="text-[11px] text-text-3 mt-0.5 flex items-center gap-1.5">
                    {a.course} · <Tag color={a.color === "amber" ? "amber" : a.color === "blue" ? "blue" : "gray"}>{a.when}</Tag>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
