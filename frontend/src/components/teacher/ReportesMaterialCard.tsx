import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiErrorMessage } from "../../services/api";
import { getReportesMaterial, resolverReportesMaterial } from "../../services/content.service";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import { Tag } from "../ui/Tag";

function fecha(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

/**
 * CU-A02 (5A): materiales que los alumnos reportaron como que no abren o están dañados. Si el archivo ya no está
 * en el almacenamiento se marca como faltante; cuando el docente lo arregla, lo marca como resuelto y los alumnos
 * que reportaron reciben un aviso.
 */
export function ReportesMaterialCard({ materiaId }: { materiaId: string | null }): React.ReactElement | null {
  const queryClient = useQueryClient();
  const clave = ["content-reports", materiaId];

  const { data, isLoading, error } = useQuery({
    queryKey: clave,
    queryFn: () => getReportesMaterial(materiaId as string),
    enabled: Boolean(materiaId),
  });

  const resolver = useMutation({
    mutationFn: resolverReportesMaterial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave }),
  });

  if (!materiaId) return null;

  const reportes = data ?? [];

  return (
    <Card>
      <CardHeader
        title="⚠️ Archivos reportados"
        action={reportes.length > 0 ? <Tag color="red">{reportes.length}</Tag> : undefined}
      />
      {isLoading && <p className="text-xs text-text-2">Cargando…</p>}
      {error != null && <p className="text-xs text-danger">{apiErrorMessage(error, "No se pudieron cargar los reportes")}</p>}

      {!isLoading && !error && reportes.length === 0 && (
        <p className="text-xs text-text-3">Ningún alumno reportó problemas con los archivos.</p>
      )}

      <ul aria-label="Archivos reportados" className="flex flex-col divide-y divide-border">
        {reportes.map((r) => (
          <li key={r.contenido_id} className="py-2.5 flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-text-1 truncate">{r.titulo}</div>
                <div className="text-[11px] text-text-3">
                  {r.alumnos} {r.alumnos === 1 ? "alumno" : "alumnos"} · último reporte {fecha(r.ultimo_reporte)}
                </div>
              </div>
              {r.archivo_disponible === false ? <Tag color="red">Archivo faltante</Tag> : <Tag color="amber">Reportado</Tag>}
            </div>

            {r.motivos.length > 0 && (
              <ul className="text-[11px] text-text-2 list-disc pl-4">
                {r.motivos.map((m) => (
                  <li key={m}>“{m}”</li>
                ))}
              </ul>
            )}

            {r.archivo_disponible === false && (
              <p className="text-[11px] text-amber-800">
                El archivo ya no está guardado: volvé a subirlo y después marcá el problema como resuelto.
              </p>
            )}

            <div>
              <Button
                variant="secondary"
                size="sm"
                disabled={resolver.isPending}
                aria-label={`Marcar como resuelto: ${r.titulo}`}
                onClick={() => resolver.mutate(r.contenido_id)}
              >
                Marcar como resuelto
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {resolver.isError && (
        <p className="text-xs text-danger mt-2">{apiErrorMessage(resolver.error, "No se pudo marcar como resuelto")}</p>
      )}
    </Card>
  );
}
