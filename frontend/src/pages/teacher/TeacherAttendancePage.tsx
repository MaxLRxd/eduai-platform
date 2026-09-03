import React, { useMemo, useState } from "react";
import { useTeacherCourses } from "../../hooks/useTeacherCourses";
import { useAttendanceState, useSaveAttendance } from "../../hooks/useAttendance";
import { CourseFilter } from "../../components/ui/CourseFilter";
import { Table, TableWrap, Td, Th, Thead } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { InfoBox } from "../../components/ui/InfoBox";
import type { DailyAttendanceStatus } from "../../types/domain";

const STATUS_META: Record<DailyAttendanceStatus, { label: string; short: string; classes: string }> = {
  present: { label: "Presente", short: "P", classes: "bg-emerald-100 border-success text-emerald-800" },
  absent: { label: "Ausente", short: "A", classes: "bg-red-100 border-danger text-red-900" },
  late: { label: "Tardanza", short: "T", classes: "bg-amber-100 border-warning text-amber-900" },
};

export function TeacherAttendancePage(): React.ReactElement {
  const { data: courses } = useTeacherCourses();
  const [selected, setSelected] = useState("");
  const courseId = selected || courses?.[0]?.id || "";
  const { data: students, isLoading, refetch } = useAttendanceState(courseId);
  const save = useSaveAttendance();

  const [today, setToday] = useState(() => new Date().toISOString().split("T")[0]);
  const [statuses, setStatuses] = useState<Record<string, DailyAttendanceStatus>>({});
  const [savedMsg, setSavedMsg] = useState("");

  const all = students ?? [];

  const currentStatus = (id: string, fallback: DailyAttendanceStatus): DailyAttendanceStatus =>
    statuses[id] ?? fallback;

  const setAll = (status: DailyAttendanceStatus): void => {
    const next: Record<string, DailyAttendanceStatus> = {};
    all.forEach((s) => (next[s.id] = status));
    setStatuses(next);
  };

  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0 };
    all.forEach((s) => {
      counts[statuses[s.id] ?? s.status]++;
    });
    return counts;
  }, [all, statuses]);

  const fechas = useMemo(() => {
    const set = new Set<string>();
    all.forEach((s) => s.history.forEach((_, i) => set.add(String(i))));
    if (all.length > 0 && all[0].history.length > 0) {
      return all[0].history.map((_, i) => `Clase ${i + 1}`);
    }
    return [...set];
  }, [all]);

  const handleConfirm = async (): Promise<void> => {
    if (!courseId) return;
    const registros = all.map((s) => ({ alumno_id: s.id, estado: statuses[s.id] ?? s.status }));
    await save.mutateAsync({ courseId, fechaClase: today, registros });
    setSavedMsg("✅ Asistencia guardada correctamente");
    setStatuses({});
    refetch();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Asistencia</h2>
        <p className="text-[13px] text-text-2">Registro de presencias por materia y curso</p>
      </div>

      <CourseFilter courses={courses ?? []} value={courseId} onChange={setSelected} />

      <div className="bg-surface border border-border rounded-lg px-4 py-3 mb-4 shadow-xs flex items-center gap-3 flex-wrap">
        <label htmlFor="att-date" className="text-[13px] font-semibold">
          Fecha de clase:
        </label>
        <input
          id="att-date"
          type="date"
          value={today}
          onChange={(e) => setToday(e.target.value)}
          className="px-2.5 py-1.5 border border-border rounded-sm text-[13px] font-mono bg-surface-2"
        />
        <div className="flex gap-1.5">
          <Button size="sm" onClick={() => setAll("present")}>
            ✅ Todos presentes
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAll("absent")}>
            ✗ Todos ausentes
          </Button>
        </div>
        <div className="ml-auto flex gap-3.5 text-xs font-semibold">
          <span className="text-success">● {summary.present} presentes</span>
          <span className="text-danger">● {summary.absent} ausentes</span>
          <span className="text-warning">● {summary.late} tardanzas</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 text-xs text-text-2 flex-wrap">
        <span className="font-bold">Leyenda:</span>
        {(Object.keys(STATUS_META) as DailyAttendanceStatus[]).map((k) => (
          <span key={k} className={`px-2 py-0.5 rounded font-bold border-[1.5px] ${STATUS_META[k].classes}`}>
            {STATUS_META[k].short}
          </span>
        ))}
        <span>Presente · Ausente · Tardanza</span>
      </div>

      {isLoading && <p className="text-sm text-text-2">Cargando asistencia…</p>}

      <TableWrap>
        <Table ariaLabel="Registro de asistencia">
          <Thead>
            <tr>
              <Th>Estudiante</Th>
              <Th>Hoy</Th>
              {fechas.map((d) => (
                <Th key={d}>{d}</Th>
              ))}
              <Th>% Asist.</Th>
            </tr>
          </Thead>
          <tbody>
            {all.map((s) => {
              const status = currentStatus(s.id, s.status);
              const pct = s.total ? Math.round(((s.total - s.absent) / s.total) * 100) : 0;
              const pctColor = pct >= 90 ? "text-success" : pct >= 75 ? "text-warning" : "text-danger";
              const barColor = pct >= 90 ? "bg-success" : pct >= 75 ? "bg-warning" : "bg-danger";
              return (
                <tr key={s.id} className="hover:bg-surface-2">
                  <Td className="font-semibold text-text-1">
                    {s.name}
                    {pct < 75 && (
                      <span className="ml-2 text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-1.5 py-0.5">
                        ⚠ En riesgo
                      </span>
                    )}
                  </Td>
                  <Td>
                    <div className="flex gap-1" role="radiogroup" aria-label={`Estado de ${s.name}`}>
                      {(Object.keys(STATUS_META) as DailyAttendanceStatus[]).map((k) => (
                        <label key={k} className="cursor-pointer flex flex-col items-center">
                          <input
                            type="radio"
                            name={`att-${s.id}`}
                            className="sr-only"
                            checked={status === k}
                            onChange={() => setStatuses((prev) => ({ ...prev, [s.id]: k }))}
                            aria-label={STATUS_META[k].label}
                          />
                          <span
                            className={`w-8 h-6.5 rounded-sm flex items-center justify-center text-[11px] font-extrabold border-[1.5px] ${
                              status === k ? STATUS_META[k].classes : "bg-surface border-border text-text-2"
                            }`}
                          >
                            {STATUS_META[k].short}
                          </span>
                        </label>
                      ))}
                    </div>
                  </Td>
                  {s.history.map((h, i) => (
                    <Td key={i} className="text-center">
                      <span className={h ? "text-success" : "text-danger"}>{h ? "✓" : "✗"}</span>
                    </Td>
                  ))}
                  <Td>
                    <div className="w-13 h-1.5 bg-surface-3 rounded overflow-hidden mb-0.5">
                      <div className={`h-full rounded ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-[11px] font-bold ${pctColor}`}>{pct}%</span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </TableWrap>

      <div className="flex items-center gap-3 flex-wrap mb-3.5">
        <Button onClick={handleConfirm} disabled={save.isPending || all.length === 0}>
          {save.isPending ? "Guardando…" : "✅ Confirmar asistencia del día"}
        </Button>
        <Button variant="secondary" size="sm">
          Exportar Excel
        </Button>
        {savedMsg && <span className="text-xs text-text-2">{savedMsg}</span>}
      </div>

      <InfoBox variant="warning">
        ⚠️ Una vez guardado, el registro queda asentado en el sistema. Podés corregirlo hasta las 23:59 del mismo día.
      </InfoBox>
    </div>
  );
}