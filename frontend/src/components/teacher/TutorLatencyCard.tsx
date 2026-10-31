import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../services/api";
import { Card, CardHeader } from "../ui/Card";
import { Tag } from "../ui/Tag";

interface Tiempos {
  promedio_ms: number;
  p50_ms: number;
  p90_ms: number;
  p95_ms: number;
  max_ms: number;
}

interface Latencia {
  dias: number;
  muestras: number;
  umbral_ms: number;
  objetivo_porcentaje: number;
  porcentaje_bajo_umbral: number;
  cumple: boolean | null;
  primera_respuesta: Tiempos;
  respuesta_completa: Tiempos;
}

const seg = (ms: number): string => `${(ms / 1000).toFixed(1)} s`;

/**
 * Métrica de rendimiento del tutor IA: "primera respuesta visible en menos de 3 s".
 * Con `materiaId` muestra una materia; sin él, toda la plataforma (administrador).
 */
export function TutorLatencyCard({ materiaId }: { materiaId?: string | null }): React.ReactElement | null {
  const ruta = materiaId ? `/api/materias/${materiaId}/tutor/latencia` : "/api/admin/tutor/latencia";
  const enabled = materiaId !== null;

  const { data, isLoading, error } = useQuery({
    queryKey: ["tutor-latencia", materiaId ?? "global"],
    queryFn: () => api<Latencia>(ruta),
    enabled,
    staleTime: 60_000,
  });

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader
        title="⏱️ Tiempo de respuesta del tutor"
        action={
          data && data.cumple !== null ? (
            <Tag color={data.cumple ? "green" : "red"}>{data.cumple ? "Cumple" : "No cumple"}</Tag>
          ) : undefined
        }
      />
      {isLoading && <p className="text-xs text-text-2">Calculando…</p>}
      {error && <p className="text-xs text-red-700">{apiErrorMessage(error, "No se pudo calcular la métrica.")}</p>}
      {data && data.muestras === 0 && (
        <p className="text-xs text-text-3">
          Todavía no hay consultas al tutor en los últimos {data.dias} días para medir.
        </p>
      )}
      {data && data.muestras > 0 && (
        <div className="flex flex-col gap-2 text-[12px] text-text-2">
          <div>
            <span className="font-display text-2xl font-extrabold text-primary">{data.porcentaje_bajo_umbral}%</span>{" "}
            de las respuestas se vieron en menos de {seg(data.umbral_ms)}
            <span className="text-text-3"> (objetivo: {data.objetivo_porcentaje}%)</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ["Mediana", data.primera_respuesta.p50_ms],
              ["Percentil 95", data.primera_respuesta.p95_ms],
              ["Máximo", data.primera_respuesta.max_ms],
            ].map(([etiqueta, ms]) => (
              <div key={etiqueta as string} className="bg-surface-2 rounded border border-border p-2">
                <div className="font-bold text-text-1">{seg(ms as number)}</div>
                <div className="text-[10px] text-text-3">{etiqueta}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-text-3">
            {data.muestras} respuestas en los últimos {data.dias} días. Respuesta completa: mediana{" "}
            {seg(data.respuesta_completa.p50_ms)}.
          </p>
        </div>
      )}
    </Card>
  );
}
