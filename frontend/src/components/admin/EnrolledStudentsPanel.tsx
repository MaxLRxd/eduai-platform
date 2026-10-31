import React, { useState } from "react";
import { Card, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { InfoBox } from "../ui/InfoBox";
import { apiErrorMessage } from "../../services/api";
import {
  useEnrolledStudents,
  useUnenrollAll,
  useUnenrollStudent,
} from "../../hooks/useAdminEnrollments";

interface Props {
  materiaId: string;
  materiaNombre: string;
  onClose: () => void;
}

/** CU-AD01 (A3.1): para dar de baja una materia hay que desmatricular a sus alumnos primero. */
export function EnrolledStudentsPanel({ materiaId, materiaNombre, onClose }: Props): React.ReactElement {
  const { data: alumnos, isLoading, error } = useEnrolledStudents(materiaId);
  const unenroll = useUnenrollStudent(materiaId);
  const unenrollAll = useUnenrollAll(materiaId);
  const [message, setMessage] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);

  const handleOne = (id: string, nombre: string): void => {
    if (!window.confirm(`¿Desmatricular a ${nombre} de ${materiaNombre}? Conserva su historial pero pierde el acceso.`)) {
      return;
    }
    setMessage(null);
    unenroll.mutate(id, {
      onSuccess: () => setMessage({ tipo: "success", texto: `${nombre} fue desmatriculado.` }),
      onError: (e) => setMessage({ tipo: "error", texto: apiErrorMessage(e, "No se pudo desmatricular.") }),
    });
  };

  const handleAll = (): void => {
    const total = alumnos?.length ?? 0;
    if (
      !window.confirm(
        `¿Desmatricular a los ${total} alumnos de ${materiaNombre}? Todos perderán el acceso y se les avisará dentro de la plataforma.`
      )
    ) {
      return;
    }
    setMessage(null);
    unenrollAll.mutate(undefined, {
      onSuccess: (r) =>
        setMessage({ tipo: "success", texto: `Se desmatriculó a ${r.cantidad} alumnos. Ya se puede dar de baja la materia.` }),
      onError: (e) => setMessage({ tipo: "error", texto: apiErrorMessage(e, "No se pudo desmatricular.") }),
    });
  };

  const busy = unenroll.isPending || unenrollAll.isPending;

  return (
    <Card className="mt-5">
      <CardHeader
        title={`Alumnos inscriptos · ${materiaNombre}`}
        action={
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        }
      />

      {message && <InfoBox variant={message.tipo}>{message.texto}</InfoBox>}
      {isLoading && <p className="text-sm text-text-2">Cargando alumnos…</p>}
      {error && <InfoBox variant="error">{apiErrorMessage(error, "No se pudo cargar el listado.")}</InfoBox>}

      {alumnos && alumnos.length === 0 && (
        <p className="text-[12px] text-text-3">No hay alumnos inscriptos. La materia se puede dar de baja.</p>
      )}

      {alumnos && alumnos.length > 0 && (
        <>
          <div className="flex flex-col divide-y divide-border mb-3.5">
            {alumnos.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-text-1 truncate">{a.nombre}</div>
                  <div className="text-[11px] text-text-3 truncate">{a.email}</div>
                </div>
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => handleOne(a.id, a.nombre)}>
                  Desmatricular
                </Button>
              </div>
            ))}
          </div>
          <Button variant="danger" size="sm" disabled={busy} onClick={handleAll}>
            {unenrollAll.isPending ? "Desmatriculando…" : `Desmatricular a todos (${alumnos.length})`}
          </Button>
        </>
      )}
    </Card>
  );
}
