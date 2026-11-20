import { materiasHuerfanas } from "../modules/contenidos/rag-limpieza";

describe("materiasHuerfanas", () => {
  const indexadas = [
    { subject_id: "redes", fragmentos: 7 },
    { subject_id: "materia-borrada", fragmentos: 71 },
    { subject_id: "e2e-viejo", fragmentos: 3 },
  ];

  it("devuelve solo las materias indexadas que ya no existen en la base", () => {
    expect(materiasHuerfanas(indexadas, ["redes"]).map((m) => m.subject_id)).toEqual([
      "materia-borrada",
      "e2e-viejo",
    ]);
  });

  it("no marca nada si todas las materias indexadas siguen vigentes", () => {
    expect(materiasHuerfanas(indexadas, ["redes", "materia-borrada", "e2e-viejo", "otra"])).toEqual([]);
  });

  it("si no hay nada indexado no hay huérfanas", () => {
    expect(materiasHuerfanas([], ["redes"])).toEqual([]);
  });
});
