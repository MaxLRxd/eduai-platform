const updateManyMock = jest.fn();
const indexMaterialMock = jest.fn();
const indexArchivoMock = jest.fn();
const eliminarMaterialRagMock = jest.fn();

jest.mock("../config/prisma", () => ({
  prisma: { contenido: { updateMany: (...args: unknown[]) => updateManyMock(...args) } },
}));

jest.mock("../config/aiClient", () => ({
  indexMaterial: (...args: unknown[]) => indexMaterialMock(...args),
  indexArchivo: (...args: unknown[]) => indexArchivoMock(...args),
  eliminarMaterialRag: (...args: unknown[]) => eliminarMaterialRagMock(...args),
}));

jest.mock("../config/storage", () => ({ leerArchivo: jest.fn() }));

import {
  esperarIndexadosEnCurso,
  indexarAhora,
  indexarEnSegundoPlano,
} from "../modules/contenidos/rag-indexer";

describe("rag-indexer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateManyMock.mockResolvedValue({ count: 1 });
  });

  it("marca rag_indexado cuando el indexado en segundo plano termina", async () => {
    indexArchivoMock.mockResolvedValue({ material_id: "c1", chunks: 300, indexed: true });

    indexarEnSegundoPlano("c1", "m1", { tipo: "archivo", buffer: Buffer.from("x"), nombre: "a.pdf" });
    expect(updateManyMock).not.toHaveBeenCalled();
    await esperarIndexadosEnCurso();

    expect(indexArchivoMock).toHaveBeenCalledWith("m1", "c1", expect.any(Buffer), "a.pdf");
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { rag_indexado: true },
    });
  });

  it("deja rag_indexado en false si el ai-service falla", async () => {
    indexMaterialMock.mockResolvedValue(null);

    const ok = await indexarAhora("c1", "m1", { tipo: "texto", texto: "hola" });

    expect(ok).toBe(false);
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { rag_indexado: false },
    });
  });

  it("un indexado viejo no pisa el resultado de una edicion posterior", async () => {
    let resolverViejo: (v: unknown) => void = () => {};
    indexMaterialMock
      .mockReturnValueOnce(new Promise((r) => (resolverViejo = r)))
      .mockResolvedValueOnce({ material_id: "c1", chunks: 1, indexed: true });

    indexarEnSegundoPlano("c1", "m1", { tipo: "texto", texto: "v1" });
    indexarEnSegundoPlano("c1", "m1", { tipo: "texto", texto: "v2" });
    resolverViejo(null);
    await esperarIndexadosEnCurso();

    expect(updateManyMock).toHaveBeenCalledTimes(1);
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { rag_indexado: true },
    });
  });

  it("borra los chunks si el contenido se elimino durante el indexado", async () => {
    indexMaterialMock.mockResolvedValue({ material_id: "c1", chunks: 2, indexed: true });
    updateManyMock.mockResolvedValue({ count: 0 });

    const ok = await indexarAhora("c1", "m1", { tipo: "texto", texto: "hola" });

    expect(ok).toBe(false);
    expect(eliminarMaterialRagMock).toHaveBeenCalledWith("m1", "c1");
  });
});
