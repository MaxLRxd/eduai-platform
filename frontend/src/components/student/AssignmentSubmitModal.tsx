import React, { useEffect, useRef, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { InfoBox } from "../ui/InfoBox";
import { useSubmitAssignment, useUploadAssignmentFile } from "../../hooks/useAssignments";
import { apiErrorMessage } from "../../services/api";
import type { Assignment, AssignmentType } from "../../types/domain";

const TITULO: Record<AssignmentType, string> = {
  MULTIPLE_CHOICE: "Elegí una opción",
  DESARROLLO: "Desarrollo escrito",
  ARCHIVO: "Subí un archivo",
  CODIGO: "Subí tu código",
};

const PLACEHOLDER: Record<AssignmentType, string> = {
  MULTIPLE_CHOICE: "",
  DESARROLLO: "Escribí tu resolución. Podés usar notación matemática o texto plano.",
  ARCHIVO: "",
  CODIGO: "// Pegá acá tu código\n",
};

const inputClass =
  "w-full px-3 py-2 border border-border rounded text-sm text-text-1 bg-surface font-mono transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,61,122,0.1)]";

function esVencida(iso: string): boolean {
  const f = new Date(iso);
  return !Number.isNaN(f.getTime()) && f.getTime() < Date.now();
}

export function AssignmentSubmitModal({
  assignment,
  onClose,
}: {
  assignment: Assignment | null;
  onClose: () => void;
}): React.ReactElement | null {
  const [opcion, setOpcion] = useState<number | null>(null);
  const [texto, setTexto] = useState("");
  const [codigo, setCodigo] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const enviar = useSubmitAssignment();
  const subirArchivo = useUploadAssignmentFile();

  const previa = assignment?.submitted ?? null;

  useEffect(() => {
    if (!assignment) return;
    const actual = assignment.submitted;
    setError(null);
    setArchivo(null);
    if (fileRef.current) fileRef.current.value = "";

    if (assignment.tipo === "MULTIPLE_CHOICE") {
      const idx = assignment.opciones.findIndex((o) => o.texto === actual?.respuesta_texto);
      setOpcion(idx >= 0 ? idx : null);
    } else {
      setOpcion(null);
    }

    setTexto(assignment.tipo === "DESARROLLO" ? (actual?.respuesta_texto ?? "") : "");
    setCodigo(assignment.tipo === "CODIGO" ? (actual?.respuesta_codigo ?? "") : "");
  }, [assignment]);

  if (!assignment) return null;

  const pendiente = assignment.status === "Pendiente";
  const published = previa?.publicado ?? false;
  const accept = assignment.formatosPermitidos.length
    ? assignment.formatosPermitidos.map((f) => `.${f}`).join(",")
    : undefined;

  const puedeEnviar = (): boolean => {
    if (!pendiente) return false;
    if (assignment.tipo === "MULTIPLE_CHOICE") return opcion !== null;
    if (assignment.tipo === "DESARROLLO") return texto.trim().length > 0;
    if (assignment.tipo === "CODIGO") return codigo.trim().length > 0;
    return archivo !== null || Boolean(previa?.archivo_url);
  };

  const enviarEntrega = async (): Promise<void> => {
    if (!puedeEnviar()) return;
    setError(null);

    try {
      if (assignment.tipo === "MULTIPLE_CHOICE" && opcion !== null) {
        await enviar.mutateAsync({
          actividadId: assignment.id,
          payload: { respuesta_texto: assignment.opciones[opcion].texto },
        });
      } else if (assignment.tipo === "DESARROLLO") {
        await enviar.mutateAsync({
          actividadId: assignment.id,
          payload: { respuesta_texto: texto.trim() },
        });
      } else if (assignment.tipo === "CODIGO") {
        await enviar.mutateAsync({
          actividadId: assignment.id,
          payload: { respuesta_codigo: codigo.trim() },
        });
      } else {
        const subido = archivo
          ? await subirArchivo.mutateAsync({ actividadId: assignment.id, file: archivo })
          : null;
        const url = subido?.archivo_url ?? previa?.archivo_url;
        const nombre = subido?.archivo_nombre ?? previa?.archivo_nombre;
        if (!url || !nombre) {
          setError("No se pudo determinar el archivo a adjuntar");
          return;
        }
        await enviar.mutateAsync({ actividadId: assignment.id, payload: { archivo_url: url, archivo_nombre: nombre } });
      }
      onClose();
    } catch (e) {
      setError(apiErrorMessage(e, "No se pudo enviar la entrega"));
    }
  };

  const leyendoArchivo = subirArchivo.isPending;

  return (
    <Modal open={!!assignment} onClose={onClose} title={assignment.title}>
      <div className="mb-4">
        <p className="text-xs text-text-3 mb-1">
          {assignment.course} · Vence {assignment.dueDate}
        </p>
        <p className="text-sm text-text-1 whitespace-pre-wrap">{assignment.consigna}</p>
      </div>

      {published && previa?.feedback_final && (
        <InfoBox variant="success">
          <span className="font-semibold">Docente: </span>
          {previa.feedback_final}
        </InfoBox>
      )}
      {!pendiente && !published && (
        <InfoBox variant="info">Tu entrega está en revisión. Podés reemplazarla mientras no sea publicada.</InfoBox>
      )}
      {pendiente && esVencida(assignment.dueDateIso) && (
        <InfoBox variant="warning">Esta actividad ya venció. El docente puede decidir si la acepta igual.</InfoBox>
      )}

      <div className="mt-4">
        <p className="text-xs font-semibold text-text-1 mb-2">{TITULO[assignment.tipo]}</p>

        {assignment.tipo === "MULTIPLE_CHOICE" &&
          (assignment.opciones.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {assignment.opciones.map((o, i) => (
                <label
                  key={`${o.texto}-${i}`}
                  className={`flex items-start gap-2.5 px-3 py-2.5 border rounded cursor-pointer transition-colors ${
                    opcion === i ? "border-primary bg-primary-light" : "border-border hover:bg-surface-2"
                  }`}
                >
                  <input
                    type="radio"
                    name="opcion-mc"
                    checked={opcion === i}
                    disabled={!pendiente}
                    onChange={() => setOpcion(i)}
                    className="mt-0.5 accent-primary"
                  />
                  <span className="text-sm text-text-1">{o.texto}</span>
                </label>
              ))}
            </div>
          ) : (
            <InfoBox variant="warning">El docente no cargó opciones para esta actividad.</InfoBox>
          ))}

        {assignment.tipo === "DESARROLLO" && (
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={!pendiente}
            placeholder={PLACEHOLDER.DESARROLLO}
            rows={8}
            className={inputClass}
          />
        )}

        {assignment.tipo === "CODIGO" && (
          <textarea
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            disabled={!pendiente}
            placeholder={PLACEHOLDER.CODIGO}
            rows={10}
            spellCheck={false}
            className={`${inputClass} text-xs leading-relaxed`}
          />
        )}

        {assignment.tipo === "ARCHIVO" && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept={accept}
              disabled={!pendiente}
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="w-full text-xs text-text-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border file:border-border file:bg-surface-2 file:text-xs file:font-semibold file:text-text-1 hover:file:bg-surface-2"
            />
            {assignment.formatosPermitidos.length > 0 && (
              <p className="text-[11px] text-text-3 mt-1.5">
                Formatos: {assignment.formatosPermitidos.join(", ")}
              </p>
            )}
            {!archivo && previa?.archivo_url && (
              <p className="text-[11px] text-text-2 mt-1.5">
                Archivo actual: {previa.archivo_nombre}
              </p>
            )}
          </div>
        )}
      </div>

      {previa && pendiente && (
        <p className="text-[11px] text-text-3 mt-3">
          Entregado el {new Date(previa.entregado_en).toLocaleString("es-AR")}. Si volvés a enviar, se reemplaza.
        </p>
      )}

      {error && (
        <div className="mt-3">
          <InfoBox variant="error">{error}</InfoBox>
        </div>
      )}

      <div className="flex gap-2 justify-end mt-5">
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
        {pendiente && (
          <Button
            onClick={enviarEntrega}
            disabled={!puedeEnviar() || enviar.isPending || leyendoArchivo}
          >
            {leyendoArchivo
              ? "Subiendo archivo…"
              : enviar.isPending
                ? "Enviando…"
                : previa
                  ? "Reemplazar entrega"
                  : "Enviar entrega"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
