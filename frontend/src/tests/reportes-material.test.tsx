import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const apiMock = vi.fn();
vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return { ...real, api: (...a: unknown[]) => apiMock(...a) };
});

vi.mock("../services/tutor.service", () => ({ registerContentAccess: vi.fn() }));

import { MaterialItem } from "../components/student/MaterialItem";
import { ReportesMaterialCard } from "../components/teacher/ReportesMaterialCard";
import { getCourseById } from "../services/courses.service";
import { ApiError } from "../services/api";
import type { CourseMaterial } from "../types/domain";

const URL_ARCHIVO = "http://localhost:3000/uploads/apunte-123.pdf";

const archivo = (extra: Partial<CourseMaterial> = {}): CourseMaterial => ({
  id: "c1",
  titulo: "Apunte de DNS",
  tipo: "PDF",
  resumible: false,
  ragIndexado: true,
  url: URL_ARCHIVO,
  archivo_nombre: "apunte.pdf",
  ...extra,
});

describe("alumno: archivo no disponible o dañado (CU-A02 5A)", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({ reportado: true, ya_reportado: false });
  });

  it("un archivo disponible se abre normal y ofrece reportar un problema sin molestar", () => {
    render(<MaterialItem material={archivo({ disponible: true })} color="#003d7a" />);

    expect(screen.getByRole("link", { name: "Apunte de DNS" })).toHaveAttribute("href", URL_ARCHIVO);
    expect(screen.getByRole("link", { name: "Ver / descargar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "¿No abre? Reportalo" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("si el servidor detectó que el archivo falta, muestra un aviso de error y no ofrece un enlace roto", () => {
    render(<MaterialItem material={archivo({ disponible: false })} color="#003d7a" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Este archivo no está disponible en este momento.");
    expect(screen.getByRole("button", { name: "Reportar el problema" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Apunte de DNS" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ver / descargar" })).not.toBeInTheDocument();
    expect(screen.getByText("Apunte de DNS")).toBeInTheDocument(); // el nombre sigue visible
  });

  it("si no se pudo comprobar (null) no se inventa ningún aviso", () => {
    render(<MaterialItem material={archivo({ disponible: null })} color="#003d7a" />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver / descargar" })).toBeInTheDocument();
  });

  it("reporta con un motivo y avisa que el docente fue notificado", async () => {
    render(<MaterialItem material={archivo({ disponible: false })} color="#003d7a" />);

    fireEvent.click(screen.getByRole("button", { name: "Reportar el problema" }));
    fireEvent.change(screen.getByLabelText("Contanos qué pasa con Apunte de DNS"), { target: { value: "  Dice error 404  " } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Reporte enviado: tu docente fue avisado.");
    const [ruta, init] = apiMock.mock.calls[0];
    expect(ruta).toBe("/api/contenidos/c1/reportes");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ motivo: "Dice error 404" });
    expect(screen.queryByRole("button", { name: "¿No abre? Reportalo" })).not.toBeInTheDocument(); // no se repite
  });

  it("el motivo es opcional: se puede reportar sin escribir nada", async () => {
    render(<MaterialItem material={archivo()} color="#003d7a" />);

    fireEvent.click(screen.getByRole("button", { name: "¿No abre? Reportalo" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }));

    await screen.findByRole("status");
    expect(JSON.parse(apiMock.mock.calls[0][1].body)).toEqual({});
  });

  it("si el envío falla muestra el motivo y deja reintentar sin perder lo escrito", async () => {
    apiMock.mockRejectedValue(new ApiError(403, JSON.stringify({ error: "No tenes acceso a esta materia" })));
    render(<MaterialItem material={archivo()} color="#003d7a" />);

    fireEvent.click(screen.getByRole("button", { name: "¿No abre? Reportalo" }));
    fireEvent.change(screen.getByLabelText(/Contanos qué pasa/), { target: { value: "No abre" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }));

    expect(await screen.findByText("No tenes acceso a esta materia")).toBeInTheDocument();
    expect(screen.getByLabelText(/Contanos qué pasa/)).toHaveValue("No abre");
    expect(screen.getByRole("button", { name: "Enviar reporte" })).toBeEnabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("Cancelar cierra el formulario sin enviar nada", () => {
    render(<MaterialItem material={archivo()} color="#003d7a" />);

    fireEvent.click(screen.getByRole("button", { name: "¿No abre? Reportalo" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(apiMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "¿No abre? Reportalo" })).toBeInTheDocument();
  });

  it("un material de texto o sin archivo no ofrece reportar archivos", () => {
    render(<MaterialItem material={{ id: "t1", titulo: "Apunte", tipo: "TEXTO", resumible: true, ragIndexado: true, texto: "hola" }} color="#003d7a" />);

    expect(screen.queryByRole("button", { name: /Reportalo|Reportar/ })).not.toBeInTheDocument();
  });

  it("la materia del alumno trae la disponibilidad que informa el servidor", async () => {
    apiMock.mockImplementation(async (ruta: string) => {
      if (ruta === "/api/materias/m1") {
        return { materia: { id: "m1", nombre: "Redes", descripcion: null, nivel_educativo: "T", activa: true, inscriptos: 1, created_at: "2026-01-01" } };
      }
      if (ruta === "/api/materias/m1/contenidos") {
        return {
          secciones: [
            {
              id: "s1",
              nombre: "Unidad 1",
              tipo: "TEORIA",
              contenidos: [
                { id: "c1", seccion_id: "s1", titulo: "Falta", tipo: "PDF", texto_contenido: null, rag_indexado: true, archivo_url: "/uploads/x.pdf", archivo_disponible: false },
                { id: "c2", seccion_id: "s1", titulo: "Texto", tipo: "TEXTO", texto_contenido: "hola", rag_indexado: true, archivo_url: null, archivo_disponible: null },
              ],
              clases: [],
            },
          ],
        };
      }
      if (ruta === "/api/materias/m1/secciones") return { secciones: [] };
      throw new Error(`ruta inesperada ${ruta}`);
    });

    const curso = await getCourseById("m1");

    expect(curso?.materiales.find((m) => m.id === "c1")?.disponible).toBe(false);
    expect(curso?.materiales.find((m) => m.id === "c2")?.disponible).toBeNull();
  });
});

describe("docente: archivos reportados", () => {
  const reportes = [
    { contenido_id: "c1", titulo: "Apunte de DNS", tipo: "PDF", archivo_nombre: "apunte.pdf", archivo_disponible: false, alumnos: 3, ultimo_reporte: "2026-11-18T12:00:00Z", motivos: ["No abre", "Dice error 404"] },
    { contenido_id: "c2", titulo: "Guía 2", tipo: "PDF", archivo_nombre: "guia.pdf", archivo_disponible: true, alumnos: 1, ultimo_reporte: "2026-11-17T09:00:00Z", motivos: [] },
  ];
  let lista: typeof reportes;

  beforeEach(() => {
    apiMock.mockReset();
    lista = [...reportes];
    apiMock.mockImplementation(async (ruta: string, init?: { method?: string }) => {
      if (ruta === "/api/materias/m1/reportes-contenido") return { reportes: lista };
      if (ruta.endsWith("/reportes/resolver") && init?.method === "POST") {
        const id = ruta.split("/")[3];
        lista = lista.filter((r) => r.contenido_id !== id);
        return { resueltos: 1 };
      }
      throw new Error(`ruta inesperada ${ruta}`);
    });
  });

  const montar = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ReportesMaterialCard materiaId="m1" />
      </QueryClientProvider>,
    );
  };

  it("lista los materiales reportados con cantidad de alumnos, motivos y si el archivo falta", async () => {
    montar();

    const dns = (await screen.findByText("Apunte de DNS")).closest("li") as HTMLElement;
    expect(within(dns).getByText(/3 alumnos/)).toBeInTheDocument();
    expect(within(dns).getByText("Archivo faltante")).toBeInTheDocument();
    expect(within(dns).getByText("“No abre”")).toBeInTheDocument();
    expect(within(dns).getByText("“Dice error 404”")).toBeInTheDocument();
    expect(within(dns).getByText(/volvé a subirlo/)).toBeInTheDocument();

    const guia = screen.getByText("Guía 2").closest("li") as HTMLElement;
    expect(within(guia).getByText(/1 alumno ·/)).toBeInTheDocument();
    expect(within(guia).getByText("Reportado")).toBeInTheDocument();
    expect(within(guia).queryByText(/volvé a subirlo/)).not.toBeInTheDocument();
  });

  it("Marcar como resuelto lo saca de la lista", async () => {
    montar();
    await screen.findByText("Apunte de DNS");

    fireEvent.click(screen.getByRole("button", { name: "Marcar como resuelto: Apunte de DNS" }));

    await waitFor(() => expect(screen.queryByText("Apunte de DNS")).not.toBeInTheDocument());
    expect(screen.getByText("Guía 2")).toBeInTheDocument();
    expect(apiMock).toHaveBeenCalledWith("/api/contenidos/c1/reportes/resolver", { method: "POST" });
  });

  it("sin reportes lo dice", async () => {
    lista = [];
    montar();

    expect(await screen.findByText("Ningún alumno reportó problemas con los archivos.")).toBeInTheDocument();
  });

  it("si falla la carga muestra el error", async () => {
    apiMock.mockRejectedValue(new ApiError(500, JSON.stringify({ error: "Error del servidor" })));
    montar();

    expect(await screen.findByText("Error del servidor")).toBeInTheDocument();
  });
});
