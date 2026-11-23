import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  mutate: vi.fn(),
  data: null as null | { success: boolean; message: string; materiaId?: string },
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("../hooks/useEnrollment", () => ({
  useEnrollment: () => ({ mutate: mocks.mutate, data: mocks.data, isPending: false }),
}));

import { StudentEnrollPage } from "../pages/student/StudentEnrollPage";

describe("inscripción por clave (CU-A01)", () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.mutate.mockReset();
    mocks.data = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("no consulta el servicio con una clave vacía", () => {
    render(<StudentEnrollPage />);

    fireEvent.click(screen.getByRole("button", { name: "Inscribirse" }));

    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it("muestra el error y no redirige cuando la clave es inválida", () => {
    vi.useFakeTimers();
    mocks.data = { success: false, message: "La clave no es válida, está vencida o alcanzó su límite de usos." };
    render(<StudentEnrollPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("La clave no es válida");
    act(() => vi.advanceTimersByTime(2000));
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("redirige al aula después de inscribirse", () => {
    vi.useFakeTimers();
    mocks.data = { success: true, message: "¡Listo! Te inscribiste correctamente a Redes.", materiaId: "m1" };
    render(<StudentEnrollPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Te inscribiste correctamente");
    act(() => vi.advanceTimersByTime(1800));
    expect(mocks.navigate).toHaveBeenCalledWith("/student/courses/m1");
  });
});
