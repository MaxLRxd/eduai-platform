import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Course, CourseUnit } from "../types/domain";

const askTutorStreamMock = vi.fn();

vi.mock("../services/tutor.service", () => ({
  createTutorSession: vi.fn(async () => "sesion-1"),
  listTutorSessions: vi.fn(async () => []),
  getTutorMessages: vi.fn(async () => []),
  askTutorStream: (...args: unknown[]) => askTutorStreamMock(...args),
}));

import { TUTOR_LENTO_MS, useTutorChat } from "../hooks/useTutorChat";
import { preguntaUnidadActual } from "../pages/student/StudentCourseDetailPage";
import { getTutorMessages, listTutorSessions } from "../services/tutor.service";

const course = { id: "materia-1" } as Course;

describe("useTutorChat: historial", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(listTutorSessions).mockReset().mockResolvedValue([]);
    vi.mocked(getTutorMessages).mockReset().mockResolvedValue([]);
  });

  it("restaura la conversación guardada al abrir la materia", async () => {
    vi.mocked(listTutorSessions).mockResolvedValueOnce([
      {
        id: "sesion-1",
        materia_id: "materia-1",
        modo: "NORMAL",
        iniciada_en: "2026-11-15T10:00:00.000Z",
        cerrada_en: null,
        mensajes: 2,
      },
    ]);
    vi.mocked(getTutorMessages).mockResolvedValueOnce([
      { id: "m1", rol: "USER", contenido: "Hola", creado_en: "2026-11-15T10:00:00.000Z" },
      { id: "m2", rol: "ASSISTANT", contenido: "¿En qué te ayudo?", creado_en: "2026-11-15T10:00:01.000Z" },
    ]);

    const { result } = renderHook(() => useTutorChat(course));

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.sesiones).toHaveLength(1);
    expect(result.current.sesionActivaId).toBe("sesion-1");
  });

  it("nueva conversación conserva las conversaciones anteriores", async () => {
    vi.mocked(listTutorSessions).mockResolvedValueOnce([
      {
        id: "sesion-1",
        materia_id: "materia-1",
        modo: "NORMAL",
        iniciada_en: "2026-11-15T10:00:00.000Z",
        cerrada_en: null,
        mensajes: 1,
      },
    ]);
    vi.mocked(getTutorMessages).mockResolvedValueOnce([
      { id: "m1", rol: "USER", contenido: "Hola", creado_en: "2026-11-15T10:00:00.000Z" },
    ]);

    const { result } = renderHook(() => useTutorChat(course));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));

    act(() => result.current.nuevaConversacion());

    expect(result.current.messages).toEqual([]);
    expect(result.current.sesiones).toHaveLength(1);
  });
});

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
