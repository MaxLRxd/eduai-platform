import { armarReportes, rangoDePeriodo, validarPeriodo, type DatosReportes } from "../modules/admin/admin.reportes";

/**
 * Datos conocidos con resultados calculados a mano: cada cifra del reporte se puede reproducir.
 *  - Asistencia: Redes 8 presentes + 2 justificados + 2 ausentes + 0 tardanzas (12 → 83%);
 *                BD 3 presentes + 1 tardanza + 2 ausentes (6 → 50%). Total 18 registros, 13 presentes.
 *  - Notas: 2, 5, 6, 8, 9, 10 → 6 notas, 4 aprobadas (≥6 → 67%). Promedio ponderado: Redes 8,00, BD 6,00 → 7,00.
 */
const datos: DatosReportes = {
  filtroEtiqueta: "",
  alumnosActivos: 16,
  docentesActivos: 5,
  materiasActivas: 3,
  nombreMateria: new Map([
    ["m1", "Redes"],
    ["m2", "Bases de Datos"],
  ]),
  inscripciones: 12,
  alumnosConInscripcion: 10,
  notas: [
    { materia_id: "m1", calificacion: 2 },
    { materia_id: "m1", calificacion: 8 },
    { materia_id: "m1", calificacion: 10 },
    { materia_id: "m2", calificacion: 5 },
    { materia_id: "m2", calificacion: 6 },
    { materia_id: "m2", calificacion: 9 },
  ],
  promedioPonderado: new Map([
    ["m1", 8],
    ["m2", 6],
  ]),
  asistencias: [
    { materia_id: "m1", estado: "PRESENTE", cantidad: 8 },
    { materia_id: "m1", estado: "JUSTIFICADO", cantidad: 2 },
    { materia_id: "m1", estado: "AUSENTE", cantidad: 2 },
    { materia_id: "m2", estado: "PRESENTE", cantidad: 3 },
    { materia_id: "m2", estado: "TARDANZA", cantidad: 1 },
    { materia_id: "m2", estado: "AUSENTE", cantidad: 2 },
  ],
  sesionesTutor: [
    { materia_id: "m1", cantidad: 7 },
    { materia_id: "m2", cantidad: 3 },
  ],
  mensajesTutor: 20,
  alertas: { total: 4, alta: 1 },
  actividad30d: { alumnosConSesion: 9, alumnosConTutor: 6, alumnosConEntrega: 4 },
  retencion: { valor: 75, detalle: "6 de 8 usuarios activos el mes anterior volvieron este mes" },
};

const reporte = (tipo: string, d: DatosReportes = datos) => {
  const r = armarReportes(d).find((x) => x.type === tipo);
  if (!r) throw new Error(`falta el reporte ${tipo}`);
  return r;
};
const valor = (tipo: string, label: string, d: DatosReportes = datos) =>
  reporte(tipo, d).stats.find((s) => s.label === label)?.value;

