import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/teacherAI.service", () => ({
  listarSesionesDocente: vi.fn(async () => []),
  crearSesionDocente: vi.fn(async () => ({
    id: "sesion-1",
    materia_id: "materia-1",
    titulo: null,
    iniciada_en: "2026-11-22T10:00:00.000Z",
    cerrada_en: null,
    mensajes: 0,
  })),
  listarMensajesDocente: vi.fn(async () => []),
  enviarMensajeDocente: vi.fn(async () => ({
    id: "mensaje-2",
    rol: "ASSISTANT",
    contenido: "Material generado por el asistente.",
    sources: [{ material_id: "contenido-1", content: "Fragmento", score: 0.9 }],
    creado_en: "2026-11-22T10:00:01.000Z",
  })),
  downloadMaterialPdf: vi.fn(),
  exportMaterialPdf: vi.fn(async () => ({ filename: "material.pdf", pdf: "" })),
}));

import { useTeacherAssistant } from "../hooks/useTeacherAssistant";
import {
  crearSesionDocente,
  enviarMensajeDocente,
  listarMensajesDocente,
  listarSesionesDocente,
} from "../services/teacherAI.service";

describe("useTeacherAssistant: conversación persistente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listarSesionesDocente).mockResolvedValue([]);
    vi.mocked(listarMensajesDocente).mockResolvedValue([]);
  });

  it("retoma la última conversación y carga su historial", async () => {
    vi.mocked(listarSesionesDocente).mockResolvedValueOnce([
      {
        id: "sesion-1",
        materia_id: "materia-1",
        titulo: "Actividades de redes",
        iniciada_en: "2026-11-22T10:00:00.000Z",
        cerrada_en: null,
        mensajes: 2,
      },
    ]);
    vi.mocked(listarMensajesDocente).mockResolvedValueOnce([
      { id: "m1", rol: "USER", contenido: "Hola", sources: [], creado_en: "2026-11-22T10:00:00.000Z" },
      { id: "m2", rol: "ASSISTANT", contenido: "¿Qué necesitás?", sources: [], creado_en: "2026-11-22T10:00:01.000Z" },
    ]);

    const { result } = renderHook(() => useTeacherAssistant("materia-1"));

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.sesionActivaId).toBe("sesion-1");
    expect(result.current.output).toBe("¿Qué necesitás?");
  });

  it("crea una sesión y envía los materiales seleccionados", async () => {
    const { result } = renderHook(() => useTeacherAssistant("materia-1"));

    await act(async () => {
      await result.current.ask("Generá actividades", "materia-1", "2026-11-22", ["contenido-1"]);
    });

    expect(crearSesionDocente).toHaveBeenCalledWith("materia-1");
    expect(enviarMensajeDocente).toHaveBeenCalledWith("sesion-1", {
      prompt: "Generá actividades",
      class_date: "2026-11-22",
      content_ids: ["contenido-1"],
    });
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.output).toBe("Material generado por el asistente.");
  });

  it("permite empezar una conversación nueva sin borrar el historial", async () => {
    vi.mocked(listarSesionesDocente).mockResolvedValueOnce([
      {
        id: "sesion-1",
        materia_id: "materia-1",
        titulo: "Anterior",
        iniciada_en: "2026-11-22T10:00:00.000Z",
        cerrada_en: null,
        mensajes: 1,
      },
    ]);
    vi.mocked(listarMensajesDocente).mockResolvedValueOnce([
      { id: "m1", rol: "USER", contenido: "Hola", sources: [], creado_en: "2026-11-22T10:00:00.000Z" },
    ]);
    const { result } = renderHook(() => useTeacherAssistant("materia-1"));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));

    act(() => result.current.nuevaConversacion());

    expect(result.current.messages).toEqual([]);
    expect(result.current.sesiones).toHaveLength(1);
    expect(result.current.sesionActivaId).toBeNull();
  });
});
