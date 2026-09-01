import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";

export function TeacherDashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const { data: dashboard } = useDashboard(user?.role);

  const d = dashboard?.rol === "PROFESOR" ? dashboard.data : undefined;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Panel docente</h2>
        <p className="text-[13px] text-text-2">Hola, {user?.name} · {d?.materias.length ?? 0} materias a cargo</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="students" label="Estudiantes" value={d?.resumen.alumnos ?? "—"} meta="Total inscriptos" accent="#003d7a" accentLight="#dbeafe" />
        <StatCard icon="assignments" label="Actividades" value={d?.resumen.actividades ?? "—"} meta="Publicadas" accent="#059669" accentLight="#d1fae5" />
        <StatCard icon="corrections" label="Por calificar" value={d?.resumen.entregasPendientes ?? "—"} meta="Entregas sin corregir" accent="#d97706" accentLight="#fef3c7" />
        <StatCard icon="grades" label="Alertas activas" value={d?.resumen.alertasActivas ?? "—"} meta="Atención académica" accent="#2563eb" accentLight="#dbeafe" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Mis materias" />
          <div className="flex flex-col">
            {(d?.materias ?? []).map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div>
                  <div className="text-[13px] font-medium text-text-1">{m.nombre}</div>
                  <div className="text-[11px] text-text-3 mt-0.5">{m.nivel_educativo}</div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-bold text-text-1">{m.inscriptos}</div>
                  <div className="text-[11px] text-text-3">alumnos · {m.secciones} secc. · {m.actividades} act.</div>
                </div>
              </div>
            ))}
            {d && d.materias.length === 0 && <div className="py-4 text-[12px] text-text-3 text-center">Sin materias asignadas</div>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Resumen de secciones" />
          <div className="flex flex-col gap-3">
            {(d?.materias ?? []).map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-text-1">{m.nombre}</span>
                <span className="text-xs text-text-3">
                  {m.secciones} secciones · {m.inscriptos} inscriptos
                </span>
              </div>
            ))}
            {d && d.materias.length === 0 && <div className="py-4 text-[12px] text-text-3 text-center">Sin datos</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
