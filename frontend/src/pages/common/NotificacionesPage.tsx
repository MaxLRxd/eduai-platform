import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table, Td, Th, Thead, Tr } from '../../components/ui/Table';
import {
  useMarcarLeida,
  useMarcarTodasLeidas,
  useNotificaciones,
} from '../../hooks/useNotificaciones';
import { useAuth } from '../../contexts/AuthContext';
import type { Notificacion } from '../../services/notificaciones.service';
import { formatFecha } from '../../utils/format';

export default function NotificacionesPage() {
  const { data: notificaciones = [], isLoading } = useNotificaciones(false);
  const marcarLeida = useMarcarLeida();
  const marcarTodas = useMarcarTodasLeidas();
  const navigate = useNavigate();
  const { user } = useAuth();

  const enlaceDe = (n: Notificacion): string | null => {
    const esAlumno = user?.role === 'ALUMNO';
    switch (n.referenciaTipo) {
      case 'entrega':
        return esAlumno ? '/student/assignments' : '/teacher/corrections';
      case 'conversacion':
        return esAlumno ? null : '/teacher/messages';
      default:
        return null;
    }
  };

  const handleClick = async (n: Notificacion) => {
    if (!marcarLeida.isPending) {
      await marcarLeida.mutateAsync(n.id);
    }
    const enlace = enlaceDe(n);
    if (enlace) {
      navigate(enlace);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => marcarTodas.mutate()}
            disabled={marcarTodas.isPending || notificaciones.every((n: Notificacion) => n.leida)}
          >
            Marcar todas como leídas
          </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Cargando notificaciones...</div>
        ) : notificaciones.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No tienes notificaciones</div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Estado</Th>
                <Th>Título</Th>
                <Th>Mensaje</Th>
                <Th>Fecha</Th>
              </Tr>
            </Thead>
            <tbody>
              {notificaciones.map((n: Notificacion) => (
                <Tr
                  key={n.id}
                  className={`cursor-pointer hover:bg-gray-50 ${n.leida ? 'opacity-70' : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <Td>
                    {n.leida ? (
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        Leída
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        No leída
                      </span>
                    )}
                  </Td>
                  <Td className="font-medium text-gray-900">{n.titulo}</Td>
                  <Td className="max-w-md truncate text-gray-600">{n.mensaje}</Td>
                  <Td className="whitespace-nowrap text-gray-500">{formatFecha(n.createdAt)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
