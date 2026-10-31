import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../services/api";
import { Card, CardHeader } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";

interface AccesosMateria {
  inscriptos: number;
  contenidos: {
    contenido_id: string;
    titulo: string;
    tipo: string;
    alumnos_distintos: number;
    accesos: number;
    ultimo_acceso: string | null;
  }[];
}

function fecha(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

/** CU-A02: cuántos alumnos abrieron cada material de la materia. */
export function ContentAccessCard({ materiaId }: { materiaId: string | null }): React.ReactElement | null {
  const { data, isLoading, error } = useQuery({
    queryKey: ["content-access", materiaId],
    queryFn: () => api<AccesosMateria>(`/api/materias/${materiaId}/accesos`),
    enabled: Boolean(materiaId),
  });

  if (!materiaId) return null;

  return (
    <Card>
      <CardHeader title="👀 Material visto por los alumnos" />
      {isLoading && <p className="text-xs text-text-2">Cargando…</p>}
      {error && <p className="text-xs text-red-700">{apiErrorMessage(error, "No se pudieron cargar las estadísticas.")}</p>}
      {data && data.contenidos.length === 0 && (
        <p className="text-xs text-text-3">Todavía no hay materiales cargados en esta materia.</p>
      )}
      {data && data.contenidos.length > 0 && (
        <div className="flex flex-col gap-3">
          {data.contenidos.map((c) => {
            const porcentaje = data.inscriptos ? Math.round((c.alumnos_distintos / data.inscriptos) * 100) : 0;
            return (
              <div key={c.contenido_id}>
                <div className="flex justify-between gap-2 text-[12px] mb-1">
                  <span className="font-semibold text-text-1 truncate">{c.titulo}</span>
                  <span className="text-text-3 shrink-0">
                    {c.alumnos_distintos} de {data.inscriptos} alumnos
                  </span>
                </div>
                <ProgressBar value={porcentaje} color="#003d7a" />
                <div className="text-[10px] text-text-3 mt-0.5">
                  {c.accesos} {c.accesos === 1 ? "apertura" : "aperturas"} · último acceso {fecha(c.ultimo_acceso)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
