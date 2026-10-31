import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Course, CourseUnit } from "../types/domain";

const askTutorStreamMock = vi.fn();

vi.mock("../services/tutor.service", () => ({
  createTutorSession: vi.fn(async () => "sesion-1"),
  askTutorStream: (...args: unknown[]) => askTutorStreamMock(...args),
}));

import { TUTOR_LENTO_MS, useTutorChat } from "../hooks/useTutorChat";
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

describe("useTutorChat: tutor lento (CU-A04 A7)", () => {
  beforeEach(() => {
    askTutorStreamMock.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Una consulta que nunca responde hasta que se la aborta, como un tutor colgado. */
  const consultaColgada = (
    _s: string,
    _q: string,
    _onToken: (t: string) => void,
    _modo?: string,
    signal?: AbortSignal
  ) =>
    new Promise<string>((_resolve, reject) => {
      signal?.addEventListener("abort", () => reject(new DOMException("abortado", "AbortError")));
    });

  it("avisa que tarda recien pasados 10 segundos sin respuesta", async () => {
    askTutorStreamMock.mockImplementation(consultaColgada);
    const { result } = renderHook(() => useTutorChat(course));

    await act(async () => {
      void result.current.ask("¿Qué es una red?");
    });
    expect(result.current.lenta).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(TUTOR_LENTO_MS - 100);
    });
    expect(result.current.lenta).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.lenta).toBe(true);
    expect(result.current.pending).toBe(true);
  });

  it("no avisa si la primera palabra llega a tiempo", async () => {
    askTutorStreamMock.mockImplementation(
      (_s: string, _q: string, onToken: (t: string) => void) =>
        new Promise<string>((resolve) => {
          onToken("Hola");
          setTimeout(() => resolve("Hola"), 20_000);
        })
    );
    const { result } = renderHook(() => useTutorChat(course));

    await act(async () => {
      void result.current.ask("hola");
      vi.advanceTimersByTime(TUTOR_LENTO_MS + 500);
    });

    expect(result.current.lenta).toBe(false);
  });

  it("reintentar corta la consulta colgada y vuelve a preguntar lo mismo sin duplicar burbujas", async () => {
    askTutorStreamMock.mockImplementationOnce(consultaColgada);
    askTutorStreamMock.mockImplementationOnce(
      (_s: string, _q: string, onToken: (t: string) => void) =>
        new Promise<string>((resolve) => {
          onToken("Respuesta nueva");
          resolve("Respuesta nueva");
        })
    );
    const { result } = renderHook(() => useTutorChat(course));

    await act(async () => {
      void result.current.ask("¿Qué es una red?");
      vi.advanceTimersByTime(TUTOR_LENTO_MS + 100);
    });
    expect(result.current.lenta).toBe(true);

    await act(async () => {
      result.current.reintentar();
    });

    expect(askTutorStreamMock).toHaveBeenCalledTimes(2);
    expect(askTutorStreamMock.mock.calls[1][1]).toBe("¿Qué es una red?");
    expect(result.current.lenta).toBe(false);
    expect(result.current.messages).toEqual([
      { role: "user", content: "¿Qué es una red?" },
      { role: "tutor", content: "Respuesta nueva" },
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
