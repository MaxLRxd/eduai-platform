import React, { useEffect, useState } from "react";
import { useTeacherCourses } from "../../hooks/useTeacherCourses";
import { usePlanning, useSavePlanning } from "../../hooks/usePlanning";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

function shortDate(iso: string): string {
  const f = new Date(iso);
  return Number.isNaN(f.getTime()) ? iso : f.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export function TeacherPlanningPage(): React.ReactElement {
  const { data: courses } = useTeacherCourses();
  const [courseId, setCourseId] = useState<string | null>(null);
  const activeCourse = courseId ?? courses?.[0]?.id ?? null;
  const activeName = courses?.find((c) => c.id === activeCourse)?.label ?? "la materia seleccionada";

  const { data: planning, isLoading } = usePlanning(activeCourse, activeName);
  const save = useSavePlanning();

  const [classIndex, setClassIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [material, setMaterial] = useState("");
  const [visible, setVisible] = useState(false);

  const current = planning?.[classIndex];

  useEffect(() => {
    if (current) {
      setTitle(current.title);
      setMaterial(current.material);
      setVisible(current.studentVisible);
    }
  }, [current]);

  const handleCourseChange = (id: string): void => {
    setCourseId(id);
    setClassIndex(0);
  };

  const handleSave = (): void => {
    if (!activeCourse || !current) return;
    save.mutate({
      courseId: activeCourse,
      date: current.date,
      title,
      material,
      studentVisible: visible,
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Planificación</h2>
        <p className="text-[13px] text-text-2">Organizá tus clases por curso. El material puede quedar visible para los alumnos.</p>
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
              value={activeCourse ?? ""}
              onChange={(e) => handleCourseChange(e.target.value)}
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
          {(planning ?? []).length > 0 ? (
            <div className="flex gap-2 mb-4 flex-wrap">
              {(planning ?? []).map((p, idx) => (
                <button
                  key={p.date}
                  onClick={() => setClassIndex(idx)}
                  className={`flex-1 min-w-[110px] flex flex-col items-center gap-0.5 py-3 px-1.5 rounded text-center transition-colors ${
                    classIndex === idx ? "bg-primary text-white" : "bg-surface border border-border text-text-1"
                  }`}
                >
                  <span className="text-sm font-extrabold">{shortDate(p.date)}</span>
                  <span className={`text-[10px] font-semibold ${classIndex === idx ? "text-white/70" : "text-text-3"}`}>
                    {p.title ? `${p.title.slice(0, 16)}${p.title.length > 16 ? "…" : ""}` : "Sin cargar"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            !isLoading && <p className="text-xs text-text-2 mb-4">No hay clases planificadas para esta materia.</p>
          )}

          <div className="mb-2.5 px-3 py-2 bg-primary-light rounded text-xs font-semibold text-primary">
            📌 Editando: {current ? shortDate(current.date) : "—"}
          </div>

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
              placeholder="Agregá enlaces, consignas, videos o indicaciones que los alumnos podrán observar."
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
          </div>

          <label className="bg-info-light border border-blue-200 rounded px-3 py-2.5 text-xs text-blue-900 flex items-center gap-2 cursor-pointer mb-3.5">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} /> Visible para alumnos
          </label>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSave} disabled={save.isPending || !current || !title.trim()}>
              {save.isPending ? "Guardando…" : "Guardar planificación"}
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
        </Card>
      </div>
    </div>
  );
}