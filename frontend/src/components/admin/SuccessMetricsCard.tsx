import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../services/api";
import { Card, CardHeader } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";
import { Tag } from "../ui/Tag";

interface Metrica {
  valor: number | null;
  objetivo: number;
  cumple: boolean | null;
  detalle: string;
}

interface MetricasExito {
  ventana_dias: number;
  uso_tutor: Metrica;
  feedback_revisado: Metrica;
  retencion_mensual: Metrica;
  reduccion_tiempo_docente: Metrica;
}

const FILAS: { clave: keyof Omit<MetricasExito, "ventana_dias">; titulo: string }[] = [
  { clave: "uso_tutor", titulo: "Uso del tutor IA por alumno activo" },
  { clave: "feedback_revisado", titulo: "Correcciones revisadas por el alumno" },
  { clave: "retencion_mensual", titulo: "Retención mensual de usuarios activos" },
  { clave: "reduccion_tiempo_docente", titulo: "Reducción del tiempo de preparación docente" },
];

/** Las metricas de exito que el proyecto se propuso (objetivo general), con datos reales. */
export function SuccessMetricsCard(): React.ReactElement {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "metricas-exito"],
    queryFn: () => api<MetricasExito>("/api/admin/metricas-exito"),
    staleTime: 60_000,
  });

  return (
    <Card>
      <CardHeader title="🎯 Métricas de éxito del proyecto" />
      {isLoading && <p className="text-xs text-text-2">Calculando…</p>}
      {error && <p className="text-xs text-red-700">{apiErrorMessage(error, "No se pudieron calcular las métricas.")}</p>}
      {data && (
        <div className="flex flex-col gap-3.5">
          {FILAS.map(({ clave, titulo }) => {
            const m = data[clave];
            return (
              <div key={clave}>
                <div className="flex justify-between items-center gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-text-1">{titulo}</span>
                  {m.cumple === null ? (
                    <Tag color="gray">Sin datos</Tag>
                  ) : (
                    <Tag color={m.cumple ? "green" : "amber"}>{m.cumple ? "Cumple" : "Por debajo"}</Tag>
                  )}
                </div>
                {m.valor !== null && <ProgressBar value={Math.min(100, m.valor)} color={m.cumple ? "#059669" : "#d97706"} />}
                <div className="text-[11px] text-text-3 mt-0.5">
                  {m.valor !== null ? `${m.valor}% · objetivo ${m.objetivo}% · ` : `Objetivo ${m.objetivo}% · `}
                  {m.detalle}
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-text-3">Actividad de los últimos {data.ventana_dias} días.</p>
        </div>
      )}
    </Card>
  );
}
