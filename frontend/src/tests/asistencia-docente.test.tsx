import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("../hooks/useTeacherCourses", () => ({
  useTeacherCourses: () => ({ data: [{ id: "m1", label: "Redes", curso: "2A" }] }),
}));

vi.mock("../hooks/useAttendance", () => ({
  useAttendanceState: () => ({
    data: [
      { id: "a1", name: "Ana", status: "present", history: [true, true, true, false], total: 4, absent: 1 },
      { id: "a2", name: "Bruno", status: "absent", history: [true, false, false], total: 3, absent: 2 },
    ],
    isLoading: false,
    refetch: mocks.refetch,
  }),
  useSaveAttendance: () => ({ mutateAsync: mocks.save, isPending: false }),
}));

vi.mock("../components/teacher/TeacherAreaTabs", () => ({
  TeacherAreaTabs: () => null,
  STUDENTS_AREA_TABS: [],
  EVALUATIONS_AREA_TABS: [],
}));

import { TeacherAttendancePage } from "../pages/teacher/TeacherAttendancePage";

describe("registro de asistencia", () => {
  beforeEach(() => {
    mocks.save.mockReset().mockResolvedValue(undefined);
    mocks.refetch.mockReset();
  });

  it("guarda la asistencia de todos los alumnos con el estado elegido", async () => {
    const hoy = new Date().toISOString().split("T")[0];
    render(<TeacherAttendancePage />);

    fireEvent.click(screen.getByRole("button", { name: "✗ Todos ausentes" }));
    expect(screen.getByText("● 2 ausentes")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "✅ Confirmar asistencia del día" }));

    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith({
        courseId: "m1",
        fechaClase: hoy,
        registros: [
          { alumno_id: "a1", estado: "absent" },
          { alumno_id: "a2", estado: "absent" },
        ],
      })
    );
    expect(screen.getByText("✅ Asistencia guardada correctamente")).toBeTruthy();
    expect(mocks.refetch).toHaveBeenCalled();
  });

  it("destaca a los alumnos en riesgo", () => {
    render(<TeacherAttendancePage />);

    expect(screen.getByText("⚠ En riesgo")).toBeTruthy();
  });
});
