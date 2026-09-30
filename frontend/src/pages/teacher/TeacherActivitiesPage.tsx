import React, { useState } from "react";
import { useTeacherCourses } from "../../hooks/useTeacherCourses";
import { useCourseSections } from "../../hooks/useContent";
import { useDeleteActivity, useTeacherActivities, useUpdateActivity } from "../../hooks/useActivities";
import { getRubrics } from "../../services/corrections.service";
import { apiErrorMessage } from "../../services/api";
import { useQuery } from "@tanstack/react-query";
import { CourseFilter } from "../../components/ui/CourseFilter";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { InfoBox } from "../../components/ui/InfoBox";
import { Tag, type TagColor } from "../../components/ui/Tag";
import { ActivityFormModal } from "../../components/teacher/ActivityFormModal";
import { TIPO_ACTIVIDAD_LABEL } from "../../services/activities.service";
import type { AssignmentType, Rubric } from "../../types/domain";
import type { TeacherActivity } from "../../services/activities.service";

const TIPO_COLOR: Record<AssignmentType, TagColor> = {
  MULTIPLE_CHOICE: "purple",
  DESARROLLO: "blue",
  ARCHIVO: "amber",
  CODIGO: "green",
};

function formatDue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function TeacherActivitiesPage(): React.ReactElement {
  const { data: courses } = useTeacherCourses();
  const [courseId, setCourseId] = useState<string>("");
  const materiaId = courseId || courses?.[0]?.id || "";

  const { data: sections } = useCourseSections(materiaId || null);
  const { data: activities, isLoading } = useTeacherActivities(materiaId || null);
  const { data: rubrics } = useQuery({
    queryKey: ["rubrics", materiaId],
    queryFn: () => getRubrics(materiaId),
    enabled: Boolean(materiaId),
  });

  const update = useUpdateActivity();
  const remove = useDeleteActivity();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherActivity | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const archivar = (a: TeacherActivity, activo: boolean): void => {
    setMsg(null);
    update.mutate(
      { actividadId: a.id, input: { activo } },
      {
        onSuccess: () => setMsg(activo ? `✅ "${a.nombre}" restaurada.` : `📦 "${a.nombre}" archivada. Los alumnos ya no la ven.`),
        onError: (e) => setMsg(`⚠️ ${e instanceof Error ? e.message : "No se pudo cambiar el estado"}`),
      }
    );
  };

  const eliminar = (a: TeacherActivity): void => {
    setMsg(null);
    remove.mutate(
      { actividadId: a.id },
      {
        onSuccess: () => setMsg(`🗑️ "${a.nombre}" eliminada.`),
        onError: (e) => {
          const detalle = apiErrorMessage(e, "No se pudo eliminar");
          setMsg(
            detalle.includes("Archivala")
              ? `⚠️ ${detalle}`
              : `⚠️ ${detalle} Archivala en su lugar para conservar las entregas.`
          );
        },
      }
    );
  };

  const lista = activities ?? [];

  return (
    <div>
      <div className="flex justify-between items-start gap-3.5 flex-wrap mb-6">
        <div>
          <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Actividades</h2>
          <p className="text-[13px] text-text-2">Definí los espacios de entrega de tus materias</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          disabled={!materiaId}
        >
          + Nueva actividad
        </Button>
      </div>

      {courses && courses.length > 0 && (
        <CourseFilter courses={courses} value={materiaId} onChange={setCourseId} />
      )}

      {msg && <InfoBox variant="info">{msg}</InfoBox>}

      <Card>
        <CardHeader title={`Actividades${lista.length ? ` (${lista.length})` : ""}`} />

        {isLoading && <p className="text-sm text-text-2">Cargando…</p>}
        {!isLoading && lista.length === 0 && (
          <p className="text-[13px] text-text-3 py-4 text-center">
            Todavía no creaste actividades en esta materia.
          </p>
        )}

        {lista.length > 0 && (
          <div className="flex flex-col divide-y divide-border">
            {lista.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-3 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`font-semibold text-text-1 text-sm ${a.activo ? "" : "line-through text-text-3"}`}>
                      {a.nombre}
                    </span>
                    <Tag color={TIPO_COLOR[a.tipo]}>{TIPO_ACTIVIDAD_LABEL[a.tipo]}</Tag>
                    {!a.activo && <Tag color="gray">Archivada</Tag>}
                    {a.correccion_manual && <Tag color="gray">Manual</Tag>}
                  </div>
                  <p className="text-xs text-text-2 line-clamp-2 mb-1">{a.consigna}</p>
                  <p className="text-[11px] text-text-3">
                    {a.seccion?.nombre ?? "—"} · Vence {formatDue(a.fecha_limite)} ·{" "}
                    {a.entregasCount === 0
                      ? "sin entregas"
                      : `${a.entregasCount} entrega${a.entregasCount === 1 ? "" : "s"}`}
                    {a.rubrica ? ` · Rúbrica: ${a.rubrica.nombre}` : ""}
                  </p>
                </div>

                <div className="flex gap-1.5 items-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(a);
                      setFormOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  {a.activo ? (
                    <Button size="sm" variant="secondary" onClick={() => archivar(a, false)}>
                      Archivar
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => archivar(a, true)}>
                      Restaurar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => eliminar(a)}
                    disabled={remove.isPending}
                    title={
                      a.entregasCount > 0
                        ? "Tiene entregas: se va a archivar en lugar de borrarse"
                        : "Eliminar definitivamente"
                    }
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ActivityFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        materiaId={materiaId || null}
        sections={sections ?? []}
        rubrics={(rubrics ?? []) as Rubric[]}
        editing={editing}
      />
    </div>
  );
}
