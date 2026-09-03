import React, { useEffect, useState } from "react";
import { useCorrectionQueue, usePublishCorrection, useRubricCriteria, useRubrics } from "../../hooks/useCorrections";
import { Card, CardHeader } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import { InfoBox } from "../../components/ui/InfoBox";
import type { RubricCriterion } from "../../types/domain";

const LEVEL_COLOR: Record<RubricCriterion["level"], "green" | "blue" | "amber"> = {
  Excelente: "green",
  Bueno: "blue",
  Regular: "amber",
};

export function TeacherCorrectionsPage(): React.ReactElement {
  const { data: queue, isLoading } = useCorrectionQueue();
  const { data: criteria } = useRubricCriteria();
  const { data: rubrics } = useRubrics();
  const publish = usePublishCorrection();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (queue && queue.length > 0 && !selectedId) {
      setSelectedId(queue[0].id);
    }
  }, [queue, selectedId]);

  const selected = queue?.find((q) => q.id === selectedId);

  useEffect(() => {
    if (selected) {
      setGrade(selected.aiGrade);
      setFeedback(selected.aiFeedback);
      setPublished(false);
    }
  }, [selected?.id]);

  const handlePublish = (): void => {
    if (!selectedId) return;
    publish.mutate(
      { entregaId: selectedId, grade, feedback },
      { onSuccess: () => setPublished(true) }
    );
  };

  return (
    <div>
      <div className="flex justify-between items-start gap-3.5 flex-wrap mb-6">
        <div>
          <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Correcciones pendientes</h2>
          <p className="text-[13px] text-text-2">Revisá, editá y publicá el feedback pre-generado por el Auto-correction Engine</p>
        </div>
        <Tag color="red">{queue?.length ?? 0} entregas pendientes</Tag>
      </div>

      {isLoading && <p className="text-sm text-text-2">Cargando cola de correcciones…</p>}

      <div className="grid xl:grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardHeader title="Cola de entregas" />
          <div className="flex flex-col gap-2.5">
            {(queue ?? []).map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSelectedId(item.id);
                }}
                className={`text-left bg-surface border rounded-lg p-4 transition-colors cursor-pointer ${
                  item.id === selectedId ? "border-l-4 border-l-primary border-border" : "border-border hover:border-border-strong"
                }`}
              >
                <div className="flex justify-between items-start gap-2.5 flex-wrap">
                  <div>
                    <div className="font-bold text-[13px] text-text-1">{item.student}</div>
                    <div className="text-xs text-text-2 mt-0.5">
                      {item.activity} · {item.course}
                    </div>
                    <div className="flex gap-1.5 mt-1.5">
                      <Tag color="gray">{item.type}</Tag>
                      <Tag color="blue">IA: {item.aiGrade}/10</Tag>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setSelectedId(item.id)}>
                    Revisar →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <aside className="flex flex-col gap-4">
          {selected && (
            <Card>
              <CardHeader title="🔍 Revisar corrección IA" />
              <div className="p-3 bg-surface-2 rounded mb-3.5">
                <div className="font-bold text-[13px] text-text-1">{selected.student}</div>
                <div className="text-xs text-text-2 mt-0.5">
                  {selected.activity} · {selected.course}
                </div>
              </div>

              <div className="text-xs font-bold text-text-2 mb-1.5 uppercase tracking-wide">Entrega del alumno</div>
              <div className="px-3 py-2.5 bg-surface-2 rounded text-[13px] text-text-1 mb-3.5 border border-border max-h-24 overflow-y-auto">
                {selected.submission}
              </div>

              <div className="text-xs font-bold text-info mb-1.5 uppercase tracking-wide">🤖 Feedback auto-generado por IA</div>
              <div className="px-3 py-2.5 bg-blue-50 rounded text-[13px] text-text-1 mb-3.5 border border-blue-200">{selected.aiFeedback}</div>

              <div className="mb-3.5">
                <label htmlFor="grade" className="block text-xs font-semibold text-text-1 mb-1.5">
                  Calificación final
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    id="grade"
                    type="number"
                    min={1}
                    max={10}
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-20 px-3 py-2 border border-border rounded text-sm"
                  />
                  <span className="text-xs text-text-3">/10 · La IA sugirió: {selected.aiGrade}</span>
                </div>
              </div>

              <div className="mb-1">
                <label htmlFor="feedback" className="block text-xs font-semibold text-text-1 mb-1.5">
                  Feedback final (editable)
                </label>
                <textarea
                  id="feedback"
                  rows={5}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded text-sm"
                />
              </div>

              <div className="flex gap-2 mt-1">
                <Button fullWidth className="justify-center" onClick={handlePublish} disabled={publish.isPending}>
                  {publish.isPending ? "Publicando…" : "Publicar feedback"}
                </Button>
                <Button variant="ghost" size="sm">
                  Override manual
                </Button>
              </div>
              {published && <InfoBox variant="info">✅ Corrección publicada. El alumno fue notificado.</InfoBox>}

              {criteria && criteria.length > 0 && (
                <div className="border-t border-border mt-4.5 pt-4">
                  <div className="font-bold text-[13px] text-text-1 mb-2.5">📋 Rúbrica asociada: "TP Programación"</div>
                  {criteria.map((c) => (
                    <div key={c.name} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                      <div>
                        <div className="text-xs font-semibold text-text-1">{c.name}</div>
                        <div className="text-[11px] text-text-3">Peso: {c.weight}</div>
                      </div>
                      <Tag color={LEVEL_COLOR[c.level]}>{c.level}</Tag>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          <Card className="border-[1.5px] border-primary">
            <CardHeader title={<span className="text-primary">📋 Gestionar rúbricas</span>} />
            <div className="flex flex-col gap-2">
              {(rubrics ?? []).map((r) => (
                <div key={r.name} className="flex justify-between items-center p-2 bg-surface-2 rounded-sm">
                  <div>
                    <div className="text-[13px] font-semibold text-text-1">{r.name}</div>
                    <div className="text-[11px] text-text-3">
                      {r.criteriaCount} criterios · {r.activitiesCount} actividades
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Editar
                  </Button>
                </div>
              ))}
              <Button className="justify-center mt-1">+ Nueva rúbrica</Button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
