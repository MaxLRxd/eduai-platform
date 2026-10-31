import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSimulacro } from "../../hooks/useTutorTools";
import {
  corregirSimulacro,
  listarSimulacros,
  type DificultadExamen,
  type ExamenResult,
  type SimulacroCorregido,
  type VeredictoExamen,
} from "../../services/tutor.service";
import { apiErrorMessage } from "../../services/api";
import type { Course } from "../../types/domain";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import { InfoBox } from "../ui/InfoBox";
import { Tag, type TagColor } from "../ui/Tag";

const DIFICULTADES: { value: DificultadExamen; label: string }[] = [
  { value: "facil", label: "Fácil" },
  { value: "media", label: "Media" },
  { value: "dificil", label: "Difícil" },
];

const DIFICULTAD_TAG = { facil: "green", media: "blue", dificil: "red" } as const;

const VEREDICTO: Record<VeredictoExamen, { label: string; color: TagColor }> = {
  correcta: { label: "Correcta", color: "green" },
  parcial: { label: "Parcial", color: "amber" },
  incorrecta: { label: "Incorrecta", color: "red" },
  sin_responder: { label: "Sin responder", color: "gray" },
};

function formatearFecha(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function PreguntaRespondible({
  pregunta,
  indice,
  respuesta,
  onChange,
  disabled,
}: {
  pregunta: ExamenResult["preguntas"][number];
  indice: number;
  respuesta: string;
  onChange: (valor: string) => void;
  disabled: boolean;
}): React.ReactElement {
  return (
    <fieldset className="border border-border rounded p-3" disabled={disabled}>
      <legend className="sr-only">Pregunta {indice + 1}</legend>
      <div className="flex gap-2 items-start mb-2">
        <span className="text-[11px] font-bold text-text-3 shrink-0 mt-0.5">{indice + 1}.</span>
        <p className="text-[13px] text-text-1 font-medium leading-relaxed flex-1">{pregunta.enunciado}</p>
      </div>

      {pregunta.tipo === "multiple_choice" && pregunta.opciones.length > 0 ? (
        <div className="flex flex-col gap-1.5 pl-6">
          {pregunta.opciones.map((opcion, i) => (
            <label key={i} className="flex items-start gap-2 text-[13px] text-text-2 cursor-pointer">
              <input
                type="radio"
                name={`pregunta-${indice}`}
                checked={respuesta === opcion}
                onChange={() => onChange(opcion)}
                className="mt-1"
              />
              <span>
                {String.fromCharCode(97 + i)}) {opcion}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <textarea
          aria-label={`Respuesta a la pregunta ${indice + 1}`}
          rows={3}
          value={respuesta}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribí tu respuesta…"
          className="w-full px-3 py-2 border border-border rounded text-sm"
        />
      )}
    </fieldset>
  );
}

function ResultadoCorreccion({ resultado }: { resultado: SimulacroCorregido }): React.ReactElement {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="bg-surface-2 border border-border rounded p-3.5 text-center">
        <div className="text-[11px] text-text-3 mb-1">Tu resultado</div>
        <div className="font-display text-3xl font-extrabold text-primary">{resultado.puntaje}</div>
        <div className="text-[11px] text-text-3">/10</div>
        <div className="flex justify-center gap-1.5 flex-wrap mt-2.5">
          <Tag color="green">{resultado.correctas} correctas</Tag>
          <Tag color="amber">{resultado.parciales} parciales</Tag>
          <Tag color="red">{resultado.incorrectas} incorrectas</Tag>
          {resultado.sin_responder > 0 && <Tag color="gray">{resultado.sin_responder} sin responder</Tag>}
        </div>
        {resultado.id && <p className="text-[11px] text-text-3 mt-2">Guardado en tu historial.</p>}
      </div>

      {resultado.resultados.map((r) => (
        <div key={r.indice} className="border border-border rounded p-3">
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <p className="text-[13px] text-text-1 font-medium leading-relaxed">
              {r.indice + 1}. {r.enunciado}
            </p>
            <Tag color={VEREDICTO[r.veredicto].color}>{VEREDICTO[r.veredicto].label}</Tag>
          </div>
          {r.respuesta_alumno && (
            <p className="text-[12px] text-text-2 mb-1">
              <strong>Tu respuesta:</strong> {r.respuesta_alumno}
            </p>
          )}
          <p className="text-[12px] text-text-1 leading-relaxed bg-surface-2 rounded px-2.5 py-2">{r.feedback}</p>
          {r.veredicto !== "correcta" && r.respuesta_correcta && (
            <p className="text-[12px] text-text-2 mt-1.5">
              <strong>Respuesta modelo:</strong> {r.respuesta_correcta}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function SimulacroPanel({ course }: { course: Course }): React.ReactElement {
  const { resultado, pending, error, generar, limpiar } = useSimulacro();
  const queryClient = useQueryClient();
  const [nPreguntas, setNPreguntas] = useState(5);
  const [dificultad, setDificultad] = useState<DificultadExamen>("media");

  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  const [confirmando, setConfirmando] = useState(false);
  const [guardarEnHistorial, setGuardarEnHistorial] = useState(true);
  const [corregido, setCorregido] = useState<SimulacroCorregido | null>(null);

  const historial = useQuery({
    queryKey: ["simulacros", course.id],
    queryFn: () => listarSimulacros(course.id),
  });

  const corregir = useMutation({
    mutationFn: (examen: ExamenResult) =>
      corregirSimulacro(course.id, {
        titulo: examen.titulo,
        dificultad: examen.dificultad,
        registrar: guardarEnHistorial,
        preguntas: examen.preguntas.map((p, i) => ({
          tipo: p.tipo,
          enunciado: p.enunciado,
          opciones: p.opciones,
          respuesta_modelo: p.respuesta,
          respuesta_alumno: respuestas[i] ?? "",
        })),
      }),
    onSuccess: (data) => {
      setCorregido(data);
      setConfirmando(false);
      void queryClient.invalidateQueries({ queryKey: ["simulacros", course.id] });
    },
  });

  const sinResponder = resultado
    ? resultado.preguntas.map((_, i) => i).filter((i) => !(respuestas[i] ?? "").trim())
    : [];

  const reiniciar = (): void => {
    limpiar();
    setRespuestas({});
    setConfirmando(false);
    setCorregido(null);
    corregir.reset();
  };

  return (
    <Card>
      <CardHeader
        title="📝 Simulacro de examen"
        action={
          resultado || error ? (
            <Button variant="ghost" size="sm" onClick={reiniciar}>
              {corregido ? "Nuevo simulacro" : "Descartar"}
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
            Se arma con el material indexado de {course.name}. Puede tardar hasta un minuto. Después podés
            responderlo y pedir la corrección del tutor.
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
            <Tag color={DIFICULTAD_TAG[resultado.dificultad as DificultadExamen] ?? "gray"}>
              {resultado.dificultad}
            </Tag>
          </div>

          {corregido ? (
            <ResultadoCorreccion resultado={corregido} />
          ) : (
            <>
              {resultado.preguntas.map((p, i) => (
                <PreguntaRespondible
                  key={i}
                  pregunta={p}
                  indice={i}
                  respuesta={respuestas[i] ?? ""}
                  onChange={(valor) => setRespuestas((prev) => ({ ...prev, [i]: valor }))}
                  disabled={corregir.isPending}
                />
              ))}

              {corregir.isError && (
                <InfoBox variant="error">
                  {apiErrorMessage(corregir.error, "No se pudo corregir el simulacro.")} Tus respuestas siguen
                  acá: podés reintentar.
                </InfoBox>
              )}

              {!confirmando ? (
                <Button
                  fullWidth
                  className="justify-center"
                  disabled={sinResponder.length === resultado.preguntas.length}
                  onClick={() => setConfirmando(true)}
                >
                  Solicitar corrección
                </Button>
              ) : (
                <div className="border border-primary rounded p-3 bg-surface-2">
                  <p className="text-[13px] text-text-1 font-semibold mb-1.5">¿Enviar las respuestas a corregir?</p>
                  {sinResponder.length > 0 && (
                    <p className="text-[12px] text-amber-800 mb-2">
                      Hay {sinResponder.length} {sinResponder.length === 1 ? "pregunta sin responder" : "preguntas sin responder"}{" "}
                      ({sinResponder.map((i) => i + 1).join(", ")}). Se van a corregir como sin responder: podés
                      completarlas antes o pedir una corrección parcial.
                    </p>
                  )}
                  <label className="flex items-center gap-2 text-[12px] text-text-2 mb-2.5">
                    <input
                      type="checkbox"
                      checked={guardarEnHistorial}
                      onChange={(e) => setGuardarEnHistorial(e.target.checked)}
                    />
                    Guardar el resultado en mi historial
                  </label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={corregir.isPending}
                      onClick={() => corregir.mutate(resultado)}
                    >
                      {corregir.isPending
                        ? "Corrigiendo…"
                        : sinResponder.length > 0
                          ? "Corregir parcialmente"
                          : "Confirmar y corregir"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={corregir.isPending}
                      onClick={() => setConfirmando(false)}
                    >
                      {sinResponder.length > 0 ? "Completar respuestas" : "Volver"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {(historial.data?.length ?? 0) > 0 && (
        <div className="mt-4 pt-3.5 border-t border-border">
          <div className="text-[12px] font-bold text-text-2 uppercase tracking-wide mb-2">Mis simulacros</div>
          <div className="flex flex-col divide-y divide-border">
            {historial.data!.slice(0, 5).map((h) => (
              <div key={h.id} className="flex justify-between items-center gap-2 py-1.5">
                <div className="min-w-0">
                  <div className="text-[12px] text-text-1 font-medium truncate">{h.titulo}</div>
                  <div className="text-[11px] text-text-3">
                    {formatearFecha(h.creado_en)} · {h.correctas} de{" "}
                    {h.correctas + h.parciales + h.incorrectas + h.sin_responder} correctas
                  </div>
                </div>
                <strong className="text-[13px] text-primary shrink-0">{h.puntaje}/10</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
