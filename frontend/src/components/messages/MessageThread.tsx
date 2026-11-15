import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { useConversation, useSendMessage } from "../../hooks/useMessages";
import { Button } from "../ui/Button";
import { apiErrorMessage } from "../../services/api";

function hora(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime())
    ? ""
    : fecha.toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export function MessageThread({
  conversacionId,
  participanteId,
  participanteNombre,
}: {
  conversacionId: string;
  participanteId: string | null;
  participanteNombre: string;
}): React.ReactElement {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: mensajes, isLoading } = useConversation(conversacionId);
  const send = useSendMessage();
  const [texto, setTexto] = useState("");

  // Al abrir el hilo el backend marca los recibidos como leídos.
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ["messages", "inbox"] });
  }, [conversacionId, queryClient]);

  const enviar = (): void => {
    if (!participanteId || !texto.trim()) return;
    send.mutate(
      { destinatario_id: participanteId, contenido: texto.trim() },
      { onSuccess: () => setTexto("") }
    );
  };

  return (
    <div className="flex flex-col h-full min-h-[320px]">
      <div className="px-4 py-3 border-b border-border font-display text-sm font-bold">
        {participanteNombre}
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto p-4 max-h-[45vh] bg-surface-2/40">
        {(mensajes ?? []).map((m) => {
          const propio = m.emisor_id === user?.id;
          return (
            <div
              key={m.id}
              className={`max-w-[85%] rounded px-3 py-2 text-[13px] leading-relaxed ${
                propio ? "self-end bg-primary text-white" : "self-start bg-surface border border-border text-text-1"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.contenido}</div>
              <div className={`text-[10px] mt-1 ${propio ? "text-white/60" : "text-text-3"}`}>
                {hora(m.enviado_en)}
              </div>
            </div>
          );
        })}
        {isLoading && <p className="text-xs text-text-3">Cargando conversación…</p>}
        {!isLoading && (mensajes ?? []).length === 0 && (
          <p className="text-xs text-text-3">Todavía no hay mensajes en esta conversación.</p>
        )}
      </div>

      <div className="border-t border-border p-3">
        <textarea
          rows={2}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          placeholder="Escribí tu respuesta…"
          className="w-full px-3 py-2 border border-border rounded text-sm"
          disabled={!participanteId || send.isPending}
        />
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-[11px] text-danger">
            {send.isError ? apiErrorMessage(send.error, "No se pudo enviar") : ""}
          </span>
          <Button size="sm" onClick={enviar} disabled={!participanteId || !texto.trim() || send.isPending}>
            {send.isPending ? "Enviando…" : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
