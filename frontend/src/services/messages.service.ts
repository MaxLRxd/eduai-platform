import { api } from "./api";
import type { InboxMessage } from "../types/domain";

export interface MessageContact {
  id: string;
  nombre: string;
  email: string;
}

interface ConversacionItem {
  id: string;
  participante: { id: string; nombre: string; email: string; rol: string } | null;
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

export async function getInbox(usuarioId?: string): Promise<InboxMessage[]> {
  const data = await api<{ items: ConversacionItem[] }>("/api/messages");
  return (data.items ?? []).map((c) => {
    const ultimo = c.ultimo_mensaje;
    return {
      id: c.id,
      from: c.participante?.nombre ?? "Sistema",
      subject: ultimo?.contenido ?? "(Sin mensajes aún)",
      when: ultimo ? formatWhen(ultimo.enviado_en) : "",
      unread: usuarioId ? Boolean(ultimo && ultimo.emisor_id !== usuarioId) : false,
    };
  });
}

export async function getAlumnosContactos(): Promise<MessageContact[]> {
  const materias = await api<{ materias: { id: string }[] }>("/api/materias/mias");
  const listas = await Promise.all(
    (materias.materias ?? []).map((m) =>
      api<{ notas: { alumno: MessageContact }[] }>(`/api/materias/${m.id}/notas`).catch(() => ({
        notas: [] as { alumno: MessageContact }[],
      }))
    )
  );

  const mapa = new Map<string, MessageContact>();
  for (const lista of listas) {
    for (const nota of lista.notas ?? []) {
      if (nota.alumno) {
        mapa.set(nota.alumno.id, nota.alumno);
      }
    }
  }
  return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function sendMessage(input: {
  destinatario_id: string;
  contenido: string;
}): Promise<{ success: boolean }> {
  await api("/api/messages", { method: "POST", body: JSON.stringify(input) });
  return { success: true };
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