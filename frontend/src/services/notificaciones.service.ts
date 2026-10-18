import { api } from './api';

export type Notificacion = {
  id: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  tipo: string;
  createdAt: string;
  referenciaTipo?: string | null;
  referenciaId?: string | null;
};

interface NotificacionApi {
  id: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  tipo: string;
  creada_en: string;
  referencia_tipo?: string | null;
  referencia_id?: string | null;
}

function toNotificacion(n: NotificacionApi): Notificacion {
  return {
    id: n.id,
    titulo: n.titulo,
    mensaje: n.mensaje,
    leida: n.leida,
    tipo: n.tipo,
    createdAt: n.creada_en,
    referenciaTipo: n.referencia_tipo ?? null,
    referenciaId: n.referencia_id ?? null,
  };
}

export async function getNotificaciones(noLeidas?: boolean): Promise<Notificacion[]> {
  const query = noLeidas ? '?noLeidas=true' : '';
  const data = await api<{ notificaciones: NotificacionApi[] }>(`/api/notificaciones${query}`);
  return (data.notificaciones ?? []).map(toNotificacion);
}

export async function getNoLeidasCount() {
  const res = await api<{ count: number }>('/api/notificaciones/no-leidas');
  return res.count;
}

export async function marcarTodasLeidas() {
  await api('/api/notificaciones/leer-todas', { method: 'PATCH' });
}

export async function marcarLeida(id: string) {
  await api(`/api/notificaciones/${id}/leida`, { method: 'PATCH' });
}
