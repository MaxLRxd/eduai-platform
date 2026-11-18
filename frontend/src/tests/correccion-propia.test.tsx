import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const apiMock = vi.fn();
vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return { ...real, api: (...a: unknown[]) => apiMock(...a) };
});

import { CorreccionPropiaPanel } from "../components/student/CorreccionPropiaPanel";
import { ApiError } from "../services/api";
import type { Course } from "../types/domain";

const course = {
  id: "m1",
  name: "Redes",
  materiales: [
    { id: "c1", titulo: "Apunte de DNS", tipo: "TEXTO", resumible: true, ragIndexado: true },
    { id: "c2", titulo: "Pendiente de indexar", tipo: "PDF", resumible: false, ragIndexado: false },
  ],
} as unknown as Course;

const correccion = (extra: Record<string, unknown> = {}) => ({
  id: "i1",
  titulo: "Mis respuestas",
  dificultad: "media",
  puntaje: 5,
  correctas: 0,
  parciales: 1,
  incorrectas: 0,
  sin_responder: 0,
  material_limitado: false,
  resultados: [
    { indice: 0, enunciado: "¿Para qué sirve el DNS?", veredicto: "parcial", puntaje: 0.5, feedback: "Le falta el ejemplo.", respuesta_alumno: "Traduce nombres.", respuesta_correcta: "" },
  ],
  ...extra,
});

function montar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <CorreccionPropiaPanel course={course} />
    </QueryClientProvider>,
  );
}

const responder = (i = 1, pregunta = "¿Para qué sirve el DNS?", respuesta = "Traduce nombres.") => {
  fireEvent.change(screen.getByLabelText(`Pregunta ${i}`), { target: { value: pregunta } });
  fireEvent.change(screen.getByLabelText(`Tu respuesta a la pregunta ${i}`), { target: { value: respuesta } });
};

const llamadasA = (ruta: string) => apiMock.mock.calls.filter((c) => c[0] === ruta);

