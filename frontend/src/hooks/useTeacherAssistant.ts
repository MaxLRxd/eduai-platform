import { useState } from "react";
import { askTeacherAssistant } from "../services/teacherAI.service";

export function useTeacherAssistant() {
  const [output, setOutput] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function ask(prompt: string, courseLabel: string): Promise<void> {
    if (!prompt.trim()) return;
    setPending(true);
    try {
      const reply = await askTeacherAssistant(prompt, courseLabel);
      setOutput(reply);
    } finally {
      setPending(false);
    }
  }

  return { output, pending, ask };
}
