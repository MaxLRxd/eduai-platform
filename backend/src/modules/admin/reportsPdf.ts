import PDFDocument from "pdfkit";

export interface ReportePdf {
  title: string;
  description: string;
  headline: string;
  stats: { label: string; value: string }[];
  footnote: string;
}

function sinEmojis(texto: string): string {
  return texto
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{FE0F}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function renderReportePdf(reporte: ReportePdf): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const anchoContenido = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const generado = new Date().toLocaleString("es-AR");

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#6b7280");
    doc.text("EduAI Platform · Reportes institucionales", { align: "left" });
    doc.moveDown(0.3);
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + anchoContenido, doc.y)
      .strokeColor("#e5e7eb")
      .lineWidth(1)
      .stroke();
    doc.moveDown(1.2);

    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(20);
    doc.text(sinEmojis(reporte.title));
    doc.moveDown(0.4);

    doc.fillColor("#4b5563").font("Helvetica").fontSize(11);
    doc.text(reporte.description);
    doc.moveDown(1);

    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(24);
    doc.text(reporte.headline);
    doc.moveDown(1.4);

    const filaInicio = doc.y;
    const colValue = doc.page.margins.left + anchoContenido * 0.62;

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#6b7280");
    doc.text("MÉTRICA", doc.page.margins.left, doc.y, { continued: false });
    doc.text("VALOR", colValue, filaInicio, { width: anchoContenido * 0.38, align: "right" });
    doc.moveDown(0.5);

    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + anchoContenido, doc.y)
      .strokeColor("#e5e7eb")
      .stroke();
    doc.moveDown(0.5);

    for (const stat of reporte.stats) {
      const y = doc.y;
      doc.font("Helvetica").fontSize(11).fillColor("#374151");
      doc.text(stat.label, doc.page.margins.left, y, { width: anchoContenido * 0.6 });
      const finEtiqueta = doc.y;
      doc.font("Helvetica-Bold").fillColor("#111827");
      doc.text(stat.value, colValue, y, { width: anchoContenido * 0.38, align: "right" });
      doc.y = Math.max(finEtiqueta, doc.y) + 6;
    }

    doc.moveDown(1.2);
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + anchoContenido, doc.y)
      .strokeColor("#e5e7eb")
      .stroke();
    doc.moveDown(0.8);

    doc.font("Helvetica-Oblique").fontSize(9).fillColor("#6b7280");
    doc.text(reporte.footnote, { width: anchoContenido });
    doc.moveDown(0.4);
    doc.text(`Generado el ${generado}`, { width: anchoContenido });

    doc.end();
  });
}
