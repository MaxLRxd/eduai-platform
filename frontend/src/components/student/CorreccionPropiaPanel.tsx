import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  corregirSimulacro,
  getMaterialDisponible,
  type MaterialDisponible,
  type SimulacroCorregido,
} from "../../services/tutor.service";
import { apiErrorMessage } from "../../services/api";
import type { Course } from "../../types/domain";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import { InfoBox } from "../ui/InfoBox";
import { ResultadoCorreccion } from "./SimulacroPanel";

const MAX_PREGUNTAS = 10;

interface Par {
  enunciado: string;
  respuesta: string;
}

const parVacio = (): Par => ({ enunciado: "", respuesta: "" });

type Paso = "editando" | "verificando" | "confirmando";

/**
 * CU-A11 (A2): corrección de respuestas propias. El alumno escribe las preguntas que quiere practicar (de una
 * guía, de un parcial anterior) con sus respuestas, y el tutor las corrige contra el material de la materia.
 * (A4): antes de corregir se revisa si hay material suficiente; si no, se avisa que la corrección será limitada
 * y el alumno elige continuar o cancelar.
 */
export function CorreccionPropiaPanel({ course }: { course: Course }): React.ReactElement {
  const queryClient = useQueryClient();
  const [pares, setPares] = useState<Par[]>([parVacio()]);
  const [contenidoId, setContenidoId] = useState("");
  const [guardarEnHistorial, setGuardarEnHistorial] = useState(true);
  const [paso, setPaso] = useState<Paso>("editando");
  const [material, setMaterial] = useState<MaterialDisponible | null>(null);
  const [resultado, setResultado] = useState<SimulacroCorregido | null>(null);

  const referencias = course.materiales.filter((m) => m.ragIndexado || m.resumible);
  // Se ignoran los bloques sin pregunta: no hay nada que corregir en ellos.
  const preguntas = pares.filter((p) => p.enunciado.trim());
  const sinResponder = preguntas.filter((p) => !p.respuesta.trim());
  const algunaRespondida = preguntas.some((p) => p.respuesta.trim());
  const poco = material?.suficiente === false && !contenidoId;

  const corregir = useMutation({
    mutationFn: () =>
      corregirSimulacro(course.id, {
        titulo: "Mis respuestas",
        dificultad: "media",
        registrar: guardarEnHistorial,
        ...(contenidoId ? { contenido_id: contenidoId } : {}),
        preguntas: preguntas.map((p) => ({
          tipo: "desarrollo" as const,
          enunciado: p.enunciado.trim(),
          opciones: [],
          respuesta_modelo: "",
          respuesta_alumno: p.respuesta.trim(),
        })),
      }),
    onSuccess: (data) => {
      setResultado(data);
      setPaso("editando");
      void queryClient.invalidateQueries({ queryKey: ["simulacros", course.id] });
    },
  });

  const patch = (i: number, cambio: Partial<Par>): void =>
    setPares((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...cambio } : p)));

  const solicitar = async (): Promise<void> => {
    setPaso("verificando");
    try {
      setMaterial(await getMaterialDisponible(course.id));
    } catch {
      setMaterial(null); // no se pudo consultar: no se bloquea al alumno
    }
    setPaso("confirmando");
  };

  const reiniciar = (): void => {
    setPares([parVacio()]);
    setContenidoId("");
    setResultado(null);
    setMaterial(null);
    setPaso("editando");
    corregir.reset();
  };

  return (
    <Card>
      <CardHeader
        title="✍️ Corregir mis respuestas"
        action={
          resultado ? (
            <Button variant="ghost" size="sm" onClick={reiniciar}>
              Nueva corrección
            </Button>
          ) : undefined
        }
      />

      {resultado ? (
        <ResultadoCorreccion resultado={resultado} />
      ) : (
        <div className="flex flex-col gap-2.5">
          <p className="text-[12px] text-text-2 leading-relaxed">
            Escribí preguntas que quieras practicar (de una guía o de un parcial anterior) con tus respuestas, y el
            tutor las corrige con el material de {course.name}.
          </p>

          {pares.map((par, i) => (
            <fieldset key={i} className="border border-border rounded p-3 flex flex-col gap-2" disabled={paso !== "editando" || corregir.isPending}>
              <legend className="sr-only">Pregunta {i + 1}</legend>
              <div className="flex gap-2 items-start">
                <textarea
                  aria-label={`Pregunta ${i + 1}`}
                  rows={2}
                  maxLength={4000}
                  value={par.enunciado}
                  onChange={(e) => patch(i, { enunciado: e.target.value })}
                  placeholder="Escribí la pregunta…"
                  className="flex-1 px-3 py-2 border border-border rounded text-sm"
                />
                {pares.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Quitar la pregunta ${i + 1}`}
                    onClick={() => setPares((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    ✕
                  </Button>
                )}
              </div>
              <textarea
                aria-label={`Tu respuesta a la pregunta ${i + 1}`}
                rows={3}
                maxLength={8000}
                value={par.respuesta}
                onChange={(e) => patch(i, { respuesta: e.target.value })}
                placeholder="Escribí tu respuesta…"
                className="w-full px-3 py-2 border border-border rounded text-sm"
              />
            </fieldset>
          ))}

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              disabled={pares.length >= MAX_PREGUNTAS || paso !== "editando"}
              onClick={() => setPares((prev) => [...prev, parVacio()])}
            >
              + Pregunta
            </Button>
            <span className="text-[11px] text-text-3">Hasta {MAX_PREGUNTAS} preguntas.</span>
          </div>

          <div>
            <label htmlFor="correccion-referencia" className="block text-[12px] font-semibold text-text-1 mb-1.5">
              Material de referencia <span className="text-text-3 font-normal">(opcional)</span>
            </label>
            <select
              id="correccion-referencia"
              value={contenidoId}
              disabled={paso !== "editando"}
              onChange={(e) => setContenidoId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm"
            >
              <option value="">Todo el material de la materia</option>
              {referencias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.titulo}
                </option>
              ))}
            </select>
          </div>

          {corregir.isError && (
            <InfoBox variant="error">
              {apiErrorMessage(corregir.error, "No se pudo corregir.")} Tus respuestas siguen acá: podés reintentar.
            </InfoBox>
          )}

          {paso !== "confirmando" ? (
            <Button
              fullWidth
              className="justify-center"
              disabled={!algunaRespondida || paso === "verificando"}
              onClick={() => void solicitar()}
            >
              {paso === "verificando" ? "Revisando el material…" : "Solicitar corrección"}
            </Button>
          ) : (
            <div className="border border-primary rounded p-3 bg-surface-2">
              <p className="text-[13px] text-text-1 font-semibold mb-1.5">¿Enviar las respuestas a corregir?</p>

              {poco && (
                <div role="alert" className="text-[12px] text-amber-800 bg-warning-light border border-amber-200 rounded px-2.5 py-2 mb-2">
                  Hay poco material indexado en esta materia
                  {material?.fragmentos != null && ` (${material.fragmentos} fragmentos)`}: la corrección puede ser
                  limitada. Podés continuar igual o cancelar y pedirle al docente que cargue más material.
                </div>
              )}

              {sinResponder.length > 0 && (
                <p className="text-[12px] text-amber-800 mb-2">
                  Hay {sinResponder.length} {sinResponder.length === 1 ? "pregunta sin responder" : "preguntas sin responder"}: se
                  van a corregir como sin responder.
                </p>
              )}

              <label className="flex items-center gap-2 text-[12px] text-text-2 mb-2.5">
                <input type="checkbox" checked={guardarEnHistorial} onChange={(e) => setGuardarEnHistorial(e.target.checked)} />
                Guardar el resultado en mi historial
              </label>

              <div className="flex gap-2">
                <Button size="sm" disabled={corregir.isPending} onClick={() => corregir.mutate()}>
                  {corregir.isPending ? "Corrigiendo…" : poco ? "Continuar con corrección limitada" : "Confirmar y corregir"}
                </Button>
                <Button variant="ghost" size="sm" disabled={corregir.isPending} onClick={() => setPaso("editando")}>
                  {poco ? "Cancelar" : "Volver"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
