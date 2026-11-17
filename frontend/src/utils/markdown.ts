export function limpiarMarkdown(texto: string): string {
  if (!texto) return texto;

  let limpio = texto.replace(/\r\n/g, "\n");
  limpio = limpio.replace(/```[^\n]*\n?/g, "");
  limpio = limpio.replace(/`([^`]+)`/g, "$1");
  limpio = limpio.replace(/\*\*(.+?)\*\*/g, "$1");
  limpio = limpio.replace(/__(.+?)__/g, "$1");
  limpio = limpio.replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g, "$1");
  limpio = limpio.replace(/^#{1,6}\s+/gm, "");
  limpio = limpio.replace(/\n{3,}/g, "\n\n");
  return limpio.trim();
}
