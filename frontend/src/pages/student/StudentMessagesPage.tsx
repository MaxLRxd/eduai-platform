import React, { useState } from "react";
import { useContacts, useInbox, useSendMessage } from "../../hooks/useMessages";
import type { MessageContact } from "../../services/messages.service";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { MessageThread } from "../../components/messages/MessageThread";
import { apiErrorMessage } from "../../services/api";

export function StudentMessagesPage(): React.ReactElement {
  const { data: inbox } = useInbox();
  const { data: contacts } = useContacts();
  const sendMessage = useSendMessage();

  const [conversacionId, setConversacionId] = useState<string | null>(null);
  const [nuevoPara, setNuevoPara] = useState<MessageContact | null>(null);
  const [texto, setTexto] = useState("");

  const conversacion = (inbox ?? []).find((m) => m.id === conversacionId) ?? null;
  const participanteId = conversacion?.participanteId ?? nuevoPara?.id ?? null;
  const participanteNombre = conversacion?.from ?? nuevoPara?.nombre ?? "";

  const abrirContacto = (contacto: MessageContact): void => {
    const existente = (inbox ?? []).find((m) => m.participanteId === contacto.id);
    if (existente) {
      setConversacionId(existente.id);
      setNuevoPara(null);
      return;
    }
    setConversacionId(null);
    setNuevoPara(contacto);
    setTexto("");
  };

  const enviarNuevo = (): void => {
    if (!nuevoPara || !texto.trim()) return;
    sendMessage.mutate(
      { destinatario_id: nuevoPara.id, contenido: texto.trim() },
      {
        onSuccess: (data) => {
          setTexto("");
          setNuevoPara(null);
          setConversacionId(data.conversacionId);
        },
      }
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Mensajes</h2>
        <p className="text-[13px] text-text-2">Comunicate con los docentes de tus materias</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.6fr] gap-5">
        <div className="flex flex-col gap-4">
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border font-display text-sm font-bold">
              Bandeja de entrada{" "}
              {(inbox ?? []).some((m) => m.unread) && (
                <span className="ml-1.5 bg-danger text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                  {inbox?.filter((m) => m.unread).length}
                </span>
              )}
            </div>
            {(inbox ?? []).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setConversacionId(m.id);
                  setNuevoPara(null);
                }}
                className={`w-full text-left px-5 py-3.5 border-b border-border last:border-0 transition-colors ${
                  m.id === conversacionId ? "bg-primary-light" : m.unread ? "bg-sky-50" : "hover:bg-surface-2"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className={`text-[13px] ${m.unread ? "font-bold" : "font-medium"} text-text-1`}>
                      {m.from}
                    </div>
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
              <div className="px-5 py-6 text-center text-xs text-text-3">
                Sin conversaciones todavía. Elegí un docente para escribirle.
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Docentes de mis materias" />
            <div className="flex flex-col gap-1.5">
              {(contacts ?? []).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => abrirContacto(c)}
                  className={`text-left px-3 py-2 rounded border transition-colors ${
                    nuevoPara?.id === c.id || conversacion?.participanteId === c.id
                      ? "border-primary bg-primary-light"
                      : "border-border bg-surface hover:bg-surface-2"
                  }`}
                >
                  <div className="text-[13px] font-semibold text-text-1">{c.nombre}</div>
                  <div className="text-[11px] text-text-3">
                    {c.materias.length > 0 ? c.materias.map((m) => m.nombre).join(" · ") : c.email}
                  </div>
                </button>
              ))}
              {contacts && contacts.length === 0 && (
                <p className="text-xs text-text-3 py-2">Todavía no tenés docentes asignados.</p>
              )}
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          {conversacionId && participanteId ? (
            <MessageThread
              conversacionId={conversacionId}
              participanteId={participanteId}
              participanteNombre={participanteNombre}
            />
          ) : nuevoPara ? (
            <div className="p-5">
              <CardHeader title={`Nuevo mensaje para ${nuevoPara.nombre}`} />
              <p className="text-xs text-text-2 mb-3">
                {nuevoPara.materias.length > 0
                  ? `Materias: ${nuevoPara.materias.map((m) => m.nombre).join(", ")}`
                  : nuevoPara.email}
              </p>
              <textarea
                rows={5}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribí tu consulta…"
                className="w-full px-3 py-2 border border-border rounded text-sm"
              />
              <div className="flex items-center justify-between gap-2 mt-3">
                <span className="text-[11px] text-danger">
                  {sendMessage.isError ? apiErrorMessage(sendMessage.error, "No se pudo enviar") : ""}
                </span>
                <Button onClick={enviarNuevo} disabled={!texto.trim() || sendMessage.isPending}>
                  {sendMessage.isPending ? "Enviando…" : "Enviar mensaje"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[320px] flex items-center justify-center p-8 text-center text-[13px] text-text-3">
              Elegí una conversación o un docente para empezar.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
