import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNoLeidasCount,
  getNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from '../services/notificaciones.service';

export function useNotificaciones(noLeidas = false) {
  return useQuery({
    queryKey: ['notificaciones', noLeidas ? 'no-leidas' : 'todas'],
    queryFn: () => getNotificaciones(noLeidas),
    staleTime: 30 * 1000,
  });
}

export function useNoLeidasCount() {
  return useQuery({
    queryKey: ['notificaciones', 'no-leidas', 'count'],
    queryFn: getNoLeidasCount,
    staleTime: 10 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarcarLeida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marcarLeida(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificaciones'] });
      qc.invalidateQueries({ queryKey: ['notificaciones', 'no-leidas'] });
      qc.invalidateQueries({ queryKey: ['notificaciones', 'no-leidas', 'count'] });
    },
  });
}

export function useMarcarTodasLeidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => marcarTodasLeidas(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificaciones'] });
      qc.invalidateQueries({ queryKey: ['notificaciones', 'no-leidas'] });
      qc.invalidateQueries({ queryKey: ['notificaciones', 'no-leidas', 'count'] });
    },
  });
}
