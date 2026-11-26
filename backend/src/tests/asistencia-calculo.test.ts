import {
  PESO_TARDANZA,
  conteoDeEstados,
  faltasEquivalentes,
  porcentajeAsistencia,
} from "../modules/asistencias/asistencia.calculo";

describe("criterio de asistencia: la tardanza cuenta como media falta", () => {
  it("el peso de la tardanza es 0,5 y está en un solo lugar", () => {
    expect(PESO_TARDANZA).toBe(0.5);
  });

  it("faltas equivalentes: cada ausencia vale 1 y cada tardanza 0,5", () => {
    expect(faltasEquivalentes({ ausentes: 2, tardanzas: 3 })).toBe(3.5);
    expect(faltasEquivalentes({ ausentes: 0, tardanzas: 0 })).toBe(0);
  });

  it("ejemplo del criterio: 10 clases con 6 presentes, 1 justificada, 2 ausentes y 1 tardanza dan 75 %", () => {
    // faltas = 2 ausencias + 0,5 por la tardanza = 2,5 → (10 - 2,5) / 10 = 75 %
    const c = conteoDeEstados([
      ...Array(6).fill("PRESENTE"),
      "JUSTIFICADO",
      "AUSENTE",
      "AUSENTE",
      "TARDANZA",
    ]);

    expect(c).toEqual({ total: 10, ausentes: 2, tardanzas: 1 });
    expect(porcentajeAsistencia(c)).toBe(75);
  });

  it("el justificado no baja el porcentaje y la tardanza sí, pero menos que una ausencia", () => {
    const conJustificada = porcentajeAsistencia(conteoDeEstados(["PRESENTE", "JUSTIFICADO"]));
    const conTardanza = porcentajeAsistencia(conteoDeEstados(["PRESENTE", "TARDANZA"]));
    const conAusencia = porcentajeAsistencia(conteoDeEstados(["PRESENTE", "AUSENTE"]));

    expect(conJustificada).toBe(100);
    expect(conTardanza).toBe(75);
    expect(conAusencia).toBe(50);
  });

  it("sin clases registradas no hay porcentaje (no se inventa 0 %)", () => {
    expect(porcentajeAsistencia(conteoDeEstados([]))).toBeNull();
  });

  it("redondea al entero más cercano", () => {
    // 3 clases con 1 tardanza: (3 - 0,5) / 3 = 83,3 %
    expect(porcentajeAsistencia({ total: 3, ausentes: 0, tardanzas: 1 })).toBe(83);
  });
});
