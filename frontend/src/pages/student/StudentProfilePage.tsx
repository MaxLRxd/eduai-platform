import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardHeader } from "../../components/ui/Card";
import { FormField } from "../../components/ui/FormField";
import { Button } from "../../components/ui/Button";
import { Tag } from "../../components/ui/Tag";
import { InfoBox } from "../../components/ui/InfoBox";

const SUMMARY = [
  { label: "Asistencia", value: "96%", color: "#059669" },
  { label: "Entregas", value: "24", color: "#003d7a" },
  { label: "Pendientes", value: "3", color: "#d97706" },
  { label: "Cursos activos", value: "4", color: "#7c3aed" },
];

const NOTIFICATIONS = [
  { title: "Recordatorios de entrega", desc: "Avisame antes de que venza un trabajo", checked: true },
  { title: "Calificaciones publicadas", desc: "Notificarme cuando se cargue una nueva nota", checked: true },
  { title: "Novedades del Tutor IA", desc: "Actualizaciones y sugerencias del asistente", checked: false },
];

export function StudentProfilePage(): React.ReactElement {
  const { user } = useAuth();
  const initials = `${user?.name[0] ?? ""}${user?.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Mi perfil</h2>
        <p className="text-[13px] text-text-2">Información personal, seguridad y preferencias de tu cuenta</p>
      </div>

      <Card className="mb-5">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-display text-2xl font-extrabold text-white shrink-0 shadow">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl font-extrabold text-text-1">
              {user?.name} {user?.lastName}
            </div>
            <div className="text-[13px] text-text-2 mt-0.5">Estudiante · Tecnicatura en Desarrollo de Software</div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Tag color="blue">Legajo P-2024-001</Tag>
              <Tag color="green">Activo</Tag>
              <Tag color="gray">Sem. 3 · 2024</Tag>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] text-text-3 mb-1">Promedio general</div>
            <div className="font-display text-3xl font-extrabold text-primary">8.5</div>
            <div className="text-[11px] text-text-3">/10</div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Datos personales" />
          <div className="grid grid-cols-2 gap-3 mb-1">
            <FormField id="name" label="Nombre" defaultValue={user?.name} />
            <FormField id="lastName" label="Apellido" defaultValue={user?.lastName} />
          </div>
          <FormField id="email" label="Email institucional" type="email" defaultValue={`${user?.username}@ies.edu.ar`} />
          <FormField id="phone" label="Teléfono de contacto" type="tel" defaultValue="+54 9 342 555-0123" />
          <FormField id="legajo" label="Legajo (solo lectura)" defaultValue="P-2024-001" readOnly className="bg-surface-2 text-text-2" />
          <Button size="sm">Guardar cambios</Button>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Seguridad" />
            <InfoBox variant="info">Usá una contraseña de al menos 8 caracteres combinando letras y números.</InfoBox>
            <FormField id="current-password" label="Contraseña actual" type="password" placeholder="••••••••" />
            <FormField id="new-password" label="Nueva contraseña" type="password" placeholder="••••••••" />
            <FormField id="confirm-password" label="Confirmar nueva contraseña" type="password" placeholder="••••••••" />
            <Button variant="secondary" size="sm">
              Cambiar contraseña
            </Button>
          </Card>

          <Card>
            <CardHeader title="Notificaciones" />
            {NOTIFICATIONS.map((n) => (
              <div key={n.title} className="flex justify-between items-start py-2.5 border-b border-border last:border-0">
                <div>
                  <div className="text-[13px] font-semibold">{n.title}</div>
                  <div className="text-[11px] text-text-2 mt-0.5">{n.desc}</div>
                </div>
                <input type="checkbox" defaultChecked={n.checked} className="ml-3 shrink-0" />
              </div>
            ))}
          </Card>
        </div>
      </div>

      <Card className="mt-1">
        <CardHeader title="Resumen académico" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {SUMMARY.map((s) => (
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
