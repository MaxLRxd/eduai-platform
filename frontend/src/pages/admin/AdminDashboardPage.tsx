import React from "react";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { InfoBox } from "../../components/ui/InfoBox";

const TOP_SUBJECTS = [
  { name: "Programación II", meta: "48 alumnos", value: 92, color: "#003d7a" },
  { name: "Bases de Datos", meta: "35 alumnos", value: 85, color: "#059669" },
  { name: "Matemática Discreta", meta: "52 alumnos", value: 78, color: "#7c3aed" },
  { name: "Redes", meta: "30 alumnos", value: 65, color: "#d97706" },
];

export function AdminDashboardPage(): React.ReactElement {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Panel institucional</h2>
        <p className="text-[13px] text-text-2">IES Santa Fe · Vista general del sistema</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="materias" label="Materias activas" value="12" meta="1 pendiente de asignar" accent="#003d7a" accentLight="#dbeafe" />
        <StatCard icon="usuarios" label="Docentes" value="8" meta="Todos activos" accent="#059669" accentLight="#d1fae5" />
        <StatCard icon="students" label="Alumnos totales" value="342" meta="+18 este mes" accent="#2563eb" accentLight="#dbeafe" />
        <StatCard icon="analytics" label="MAU este mes" value="298" meta="Plan Growth · 59.6%" accent="#d97706" accentLight="#fef3c7" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Materias más activas" />
          <div className="flex flex-col gap-3">
            {TOP_SUBJECTS.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between mb-1.5">
                  <span className="font-semibold text-[13px]">{s.name}</span>
                  <span className="text-xs text-text-3">
                    {s.meta} · <strong style={{ color: s.color }}>{s.value}%</strong>
                  </span>
                </div>
                <ProgressBar value={s.value} color={s.color} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Métricas institucionales" />
          <div className="mb-3.5">
            <div className="text-xs text-text-2 mb-1">Uso del Tutor IA</div>
            <div className="font-display text-3xl font-extrabold text-success">
              47<span className="text-sm font-medium">%</span>
            </div>
            <div className="mt-2">
              <InfoBox variant="info">✓ Supera objetivo institucional (40%)</InfoBox>
            </div>
          </div>
          <div className="h-px bg-border my-3.5" />
          <div className="flex justify-between gap-4">
            <div>
              <div className="text-[11px] text-text-2 mb-1">Retención</div>
              <div className="font-display text-xl font-extrabold text-success">76%</div>
            </div>
            <div>
              <div className="text-[11px] text-text-2 mb-1">Objetivo</div>
              <div className="font-display text-xl font-extrabold text-text-3">70%</div>
            </div>
            <div>
              <div className="text-[11px] text-text-2 mb-1">Satisfacción</div>
              <div className="font-display text-xl font-extrabold text-info">4.6⭐</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
