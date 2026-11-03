import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

// Se mockea solo `api`: `apiUrl` y `API_URL` son los reales, que es lo que se quiere probar.
vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return { ...real, api: (...args: unknown[]) => apiMock(...args) };
});

import { getCourseById } from "../services/courses.service";
import { getCorrectionQueue } from "../services/corrections.service";
import { getUploadedMaterials } from "../services/content.service";
import { resolverMateriaActiva } from "../utils/materiaActiva";

const API = "http://localhost:3000";

describe("materiales del alumno: la URL apunta al backend", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockImplementation(async (ruta: string) => {
      if (ruta === "/api/materias/m1") {
        return {
          materia: { id: "m1", nombre: "Redes", descripcion: null, nivel_educativo: "Terciario", activa: true, inscriptos: 3, created_at: "2026-01-01" },
        };
      }
      if (ruta === "/api/materias/m1/secciones") {
        return { secciones: [{ id: "s1", nombre: "Unidad 1", tipo: "TEORIA", contenidos: 2 }] };
      }
      if (ruta === "/api/secciones/s1/contenidos") {
        return {
          contenidos: [
            { id: "c1", titulo: "Apunte", tipo: "PDF", texto_contenido: null, rag_indexado: true, archivo_url: "/uploads/apunte-123.pdf", archivo_nombre: "apunte.pdf" },
            { id: "c2", titulo: "Texto", tipo: "TEXTO", texto_contenido: "contenido", rag_indexado: false, archivo_url: null },
            { id: "c3", titulo: "Externo", tipo: "PDF", texto_contenido: null, rag_indexado: true, archivo_url: "https://cdn.ejemplo.com/a.pdf" },
          ],
        };
      }
      throw new Error(`ruta inesperada ${ruta}`);
    });
  });

  it("convierte la ruta relativa /uploads/... en una URL absoluta del backend", async () => {
    const curso = await getCourseById("m1");
    const material = curso?.materiales.find((m) => m.id === "c1");

    expect(material?.url).toBe(`${API}/uploads/apunte-123.pdf`);
    expect(material?.archivo_nombre).toBe("apunte.pdf");
  });

  it("respeta las URLs que ya son absolutas (almacenamiento externo) y deja en null las de texto", async () => {
    const curso = await getCourseById("m1");

    expect(curso?.materiales.find((m) => m.id === "c3")?.url).toBe("https://cdn.ejemplo.com/a.pdf");
    expect(curso?.materiales.find((m) => m.id === "c2")?.url).toBeNull();
  });
});

describe("cola de correcciones: el docente puede abrir el archivo entregado", () => {
  const entrega = (extra: Record<string, unknown>) => ({
    id: "e1",
    alumno: { id: "a1", nombre: "Ana", email: "ana@edu.ai" },
    actividad: { id: "act1", nombre: "TP1", tipo: "ARCHIVO", seccion: { materia: { id: "m1", nombre: "Redes" } } },
    materia: { id: "m1", nombre: "Redes" },
    respuesta_texto: null,
    respuesta_codigo: null,
    archivo_url: null,
    archivo_nombre: null,
    calificacion_ia: null,
    feedback_ia: null,
    ...extra,
  });

  it("incluye la URL absoluta y el nombre del archivo", async () => {
    apiMock.mockResolvedValue({
      entregas: [entrega({ archivo_url: "/uploads/tp1-abc.docx", archivo_nombre: "TP1 final.docx" })],
    });

    const [item] = await getCorrectionQueue();

    expect(item.fileUrl).toBe(`${API}/uploads/tp1-abc.docx`);
    expect(item.fileName).toBe("TP1 final.docx");
    expect(item.submission).toBe("El alumno entregó un archivo adjunto.");
  });

  it("una entrega de texto no trae enlace", async () => {
    apiMock.mockResolvedValue({ entregas: [entrega({ respuesta_texto: "Mi respuesta" })] });

    const [item] = await getCorrectionQueue();

    expect(item.fileUrl).toBeNull();
    expect(item.submission).toBe("Mi respuesta");
  });

  it("una entrega vacia sigue diciendo que no tiene contenido", async () => {
    apiMock.mockResolvedValue({ entregas: [entrega({})] });

    expect((await getCorrectionQueue())[0].submission).toBe("Sin contenido");
  });
});

describe("resolverMateriaActiva (Gestionar contenidos desde Mis materias)", () => {
  const materias = [{ id: "m1" }, { id: "m2" }, { id: "m3" }];

  it("usa la materia pedida por la URL si es del docente", () => {
    expect(resolverMateriaActiva("m2", materias)).toBe("m2");
  });

  it("cae a la primera si el id es ajeno, viejo o no hay parametro", () => {
    expect(resolverMateriaActiva("ajena", materias)).toBe("m1");
    expect(resolverMateriaActiva(null, materias)).toBe("m1");
  });

  it("mientras las materias cargan o si no tiene ninguna, no hay materia activa", () => {
    expect(resolverMateriaActiva("m2", undefined)).toBeNull();
    expect(resolverMateriaActiva("m2", [])).toBeNull();
  });
});

describe("materiales del docente: la URL del archivo", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  const contenido = (extra: Record<string, unknown>) => ({
    id: "c1",
    seccion_id: "s1",
    tipo: "PDF",
    titulo: "Apunte",
    texto_contenido: null,
    archivo_url: null,
    archivo_nombre: null,
    archivo_formato: null,
    archivo_tamano_kb: 10,
    rag_indexado: true,
    created_at: "2026-11-01T10:00:00Z",
    ...extra,
  });

  it("arma la URL absoluta a partir de la ruta relativa", async () => {
    apiMock.mockResolvedValue({ contenidos: [contenido({ archivo_url: "/uploads/a-1.pdf", archivo_nombre: "a.pdf" })] });

    const [m] = await getUploadedMaterials("s1");

    expect(m.url).toBe(`${API}/uploads/a-1.pdf`);
    expect(m.name).toBe("a.pdf");
  });

  it("no rompe las URLs absolutas de un almacenamiento externo", async () => {
    apiMock.mockResolvedValue({ contenidos: [contenido({ archivo_url: "https://cdn.ejemplo.com/a.pdf" })] });

    expect((await getUploadedMaterials("s1"))[0].url).toBe("https://cdn.ejemplo.com/a.pdf");
  });

  it("los materiales de texto traen su contenido y no tienen URL", async () => {
    apiMock.mockResolvedValue({ contenidos: [contenido({ tipo: "TEXTO", titulo: "Consigna", texto_contenido: "Leer el capitulo 2." })] });

    const [m] = await getUploadedMaterials("s1");

    expect(m.url).toBeUndefined();
    expect(m.text).toBe("Leer el capitulo 2.");
    expect(m.id).toBe("c1");
  });
});
