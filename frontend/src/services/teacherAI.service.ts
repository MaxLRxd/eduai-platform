// TODO(backend): reemplazar por el use_case correspondiente en ai-services (generate_teaching_material,
// ver implementacion.docx) una vez que ai-service/ai-services queden unificados.
export async function askTeacherAssistant(prompt: string, courseLabel: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return `[Mock] Todavía no estoy conectado al asistente docente real. Cuando lo esté, esta respuesta se va a generar usando la planificación de "${courseLabel}". Tu pedido fue: "${prompt}".`;
}
