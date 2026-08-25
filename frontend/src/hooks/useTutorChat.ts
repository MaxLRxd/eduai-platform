import { useState } from "react";
import type { Course, TutorMessage } from "../types/domain";
import { askTutor } from "../services/tutor.service";

export function useTutorChat(course: Course | undefined) {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [pending, setPending] = useState(false);

  async function ask(question: string): Promise<void> {
    if (!course || !question.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setPending(true);
    try {
      const reply = await askTutor(course, question);
      setMessages((prev) => [...prev, { role: "tutor", content: reply }]);
    } finally {
      setPending(false);
    }
  }

  return { messages, pending, ask };
}
