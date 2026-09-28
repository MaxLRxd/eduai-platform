import React, { useState } from "react";
import { useSimulacro } from "../../hooks/useTutorTools";
import type { DificultadExamen, ExamenPregunta } from "../../services/tutor.service";
import type { Course } from "../../types/domain";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import { Tag } from "../ui/Tag";

const DIFICULTADES: { value: DificultadExamen; label: string }[] = [
  { value: "facil", label: "Fácil" },
  { value: "media", label: "Media" },
  { value: "dificil", label: "Difícil" },
];

const DIFICULTAD_TAG = { facil: "green", media: "blue", dificil: "red" } as const;

function Pregunta({
  pregunta,
  indice,
}: {
  pregunta: ExamenPregunta;
  indice: number;
}): React.ReactElement {
  const [revelada, setRevelada] = useState(false);

  return (
    <div className="border border-border rounded p-3">
      <div className="flex gap-2 items-start mb-2">
        <span className="text-[11px] font-bold text-text-3 shrink-0 mt-0.5">{indice + 1}.</span>
        <p className="text-[13px] text-text-1 font-medium leading-relaxed flex-1">
          {pregunta.enunciado}
        </p>
      </div>

      {pregunta.opciones.length > 0 && (
        <ul className="flex flex-col gap-1 mb-2.5 pl-6">
          {pregunta.opciones.map((opcion, i) => (
            <li key={i} className="text-[13px] text-text-2">
              {String.fromCharCode(97 + i)}) {opcion}
            </li>
          ))}
        </ul>
      )}

      {pregunta.respuesta ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRevelada((v) => !v)}
        >
          {revelada ? "Ocultar respuesta" : "Ver respuesta"}
        </Button>
      ) : null}
      {revelada && pregunta.respuesta && (
        <div className="mt-2 bg-surface-2 rounded px-3 py-2 text-[13px] text-text-1 leading-relaxed">
          {pregunta.respuesta}
        </div>
      )}
    </div>
  );
}

export function SimulacroPanel({ course }: { course: Course }): React.ReactElement {
  const { resultado, pending, error, generar, limpiar } = useSimulacro();
  const [nPreguntas, setNPreguntas] = useState(5);
  const [dificultad, setDificultad] = useState<DificultadExamen>("media");

  return (
    <Card>
      <CardHeader
        title="📝 Simulacro de examen"
        action={
          resultado || error ? (
            <Button variant="ghost" size="sm" onClick={limpiar}>
              Limpiar
            </Button>
          ) : undefined
        }
      />

      {!resultado && (
        <div className="flex flex-col gap-2.5">
          <div>
            <label className="block text-[12px] font-semibold text-text-1 mb-1.5" htmlFor="n-preguntas">
              Cantidad de preguntas
            </label>
            <select
              id="n-preguntas"
              className="w-full px-3 py-2 border border-border rounded text-sm"
              value={nPreguntas}
              onChange={(e) => setNPreguntas(Number(e.target.value))}
            >
              {[3, 5, 8, 10, 15].map((n) => (
                <option key={n} value={n}>
                  {n} preguntas
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-[12px] font-semibold text-text-1 mb-1.5">Dificultad</span>
            <div className="flex gap-2">
              {DIFICULTADES.map((d) => (
                <Button
                  key={d.value}
                  size="sm"
                  variant={dificultad === d.value ? "primary" : "secondary"}
                  onClick={() => setDificultad(d.value)}
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          <Button
            fullWidth
            className="mt-1 justify-center"
            disabled={pending}
            onClick={() => void generar(course.id, nPreguntas, dificultad)}
          >
            {pending ? "Generando simulacro…" : "Generar simulacro"}
          </Button>
          <p className="text-[11px] text-text-3 leading-relaxed">
            Se arma con el material indexado de {course.name}. Puede tardar hasta un minuto.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-danger-light border border-red-300 rounded px-3 py-2.5 text-[13px] text-red-800">
          {error}
        </div>
      )}

      {resultado && (
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between gap-2.5 items-center">
            <strong className="text-[14px] text-text-1">{resultado.titulo}</strong>
            <Tag
              color={
                DIFICULTAD_TAG[resultado.dificultad as DificultadExamen] ?? "gray"
              }
            >
              {resultado.dificultad}
            </Tag>
          </div>
          {resultado.preguntas.map((p, i) => (
            <Pregunta key={i} pregunta={p} indice={i} />
          ))}
        </div>
      )}
    </Card>
  );
}
