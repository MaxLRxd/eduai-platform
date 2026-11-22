import { generarMaterialDocente } from "../config/aiClient";
import { prisma } from "../config/prisma";

jest.mock("../config/env", () => ({
  env: { AI_SERVICE_URL: "http://ai.test", AI_SERVICE_TOKEN: "" },
}));

jest.mock("../config/prisma", () => ({
  prisma: { contenido: { findMany: jest.fn().mockResolvedValue([]) } },
}));

const prismaMock = prisma as unknown as { contenido: { findMany: jest.Mock } };

describe("generarMaterialDocente", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.contenido.findMany.mockResolvedValue([]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ material: "ok", sources: [] }),
    }) as jest.Mock;
  });

  it("no envía un array vacío de material_ids cuando no hay filtro", async () => {
    await generarMaterialDocente("materia-1", "Generá actividades");

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body as string);
    expect(body).not.toHaveProperty("material_ids");
  });

  it("envía los ids cuando el docente eligió materiales", async () => {
    await generarMaterialDocente("materia-1", "Generá activities", ["contenido-1"]);

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body as string);
    expect(body.material_ids).toEqual(["contenido-1"]);
  });
});