describe("CU-A11 (A2, A4): corregir mis respuestas", () => {
  let material: unknown;

  beforeEach(() => {
    apiMock.mockReset();
    material = { fragmentos: 12, minimo: 3, suficiente: true };
    apiMock.mockImplementation(async (ruta: string) => {
      if (ruta === "/api/materias/m1/tutor/material-disponible") {
        if (material instanceof Error) throw material;
        return material;
      }
      if (ruta === "/api/materias/m1/tutor/examen/corregir") return correccion();
      if (ruta === "/api/materias/m1/tutor/simulacros") return { simulacros: [] };
      throw new Error(`ruta inesperada ${ruta}`);
    });
  });

  it("no se puede pedir corrección sin una pregunta con su respuesta", () => {
    montar();
    expect(screen.getByRole("button", { name: "Solicitar corrección" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Pregunta 1"), { target: { value: "¿Qué es DNS?" } });
    expect(screen.getByRole("button", { name: "Solicitar corrección" })).toBeDisabled(); // falta la respuesta

    fireEvent.change(screen.getByLabelText("Tu respuesta a la pregunta 1"), { target: { value: "Nombres." } });
    expect(screen.getByRole("button", { name: "Solicitar corrección" })).toBeEnabled();
  });

  it("con material suficiente confirma sin avisos y manda las preguntas como desarrollo, sin respuesta modelo", async () => {
    montar();
    responder();

    fireEvent.click(screen.getByRole("button", { name: "Solicitar corrección" }));
    expect(await screen.findByText("¿Enviar las respuestas a corregir?")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y corregir" }));

    expect(await screen.findByText("Le falta el ejemplo.")).toBeInTheDocument();
    const [, init] = llamadasA("/api/materias/m1/tutor/examen/corregir")[0];
    expect(JSON.parse(init.body)).toEqual({
      titulo: "Mis respuestas",
      dificultad: "media",
      registrar: true,
      preguntas: [{ tipo: "desarrollo", enunciado: "¿Para qué sirve el DNS?", opciones: [], respuesta_modelo: "", respuesta_alumno: "Traduce nombres." }],
    });
  });

  describe("material insuficiente (A4)", () => {
    beforeEach(() => {
      material = { fragmentos: 1, minimo: 3, suficiente: false };
    });

    it("avisa que la corrección puede ser limitada y deja elegir entre continuar o cancelar", async () => {
      montar();
      responder();

      fireEvent.click(screen.getByRole("button", { name: "Solicitar corrección" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("la corrección puede ser limitada");
      expect(screen.getByRole("alert")).toHaveTextContent("1 fragmentos");
      expect(screen.getByRole("button", { name: "Continuar con corrección limitada" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    });

    it("Cancelar no corrige nada y conserva lo escrito", async () => {
      montar();
      responder();
      fireEvent.click(screen.getByRole("button", { name: "Solicitar corrección" }));
      await screen.findByRole("alert");

      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(llamadasA("/api/materias/m1/tutor/examen/corregir")).toHaveLength(0);
      expect(screen.getByLabelText("Tu respuesta a la pregunta 1")).toHaveValue("Traduce nombres.");
      expect(screen.getByRole("button", { name: "Solicitar corrección" })).toBeEnabled();
    });

    it("Continuar corrige de todos modos", async () => {
      montar();
      responder();
      fireEvent.click(screen.getByRole("button", { name: "Solicitar corrección" }));
      await screen.findByRole("alert");

      fireEvent.click(screen.getByRole("button", { name: "Continuar con corrección limitada" }));

      expect(await screen.findByText("Le falta el ejemplo.")).toBeInTheDocument();
      expect(llamadasA("/api/materias/m1/tutor/examen/corregir")).toHaveLength(1);
    });

    it("si el alumno eligió un material de referencia no se muestra el aviso y se manda su id", async () => {
      montar();
      responder();
      fireEvent.change(screen.getByLabelText(/Material de referencia/), { target: { value: "c1" } });

      fireEvent.click(screen.getByRole("button", { name: "Solicitar corrección" }));
      await screen.findByText("¿Enviar las respuestas a corregir?");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Confirmar y corregir" }));
      await screen.findByText("Le falta el ejemplo.");

      expect(JSON.parse(llamadasA("/api/materias/m1/tutor/examen/corregir")[0][1].body).contenido_id).toBe("c1");
    });
  });

  it("si no se pudo saber cuánto material hay, no se bloquea: se confirma normalmente", async () => {
    material = new ApiError(502, "{}");
    montar();
    responder();

    fireEvent.click(screen.getByRole("button", { name: "Solicitar corrección" }));

    expect(await screen.findByText("¿Enviar las respuestas a corregir?")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar y corregir" })).toBeInTheDocument();
  });

  it("los bloques sin pregunta se ignoran y las preguntas sin respuesta se avisan y se mandan igual", async () => {
    montar();
    responder(1);
    fireEvent.click(screen.getByRole("button", { name: "+ Pregunta" }));
    fireEvent.change(screen.getByLabelText("Pregunta 2"), { target: { value: "¿Y el ancho de banda?" } }); // sin respuesta
    fireEvent.click(screen.getByRole("button", { name: "+ Pregunta" })); // bloque 3 vacío: se ignora

    fireEvent.click(screen.getByRole("button", { name: "Solicitar corrección" }));
    expect(await screen.findByText(/1 pregunta sin responder/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y corregir" }));
    await screen.findByText("Le falta el ejemplo.");

    const preguntas = JSON.parse(llamadasA("/api/materias/m1/tutor/examen/corregir")[0][1].body).preguntas;
    expect(preguntas.map((p: { enunciado: string }) => p.enunciado)).toEqual(["¿Para qué sirve el DNS?", "¿Y el ancho de banda?"]);
    expect(preguntas[1].respuesta_alumno).toBe("");
  });

  it("no guarda en el historial si el alumno lo desmarca", async () => {
    montar();
    responder();
    fireEvent.click(screen.getByRole("button", { name: "Solicitar corrección" }));
    await screen.findByText("¿Enviar las respuestas a corregir?");

    fireEvent.click(screen.getByRole("checkbox", { name: /Guardar el resultado/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y corregir" }));
    await screen.findByText("Le falta el ejemplo.");

    expect(JSON.parse(llamadasA("/api/materias/m1/tutor/examen/corregir")[0][1].body).registrar).toBe(false);
  });

  it("el resultado avisa cuando la corrección fue limitada por falta de material", async () => {
    apiMock.mockImplementation(async (ruta: string) => {
      if (ruta.endsWith("/material-disponible")) return { fragmentos: 9, minimo: 3, suficiente: true };
      if (ruta.endsWith("/examen/corregir")) return correccion({ material_limitado: true });
      return { simulacros: [] };
    });
    montar();
    responder();
    fireEvent.click(screen.getByRole("button", { name: "Solicitar corrección" }));
    await screen.findByText("¿Enviar las respuestas a corregir?");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y corregir" }));

    expect(await screen.findByText(/Corrección limitada: no se encontró material/)).toBeInTheDocument();
  });

  it("si la corrección falla muestra el motivo y conserva las respuestas para reintentar", async () => {
    apiMock.mockImplementation(async (ruta: string) => {
      if (ruta.endsWith("/material-disponible")) return { fragmentos: 9, minimo: 3, suficiente: true };
      if (ruta.endsWith("/examen/corregir")) {
        throw new ApiError(502, JSON.stringify({ error: "No fue posible corregir el simulacro en este momento." }));
      }
      return { simulacros: [] };
    });
    montar();
    responder();
    fireEvent.click(screen.getByRole("button", { name: "Solicitar corrección" }));
    await screen.findByText("¿Enviar las respuestas a corregir?");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y corregir" }));

    expect(await screen.findByText(/No fue posible corregir/)).toBeInTheDocument();
    expect(screen.getByLabelText("Tu respuesta a la pregunta 1")).toHaveValue("Traduce nombres.");
  });

  it("el selector de referencia ofrece solo materiales disponibles y se puede agregar hasta 10 preguntas", () => {
    montar();

    const opciones = screen.getAllByRole("option").map((o) => o.textContent);
    expect(opciones).toEqual(["Todo el material de la materia", "Apunte de DNS"]);

    for (let i = 0; i < 12; i++) {
      const mas = screen.getByRole("button", { name: "+ Pregunta" });
      if (!(mas as HTMLButtonElement).disabled) fireEvent.click(mas);
    }
    expect(screen.getByLabelText("Pregunta 10")).toBeInTheDocument();
    expect(screen.queryByLabelText("Pregunta 11")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Pregunta" })).toBeDisabled();
  });

  it("Nueva corrección vuelve al formulario vacío", async () => {
    montar();
    responder();
    fireEvent.click(screen.getByRole("button", { name: "Solicitar corrección" }));
    await screen.findByText("¿Enviar las respuestas a corregir?");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y corregir" }));
    await screen.findByText("Le falta el ejemplo.");

    fireEvent.click(screen.getByRole("button", { name: "Nueva corrección" }));

    await waitFor(() => expect(screen.getByLabelText("Pregunta 1")).toHaveValue(""));
  });
});
