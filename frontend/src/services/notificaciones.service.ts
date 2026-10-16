import { api } from './api';

export type Notificacion = {
  id: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  tipo: string;
  createdAt: string;
  enlace?: string | null;
};

export async function getNotificaciones(noLeidas?: boolean) {
  const query = noLeidas ? '?noLeidas=true' : '';
  return api<Notificacion[]>(`/api/notificaciones${query}`);
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
