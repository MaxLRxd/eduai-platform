import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardHeader } from "../../components/ui/Card";
import { FormField } from "../../components/ui/FormField";
import { Button } from "../../components/ui/Button";
import { Tag } from "../../components/ui/Tag";
import { InfoBox } from "../../components/ui/InfoBox";

const SUMMARY = [
  { label: "Estudiantes", value: "48", color: "#003d7a" },
  { label: "Asist. promedio", value: "94%", color: "#059669" },
  { label: "Por calificar", value: "12", color: "#d97706" },
  { label: "Promedio clase", value: "8.3", color: "#7c3aed" },
];

const NOTIFICATIONS = [
  { title: "Entregas de estudiantes", desc: "Notificarme por email cuando un alumno entregue trabajo", checked: true },
  { title: "Mensajes directos", desc: "Notificarme cuando reciba un nuevo mensaje", checked: true },
  { title: "Alertas académicas", desc: "Alumnos con asistencia o notas en riesgo", checked: false },
  { title: "Resumen semanal", desc: "Recibir reporte semanal de actividad del curso", checked: true },
];

export function TeacherProfilePage(): React.ReactElement {
  const { user } = useAuth();
  const initials = `${user?.name[0] ?? ""}${user?.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Mi perfil</h2>
        <p className="text-[13px] text-text-2">Información docente, seguridad y preferencias de notificación</p>
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
            <div className="text-[13px] text-text-2 mt-0.5">Docente titular · Programación II · Turno mañana</div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Tag color="blue">Leg. D-0042</Tag>
              <Tag color="green">Activo</Tag>
              <Tag color="purple">48 estudiantes</Tag>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] text-text-3 mb-1">Promedio clase</div>
            <div className="font-display text-3xl font-extrabold text-primary">8.3</div>
            <div className="text-[11px] text-text-3">/10</div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Datos del docente" />
          <div className="grid grid-cols-2 gap-3 mb-1">
            <FormField id="name" label="Nombre" defaultValue={user?.name} />
            <FormField id="lastName" label="Apellido" defaultValue={user?.lastName} />
          </div>
          <FormField id="email" label="Email institucional" type="email" defaultValue={`${user?.username}@ies.edu.ar`} />
          <FormField id="phone" label="Teléfono de contacto" type="tel" defaultValue="+54 9 342 555-0199" />
          <FormField id="legajo" label="Legajo docente (solo lectura)" defaultValue="D-0042" readOnly className="bg-surface-2 text-text-2" />
          <FormField id="materia" label="Materia principal (solo lectura)" defaultValue="Programación II" readOnly className="bg-surface-2 text-text-2" />
          <FormField id="titulo" label="Título / Formación" defaultValue="Lic. en Ciencias de la Computación (UNL)" />
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
        <CardHeader title="Resumen de actividad" />
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
