import React from "react";
import { useNavigate } from "react-router-dom";
import { useCourses } from "../../hooks/useCourses";
import { InfoBox } from "../../components/ui/InfoBox";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Tag } from "../../components/ui/Tag";

export function StudentCoursesPage(): React.ReactElement {
  const navigate = useNavigate();
  const { data: courses, isLoading } = useCourses();

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Mis materias</h2>
        <p className="text-[13px] text-text-2">
          Aulas virtuales estilo Moodle · el Tutor IA está dentro de cada materia y responde con el material cargado por el profesor
        </p>
      </div>

      <InfoBox variant="info">
        🤖 El acceso al Tutor IA ya no aparece como sección separada: cada materia tiene su propio tutor contextual, alimentado por
        planificaciones, archivos y actividades de esa cátedra.
      </InfoBox>

      {isLoading && <p className="text-sm text-text-2">Cargando materias…</p>}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4.5">
        {(courses ?? []).map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/student/courses/${c.id}`)}
            className="text-left bg-surface border border-border rounded-lg p-5 shadow-sm hover:border-border-strong hover:shadow transition-all"
          >
            <div className="flex justify-between gap-2.5 items-start mb-2">
              <div>
                <div className="font-display text-sm font-bold text-text-1">{c.name}</div>
                <div className="text-xs text-text-3 mt-0.5">{c.professor}</div>
              </div>
              <Tag color="blue">Tutor IA</Tag>
            </div>
            <div className="mb-2.5">
              <ProgressBar value={c.progress} color={c.color} />
            </div>
            <div className="flex justify-between text-xs text-text-2">
              <span>{c.students} alumnos</span>
              <span>⭐ {c.rating}</span>
              <span className="font-bold" style={{ color: c.color }}>
                {c.progress}%
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-border flex justify-between items-center">
              <span className="text-xs text-text-2">Ver unidades, materiales y tutor</span>
              <strong className="text-primary text-xs">Ingresar →</strong>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
