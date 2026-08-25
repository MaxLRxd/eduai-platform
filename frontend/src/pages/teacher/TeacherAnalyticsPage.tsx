import React from "react";
import { useAnalytics } from "../../hooks/useAnalytics";
import { Card, CardHeader } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import { InfoBox } from "../../components/ui/InfoBox";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import type { TopicUnderstanding } from "../../types/domain";

const KPIS = [
  { icon: "🧑‍🎓", label: "Alumnos activos", value: "18 / 22", color: "#003d7a" },
  { icon: "⚠️", label: "En riesgo", value: "3", color: "#dc2626" },
  { icon: "📬", label: "Consultas IA hoy", value: "47", color: "#2563eb" },
  { icon: "✅", label: "Actividades entregadas", value: "89%", color: "#059669" },
];

const TOPIC_BG: Record<TopicUnderstanding["level"], string> = {
  Dominado: "bg-emerald-100",
  "En proceso": "bg-amber-100",
  Crítico: "bg-red-100",
};

export function TeacherAnalyticsPage(): React.ReactElement {
  const { topics, risks, errors, questions } = useAnalytics();

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Analytics de clase</h2>
        <p className="text-[13px] text-text-2">Dashboard de comprensión, alertas académicas y errores frecuentes</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {KPIS.map((k) => (
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
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {(topics.data ?? []).map((t) => (
              <div key={t.topic} className={`rounded-sm px-1.5 py-2 text-center ${TOPIC_BG[t.level]}`} title={t.level}>
                <div className="text-[10px] font-bold text-text-1 leading-tight">{t.topic}</div>
                <div className="text-[9px] text-text-2 mt-0.5">{t.level}</div>
              </div>
            ))}
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
                className={`flex justify-between items-center p-2.5 rounded border ${
                  a.risk === "Alto" ? "bg-danger-light border-red-300" : "bg-warning-light border-amber-300"
                }`}
              >
                <div>
                  <div className="text-[13px] font-bold text-text-1">{a.name}</div>
                  <div className="text-[11px] text-text-2 mt-0.5">{a.issue}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Tag color={a.risk === "Alto" ? "red" : "amber"}>{a.risk}</Tag>
                  <Button variant="ghost" size="sm">
                    Contactar
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2.5">
            <InfoBox variant="info">Las alertas se actualizan automáticamente según el Analytics Engine.</InfoBox>
          </div>
        </Card>
      </div>

      <Card className="mb-4.5">
        <CardHeader title="🔁 Errores conceptuales más frecuentes" action={<Tag color="blue">Últimas 2 semanas</Tag>} />
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
                    <Tag color="red">{e.studentCount} alumnos</Tag>
                  </Td>
                  <Td className="text-xs">{e.topics}</Td>
                </tr>
              ))}
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
        </div>
      </Card>
    </div>
  );
}
