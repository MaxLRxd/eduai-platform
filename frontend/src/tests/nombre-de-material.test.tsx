import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { CourseMaterial, UploadedMaterial } from "../types/domain";

const registrarAccesoMock = vi.fn();

vi.mock("../services/tutor.service", () => ({
  registerContentAccess: (...args: unknown[]) => registrarAccesoMock(...args),
}));

import { MaterialItem } from "../components/student/MaterialItem";
import { MaterialRow } from "../components/teacher/MaterialRow";

const URL_ARCHIVO = "http://localhost:3000/uploads/apunte-123.pdf";

const base: CourseMaterial = {
  id: "c1",
  titulo: "Apunte de la Unidad 1",
  tipo: "PDF",
  resumible: false,
  ragIndexado: true,
};

describe("alumno: el nombre del material abre el material", () => {
  beforeEach(() => {
    registrarAccesoMock.mockReset();
  });

  it("si es un archivo, el nombre es un enlace al archivo y registra el acceso", () => {
    render(<MaterialItem material={{ ...base, url: URL_ARCHIVO, archivo_nombre: "apunte.pdf" }} color="#003d7a" />);

    const enlace = screen.getByRole("link", { name: "Apunte de la Unidad 1" });

    expect(enlace).toHaveAttribute("href", URL_ARCHIVO);
    expect(enlace).toHaveAttribute("target", "_blank");
    expect(enlace).toHaveAttribute("rel", expect.stringContaining("noopener"));

    fireEvent.click(enlace);
    expect(registrarAccesoMock).toHaveBeenCalledWith("c1");
  });

  it("el boton 'Ver / descargar' sigue apuntando al mismo archivo", () => {
    render(<MaterialItem material={{ ...base, url: URL_ARCHIVO }} color="#003d7a" />);

    expect(screen.getByRole("link", { name: "Ver / descargar" })).toHaveAttribute("href", URL_ARCHIVO);
  });

  it("si es un texto, el nombre despliega el contenido y registra el acceso solo la primera vez", () => {
    render(<MaterialItem material={{ ...base, tipo: "TEXTO", texto: "Contenido del apunte." }} color="#003d7a" />);

    expect(screen.queryByText("Contenido del apunte.")).not.toBeInTheDocument();

    const nombre = screen.getByRole("button", { name: "Apunte de la Unidad 1" });
    fireEvent.click(nombre);
    expect(screen.getByText("Contenido del apunte.")).toBeInTheDocument();
    expect(registrarAccesoMock).toHaveBeenCalledTimes(1);

    fireEvent.click(nombre); // se cierra
    expect(screen.queryByText("Contenido del apunte.")).not.toBeInTheDocument();
    fireEvent.click(nombre); // se vuelve a abrir
    expect(registrarAccesoMock).toHaveBeenCalledTimes(2);
  });

  it("un material sin archivo ni texto muestra el nombre sin enlace", () => {
    render(<MaterialItem material={base} color="#003d7a" />);

    expect(screen.getByText("Apunte de la Unidad 1")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("docente: el nombre del material abre el material", () => {
  const rag = { color: "green" as const, label: "RAG" };
  const material: UploadedMaterial = {
    id: "c1",
    name: "Apunte.pdf",
    fileType: "pdf",
    sizeLabel: "120 KB",
    ragStatus: "Indexado",
    date: "01/11",
  };

  it("si tiene archivo, el nombre es un enlace al archivo", () => {
    render(<MaterialRow material={{ ...material, url: URL_ARCHIVO }} icon="📄" rag={rag} />);

    const enlace = screen.getByRole("link", { name: "Apunte.pdf" });
    expect(enlace).toHaveAttribute("href", URL_ARCHIVO);
    expect(enlace).toHaveAttribute("target", "_blank");
  });

  it("si es un texto, el nombre despliega y oculta el contenido", () => {
    render(<MaterialRow material={{ ...material, name: "Consigna", fileType: "txt", text: "Texto de la consigna." }} icon="📝" rag={rag} />);

    expect(screen.queryByText("Texto de la consigna.")).not.toBeInTheDocument();

    const nombre = screen.getByRole("button", { name: "Consigna" });
    fireEvent.click(nombre);
    expect(screen.getByText("Texto de la consigna.")).toBeInTheDocument();

    fireEvent.click(nombre);
    expect(screen.queryByText("Texto de la consigna.")).not.toBeInTheDocument();
  });

  it("sin archivo ni texto es solo una etiqueta", () => {
    render(<MaterialRow material={material} icon="📄" rag={rag} />);

    expect(screen.getByText("Apunte.pdf")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
