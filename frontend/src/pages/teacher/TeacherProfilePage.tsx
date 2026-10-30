import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";
import { Card, CardHeader } from "../../components/ui/Card";
import { FormField } from "../../components/ui/FormField";
import { Tag } from "../../components/ui/Tag";
import { ChangePasswordCard } from "../../components/profile/ChangePasswordCard";

export function TeacherProfilePage(): React.ReactElement {
  const { user } = useAuth();
  const { data: dashboard } = useDashboard(user?.role);
  const d = dashboard?.rol === "PROFESOR" ? dashboard.data : undefined;

  const initials = `${user?.name?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const summary = [
    { label: "Materias", value: String(d?.resumen.materias ?? "—"), color: "#003d7a" },
    { label: "Estudiantes", value: String(d?.resumen.alumnos ?? "—"), color: "#059669" },
    { label: "Por calificar", value: String(d?.resumen.entregasPendientes ?? "—"), color: "#d97706" },
    { label: "Actividades", value: String(d?.resumen.actividades ?? "—"), color: "#7c3aed" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Mi perfil</h2>
        <p className="text-[13px] text-text-2">Información docente y seguridad</p>
      </div>

      <Card className="mb-5">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-display text-2xl font-extrabold text-white shrink-0 shadow">
            {initials || (user?.name?.[0] ?? "")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl font-extrabold text-text-1">
              {user?.name} {user?.lastName}
            </div>
            <div className="text-[13px] text-text-2 mt-0.5">Docente · {user?.username ?? "-"}</div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Tag color="green">Activo</Tag>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Datos del docente" />
          <FormField id="name" label="Nombre" value={user?.name ?? ""} readOnly className="bg-surface-2 text-text-2" />
          <FormField
            id="email"
            label="Email institucional"
            type="email"
            value={user?.username ?? ""}
            readOnly
            className="bg-surface-2 text-text-2"
          />
          <p className="text-[11px] text-text-3">
            Para modificar tu nombre o email, pedíselo a un administrador de tu institución.
          </p>
        </Card>

        <ChangePasswordCard />
      </div>

      <Card className="mt-5">
        <CardHeader title="Resumen de actividad" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {summary.map((s) => (
            <div key={s.label} className="p-4 bg-surface-2 rounded border border-border">
              <div className="font-display text-2xl font-extrabold" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-[11px] text-text-2 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
