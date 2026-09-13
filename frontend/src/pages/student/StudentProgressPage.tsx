import React from "react";
import { useProgress } from "../../hooks/useProgress";
import { Card, CardHeader } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import { Tag } from "../../components/ui/Tag";

export function StudentProgressPage(): React.ReactElement {
  const { summary, grades, attendance, overview } = useProgress();

  const tiles = [
    {
      icon: "📊",
      label: "Promedio general",
      value: (overview.data?.promedioGeneral ?? 0).toFixed(1),
      color: "#003d7a",
    },
    {
      icon: "📅",
      label: "Asistencia global",
      value: `${overview.data?.asistenciaGlobal ?? 0}%`,
      color: "#059669",
    },
    {
      icon: "✅",
      label: "Actividades entregadas",
      value: `${overview.data?.actividades.entregadas ?? 0}/${overview.data?.actividades.total ?? 0}`,
      color: "#2563eb",
    },
    {
      icon: "🏆",
      label: "Mejor nota",
      value: (overview.data?.mejorNota ?? 0).toFixed(1),
      color: "#d97706",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Mis estadísticas</h2>
        <p className="text-[13px] text-text-2">Notas, asistencia y desempeño en actividades · Vista completa</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {tiles.map((t) => (
          <Card key={t.label} className="text-center py-4 px-3">
            <div className="text-2xl mb-1">{t.icon}</div>
            <div className="text-[11px] text-text-3 uppercase tracking-wide mb-1.5">{t.label}</div>
            <div className="font-display text-[22px] font-extrabold" style={{ color: t.color }}>
              {t.value}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        {(summary.data ?? []).map((s) => (
          <Card key={s.course}>
            <div className="flex justify-between items-start mb-3">
              <span className="font-display text-sm font-bold">{s.course}</span>
              <div className="text-right">
                <div className="font-display text-2xl font-extrabold" style={{ color: s.color }}>
                  {s.average}
                </div>
                <div className="text-[11px] text-text-3">/10 promedio</div>
              </div>
            </div>
            <div className="h-px bg-border my-3" />
            <div className="flex flex-col gap-2.5">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-text-2">📊 Promedio notas</span>
                  <span className="text-xs font-bold" style={{ color: s.color }}>
                    {s.average}/10
                  </span>
                </div>
                <ProgressBar value={s.average * 10} color={s.color} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-text-2">📅 Asistencia</span>
                  <span className="text-xs font-bold">{s.attendance}%</span>
                </div>
                <ProgressBar value={s.attendance} color={s.attendance >= 90 ? "#059669" : s.attendance >= 75 ? "#d97706" : "#dc2626"} />
              </div>
            </div>
          </Card>
        ))}
        {(summary.data ?? []).length === 0 && (
          <Card className="md:col-span-2">
            <div className="py-6 text-[12px] text-text-3 text-center">Todavía no hay notas cargadas en tus materias.</div>
          </Card>
        )}
      </div>

      <Card className="mb-4.5">
        <CardHeader title="📋 Detalle de calificaciones" />
        <TableWrap>
          <Table>
            <Thead>
              <tr>
                <Th>Evaluación</Th>
                <Th>Materia</Th>
                <Th>Tipo</Th>
                <Th>Fecha</Th>
                <Th>Nota</Th>
              </tr>
            </Thead>
            <tbody>
              {(grades.data ?? []).map((g) => (
                <tr key={g.evaluation} className="hover:bg-surface-2">
                  <Td className="font-semibold text-text-1">{g.evaluation}</Td>
                  <Td>{g.course}</Td>
                  <Td>
                    <Tag color="gray">{g.type}</Tag>
                  </Td>
                  <Td className="font-mono text-xs">{g.date}</Td>
                  <Td className={`font-extrabold ${g.grade >= 8 ? "text-success" : g.grade >= 6 ? "text-warning" : "text-danger"}`}>
                    {g.grade}
                  </Td>
                </tr>
              ))}
              {(grades.data ?? []).length === 0 && (
                <tr>
                  <Td colSpan={5} className="text-center text-[12px] text-text-3 py-4">
                    No hay calificaciones registradas todavía.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableWrap>
      </Card>

      <Card>
        <CardHeader title="📅 Registro de asistencia" />
        <TableWrap>
          <Table>
            <Thead>
              <tr>
                <Th>Fecha</Th>
                <Th>Materia</Th>
                <Th>Estado</Th>
              </tr>
            </Thead>
            <tbody>
              {(attendance.data ?? []).map((a, i) => (
                <tr key={i} className="hover:bg-surface-2">
                  <Td className="font-mono text-xs">{a.date}</Td>
                  <Td>{a.course}</Td>
                  <Td>
                    <Tag color={a.status === "Presente" ? "green" : a.status === "Tardanza" ? "amber" : a.status === "Justificado" ? "gray" : "red"}>{a.status}</Tag>
                  </Td>
                </tr>
              ))}
              {(attendance.data ?? []).length === 0 && (
                <tr>
                  <Td colSpan={3} className="text-center text-[12px] text-text-3 py-4">
                    No hay registros de asistencia todavía.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
}
