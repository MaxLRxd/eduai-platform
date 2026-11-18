import React from "react";
import { Card, CardHeader } from "../ui/Card";
import { Tag } from "../ui/Tag";
import { useTopicDetail } from "../../hooks/useAnalytics";
import type { TopicUnderstanding } from "../../types/domain";

/**
 * Detalle de un tema del mapa de comprensión: las preguntas y errores concretos de esa unidad,
 * con las veces que se repitieron. Es lo que el docente necesita para decidir qué reforzar.
 */
export function TopicDetailPanel({
  courseId,
  topic,
  periodo,
  onClose,
}: {
  courseId: string;
  topic: TopicUnderstanding;
  periodo?: string;
  onClose: () => void;
}): React.ReactElement {
  const { data, isLoading, isError } = useTopicDetail(courseId, topic.id ?? "general", periodo);
  const items = data ?? [];

  return (
    <section aria-label={`Detalle del tema ${topic.topic}`} className="mb-5">
    <Card>
      <CardHeader
        title={`Detalle: ${topic.topic}`}
        action={
          <button type="button" onClick={onClose} className="text-xs text-primary hover:underline">
            Cerrar
          </button>
        }
      />
      <p className="text-xs text-text-2 mb-3">
        {topic.consultas} consulta{topic.consultas === 1 ? "" : "s"} al tutor · {topic.errores} error
        {topic.errores === 1 ? "" : "es"} · {periodo ? `período ${periodo}` : "todos los períodos"}
      </p>

      {isLoading && <p className="text-xs text-text-2">Cargando el detalle…</p>}
      {isError && <p className="text-xs text-danger">No se pudo cargar el detalle del tema.</p>}

      <ul aria-label="Preguntas del tema" className="flex flex-col">
        {items.map((q) => (
          <li key={q.id} className="flex justify-between items-center gap-3 py-2 border-b border-border last:border-0">
            <span className="text-[13px] text-text-1 min-w-0">{q.descripcion}</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <Tag color={q.tipo === "ERROR" ? "red" : "blue"}>{q.tipo === "ERROR" ? "Error" : "Duda"}</Tag>
              <Tag color="gray">{q.frecuencia}×</Tag>
            </span>
          </li>
        ))}
      </ul>
      {!isLoading && !isError && items.length === 0 && (
        <p className="text-xs text-text-3">Todavía no hay preguntas registradas para este tema.</p>
      )}
    </Card>
    </section>
  );
}
