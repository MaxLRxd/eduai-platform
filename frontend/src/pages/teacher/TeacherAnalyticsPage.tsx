import React, { useState } from "react";
import { useTeacherCourses } from "../../hooks/useTeacherCourses";
import { useAnalytics } from "../../hooks/useAnalytics";
import { Card, CardHeader } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";
import { InfoBox } from "../../components/ui/InfoBox";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import type { TopicUnderstanding } from "../../types/domain";

const TOPIC_BG: Record<TopicUnderstanding["level"], string> = {
  Dominado: "bg-emerald-100",
  "En proceso": "bg-amber-100",
  Crítico: "bg-red-100",
};

export function TeacherAnalyticsPage(): React.ReactElement {
  const { data: courses } = useTeacherCourses();
  const [courseId, setCourseId] = useState<string | null>(null);
  const activeCourse = courseId ?? courses?.[0]?.id ?? null;

  const { topics, risks, errors, questions } = useAnalytics(activeCourse);

  const kpis = [
    { icon: "🧠", label: "Temas analizados", value: String(topics.data?.length ?? 0), color: "#003d7a" },
    { icon: "⚠️", label: "Alertas de riesgo activas", value: String(risks.data?.length ?? 0), color: "#dc2626" },
    { icon: "🔁", label: "Errores frecuentes", value: String(errors.data?.length ?? 0), color: "#2563eb" },
    { icon: "💬", label: "Dudas frecuentes", value: String(questions.data?.length ?? 0), color: "#059669" },
  ];

  const riskCardClass = (risk: string): string =>
    risk === "Alto" ? "bg-danger-light border-red-300" : risk === "Medio" ? "bg-warning-light border-amber-300" : "bg-success-light border-emerald-200";

  const riskTagColor = (risk: string): "red" | "amber" | "green" =>
    risk === "Alto" ? "red" : risk === "Medio" ? "amber" : "green";

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Analytics de clase</h2>
        <p className="text-[13px] text-text-2">Dashboard de comprensión, alertas académicas y errores frecuentes</p>
      </div>

      <div className="max-w-md mb-5">
        <label htmlFor="analytics-course" className="block text-xs font-semibold text-text-1 mb-1.5">
          Materia / curso
        </label>
        <select
          id="analytics-course"
          value={activeCourse ?? ""}
          onChange={(e) => setCourseId(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
        >
          {(courses ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.label} — {c.curso}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {kpis.map((k) => (
          <Card key={k.label} className="text-center py-4.5 px-3.5">
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="text-[11px] text-text-3 uppercase tracking-wide mb-1.5">{k.label}</div>
            <div className="font-display text-[22px] font-extrabold" style={{ color: k.color }}>
              {k.value}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <Card>
          <CardHeader title="🗺️ Mapa de comprensión por tema" />
          <p className="text-xs text-text-3 mb-3">Intensidad = frecuencia de dudas y errores · verde = dominado · rojo = área crítica</p>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {(topics.data ?? []).map((t) => (
              <div key={t.topic} className={`rounded-sm px-1.5 py-2 text-center ${TOPIC_BG[t.level]}`} title={t.level}>
                <div className="text-[10px] font-bold text-text-1 leading-tight">{t.topic}</div>
                <div className="text-[9px] text-text-2 mt-0.5">{t.level}</div>
              </div>
            ))}
            {!topics.isLoading && (topics.data ?? []).length === 0 && (
              <p className="text-xs text-text-2 col-span-2">Sin datos de comprensión para esta materia.</p>
            )}
          </div>
          <div className="flex gap-3 text-xs text-text-2">
            <span>🟢 Dominado</span>
            <span>🟡 En proceso</span>
            <span>🔴 Crítico</span>
          </div>
        </Card>

        <Card>
          <CardHeader title="⚠️ Alertas: alumnos en riesgo" />
          <div className="flex flex-col gap-2">
            {(risks.data ?? []).map((a) => (
              <div
                key={a.name}
                className={`flex justify-between items-center p-2.5 rounded border ${riskCardClass(a.risk)}`}
              >
                <div>
                  <div className="text-[13px] font-bold text-text-1">{a.name}</div>
                  <div className="text-[11px] text-text-2 mt-0.5">{a.issue}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Tag color={riskTagColor(a.risk)}>{a.risk}</Tag>
                </div>
              </div>
            ))}
            {!risks.isLoading && (risks.data ?? []).length === 0 && (
              <p className="text-xs text-text-2">Sin alertas de riesgo activas en esta materia.</p>
            )}
          </div>
          <div className="mt-2.5">
            <InfoBox variant="info">Las alertas se actualizan automáticamente según el Analytics Engine.</InfoBox>
          </div>
        </Card>
      </div>

      <Card className="mb-4.5">
        <CardHeader title="🔁 Errores conceptuales más frecuentes" action={<Tag color="blue">Período 2026-1</Tag>} />
        <TableWrap>
          <Table>
            <Thead>
              <tr>
                <Th>#</Th>
                <Th>Error / Confusión</Th>
                <Th>Frecuencia</Th>
                <Th>Temas relacionados</Th>
              </tr>
            </Thead>
            <tbody>
              {(errors.data ?? []).map((e) => (
                <tr key={e.rank} className="hover:bg-surface-2">
                  <Td className="font-extrabold text-text-3">{e.rank}</Td>
                  <Td className="font-semibold text-text-1">{e.description}</Td>
                  <Td>
                    <Tag color="red">{e.studentCount} consultas</Tag>
                  </Td>
                  <Td className="text-xs">{e.topics}</Td>
                </tr>
              ))}
              {!errors.isLoading && (errors.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-2.5 text-xs text-text-2">
                    Sin errores frecuentes registrados para esta materia.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableWrap>
      </Card>

      <Card>
        <CardHeader title="💬 Dudas frecuentes al Tutor IA" />
        <div className="flex flex-col">
          {(questions.data ?? []).map((q, i) => (
            <div key={q.question} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-text-3 w-5">{i + 1}.</span>
                <span className="text-[13px] text-text-1">{q.question}</span>
              </div>
              <Tag color="blue">{q.count} consultas</Tag>
            </div>
          ))}
          {!questions.isLoading && (questions.data ?? []).length === 0 && (
            <p className="text-xs text-text-2 py-2">Sin dudas registradas para esta materia.</p>
          )}
        </div>
      </Card>
    </div>
  );
}