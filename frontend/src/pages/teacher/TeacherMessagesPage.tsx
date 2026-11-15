import React, { useState } from "react";
import { useInbox, useContacts, useSendBroadcast, useSendMessage } from "../../hooks/useMessages";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { InfoBox } from "../../components/ui/InfoBox";
import { MessageThread } from "../../components/messages/MessageThread";

export function TeacherMessagesPage(): React.ReactElement {
  const { data: inbox } = useInbox();
  const { data: contacts } = useContacts();
  const sendMessage = useSendMessage();
  const sendBroadcast = useSendBroadcast();

  const [destinatarioId, setDestinatarioId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [broadcastTitulo, setBroadcastTitulo] = useState("");
  const [broadcastContenido, setBroadcastContenido] = useState("");
  const [conversacionId, setConversacionId] = useState<string | null>(null);

  const conversacion = (inbox ?? []).find((m) => m.id === conversacionId) ?? null;

  const broadcastDirigidoA =
    broadcastTarget === "all" ? undefined : (broadcastTarget as "ALUMNO" | "PROFESOR");

  const recipientsLabel =
    broadcastTarget === "all"
      ? "Se enviará a toda la institución"
      : broadcastTarget === "ALUMNO"
        ? "Se enviará a todos los alumnos"
        : "Se enviará a todos los docentes";

  const handleSendMessage = () => {
    if (!destinatarioId || !body.trim()) return;
    const contenido = subject.trim() ? `${subject.trim()}\n\n${body.trim()}` : body.trim();
    sendMessage.mutate(
      { destinatario_id: destinatarioId, contenido },
      {
        onSuccess: (data) => {
          setConversacionId(data.conversacionId);
          setBody("");
          setSubject("");
        },
      }
    );
  };

  const handleSendBroadcast = () => {
    if (!broadcastContenido.trim()) return;
    sendBroadcast.mutate({
      dirigido_a: broadcastDirigidoA,
      titulo: broadcastTitulo.trim() || "Comunicado",
      contenido: broadcastContenido.trim(),
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Mensajes</h2>
        <p className="text-[13px] text-text-2">Comunicaciones individuales y difusión a cursos</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="flex flex-col gap-4">
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border font-display text-sm font-bold">
              Bandeja de entrada <span className="ml-1.5 bg-danger text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full">{inbox?.filter((m) => m.unread).length ?? 0}</span>
            </div>
            {(inbox ?? []).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setConversacionId(m.id)}
                className={`w-full text-left px-5 py-3.5 border-b border-border last:border-0 transition-colors ${
                  m.id === conversacionId ? "bg-primary-light" : m.unread ? "bg-sky-50" : "hover:bg-surface-2"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className={`text-[13px] ${m.unread ? "font-bold" : "font-medium"} text-text-1`}>{m.from}</div>
                    <div className="text-xs text-text-2 mt-0.5 line-clamp-2">{m.subject}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] text-text-3">{m.when}</span>
                    {m.unread && <span className="w-2 h-2 bg-info rounded-full" />}
                  </div>
                </div>
              </button>
            ))}
            {inbox && inbox.length === 0 && (
              <div className="px-5 py-6 text-center text-xs text-text-3">Sin conversaciones todavía</div>
            )}
          </Card>

          {conversacion && (
            <Card className="p-0 overflow-hidden">
              <MessageThread
                conversacionId={conversacion.id}
                participanteId={conversacion.participanteId}
                participanteNombre={conversacion.from}
              />
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Mensaje individual" />
            <div className="mb-3.5">
              <label htmlFor="msg-to" className="block text-xs font-semibold text-text-1 mb-1.5">
                Para
              </label>
              <select
                id="msg-to"
                value={destinatarioId}
                onChange={(e) => setDestinatarioId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
              >
                <option value="">— Seleccioná un estudiante —</option>
                {(contacts ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3.5">
              <label htmlFor="msg-subject" className="block text-xs font-semibold text-text-1 mb-1.5">
                Asunto
              </label>
              <input
                id="msg-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del mensaje"
                className="w-full px-3 py-2 border border-border rounded text-sm"
              />
            </div>
            <div className="mb-3.5">
              <label htmlFor="msg-body" className="block text-xs font-semibold text-text-1 mb-1.5">
                Mensaje
              </label>
              <textarea
                id="msg-body"
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribí tu mensaje..."
                className="w-full px-3 py-2 border border-border rounded text-sm"
              />
            </div>
            <Button size="sm" onClick={handleSendMessage} disabled={sendMessage.isPending || !destinatarioId || !body.trim()}>
              {sendMessage.isPending ? "Enviando…" : "Enviar mensaje"}
            </Button>
            {sendMessage.isSuccess && <p className="text-xs text-success mt-2">Mensaje enviado</p>}
          </Card>

          <Card className="border-[1.5px] border-primary bg-primary-light">
            <CardHeader title={<span className="text-primary">Difusión</span>} />
            <InfoBox variant="info">Enviá un mensaje a todos los alumnos, docentes o a toda la institución.</InfoBox>
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
                <option value="all">Toda la institución</option>
                <option value="ALUMNO">Todos los alumnos</option>
                <option value="PROFESOR">Todos los docentes</option>
              </select>
            </div>
            <div className="text-xs text-primary font-semibold mb-2.5 px-2.5 py-1.5 bg-white rounded-sm border border-primary">{recipientsLabel}</div>
            <div className="mb-3.5">
              <label htmlFor="broadcast-subject" className="block text-xs font-semibold text-text-1 mb-1.5">
                Asunto de la difusión
              </label>
              <input
                id="broadcast-subject"
                value={broadcastTitulo}
                onChange={(e) => setBroadcastTitulo(e.target.value)}
                placeholder="Ej.: Recordatorio de entrega TP3"
                className="w-full px-3 py-2 border border-border rounded text-sm"
              />
            </div>
            <div className="mb-3.5">
              <label htmlFor="broadcast-body" className="block text-xs font-semibold text-text-1 mb-1.5">
                Mensaje
              </label>
              <textarea
                id="broadcast-body"
                rows={3}
                value={broadcastContenido}
                onChange={(e) => setBroadcastContenido(e.target.value)}
                placeholder="Escribí el mensaje de difusión..."
                className="w-full px-3 py-2 border border-border rounded text-sm"
              />
            </div>
            <Button size="sm" onClick={handleSendBroadcast} disabled={sendBroadcast.isPending || !broadcastContenido.trim()}>
              {sendBroadcast.isPending ? "Enviando…" : "Enviar difusión"}
            </Button>
            {sendBroadcast.isSuccess && <p className="text-xs text-success mt-2">Difusión enviada a {sendBroadcast.data?.recipients} destinatarios</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}