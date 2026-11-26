/** Descarga un CSV que devolvio el backend (ya viene con BOM y «;» para que Excel lo abra bien). */
export function descargarCsv(resultado: { filename: string; csv: string }): void {
  const blob = new Blob([resultado.csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = resultado.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
