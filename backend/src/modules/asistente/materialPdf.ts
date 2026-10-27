import PDFDocument from "pdfkit";

export interface MaterialPdf {
  titulo: string;
  materia?: string;
  material: string;
}

function sinEmojis(texto: string): string {
  return texto
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{FE0F}]/gu, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** Quita el markdown en linea (**negrita**, *cursiva*, `codigo`) que pdfkit no interpreta. */
function sinMarcasInline(texto: string): string {
  return texto
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export function renderMaterialPdf({ titulo, materia, material }: MaterialPdf): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const ancho = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#6b7280");
    doc.text(sinEmojis(materia ? `EduAI Platform · ${materia}` : "EduAI Platform · Material de clase"));
    doc.moveDown(0.3);
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + ancho, doc.y)
      .strokeColor("#e5e7eb")
      .lineWidth(1)
      .stroke();
    doc.moveDown(1);

    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(20);
    doc.text(sinEmojis(titulo), { width: ancho });
    doc.moveDown(0.8);

    for (const cruda of material.replace(/\r\n/g, "\n").split("\n")) {
      const linea = sinEmojis(cruda);

      if (!linea) {
        doc.moveDown(0.5);
        continue;
      }

      if (/^[-*_]{3,}$/.test(linea)) {
        doc
          .moveTo(doc.page.margins.left, doc.y)
          .lineTo(doc.page.margins.left + ancho, doc.y)
          .strokeColor("#e5e7eb")
          .stroke();
        doc.moveDown(0.5);
        continue;
      }

      const encabezado = /^(#{1,6})\s+(.*)$/.exec(linea);
      if (encabezado) {
        const nivel = encabezado[1].length;
        doc.moveDown(0.4);
        doc.font("Helvetica-Bold").fillColor("#111827").fontSize(nivel === 1 ? 17 : nivel === 2 ? 14 : 12);
        doc.text(sinMarcasInline(encabezado[2]), { width: ancho });
        doc.moveDown(0.3);
        continue;
      }

      doc.font("Helvetica").fillColor("#374151").fontSize(11);

      const viñeta = /^[-*•]\s+(.*)$/.exec(linea);
      if (viñeta) {
        doc.text(`•  ${sinMarcasInline(viñeta[1])}`, { width: ancho - 14, indent: 14, lineGap: 2 });
        continue;
      }

      const numerada = /^(\d+)[.)]\s+(.*)$/.exec(linea);
      if (numerada) {
        doc.text(`${numerada[1]}.  ${sinMarcasInline(numerada[2])}`, { width: ancho - 14, indent: 14, lineGap: 2 });
        continue;
      }

      doc.text(sinMarcasInline(linea), { width: ancho, lineGap: 2 });
    }

    doc.moveDown(1.2);
    doc.font("Helvetica-Oblique").fontSize(9).fillColor("#6b7280");
    doc.text(`Generado con el asistente docente de EduAI el ${new Date().toLocaleString("es-AR")}`, { width: ancho });

    doc.end();
  });
}
