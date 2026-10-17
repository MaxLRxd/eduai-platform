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
    mockApi.mockResolvedValue([]);

    await getNotificaciones();

    expect(mockApi).toHaveBeenCalledWith("/api/notificaciones");
  });

  it("agrega el query param cuando se piden solo las no leídas", async () => {
    mockApi.mockResolvedValue([]);

    await getNotificaciones(true);

    expect(mockApi).toHaveBeenCalledWith("/api/notificaciones?noLeidas=true");
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
