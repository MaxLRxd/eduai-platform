import React, { useEffect, useState } from "react";
import { useTeacherCourses } from "../../hooks/useTeacherCourses";
import { usePlanning, useSavePlanning } from "../../hooks/usePlanning";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function TeacherPlanningPage(): React.ReactElement {
  const { data: courses } = useTeacherCourses();
  const { data: planning, isLoading } = usePlanning();
  const save = useSavePlanning();

  const [courseId, setCourseId] = useState("prog2");
  const [classIndex, setClassIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [material, setMaterial] = useState("");
  const [visible, setVisible] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  const current = planning?.[classIndex];

  useEffect(() => {
    if (current) {
      setTitle(current.title);
      setMaterial(current.material);
      setVisible(current.studentVisible);
      setAiEnabled(current.aiEnabled);
    }
  }, [current]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Planificación</h2>
        <p className="text-[13px] text-text-2">Organizá tus clases por curso. El material puede quedar visible para los alumnos y disponible para la IA.</p>
      </div>

      {isLoading && <p className="text-sm text-text-2">Cargando planificación…</p>}

      <div className="grid xl:grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardHeader title="Materia / Curso" />
          <div className="mb-4">
            <label htmlFor="planning-course" className="block text-xs font-semibold text-text-1 mb-1.5">
              Seleccioná la materia y curso
            </label>
            <select
              id="planning-course"
              value={courseId}
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

          <CardHeader title="Clases del curso" />
          <div className="flex gap-2 mb-4">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => setClassIndex(idx)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-3 px-1.5 rounded text-center transition-colors ${
                  classIndex === idx ? "bg-primary text-white" : "bg-surface border border-border text-text-1"
                }`}
              >
                <span className="text-base font-extrabold">{idx + 1}</span>
                <span className="text-[10px] font-semibold opacity-80">Clase {idx + 1}</span>
                <span className={`text-[10px] ${classIndex === idx ? "text-white/70" : "text-text-3"}`}>
                  {(planning?.[idx]?.title || "Sin cargar").slice(0, 14)}…
                </span>
              </button>
            ))}
          </div>

          <div className="mb-2.5 px-3 py-2 bg-primary-light rounded text-xs font-semibold text-primary">📌 Editando: Clase {classIndex + 1}</div>

          <div className="mb-3.5">
            <label htmlFor="planning-title" className="block text-xs font-semibold text-text-1 mb-1.5">
              Título de la clase
            </label>
            <input
              id="planning-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej.: Clases y objetos"
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
          </div>

          <div className="mb-3.5">
            <label htmlFor="planning-material" className="block text-xs font-semibold text-text-1 mb-1.5">
              Material para estudiantes
            </label>
            <textarea
              id="planning-material"
              rows={5}
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Agregá enlaces, archivos, consignas, videos o indicaciones que los alumnos podrán observar."
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
          </div>

          {current && current.attachments.length > 0 && (
            <div className="mb-3.5">
              <div className="text-xs font-semibold text-text-1 mb-1.5">Archivos de la planificación docente</div>
              <div className="border-[1.5px] border-dashed border-border-strong rounded p-3.5 bg-surface-2">
                {current.attachments.map((a) => (
                  <div key={a.name} className="text-xs text-text-2 py-0.5">
                    📎 {a.name} · {a.sizeLabel}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3.5">
            <label className="bg-info-light border border-blue-200 rounded px-3 py-2.5 text-xs text-blue-900 flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} /> Visible para alumnos
            </label>
            <label className="bg-success-light border border-emerald-200 rounded px-3 py-2.5 text-xs text-emerald-900 flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} /> La IA puede usar estos datos
            </label>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Guardando…" : "Guardar planificación"}
            </Button>
            <Button variant="secondary" onClick={() => setClassIndex((i) => Math.min(i + 1, 2))}>
              Copiar a siguiente clase
            </Button>
          </div>
          {save.isSuccess && <p className="text-xs text-success mt-2">✅ Planificación guardada</p>}
        </Card>

        <Card>
          <CardHeader title="Vista para alumnos" />
          <div className="p-3.5 border border-border rounded bg-surface-2 text-[13px] text-text-2">
            {visible ? (
              <>
                <div className="font-semibold text-text-1 mb-1">{title || "Sin título"}</div>
                <div>{material || "Sin material cargado todavía."}</div>
              </>
            ) : (
              "Esta clase todavía no es visible para los alumnos."
            )}
          </div>
          <div className="h-px bg-border my-3.5" />
          <CardHeader title="Datos que leerá la IA" />
          <div className="text-xs text-text-2 leading-relaxed">
            {aiEnabled ? (
              <>
                Título: {title || "—"}
                <br />
                Material: {material || "—"}
              </>
            ) : (
              "La IA no tiene habilitado el uso de esta planificación."
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
