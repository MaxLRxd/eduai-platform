import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { InfoBox } from "../../components/ui/InfoBox";
import { Tag } from "../../components/ui/Tag";
import { api, apiErrorMessage } from "../../services/api";

interface PerfilAlumno {
  alumno: { id: string; nombre: string; email: string; inscripto_en: string };
  materia: string;
  notas: { promedio: number | null; detalle: { periodo: string; calificacion: number; observaciones: string | null }[] };
  asistencia: { registros: number; porcentaje: number | null; por_estado: Record<string, number> };
  entregas: {
    actividades: number;
    entregadas: number;
    pendientes: number;
    calificadas: number;
    promedio_calificadas: number | null;
  };
  tutor: {
    sesiones: number;
    consultas: number;
    ultimas_consultas: { id: string; consulta: string; modo: string | null; fecha: string }[];
  };
  simulacros: { id: string; titulo: string; dificultad: string; puntaje: number; fecha: string }[];
  material: { total: number; vistos: number };
  alertas: { id: string; tipo: string; severidad: string; descripcion: string }[];
}

const MODO_LABEL: Record<string, string> = { NORMAL: "Normal", SOCRATIC: "Socrático", HINTS: "Pistas" };
const SEVERIDAD_COLOR: Record<string, "red" | "amber" | "blue"> = { ALTA: "red", MEDIA: "amber", BAJA: "blue" };

const num = (v: number | null, sufijo = ""): string => (v === null ? "—" : `${v}${sufijo}`);

function fecha(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Dato({ etiqueta, valor, color }: { etiqueta: string; valor: string; color: string }): React.ReactElement {
  return (
    <div className="p-4 bg-surface-2 rounded border border-border text-center">
      <div className="font-display text-2xl font-extrabold" style={{ color }}>
        {valor}
      </div>
      <div className="text-[11px] text-text-2 mt-1 font-medium">{etiqueta}</div>
    </div>
  );
}

/** Perfil del alumno desde la mirada del docente (CU-P08 / historial de interacciones con el tutor). */
export function TeacherStudentProfilePage(): React.ReactElement {
  const { alumnoId } = useParams();
  const [searchParams] = useSearchParams();
  const materiaId = searchParams.get("course");
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["teacher", "student-profile", materiaId, alumnoId],
    queryFn: async () =>
      (await api<{ perfil: PerfilAlumno }>(`/api/materias/${materiaId}/alumnos/${alumnoId}/perfil`)).perfil,
    enabled: Boolean(materiaId && alumnoId),
  });

  const volver = (
    <Button variant="ghost" onClick={() => navigate(-1)}>
      Volver
    </Button>
  );

  if (!materiaId) {
    return (
      <div className="space-y-4">
        {volver}
        <InfoBox variant="warning">Abrí el perfil desde “Mis estudiantes” para elegir la materia.</InfoBox>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">
            {data ? data.alumno.nombre : "Perfil del alumno"}
          </h2>
          <p className="text-[13px] text-text-2">
            {data ? `${data.alumno.email} · ${data.materia} · inscripto el ${fecha(data.alumno.inscripto_en)}` : ""}
          </p>
        </div>
        {volver}
      </div>

      {isLoading && <p className="text-sm text-text-2">Cargando perfil…</p>}
      {error && <InfoBox variant="error">{apiErrorMessage(error, "No se pudo cargar el perfil del alumno.")}</InfoBox>}

      {data && (
        <>
          {data.alertas.length > 0 && (
            <Card>
              <CardHeader title="⚠️ Alertas de riesgo académico" />
              <div className="flex flex-col gap-2">
                {data.alertas.map((a) => (
                  <div key={a.id} className="flex items-start gap-2">
                    <Tag color={SEVERIDAD_COLOR[a.severidad] ?? "blue"}>{a.severidad}</Tag>
                    <span className="text-[13px] text-text-1">{a.descripcion}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Dato etiqueta="Promedio de notas" valor={num(data.notas.promedio)} color="#003d7a" />
            <Dato etiqueta="Asistencia" valor={num(data.asistencia.porcentaje, "%")} color="#059669" />
            <Dato
              etiqueta="Entregas realizadas"
              valor={`${data.entregas.entregadas}/${data.entregas.actividades}`}
              color="#d97706"
            />
            <Dato etiqueta="Material visto" valor={`${data.material.vistos}/${data.material.total}`} color="#7c3aed" />
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader title="Notas" />
              {data.notas.detalle.length === 0 ? (
                <p className="text-[12px] text-text-3">Todavía no hay notas registradas.</p>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {data.notas.detalle.map((n, i) => (
                    <div key={i} className="flex justify-between gap-3 py-1.5 text-[13px]">
                      <span className="text-text-1">
                        {n.periodo}
                        {n.observaciones ? <span className="text-text-3"> · {n.observaciones}</span> : null}
                      </span>
                      <strong className="text-primary">{n.calificacion}</strong>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-[11px] text-text-3 mt-2.5">
                Entregas calificadas: {data.entregas.calificadas}
                {data.entregas.promedio_calificadas !== null ? ` · promedio ${data.entregas.promedio_calificadas}` : ""} ·
                pendientes: {data.entregas.pendientes}
              </div>
            </Card>

            <Card>
              <CardHeader title="🤖 Uso del Tutor IA" />
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Dato etiqueta="Sesiones" valor={String(data.tutor.sesiones)} color="#003d7a" />
                <Dato etiqueta="Consultas" valor={String(data.tutor.consultas)} color="#2563eb" />
              </div>
              {data.tutor.ultimas_consultas.length === 0 ? (
                <p className="text-[12px] text-text-3">Todavía no consultó al tutor.</p>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {data.tutor.ultimas_consultas.map((c) => (
                    <div key={c.id} className="py-1.5">
                      <div className="text-[13px] text-text-1">{c.consulta}</div>
                      <div className="text-[10px] text-text-3">
                        {fecha(c.fecha)} · modo {c.modo ? (MODO_LABEL[c.modo] ?? c.modo) : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader title="📝 Simulacros corregidos" />
            {data.simulacros.length === 0 ? (
              <p className="text-[12px] text-text-3">Todavía no hizo simulacros.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {data.simulacros.map((s) => (
                  <div key={s.id} className="flex justify-between gap-3 py-1.5 text-[13px]">
                    <span className="text-text-1">
                      {s.titulo} <span className="text-text-3">· {s.dificultad} · {fecha(s.fecha)}</span>
                    </span>
                    <strong className="text-primary">{s.puntaje}/10</strong>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
