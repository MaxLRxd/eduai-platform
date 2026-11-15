import { api } from "./api";
import type { InboxMessage } from "../types/domain";

export interface MessageContact {
  id: string;
  nombre: string;
  email: string;
  rol: "ALUMNO" | "PROFESOR" | "ADMIN";
  materias: { id: string; nombre: string }[];
}

export interface MessageItem {
  id: string;
  emisor_id: string;
  contenido: string;
  leido: boolean;
  enviado_en: string;
}

interface ConversacionItem {
  id: string;
  participante: { id: string; nombre: string; email: string; rol: string } | null;
  participante_id: string | null;
  no_leidos: number;
  ultimo_mensaje: { contenido: string; emisor_id: string; enviado_en: string } | null;
}

function formatWhen(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  const diffMin = Math.round((Date.now() - fecha.getTime()) / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `Hace ${diffHoras} h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias === 1) return "Ayer";
  return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export async function getInbox(): Promise<InboxMessage[]> {
  const data = await api<{ items: ConversacionItem[] }>("/api/messages");
  return (data.items ?? []).map((c) => {
    const ultimo = c.ultimo_mensaje;
    return {
      id: c.id,
      from: c.participante?.nombre ?? "Sistema",
      participanteId: c.participante_id ?? c.participante?.id ?? null,
      subject: ultimo?.contenido ?? "(Sin mensajes aún)",
      when: ultimo ? formatWhen(ultimo.enviado_en) : "",
      unread: c.no_leidos > 0,
      noLeidos: c.no_leidos ?? 0,
    };
  });
}

export async function getContactos(): Promise<MessageContact[]> {
  const data = await api<{ items: MessageContact[] }>("/api/messages/contactos");
  return data.items ?? [];
}

export async function getConversationMessages(conversacionId: string): Promise<MessageItem[]> {
  const data = await api<{ items: MessageItem[] }>(
    `/api/messages/historial?conversacionId=${encodeURIComponent(conversacionId)}`
  );
  return data.items ?? [];
}

export async function sendMessage(input: {
  destinatario_id: string;
  contenido: string;
}): Promise<{ success: boolean; conversacionId: string }> {
  const data = await api<{ mensaje: { conversacion_id: string } }>("/api/messages", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return { success: true, conversacionId: data.mensaje.conversacion_id };
}

export async function sendBroadcast(input: {
  dirigido_a?: "ALUMNO" | "PROFESOR" | "ADMIN";
  titulo: string;
  contenido: string;
}): Promise<{ success: boolean; recipients: number }> {
  const data = await api<{ broadcast: { destinatarios: number } }>("/api/messages/broadcast", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return { success: true, recipients: data.broadcast.destinatarios };
}
