import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ask: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../hooks/useTeacherCourses", () => ({
  useTeacherCourses: () => ({ data: [{ id: "m1", label: "Redes", curso: "2º" }] }),
}));

vi.mock("../hooks/usePlanning", () => ({
  usePlanning: () => ({ data: [{ date: "2026-11-22", title: "Clase 1" }] }),
}));

vi.mock("../hooks/useTeacherAssistant", () => ({
  useTeacherAssistant: () => ({
    output: null,
    setOutput: vi.fn(),
    pending: false,
    pdfPending: false,
    messages: [
      {
        id: "msg-1",
        role: "assistant",
        content: "Material generado",
        sources: [{ material_id: "mat-1", titulo: "Apunte de redes", chunk_index: 0, content: "x", score: 0.9 }],
      },
    ],
    sesiones: [],
    sesionActivaId: null,
    cargandoHistorial: false,
    ask: mocks.ask,
    seleccionarConversacion: vi.fn(),
    nuevaConversacion: vi.fn(),
    downloadPdf: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("../hooks/useContent", () => ({
  useCourseSections: () => ({ data: [{ id: "s1", nombre: "Unidad 1" }] }),
  useCourseContentTree: () => ({
    data: [
      {
        id: "s1",
        nombre: "Unidad 1",
        tipo: "TEORIA",
        materials: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            name: "Apunte de redes",
            fileType: "pdf",
            sizeLabel: "10 KB",
            ragStatus: "Indexado",
            date: "22/11",
          },
          {
            id: "22222222-2222-4222-8222-222222222222",
            name: "Guía en indexación",
            fileType: "pdf",
            sizeLabel: "12 KB",
            ragStatus: "Indexando…",
            date: "22/11",
          },
        ],
        classes: [
          {
            id: "clase-1",
            sectionId: "s1",
            title: "Clase 1",
            date: "2026-11-22",
            content: "",
            studentVisible: false,
            materials: [
              {
                id: "33333333-3333-4333-8333-333333333333",
                name: "Material de la clase",
                fileType: "pdf",
                sizeLabel: "8 KB",
                ragStatus: "Indexado",
                date: "22/11",
              },
            ],
          },
        ],
      },
    ],
  }),
  useUploadMaterial: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../components/teacher/TutorLatencyCard", () => ({
  TutorLatencyCard: () => <div>Latencia</div>,
}));

import { TeacherAIPage } from "../pages/teacher/TeacherAIPage";

describe("selector de materiales del tutor docente", () => {
  beforeEach(() => {
    mocks.ask.mockClear();
  });

  it("muestra materiales de secciones y de clases con su estado RAG", () => {
    render(<TeacherAIPage />);

    expect(screen.getByText("Unidad 1 · Apunte de redes")).toBeTruthy();
    expect(screen.getByText("Unidad 1 · Clase 1 · Material de la clase")).toBeTruthy();
    expect(screen.getAllByText("Indexado").length).toBeGreaterThanOrEqual(2);
  });

  it("envía los materiales seleccionados y avisa si todavía no están indexados", () => {
    render(<TeacherAIPage />);

    fireEvent.click(screen.getByLabelText("Unidad 1 · Clase 1 · Material de la clase"));
    fireEvent.click(screen.getByLabelText("Unidad 1 · Guía en indexación"));
    fireEvent.change(screen.getByLabelText("Pedido para la IA"), { target: { value: "Generá actividades" } });
    fireEvent.click(screen.getByRole("button", { name: "Generar respuesta" }));

    expect(mocks.ask).toHaveBeenCalledWith(
      "Generá actividades",
      "m1",
      "2026-11-22",
      ["33333333-3333-4333-8333-333333333333", "22222222-2222-4222-8222-222222222222"]
    );
    expect(screen.getByText(/no están indexados/)).toBeTruthy();
  });

  it("muestra las fuentes usadas en la respuesta", () => {
    render(<TeacherAIPage />);

    expect(screen.getByText(/Fuentes:/)).toBeTruthy();
    expect(screen.getByText("Apunte de redes")).toBeTruthy();
  });
});
