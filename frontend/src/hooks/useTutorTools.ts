import { useState } from "react";
import { ApiError } from "../services/api";
import {
  generarSimulacro,
  resumirMaterial,
  type DificultadExamen,
  type ExamenResult,
  type ResumenResult,
} from "../services/tutor.service";

function messageFromError(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    try {
      const parsed = JSON.parse(e.message) as { error?: string };
      if (parsed.error) return parsed.error;
    } catch {
      // cuerpo no JSON: caemos al fallback
    }
  }
  return fallback;
}

export function useResumen() {
  const [resultado, setResultado] = useState<ResumenResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resumir(
    materiaId: string,
    input: { contenido_id?: string; texto?: string; max_palabras?: number }
  ): Promise<void> {
    setPending(true);
    setError(null);
    try {
      setResultado(await resumirMaterial(materiaId, input));
    } catch (e) {
      setResultado(null);
      setError(messageFromError(e, "No se pudo generar el resumen."));
    } finally {
      setPending(false);
    }
  }

  function limpiar(): void {
    setResultado(null);
    setError(null);
  }

  return { resultado, pending, error, resumir, limpiar };
}

export function useSimulacro() {
  const [resultado, setResultado] = useState<ExamenResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar(
    materiaId: string,
    n_preguntas: number,
    dificultad: DificultadExamen
  ): Promise<void> {
    setPending(true);
    setError(null);
    try {
      setResultado(await generarSimulacro(materiaId, { n_preguntas, dificultad }));
    } catch (e) {
      setResultado(null);
      setError(messageFromError(e, "No se pudo generar el simulacro."));
    } finally {
      setPending(false);
    }
  }

  function limpiar(): void {
    setResultado(null);
    setError(null);
  }

  return { resultado, pending, error, generar, limpiar };
}
