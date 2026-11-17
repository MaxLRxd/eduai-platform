import type React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const planningMocks = vi.hoisted(() => ({
  save: vi.fn(),
  assign: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("../hooks/usePlanning", () => ({
  useSavePlanning: () => ({ mutateAsync: planningMocks.save, isPending: false }),
  useAssignPlanningMaterial: () => ({ mutateAsync: planningMocks.assign, isPending: false }),
  useUploadPlanningMaterial: () => ({ mutateAsync: planningMocks.upload, isPending: false }),
}));

import { ClassFormModal } from "../components/teacher/ClassFormModal";
import { ClassMaterialModal } from "../components/teacher/ClassMaterialModal";
import { toDateOnly } from "../utils/format";
import type { ContentClass } from "../services/content.service";

const sections = [{ id: "s1", nombre: "Unidad 1", tipo: "TEORIA" }];

function existingClass(date: string): ContentClass {
  return {
    id: "cl1",
    sectionId: "s1",
    title: "Clase 1",
    date,
    content: "",
    studentVisible: false,
    materials: [],
  };
}

function renderForm(props: Partial<React.ComponentProps<typeof ClassFormModal>> = {}) {
  return render(
    <ClassFormModal
      open
      onClose={vi.fn()}
      courseId="m1"
      sections={sections}
      initialSectionId="s1"
      existingClasses={[]}
      contentOptions={[]}
      {...props}
    />
  );
}

beforeEach(() => {
  planningMocks.save.mockReset().mockResolvedValue({ success: true });
  planningMocks.assign.mockReset().mockResolvedValue(undefined);
  planningMocks.upload.mockReset().mockResolvedValue(undefined);
});

describe("fechas de clase", () => {
  it("normaliza fechas ISO y descarta valores inválidos", () => {
    expect(toDateOnly("2026-03-10T00:00:00.000Z")).toBe("2026-03-10");
    expect(toDateOnly("2026-03-10")).toBe("2026-03-10");
    expect(toDateOnly("")).toBe("");
    expect(toDateOnly("no-es-fecha")).toBe("");
  });
});

describe("crear clase desde Contenidos", () => {
  it("no crea la clase sin fecha", async () => {
    renderForm();

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Clase 1" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear clase" }));

    expect(await screen.findByText(/la fecha de la clase/)).toBeInTheDocument();
    expect(planningMocks.save).not.toHaveBeenCalled();
  });

  it("no permite repetir una fecha ya usada por otra clase", async () => {
    renderForm({ existingClasses: [existingClass("2026-03-10T00:00:00.000Z")] });

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Clase 2" } });
    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-03-10" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear clase" }));

    expect(await screen.findByText(/Ya hay una clase en esa fecha/)).toBeInTheDocument();
    expect(planningMocks.save).not.toHaveBeenCalled();
  });

  it("crea la clase y copia el material elegido de Contenidos", async () => {
    const onClose = vi.fn();
    renderForm({
      onClose,
      contentOptions: [{ id: "c1", label: "Apunte · Unidad 1" }],
    });

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Clase 2" } });
    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-04-01" } });
    fireEvent.click(screen.getByLabelText("De Contenidos"));
    fireEvent.change(screen.getByLabelText("Material existente"), { target: { value: "c1" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear clase" }));

    await waitFor(() =>
      expect(planningMocks.save).toHaveBeenCalledWith({
        courseId: "m1",
        date: "2026-04-01",
        title: "Clase 2",
        material: "",
        studentVisible: false,
        sectionId: "s1",
      })
    );
    await waitFor(() =>
      expect(planningMocks.assign).toHaveBeenCalledWith({
        courseId: "m1",
        date: "2026-04-01",
        contentId: "c1",
      })
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("elegir de Contenidos para una clase existente", () => {
  it("asigna el material usando la fecha de la clase en formato día", async () => {
    const onClose = vi.fn();
    const onAssigned = vi.fn();
    render(
      <ClassMaterialModal
        open
        onClose={onClose}
        courseId="m1"
        classDate="2026-03-10T00:00:00.000Z"
        className="Clase 1"
        contentOptions={[{ id: "c1", label: "Apunte · Unidad 1" }]}
        onAssigned={onAssigned}
      />
    );

    fireEvent.change(screen.getByLabelText("Material"), { target: { value: "c1" } });
    fireEvent.click(screen.getByRole("button", { name: "Asignar a la clase" }));

    await waitFor(() =>
      expect(planningMocks.assign).toHaveBeenCalledWith({
        courseId: "m1",
        date: "2026-03-10",
        contentId: "c1",
      })
    );
    expect(onAssigned).toHaveBeenCalledWith("Apunte · Unidad 1");
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
