import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Course, CourseUnit } from "../types/domain";

const askTutorStreamMock = vi.fn();

vi.mock("../services/tutor.service", () => ({
  createTutorSession: vi.fn(async () => "sesion-1"),
  askTutorStream: (...args: unknown[]) => askTutorStreamMock(...args),
}));

import { useTutorChat } from "../hooks/useTutorChat";
import { preguntaUnidadActual } from "../pages/student/StudentCourseDetailPage";

const course = { id: "materia-1" } as Course;

describe("useTutorChat", () => {
  beforeEach(() => {
    askTutorStreamMock.mockReset();
  });

  it("ignora un segundo envío mientras hay una respuesta en curso", async () => {
    let terminar: () => void = () => {};
    askTutorStreamMock.mockImplementation(
      (_s: string, _q: string, onToken: (t: string) => void) =>
        new Promise<string>((resolve) => {
          onToken("Hola");
          terminar = () => resolve("Hola");
        })
    );

    const { result } = renderHook(() => useTutorChat(course));

    let primera: Promise<void> = Promise.resolve();
    await act(async () => {
      primera = result.current.ask("Explicame fácil");
      void result.current.ask("Explicame fácil");
      void result.current.ask("Explicame fácil");
    });
    await act(async () => {
      terminar();
      await primera;
    });

    expect(askTutorStreamMock).toHaveBeenCalledTimes(1);
    expect(result.current.messages).toEqual([
      { role: "user", content: "Explicame fácil" },
      { role: "tutor", content: "Hola" },
    ]);
  });
});

describe("preguntaUnidadActual", () => {
  const unidades: CourseUnit[] = [
    { title: "Unidad 1", status: "Disponible", items: ["Intro"] },
    { title: "Pretensado", status: "En curso", items: ["Clases U, T y C", "Pérdidas"] },
  ];

  it("usa la unidad en curso y sus temas", () => {
    expect(preguntaUnidadActual(unidades)).toBe(
      'Explicame con palabras simples la unidad "Pretensado" (temas: Clases U, T y C, Pérdidas)'
    );
  });

  it("no manda la frase ambigua 'la unidad actual'", () => {
    expect(preguntaUnidadActual([])).not.toMatch(/unidad actual/i);
  });
});
