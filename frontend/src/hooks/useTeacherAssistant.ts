import { useState } from "react";
import { askTeacherAssistant } from "../services/teacherAI.service";

export function useTeacherAssistant() {
  const [output, setOutput] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function ask(prompt: string, materiaId: string | null, classDate?: string): Promise<void> {
    if (!prompt.trim()) return;
    if (!materiaId) {
      setOutput("Seleccioná una materia para poder generar material.");
      return;
    }
    setPending(true);
    try {
      const reply = await askTeacherAssistant(prompt, materiaId, classDate);
      setOutput(reply);
    } finally {
      setPending(false);
    }
  }

  return { output, pending, ask };
}