/** CSV listo para Excel en configuracion regional es-AR: BOM UTF-8 (acentos) y «;» como separador. */
export function celdaCsv(celda: string | number): string {
  return `"${String(celda).replace(/"/g, '""')}"`;
}

export function armarCsv(filas: (string | number)[][]): string {
  return "\uFEFF" + filas.map((fila) => fila.map(celdaCsv).join(";")).join("\r\n");
}
