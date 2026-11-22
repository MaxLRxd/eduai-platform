import { prisma } from "../config/prisma";
import { eliminarMaterialRag } from "../config/aiClient";
import { eliminarArchivo, guardarArchivo } from "../config/storage";
import { indexarEnSegundoPlano } from "../modules/contenidos/rag-indexer";
import { obtenerProfesorAsignado } from "../modules/materias/materias.service";
import {
  asignarMaterialDesdeContenido,
  eliminarMaterial,
  subirMaterial,
} from "../modules/planning/planning.service";

jest.mock("../config/prisma", () => ({
  prisma: {
    materia: { findUnique: jest.fn() },
    seccion: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    planningClase: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
    contenido: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  },
}));

jest.mock("../config/storage", () => ({
  eliminarArchivo: jest.fn(),
  guardarArchivo: jest.fn(),
}));

jest.mock("../config/aiClient", () => ({
  eliminarMaterialRag: jest.fn(),
}));

jest.mock("../modules/contenidos/rag-indexer", () => ({
  indexarEnSegundoPlano: jest.fn(),
}));

jest.mock("../modules/materias/materias.service", () => ({
  obtenerInscripcion: jest.fn(),
  obtenerProfesorAsignado: jest.fn(),
}));

const prismaMock = prisma as unknown as {
  materia: { findUnique: jest.Mock };
  seccion: { findUnique: jest.Mock; findFirst: jest.Mock; create: jest.Mock };
  planningClase: { findUnique: jest.Mock; upsert: jest.Mock; update: jest.Mock };
  contenido: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};
const guardarMock = guardarArchivo as jest.Mock;
const eliminarArchivoMock = eliminarArchivo as jest.Mock;
const eliminarRagMock = eliminarMaterialRag as jest.Mock;
const indexarMock = indexarEnSegundoPlano as jest.Mock;
const asignadoMock = obtenerProfesorAsignado as jest.Mock;

const MATERIA = "11111111-1111-4111-8111-111111111111";
const SECCION = "22222222-2222-4222-8222-222222222222";
const CLASE = "33333333-3333-4333-8333-333333333333";
const CONTENIDO = "44444444-4444-4444-8444-444444444444";
const FECHA = "2026-11-22";

const guardado = {
  url: "/uploads/clase-nueva.pdf",
  nombre: "clase.pdf",
  formato: "pdf",
  tamanoKb: 12,
  key: "clase-nueva.pdf",
};

const planning = {
  id: CLASE,
  seccion_id: SECCION,
  fecha_clase: new Date(FECHA),
  titulo: "Clase 2026-11-22",
  contenido: null,
  estado: "PLANIFICADO",
  material_url: guardado.url,
  material_nombre: guardado.nombre,
  material_formato: guardado.formato,
  material_tamano_kb: guardado.tamanoKb,
};

describe("material de planning indexado en el RAG", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.materia.findUnique.mockResolvedValue({ id: MATERIA });
    asignadoMock.mockResolvedValue({ id: "perfil-1" });
    prismaMock.seccion.findFirst
      .mockResolvedValueOnce({ id: SECCION })
      .mockResolvedValueOnce({ orden: 1 });
    prismaMock.planningClase.findUnique.mockResolvedValue({
      id: CLASE,
      seccion_id: SECCION,
      material_url: null,
    });
    prismaMock.planningClase.upsert.mockResolvedValue(planning);
    prismaMock.planningClase.update.mockResolvedValue(planning);
    prismaMock.contenido.create.mockResolvedValue({ id: CONTENIDO });
    prismaMock.contenido.findFirst.mockResolvedValue(null);
    guardarMock.mockResolvedValue(guardado);
  });

  it("guarda una sola copia, crea el contenido e indexa el archivo subido", async () => {
    const res = await subirMaterial(MATERIA, FECHA, "profe-1", {
      buffer: Buffer.from("contenido"),
      nombreOriginal: "clase.pdf",
    });

    expect(guardarMock).toHaveBeenCalledTimes(1);
    expect(prismaMock.contenido.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          seccion_id: SECCION,
          clase_id: CLASE,
          archivo_url: guardado.url,
        }),
      })
    );
    expect(indexarMock).toHaveBeenCalledWith(CONTENIDO, MATERIA, {
      tipo: "archivo",
      buffer: expect.any(Buffer),
      nombre: "clase.pdf",
    });
    expect(res.material_url).toBe(guardado.url);
  });

  it("limpia el contenido y los vectores anteriores al reemplazar el material", async () => {
    prismaMock.planningClase.findUnique.mockImplementation(({ where }) =>
      Promise.resolve(
        where.materia_id_fecha_clase
          ? { id: CLASE, seccion_id: SECCION, material_url: "/uploads/clase-vieja.pdf" }
          : { id: CLASE, seccion_id: SECCION, material_url: "/uploads/clase-vieja.pdf" }
      )
    );
    prismaMock.contenido.findFirst.mockResolvedValue({ id: "55555555-5555-4555-8555-555555555555" });

    await subirMaterial(MATERIA, FECHA, "profe-1", {
      buffer: Buffer.from("contenido"),
      nombreOriginal: "clase.pdf",
    });

    expect(prismaMock.contenido.delete).toHaveBeenCalled();
    expect(eliminarRagMock).toHaveBeenCalledWith(MATERIA, "55555555-5555-4555-8555-555555555555");
    expect(eliminarArchivoMock).toHaveBeenCalledWith("/uploads/clase-vieja.pdf");
  });

  it("reutiliza un contenido existente en vez de copiarlo y lo asocia a la clase", async () => {
    prismaMock.contenido.findUnique.mockResolvedValue({
      id: CONTENIDO,
      seccion_id: SECCION,
      archivo_url: "/uploads/origen.pdf",
      archivo_nombre: "origen.pdf",
      archivo_formato: "pdf",
      archivo_tamano_kb: 9,
      titulo: "Origen",
      seccion: { materia_id: MATERIA },
    });

    await asignarMaterialDesdeContenido(MATERIA, FECHA, CONTENIDO, "profe-1");

    expect(guardarMock).not.toHaveBeenCalled();
    expect(prismaMock.contenido.update).toHaveBeenCalledWith({
      where: { id: CONTENIDO },
      data: { clase_id: CLASE },
    });
    expect(prismaMock.planningClase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ material_url: "/uploads/origen.pdf" }),
      })
    );
  });

  it("no indexa nada si el profesor no está asignado", async () => {
    asignadoMock.mockResolvedValue(null);

    await expect(
      subirMaterial(MATERIA, FECHA, "otro", {
        buffer: Buffer.from("x"),
        nombreOriginal: "clase.pdf",
      })
    ).rejects.toThrow("Solo un profesor asignado puede planificar");

    expect(indexarMock).not.toHaveBeenCalled();
    expect(guardarMock).not.toHaveBeenCalled();
  });

  it("al borrar el material quita el contenido y sus vectores", async () => {
    prismaMock.planningClase.findUnique.mockResolvedValue(planning);
    prismaMock.contenido.findFirst.mockResolvedValue({ id: CONTENIDO });

    await eliminarMaterial(MATERIA, FECHA, "profe-1");

    expect(prismaMock.contenido.delete).toHaveBeenCalledWith({ where: { id: CONTENIDO } });
    expect(eliminarRagMock).toHaveBeenCalledWith(MATERIA, CONTENIDO);
    expect(eliminarArchivoMock).toHaveBeenCalledWith(guardado.url);
  });
});
