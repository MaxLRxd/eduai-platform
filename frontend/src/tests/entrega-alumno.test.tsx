import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  submit: vi.fn(),
  upload: vi.fn(),
  markFeedbackSeen: vi.fn(),
  onClose: vi.fn(),
}));

vi.mock("../hooks/useAssignments", () => ({
  useSubmitAssignment: () => ({ mutateAsync: mocks.submit, isPending: false }),
  useUploadAssignmentFile: () => ({ mutateAsync: mocks.upload, isPending: false }),
}));

vi.mock("../services/assignments.service", () => ({
  markFeedbackSeen: mocks.markFeedbackSeen,
}));

const assignment = {
  id: "a1",
  title: "Trabajo práctico 1",
  course: "Redes",
  consigna: "Explicá el modelo OSI.",
  tipo: "DESARROLLO" as const,
  opciones: [],
  formatosPermitidos: [],
  dueDate: "1/1/2030",
  dueDateIso: "2030-01-01T00:00:00.000Z",
  status: "Pendiente" as const,
  submitted: null,
};

import { AssignmentSubmitModal } from "../components/student/AssignmentSubmitModal";

describe("entrega del alumno (CU-A03)", () => {
  beforeEach(() => {
    mocks.submit.mockReset().mockResolvedValue(undefined);
    mocks.upload.mockReset();
    mocks.markFeedbackSeen.mockReset().mockResolvedValue(undefined);
    mocks.onClose.mockReset();
  });

  it("envía el desarrollo escrito recortado y cierra el modal", async () => {
    render(<AssignmentSubmitModal assignment={assignment} onClose={mocks.onClose} />);

    const enviar = screen.getByRole("button", { name: "Enviar entrega" });
    expect(enviar).toHaveProperty("disabled", true);

    fireEvent.change(screen.getByPlaceholderText("Escribí tu resolución. Podés usar notación matemática o texto plano."), {
      target: { value: "  Capas del modelo OSI  " },
    });
    fireEvent.click(enviar);

    await waitFor(() =>
      expect(mocks.submit).toHaveBeenCalledWith({
        actividadId: "a1",
        payload: { respuesta_texto: "Capas del modelo OSI" },
      })
    );
    expect(mocks.onClose).toHaveBeenCalled();
  });

  it("bloquea la entrega vencida", () => {
    render(
      <AssignmentSubmitModal
        assignment={{ ...assignment, dueDate: "1/1/2020", dueDateIso: "2020-01-01T00:00:00.000Z" }}
        onClose={mocks.onClose}
      />
    );

    expect(screen.getByText(/El plazo de entrega venció/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /entrega/ })).toBeNull();
    expect(screen.getByPlaceholderText("Escribí tu resolución. Podés usar notación matemática o texto plano.")).toHaveProperty(
      "disabled",
      true
    );
  });

  it("muestra el feedback publicado y lo marca como visto", async () => {
    render(
      <AssignmentSubmitModal
        assignment={{
          ...assignment,
          submitted: {
            id: "s1",
            respuesta_texto: "Mi respuesta",
            respuesta_codigo: null,
            archivo_url: null,
            archivo_nombre: null,
            entregado_en: "2026-11-20T10:00:00.000Z",
            calificacion_final: 9,
            feedback_final: "Muy buen análisis.",
            publicado: true,
          },
        }}
        onClose={mocks.onClose}
      />
    );

    expect(screen.getByText(/Docente:/)).toBeTruthy();
    expect(screen.getByText("Muy buen análisis.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /entrega/ })).toBeNull();
    await waitFor(() => expect(mocks.markFeedbackSeen).toHaveBeenCalledWith("s1"));
  });
});