describe("reportes del administrador: cifras exactas", () => {
  it("asistencia: totales, tasa y desglose por materia", () => {
    const r = reporte("asistencia");

    expect(r.headline).toBe("72% de asistencia");
    expect(valor("asistencia", "Registros totales")).toBe("18");
    expect(valor("asistencia", "Presentes (incluye justificados)")).toBe("13");
    expect(valor("asistencia", "Ausencias")).toBe("4");
    expect(valor("asistencia", "Tardanzas")).toBe("1");
    expect(valor("asistencia", "Redes")).toBe("83% (12 registros)");
    expect(valor("asistencia", "Bases de Datos")).toBe("50% (6 registros)");
  });

  it("notas: promedio ponderado por materia, aprobación y distribución por rangos", () => {
    const r = reporte("notas");

    expect(r.headline).toBe("Promedio 7,00");
    expect(valor("notas", "Calificaciones cargadas")).toBe("6");
    expect(valor("notas", "Aprobadas (≥6)")).toBe("4 (67%)");
    expect(valor("notas", "Menos de 4")).toBe("1");
    expect(valor("notas", "De 4 a 5,99")).toBe("1");
    expect(valor("notas", "De 6 a 7,99")).toBe("1");
    expect(valor("notas", "De 8 a 10")).toBe("3");
    expect(valor("notas", "Redes")).toBe("promedio 8,00");
    expect(valor("notas", "Bases de Datos")).toBe("promedio 6,00");
    expect(r.stats.some((s) => s.label === "Docentes")).toBe(false);
  });

  it("el promedio sale del cálculo ponderado, no de promediar todas las notas sueltas", () => {
    // La media simple de las 6 notas sería 6,67; el reporte usa el promedio ponderado de cada materia.
    expect(reporte("notas").headline).not.toContain("6,67");
  });

  it("tutor: sesiones, mensajes y materias más consultadas", () => {
    expect(reporte("tutor").headline).toBe("10 sesiones de tutor");
    expect(valor("tutor", "Mensajes intercambiados")).toBe("20");
    expect(valor("tutor", "Redes")).toBe("7 consultas");
    expect(valor("tutor", "Bases de Datos")).toBe("3 consultas");
  });

  it("retención: usa la retención mensual real y no «inscriptos sobre registrados»", () => {
    const r = reporte("retencion");

    expect(r.headline).toBe("75% de retención mensual");
    expect(valor("retencion", "Detalle")).toContain("6 de 8");
    expect(valor("retencion", "Alertas académicas activas")).toBe("4");
    expect(valor("retencion", "Alertas de severidad ALTA")).toBe("1");
    // 10 inscriptos / 16 registrados daba 63%: ese número ya no se presenta como retención.
    expect(r.headline).not.toContain("63");
  });

  it("uso de la plataforma: alumnos activos reales y sin ninguna mención a MAU ni a topes", () => {
    const r = reporte("uso");

    expect(r.headline).toBe("9 de 16 alumnos activos");
    expect(valor("uso", "Alumnos que consultaron al tutor")).toBe("6");
    expect(valor("uso", "Alumnos que entregaron una actividad")).toBe("4");
    expect(valor("uso", "Inscripciones vigentes")).toBe("12");
    expect(armarReportes(datos).some((x) => x.type === "mau")).toBe(false);
    expect(JSON.stringify(armarReportes(datos))).not.toMatch(/MAU|plan|límite/i);
  });

  it("resumen ejecutivo: reúne las mismas cifras que los demás reportes", () => {
    const r = reporte("ejecutivo");

    expect(r.headline).toBe("16 alumnos · 5 docentes · 3 materias");
    expect(valor("ejecutivo", "Asistencia promedio")).toBe("72%");
    expect(valor("ejecutivo", "Promedio de notas")).toBe("7,00");
    expect(valor("ejecutivo", "Tasa de aprobación")).toBe("67%");
    expect(valor("ejecutivo", "Retención mensual")).toBe("75%");
    expect(valor("ejecutivo", "Alertas activas")).toBe("4");
  });

  it("sin datos no inventa porcentajes ni promedios", () => {
    const vacio: DatosReportes = {
      ...datos,
      notas: [],
      promedioPonderado: new Map(),
      asistencias: [],
      sesionesTutor: [],
      mensajesTutor: 0,
      retencion: { valor: null, detalle: "0 de 0 usuarios activos el mes anterior volvieron este mes" },
    };

    expect(reporte("asistencia", vacio).headline).toBe("Sin datos de asistencia");
    expect(reporte("notas", vacio).headline).toBe("Sin notas");
    expect(reporte("retencion", vacio).headline).toBe("Sin datos de retención mensual");
    expect(valor("ejecutivo", "Tasa de aprobación", vacio)).toBe("Sin datos");
  });

  it("el filtro elegido queda escrito en la descripción del reporte", () => {
    const r = reporte("notas", { ...datos, filtroEtiqueta: "Período 2026-1 · Redes" });

    expect(r.description).toContain("Período 2026-1 · Redes");
  });
});

describe("filtro de período", () => {
  it("2026-1 abarca de enero a junio y 2026-2 de julio a diciembre", () => {
    expect(rangoDePeriodo("2026-1")).toEqual({ gte: new Date("2026-01-01T00:00:00Z"), lt: new Date("2026-07-01T00:00:00Z") });
    expect(rangoDePeriodo("2026-2")).toEqual({ gte: new Date("2026-07-01T00:00:00Z"), lt: new Date("2027-01-01T00:00:00Z") });
  });

  it("rechaza formatos inválidos", () => {
    for (const malo of ["2026", "2026-3", "abc", "2026-1; DROP TABLE"]) {
      expect(() => validarPeriodo(malo)).toThrow("El período debe tener el formato");
    }
  });
});
