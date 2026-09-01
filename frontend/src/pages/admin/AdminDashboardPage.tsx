import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { ProgressBar } from "../../components/ui/ProgressBar";

export function AdminDashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const { data: dashboard } = useDashboard(user?.role);

  const d = dashboard?.rol === "ADMIN" ? dashboard.data : undefined;
  const alumnos = d?.resumen.usuarios.find((u) => u.rol === "ALUMNO")?.count ?? 0;
  const docentes = d?.resumen.usuarios.find((u) => u.rol === "PROFESOR")?.count ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Panel institucional</h2>
        <p className="text-[13px] text-text-2">IES Santa Fe · Vista general del sistema</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="materias" label="Materias activas" value={d?.resumen.materias ?? "—"} meta="Registradas en el sistema" accent="#003d7a" accentLight="#dbeafe" />
        <StatCard icon="usuarios" label="Docentes" value={docentes || "—"} meta="Cuentas activas" accent="#059669" accentLight="#d1fae5" />
        <StatCard icon="students" label="Alumnos totales" value={alumnos || "—"} meta="Inscriptos" accent="#2563eb" accentLight="#dbeafe" />
        <StatCard icon="grades" label="Por calificar" value={d?.resumen.entregasPendientes ?? "—"} meta="Entregas sin corregir" accent="#d97706" accentLight="#fef3c7" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Inscripciones" />
          <div className="flex flex-col gap-3">
            {(d?.resumen.usuarios ?? []).map((u) => (
              <div key={u.rol}>
                <div className="flex justify-between mb-1.5">
                  <span className="font-semibold text-[13px] capitalize">{u.rol.toLowerCase()}s</span>
                  <span className="text-xs text-text-3">
                    <strong style={{ color: "#003d7a" }}>{u.count}</strong>
                  </span>
                </div>
                <ProgressBar value={u.count} color="#003d7a" />
              </div>
            ))}
            <div className="mt-1 pt-3.5 border-t border-border flex flex-col gap-2 text-[12.5px]">
              <div className="flex justify-between"><span className="text-text-2">Inscripciones totales</span><strong className="text-text-1">{d?.resumen.inscripciones ?? "—"}</strong></div>
              <div className="flex justify-between"><span className="text-text-2">Alertas activas</span><strong className="text-text-1">{d?.resumen.alertasActivas ?? "—"}</strong></div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Métricas institucionales" />
          <div className="mb-3.5">
            <div className="text-xs text-text-2 mb-1">Entregas pendientes</div>
            <div className="font-display text-3xl font-extrabold text-success">
              {d?.resumen.entregasPendientes ?? "—"}
            </div>
            <div className="mt-2 text-[11px] text-text-3">Suma de entregas sin corregir en todas las materias</div>
          </div>
          <div className="h-px bg-border my-3.5" />
          <div className="flex justify-between gap-4">
            <div>
              <div className="text-[11px] text-text-2 mb-1">Materias</div>
              <div className="font-display text-xl font-extrabold text-success">{d?.resumen.materias ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px] text-text-2 mb-1">Docentes</div>
              <div className="font-display text-xl font-extrabold text-text-3">{docentes || "—"}</div>
            </div>
            <div>
              <div className="text-[11px] text-text-2 mb-1">Alumnos</div>
              <div className="font-display text-xl font-extrabold text-info">{alumnos || "—"}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
