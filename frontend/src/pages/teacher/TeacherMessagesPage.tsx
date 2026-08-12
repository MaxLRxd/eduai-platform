import React, { useState } from "react";
import { useTeacherCourses } from "../../hooks/useTeacherCourses";
import { useInbox, useSendBroadcast, useSendMessage } from "../../hooks/useMessages";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { InfoBox } from "../../components/ui/InfoBox";

export function TeacherMessagesPage(): React.ReactElement {
  const { data: inbox } = useInbox();
  const { data: courses } = useTeacherCourses();
  const sendMessage = useSendMessage();
  const sendBroadcast = useSendBroadcast();

  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const totalStudents = (courses ?? []).reduce((acc, c) => acc + c.studentNames.length, 0);
  const recipientsLabel =
    broadcastTarget === "all"
      ? `📣 Se enviará a todos los cursos: ${totalStudents} alumnos en total`
      : `📚 Se enviará a ${courses?.find((c) => c.id === broadcastTarget)?.studentNames.length ?? 0} alumnos`;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Mensajes</h2>
        <p className="text-[13px] text-text-2">Comunicaciones individuales y difusión a cursos</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border font-display text-sm font-bold">
            Bandeja de entrada <span className="ml-1.5 bg-danger text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full">{inbox?.filter((m) => m.unread).length ?? 0}</span>
          </div>
          {(inbox ?? []).map((m) => (
            <div key={m.id} className={`px-5 py-3.5 border-b border-border last:border-0 cursor-pointer ${m.unread ? "bg-sky-50" : ""}`}>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className={`text-[13px] ${m.unread ? "font-bold" : "font-medium"} text-text-1`}>{m.from}</div>
                  <div className="text-xs text-text-2 mt-0.5">{m.subject}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[11px] text-text-3">{m.when}</span>
                  {m.unread && <span className="w-2 h-2 bg-info rounded-full" />}
                </div>
              </div>
            </div>
          ))}
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="✉️ Mensaje individual" />
            <div className="mb-3.5">
              <label htmlFor="msg-to" className="block text-xs font-semibold text-text-1 mb-1.5">
                Para
              </label>
              <select id="msg-to" className="w-full px-3 py-2 border border-border rounded text-sm bg-surface">
                <option value="">— Seleccioná un estudiante —</option>
                {["Acevedo, Lautaro", "Báez, María", "Cardozo, Juan", "Díaz, Lucas", "Espinoza, Ana"].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="mb-3.5">
              <label htmlFor="msg-subject" className="block text-xs font-semibold text-text-1 mb-1.5">
                Asunto
              </label>
              <input id="msg-subject" placeholder="Asunto del mensaje" className="w-full px-3 py-2 border border-border rounded text-sm" />
            </div>
            <div className="mb-3.5">
              <label htmlFor="msg-body" className="block text-xs font-semibold text-text-1 mb-1.5">
                Mensaje
              </label>
              <textarea id="msg-body" rows={3} placeholder="Escribí tu mensaje..." className="w-full px-3 py-2 border border-border rounded text-sm" />
            </div>
            <Button size="sm" onClick={() => sendMessage.mutate()} disabled={sendMessage.isPending}>
              {sendMessage.isPending ? "Enviando…" : "Enviar mensaje"}
            </Button>
            {sendMessage.isSuccess && <p className="text-xs text-success mt-2">📨 Mensaje enviado</p>}
          </Card>

          <Card className="border-[1.5px] border-primary bg-primary-light">
            <CardHeader title={<span className="text-primary">📢 Difusión a curso</span>} />
            <InfoBox variant="info">Enviá un mensaje a todos los alumnos de un curso o a toda la institución.</InfoBox>
            <div className="mb-3.5">
              <label htmlFor="broadcast-target" className="block text-xs font-semibold text-text-1 mb-1.5">
                Destinatarios
              </label>
              <select
                id="broadcast-target"
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
              >
                <option value="all">📣 Todos mis cursos</option>
                {(courses ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    📚 {c.label} — {c.curso}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-primary font-semibold mb-2.5 px-2.5 py-1.5 bg-white rounded-sm border border-primary">{recipientsLabel}</div>
            <div className="mb-3.5">
              <label htmlFor="broadcast-subject" className="block text-xs font-semibold text-text-1 mb-1.5">
                Asunto de la difusión
              </label>
              <input id="broadcast-subject" placeholder="Ej.: Recordatorio de entrega TP3" className="w-full px-3 py-2 border border-border rounded text-sm" />
            </div>
            <div className="mb-3.5">
              <label htmlFor="broadcast-body" className="block text-xs font-semibold text-text-1 mb-1.5">
                Mensaje
              </label>
              <textarea id="broadcast-body" rows={3} placeholder="Escribí el mensaje de difusión..." className="w-full px-3 py-2 border border-border rounded text-sm" />
            </div>
            <Button size="sm" onClick={() => sendBroadcast.mutate()} disabled={sendBroadcast.isPending}>
              {sendBroadcast.isPending ? "Enviando…" : "📢 Enviar difusión"}
            </Button>
            {sendBroadcast.isSuccess && <p className="text-xs text-success mt-2">📢 Difusión enviada a {sendBroadcast.data?.recipients} alumnos</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
