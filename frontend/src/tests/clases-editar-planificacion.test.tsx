import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  setSearchParams: vi.fn(),
}));

const mutationMocks = vi.hoisted(() => ({
  deleteMaterial: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => routerMocks.navigate,
  useSearchParams: () => [new URLSearchParams("course=m1"), routerMocks.setSearchParams],
}));

vi.mock("../hooks/useTeacherCourses", () => ({
  useTeacherCourses: () => ({ data: [{ id: "m1", label: "Matemática", curso: "3A" }] }),
}));

vi.mock("../hooks/useContent", () => {
  const mutation = { mutate: vi.fn(), isPending: false };
  return {
    useCourseSections: () => ({ data: [{ id: "s1", nombre: "Unidad 1", tipo: "TEORIA" }] }),
    useCourseContentTree: () => ({
      data: [
        {
          id: "s1",
          nombre: "Unidad 1",
          tipo: "TEORIA",
          materials: [
            {
              id: "c1",
              name: "Apunte.pdf",
              fileType: "pdf",
              sizeLabel: "120 KB",
              ragStatus: "Indexado",
              date: "01/11",
            },
          ],
          classes: [
            {
              id: "cl1",
              sectionId: "s1",
              title: "Clase 1",
              date: "2026-03-10T00:00:00.000Z",
              content: "",
              studentVisible: false,
              materials: [],
            },
          ],
        },
      ],
      isLoading: false,
    }),
    useCreateSection: () => mutation,
    useDeleteSection: () => mutation,
    useDeleteMaterial: () => ({ mutate: mutationMocks.deleteMaterial, isPending: false }),
    useReorderSections: () => mutation,
    useUpdateSection: () => mutation,
    useUploadMaterialFile: () => mutation,
  };
});

vi.mock("../hooks/useActivities", () => ({
  useTeacherActivities: () => ({ data: [] }),
}));

vi.mock("../hooks/useCorrections", () => ({
  useRubrics: () => ({ data: [] }),
}));

vi.mock("../components/teacher/ContentAccessCard", () => ({ ContentAccessCard: () => null }));
vi.mock("../components/teacher/ReportesMaterialCard", () => ({ ReportesMaterialCard: () => null }));
vi.mock("../components/teacher/ActivityFormModal", () => ({ ActivityFormModal: () => null }));
vi.mock("../components/teacher/ClassFormModal", () => ({ ClassFormModal: () => null }));
vi.mock("../components/teacher/ClassMaterialModal", () => ({ ClassMaterialModal: () => null }));
vi.mock("../components/teacher/SeccionEditForm", () => ({ SeccionEditForm: () => null }));

import { TeacherContentPage } from "../pages/teacher/TeacherContentPage";

describe("Editar una clase desde Contenidos", () => {
  beforeEach(() => {
    routerMocks.navigate.mockReset();
    routerMocks.setSearchParams.mockReset();
    mutationMocks.deleteMaterial.mockReset();
  });

  it("redirige a Planificación con la materia activa", () => {
    render(<TeacherContentPage />);

    fireEvent.click(screen.getByRole("button", { name: "Editar la clase Clase 1" }));

    expect(routerMocks.navigate).toHaveBeenCalledWith("/teacher/planning?course=m1");
  });

  it("conserva el acceso general a Planificación", () => {
    render(<TeacherContentPage />);

    fireEvent.click(screen.getByRole("button", { name: "Ir a Planificación" }));

    expect(routerMocks.navigate).toHaveBeenCalledWith("/teacher/planning?course=m1");
  });

  it("elimina el material desde la fila de Contenidos", () => {
    render(<TeacherContentPage />);

    fireEvent.click(screen.getAllByRole("button", { name: "Eliminar Apunte.pdf" })[0]);

    expect(mutationMocks.deleteMaterial).toHaveBeenCalledWith("c1", expect.any(Object));
  });
});
