import type { Course } from "../types/domain";

// TODO(backend): reemplazar por POST al ai-service (`ask_tutor` en
// ai-services/src/use_cases/ask_tutor.py, rama develop) vía el backend Node
// una vez que ai-service/ y ai-services/ se unifiquen. Mientras tanto,
// devuelve una respuesta simulada para poder probar la UI del chat.
export async function askTutor(course: Course, question: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return `[Mock] Sobre "${course.name}": todavía no estoy conectado al tutor real (RAG + LLM). ` +
    `Cuando el ai-service esté integrado, esta respuesta va a basarse en ${course.tutorFocus}. ` +
    `Tu pregunta fue: "${question}".`;
}
