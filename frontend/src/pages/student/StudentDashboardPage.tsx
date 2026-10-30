import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCourses } from "../../hooks/useCourses";
import { useDashboard } from "../../hooks/useDashboard";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Tag } from "../../components/ui/Tag";
import { tasaAsistencia } from "../../utils/asistencia";

function formatDue(iso: string): string {
  const f = new Date(iso);
  return Number.isNaN(f.getTime())
    ? iso
    : f.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function vencida(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

export function StudentDashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: courses } = useCourses();
  const { data: dashboard } = useDashboard(user?.role);

  const d = dashboard?.rol === "ALUMNO" ? dashboard.data : undefined;
  const upcoming = d?.proximasActividades ?? [];
  const asistencia = tasaAsistencia(d?.asistencia);
  const progresoPorMateria = new Map((d?.materias ?? []).map((m) => [m.id, m.progreso]));
  const hoy = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">
          Bienvenido, {user?.name}
        </h2>
        <p className="text-[13px] text-text-2 capitalize">
          {hoy}
          {d ? ` · ${d.resumen.materias} ${d.resumen.materias === 1 ? "materia" : "materias"}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="progress" label="Promedio general" value={d && d.materias.some((m) => m.promedio !== null) ? d.resumen.promedioGlobal : "—"} meta="Todos los periodos" accent="#003d7a" accentLight="#dbeafe" />
        <StatCard icon="attendance" label="Asistencia" value={asistencia !== null ? `${asistencia}%` : "—"} meta={asistencia !== null ? "Basado en registros de clase" : "Sin registros todavía"} accent="#059669" accentLight="#d1fae5" />
        <StatCard icon="assignments" label="Entregas pendientes" value={d?.resumen.entregasPendientes ?? 0} meta="Actividades sin entregar" accent="#2563eb" accentLight="#dbeafe" />
        <StatCard icon="grades" label="Alertas activas" value={d?.resumen.alertasActivas ?? 0} meta="Atención académica" accent="#d97706" accentLight="#fef3c7" />
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
            {(courses ?? []).slice(0, 3).map((c) => {
              const progreso = progresoPorMateria.get(c.id) ?? 0;
              return (
                <div key={c.id}>
                  <div className="flex justify-between mb-1.5">
                    <span className="font-semibold text-[13px]">{c.name}</span>
                    <span className="text-xs text-text-3">
                      <strong style={{ color: c.color }}>{progreso}%</strong>
                    </span>
                  </div>
                  <ProgressBar value={progreso} color={c.color} />
                </div>
              );
            })}
            {d && d.materias.length > 0 && (
              <div className="mt-1 pt-3.5 border-t border-border flex flex-col gap-2">
                {d.materias.map((m) => (
                  <div key={m.id} className="flex justify-between text-[12.5px]">
                    <span className="text-text-2">{m.nombre}</span>
                    <strong className="text-text-1">{m.promedio ?? "—"}</strong>
                  </div>
                ))}
              </div>
            )}
            {(courses ?? []).length === 0 && (
              <div className="py-4 text-[12px] text-text-3 text-center">Todavía no tenés materias asignadas.</div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Próximas actividades" />
          <div className="flex flex-col">
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-warning" />
                <div>
                  <div className="text-[13px] font-medium text-text-1">{a.nombre}</div>
                  <div className="text-[11px] text-text-3 mt-0.5 flex items-center gap-1.5">
                    {a.materia} · <Tag color={vencida(a.fecha_limite) ? "red" : "amber"}>{vencida(a.fecha_limite) ? "Vencida" : "Vence"} · {formatDue(a.fecha_limite)}</Tag>
                  </div>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <div className="py-4 text-[12px] text-text-3 text-center">No tenés entregas pendientes. Todo al día.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
