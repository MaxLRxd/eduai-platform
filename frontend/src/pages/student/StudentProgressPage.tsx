import React, { useState } from "react";
import { useProgress } from "../../hooks/useProgress";
import { Card, CardHeader } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import { Tag } from "../../components/ui/Tag";

export function StudentProgressPage(): React.ReactElement {
  const [periodo, setPeriodo] = useState("");
  const { data, isLoading } = useProgress(periodo || undefined);
  const summary = data?.summary ?? [];
  const grades = data?.grades ?? [];
  const attendance = data?.attendance ?? [];
  const overview = data?.overview;

  const tiles = [
    {
      label: "Promedio general",
      value: (overview?.promedioGeneral ?? 0).toFixed(1),
      color: "#003d7a",
    },
    {
      label: "Asistencia global",
      value: `${overview?.asistenciaGlobal ?? 0}%`,
      color: "#059669",
    },
    {
      label: "Actividades entregadas",
      value: `${overview?.actividades.entregadas ?? 0}/${overview?.actividades.total ?? 0}`,
      color: "#2563eb",
    },
    {
      label: "Mejor nota",
      value: (overview?.mejorNota ?? 0).toFixed(1),
      color: "#d97706",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-start gap-3.5 flex-wrap mb-6">
        <div>
          <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Mis estadísticas</h2>
          <p className="text-[13px] text-text-2">Notas, asistencia y desempeño en actividades · Vista completa</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="progress-periodo" className="block text-[11px] font-semibold text-text-2 mb-1">
              Período
            </label>
            <select
              id="progress-periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="px-3 py-2 border border-border rounded text-sm bg-surface"
            >
              <option value="">Todos los períodos</option>
              {(data?.periodos ?? []).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading && <p className="text-sm text-text-2 mb-4">Cargando estadísticas…</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {tiles.map((t) => (
          <Card key={t.label} className="text-center py-4 px-3">
            <div className="text-[11px] text-text-3 uppercase tracking-wide mb-1.5">{t.label}</div>
            <div className="font-display text-[22px] font-extrabold" style={{ color: t.color }}>
              {t.value}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        {summary.map((s) => (
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
                  <span className="text-xs text-text-2">Promedio notas</span>
                  <span className="text-xs font-bold" style={{ color: s.color }}>
                    {s.average}/10
                  </span>
                </div>
                <ProgressBar value={s.average * 10} color={s.color} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-text-2">Asistencia</span>
                  <span className="text-xs font-bold">{s.attendance}%</span>
                </div>
                <ProgressBar value={s.attendance} color={s.attendance >= 90 ? "#059669" : s.attendance >= 75 ? "#d97706" : "#dc2626"} />
              </div>
            </div>
            {s.categories.length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-border">
                <div className="text-[11px] font-semibold text-text-2 uppercase tracking-wide mb-1.5">
                  Cómo se arma tu nota
                </div>
                <ul aria-label={`Categorías de ${s.course}`} className="flex flex-col gap-1">
                  {s.categories.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-text-1">
                        {c.name} <span className="text-text-3">· vale {c.weight}%</span>
                      </span>
                      <span className={c.average === null ? "text-text-3" : "font-bold text-text-1"}>
                        {c.average === null ? "sin notas" : c.average.toFixed(2).replace(".", ",")}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-text-3 mt-1.5">
                  Tu promedio es el de cada categoría ponderado por su valor. Las categorías sin notas todavía no te
                  restan.
                </p>
                {s.uncategorized > 0 && (
                  <p className="text-[11px] text-warning mt-1">
                    {s.uncategorized} nota{s.uncategorized === 1 ? "" : "s"} sin categoría no cuenta
                    {s.uncategorized === 1 ? "" : "n"} todavía: consultalo con tu docente.
                  </p>
                )}
              </div>
            )}
          </Card>
        ))}
        {summary.length === 0 && (
          <Card className="md:col-span-2">
            <div className="py-6 text-[12px] text-text-3 text-center">Todavía no hay notas cargadas en tus materias.</div>
          </Card>
        )}
      </div>

      <Card className="mb-4.5">
        <CardHeader title="Detalle de calificaciones" />
        <TableWrap>
          <Table>
            <Thead>
              <tr>
                <Th>Evaluación</Th>
                <Th>Materia</Th>
                <Th>Categoría</Th>
                <Th>Período</Th>
                <Th>Fecha</Th>
                <Th>Nota</Th>
              </tr>
            </Thead>
            <tbody>
              {grades.map((g, i) => (
                <tr key={`${g.evaluation}-${g.course}-${i}`} className="hover:bg-surface-2">
                  <Td className="font-semibold text-text-1">{g.evaluation}</Td>
                  <Td>{g.course}</Td>
                  <Td>{g.category ?? <span className="text-text-3">—</span>}</Td>
                  <Td>
                    <Tag color="gray">{g.type}</Tag>
                  </Td>
                  <Td className="font-mono text-xs">{g.date}</Td>
                  <Td className={`font-extrabold ${g.grade >= 8 ? "text-success" : g.grade >= 6 ? "text-warning" : "text-danger"}`}>
                    {g.grade}
                  </Td>
                </tr>
              ))}
              {grades.length === 0 && (
                <tr>
                  <Td colSpan={6} className="text-center text-[12px] text-text-3 py-4">
                    No hay calificaciones registradas todavía.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableWrap>
      </Card>

      <Card>
        <CardHeader title="Registro de asistencia" />
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
              {attendance.map((a, i) => (
                <tr key={i} className="hover:bg-surface-2">
                  <Td className="font-mono text-xs">{a.date}</Td>
                  <Td>{a.course}</Td>
                  <Td>
                    <Tag color={a.status === "Presente" ? "green" : a.status === "Tardanza" ? "amber" : a.status === "Justificado" ? "gray" : "red"}>{a.status}</Tag>
                  </Td>
                </tr>
              ))}
              {attendance.length === 0 && (
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
