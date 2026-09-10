import { api } from "./api";

export async function askTeacherAssistant(
  prompt: string,
  materiaId: string,
  classDate?: string
): Promise<string> {
  const data = await api<{ material: string }>("/api/asistente/generar", {
    method: "POST",
    body: JSON.stringify({
      materia_id: materiaId,
      prompt,
      ...(classDate ? { class_date: classDate } : {}),
    }),
  });
  return data.material;
}