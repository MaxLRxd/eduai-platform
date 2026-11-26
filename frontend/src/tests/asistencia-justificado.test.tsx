import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

const apiMock = vi.fn();
vi.mock("../services/api", async () => {
  const real = await vi.importActual<typeof import("../services/api")>("../services/api");
  return { ...real, api: (...a: unknown[]) => apiMock(...a) };
});

import { getAttendanceState, saveAttendance } from "../services/attendance.service";
import { tasaAsistencia } from "../utils/asistencia";
import { TeacherAttendancePage } from "../pages/teacher/TeacherAttendancePage";

const HOY = new Date().toISOString().slice(0, 10);

describe("asistencia: estado Justificado", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("se envía al backend como JUSTIFICADO", async () => {
    apiMock.mockResolvedValue({});

    await saveAttendance("m1", "2026-10-01", [{ alumno_id: "a1", estado: "justified" }]);

    const cuerpo = JSON.parse(apiMock.mock.calls[0][1].body);
    expect(cuerpo.registros).toEqual([{ alumno_id: "a1", estado: "JUSTIFICADO" }]);
  });

  it("un justificado ya guardado hoy se muestra como J (no se convierte en tardanza al volver a guardar)", async () => {
    apiMock.mockImplementation(async (ruta: string) => {
      if (ruta.endsWith("/inscriptos")) return { alumnos: [{ id: "a1", nombre: "Ana", email: "a@edu.ai" }] };
      return { asistencias: [{ id: "r1", alumno_id: "a1", materia_id: "m1", fecha_clase: HOY, estado: "JUSTIFICADO" }] };
    });

    const [ana] = await getAttendanceState("m1");

    expect(ana.status).toBe("justified");
  });

  it("una falta justificada no cuenta como inasistencia en el porcentaje", async () => {
    apiMock.mockImplementation(async (ruta: string) => {
      if (ruta.endsWith("/inscriptos")) return { alumnos: [{ id: "a1", nombre: "Ana", email: "a@edu.ai" }] };
      return {
        asistencias: [
          { id: "1", alumno_id: "a1", materia_id: "m1", fecha_clase: "2026-10-01", estado: "PRESENTE" },
          { id: "2", alumno_id: "a1", materia_id: "m1", fecha_clase: "2026-10-08", estado: "JUSTIFICADO" },
          { id: "3", alumno_id: "a1", materia_id: "m1", fecha_clase: "2026-10-15", estado: "AUSENTE" },
          { id: "4", alumno_id: "a1", materia_id: "m1", fecha_clase: "2026-10-22", estado: "AUSENTE" },
        ],
      };
    });

    const [ana] = await getAttendanceState("m1");

    expect(ana.total).toBe(4);
    expect(ana.absent).toBe(2); // solo las dos ausencias; la justificada no cuenta
  });

  it("el panel del alumno cuenta lo justificado como asistencia", () => {
    expect(
      tasaAsistencia([
        { estado: "PRESENTE", count: 6 },
        { estado: "JUSTIFICADO", count: 2 },
        { estado: "AUSENTE", count: 2 },
      ])
    ).toBe(80);
  });
});

vi.mock("../hooks/useTeacherCourses", () => ({
  useTeacherCourses: () => ({ data: [{ id: "m1", label: "Redes", curso: "2A" }] }),
}));

describe("pantalla de asistencia: botón J", () => {
  const montar = () => {
    apiMock.mockReset();
    apiMock.mockImplementation(async (ruta: string, init?: { method?: string }) => {
      if (ruta.endsWith("/inscriptos")) return { alumnos: [{ id: "a1", nombre: "Ana", email: "a@edu.ai" }] };
      if (init?.method === "POST") return {};
      return { asistencias: [] };
    });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <TeacherAttendancePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it("permite marcar Justificado, lo cuenta en el resumen y lo guarda", async () => {
    montar();

    const justificado = await screen.findByRole("radio", { name: "Justificado" });
    fireEvent.click(justificado);

    expect(screen.getByText("● 1 justificados")).toBeInTheDocument();
    expect(screen.getByText(/Presente · Ausente · Tardanza · Justificado/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "✅ Confirmar asistencia del día" }));

    await waitFor(() => {
      const envio = apiMock.mock.calls.find(([, init]) => init?.method === "POST");
      expect(JSON.parse(envio![1].body).registros).toEqual([{ alumno_id: "a1", estado: "JUSTIFICADO" }]);
    });
  });
});
