import { renderReportePdf } from "../modules/admin/reportsPdf";

describe("renderReportePdf", () => {
  const reporte = {
    title: "📊 Asistencia general",
    description: "Asistencia promedio por materia y período",
    headline: "87% de asistencia",
    stats: [
      { label: "Registros totales", value: "120" },
      { label: "Presentes", value: "104 (86%)" },
      { label: "Ausencias", value: "16" },
    ],
    footnote: "Sobre la totalidad de asistencias registradas.",
  };

  it("genera un buffer PDF válido", async () => {
    const buffer = await renderReportePdf(reporte);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(500);
  });

  it("no rompe con stats vacíos ni con títulos con emojis", async () => {
    const buffer = await renderReportePdf({ ...reporte, title: "🤖 Uso Tutor IA", stats: [] });
    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
