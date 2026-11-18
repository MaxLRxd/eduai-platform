import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const apiMock = vi.fn();
vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return { ...real, api: (...a: unknown[]) => apiMock(...a) };
});

import { ResumenPanel } from "../components/student/ResumenPanel";
import { validarArchivoResumen } from "../services/tutor.service";
import { ApiError } from "../services/api";
import type { Course } from "../types/domain";

const course = { id: "m1", materiales: [] } as unknown as Course;

const archivo = (nombre: string, tamano = 1000, contenido = "x"): File => {
  const f = new File([contenido], nombre, { type: "application/octet-stream" });
  Object.defineProperty(f, "size", { value: tamano });
  return f;
};

describe("validarArchivoResumen", () => {
  it("acepta los formatos soportados, sin importar mayúsculas", () => {
    for (const nombre of ["a.pdf", "a.DOCX", "a.pptx", "a.txt", "a.md", "a.png", "a.JPG", "a.jpeg"]) {
      expect(validarArchivoResumen({ name: nombre, size: 10 })).toBeNull();
    }
  });

  it("rechaza formatos no soportados y archivos sin extensión", () => {
    expect(validarArchivoResumen({ name: "virus.exe", size: 10 })).toContain("Formato no permitido");
    expect(validarArchivoResumen({ name: "sinextension", size: 10 })).toContain("Formato no permitido");
  });

  it("rechaza archivos vacíos y de más de 10 MB", () => {
    expect(validarArchivoResumen({ name: "a.pdf", size: 0 })).toBe("El archivo está vacío.");
    expect(validarArchivoResumen({ name: "a.pdf", size: 10 * 1024 * 1024 + 1 })).toContain("10 MB");
    expect(validarArchivoResumen({ name: "a.pdf", size: 10 * 1024 * 1024 })).toBeNull();
  });
});

describe("resumir un archivo propio (CU-A05 A1)", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  const abrirModoArchivo = () => {
    render(<ResumenPanel course={course} />);
    fireEvent.click(screen.getByRole("button", { name: "De un archivo" }));
  };

  const adjuntar = (f: File) =>
    fireEvent.change(screen.getByLabelText("Adjuntá tu archivo"), { target: { files: [f] } });

  it("sin archivo no se puede generar y se explica que no se guarda", () => {
    abrirModoArchivo();

    expect(screen.getByRole("button", { name: "Generar resumen" })).toBeDisabled();
    expect(screen.getByText(/no se guarda ni lo ven tu docente u otros alumnos/)).toBeInTheDocument();
  });

  it("en el modo archivo no se muestran los otros orígenes (selector de material ni texto)", () => {
    const conMateriales = {
      id: "m1",
      materiales: [{ id: "c1", titulo: "Apunte 1", tipo: "TEXTO", resumible: true, ragIndexado: true }],
    } as unknown as Course;
    render(<ResumenPanel course={conMateriales} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "De un archivo" }));

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Pegá aca el texto/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Adjuntá tu archivo")).toBeInTheDocument();
  });

  it("un archivo con formato no permitido muestra el motivo y no deja generar", () => {
    abrirModoArchivo();
    adjuntar(archivo("virus.exe"));

    expect(screen.getByRole("alert")).toHaveTextContent("Formato no permitido");
    expect(screen.getByRole("button", { name: "Generar resumen" })).toBeDisabled();
  });

  it("un archivo demasiado grande no deja generar", () => {
    abrirModoArchivo();
    adjuntar(archivo("enorme.pdf", 11 * 1024 * 1024));

    expect(screen.getByRole("alert")).toHaveTextContent("10 MB");
    expect(screen.getByRole("button", { name: "Generar resumen" })).toBeDisabled();
  });

  it("sube el archivo al endpoint del resumen y muestra el resultado con su nombre", async () => {
    apiMock.mockResolvedValue({ resumen: "Resumen del apunte.", origen: "apunte.pdf", max_palabras: 150, truncado: false });
    abrirModoArchivo();
    adjuntar(archivo("apunte.pdf"));

    fireEvent.click(screen.getByRole("button", { name: "Generar resumen" }));

    expect(await screen.findByText("Resumen del apunte.")).toBeInTheDocument();
    expect(screen.getByText("apunte.pdf", { selector: "strong" })).toBeInTheDocument(); // "Resumen de apunte.pdf"
    const [ruta, init] = apiMock.mock.calls[0];
    expect(ruta).toBe("/api/materias/m1/tutor/resumen/archivo");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("archivo")).toBeInstanceOf(File);
    expect(screen.queryByText(/se resumió solo el comienzo/)).not.toBeInTheDocument();
  });

  it("avisa cuando el archivo era tan largo que solo se resumió el comienzo", async () => {
    apiMock.mockResolvedValue({ resumen: "Resumen.", origen: "libro.pdf", max_palabras: 150, truncado: true });
    abrirModoArchivo();
    adjuntar(archivo("libro.pdf"));

    fireEvent.click(screen.getByRole("button", { name: "Generar resumen" }));

    expect(await screen.findByText(/se resumió solo el comienzo/)).toBeInTheDocument();
  });

  it("si el servidor no pudo leer el archivo muestra su mensaje", async () => {
    apiMock.mockRejectedValue(
      new ApiError(422, JSON.stringify({ error: "No se pudo leer texto de este archivo. Proba con otro archivo o pega el texto." })),
    );
    abrirModoArchivo();
    adjuntar(archivo("escaneo.pdf"));

    fireEvent.click(screen.getByRole("button", { name: "Generar resumen" }));

    expect(await screen.findByText(/No se pudo leer texto de este archivo/)).toBeInTheDocument();
  });

  it("Quitar saca el archivo y vuelve a bloquear el botón", () => {
    abrirModoArchivo();
    adjuntar(archivo("apunte.pdf"));
    expect(screen.getByRole("button", { name: "Generar resumen" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Quitar" }));

    expect(screen.queryByText("apunte.pdf")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generar resumen" })).toBeDisabled();
  });

  it("el modo de texto pegado sigue funcionando igual", async () => {
    apiMock.mockResolvedValue({ resumen: "Resumen del texto.", origen: null, max_palabras: 150 });
    render(<ResumenPanel course={course} />);
    fireEvent.click(screen.getByRole("button", { name: "De un texto" }));
    fireEvent.change(screen.getByPlaceholderText(/Pegá aca el texto/), { target: { value: "a".repeat(250) } });

    fireEvent.click(screen.getByRole("button", { name: "Generar resumen" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    expect(apiMock.mock.calls[0][0]).toBe("/api/materias/m1/tutor/resumen");
    expect(await screen.findByText("Resumen del texto.")).toBeInTheDocument();
  });
});
