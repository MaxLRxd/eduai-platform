import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/api", () => ({ api: vi.fn() }));

import { api } from "../services/api";
import {
  getNoLeidasCount,
  getNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from "../services/notificaciones.service";

const mockApi = vi.mocked(api);

describe("notificaciones.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pide todas las notificaciones sin filtro", async () => {
    mockApi.mockResolvedValue({ notificaciones: [] });

    await getNotificaciones();

    expect(mockApi).toHaveBeenCalledWith("/api/notificaciones");
  });

  it("agrega el query param cuando se piden solo las no leídas", async () => {
    mockApi.mockResolvedValue({ notificaciones: [] });

    await getNotificaciones(true);

    expect(mockApi).toHaveBeenCalledWith("/api/notificaciones?noLeidas=true");
  });

  it("desenvuelve el envelope y mapea los campos del backend", async () => {
    mockApi.mockResolvedValue({
      notificaciones: [
        {
          id: "n1",
          titulo: "Nueva entrega",
          mensaje: "El alumno subió el TP",
          leida: false,
          tipo: "ENTREGA",
          creada_en: "2026-10-17T12:00:00.000Z",
          referencia_tipo: "entrega",
          referencia_id: "e1",
        },
      ],
    });

    const [n] = await getNotificaciones();

    expect(n).toEqual({
      id: "n1",
      titulo: "Nueva entrega",
      mensaje: "El alumno subió el TP",
      leida: false,
      tipo: "ENTREGA",
      createdAt: "2026-10-17T12:00:00.000Z",
      referenciaTipo: "entrega",
      referenciaId: "e1",
    });
  });

  it("devuelve el contador de no leídas", async () => {
    mockApi.mockResolvedValue({ count: 4 });

    await expect(getNoLeidasCount()).resolves.toBe(4);
    expect(mockApi).toHaveBeenCalledWith("/api/notificaciones/no-leidas");
  });

  it("marca una notificación como leída con PATCH", async () => {
    mockApi.mockResolvedValue(undefined);

    await marcarLeida("notif-1");

    expect(mockApi).toHaveBeenCalledWith("/api/notificaciones/notif-1/leida", { method: "PATCH" });
  });

  it("marca todas como leídas con PATCH", async () => {
    mockApi.mockResolvedValue(undefined);

    await marcarTodasLeidas();

    expect(mockApi).toHaveBeenCalledWith("/api/notificaciones/leer-todas", { method: "PATCH" });
  });
});
