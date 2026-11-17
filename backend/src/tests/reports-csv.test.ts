import { csvFromReporte } from "../modules/admin/admin.service";

const reporte = {
  type: "asistencia",
  title: "📊 Asistencia general",
  description: "Asistencia promedio por materia y período",
  headline: "87% de asistencia",
  stats: [
    { label: "Métrica", value: "87%" },
    { label: "Descripción", value: "Año Ñandú" },
  ],
  footnote: "Sobre la totalidad de asistencias registradas.",
};

describe("exportación CSV de reportes", () => {
  it("antepone BOM y usa punto y coma como separador", () => {
    const csv = csvFromReporte(reporte);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Métrica";"87%"');
    expect(csv).toContain('"Descripción";"Año Ñandú"');
  });

  it("conserva acentos y escapa comillas", () => {
    const csv = csvFromReporte({
      ...reporte,
      description: 'Reporte "especial" con Ñ',
    });

    expect(csv).toContain('"Reporte ""especial"" con Ñ"');
  });
});
