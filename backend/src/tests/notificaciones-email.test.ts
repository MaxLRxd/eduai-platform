jest.mock("../config/prisma", () => ({
  prisma: {
    notificacion: { create: jest.fn() },
    usuario: { findUnique: jest.fn() },
  },
}));

jest.mock("../services/email.service", () => ({
  isEmailEnabled: jest.fn(),
  sendEmailSeguro: jest.fn(),
}));

import { prisma } from "../config/prisma";
import { isEmailEnabled, sendEmailSeguro } from "../services/email.service";
import { crearNoLeidas } from "../modules/notificaciones/notificaciones.service";

const USUARIO_ID = "44444444-4444-4444-8444-444444444444";

const prismaMock = prisma as unknown as {
  notificacion: { create: jest.Mock };
  usuario: { findUnique: jest.Mock };
};
const isEmailEnabledMock = isEmailEnabled as unknown as jest.Mock;
const sendEmailSeguroMock = sendEmailSeguro as unknown as jest.Mock;

const fila = () => ({
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  usuario_id: USUARIO_ID,
  tipo: "ENTREGA",
  titulo: "Nueva entrega",
  mensaje: "Corregi el TP1",
  referencia_tipo: null,
  referencia_id: null,
  leida: false,
  creada_en: new Date(),
  leida_en: null,
});

const input = {
  usuario_id: USUARIO_ID,
  tipo: "ENTREGA" as const,
  titulo: "Nueva entrega",
  mensaje: "Corregi el TP1",
};

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("notificaciones: envio de email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.notificacion.create.mockResolvedValue(fila());
  });

  it("no consulta el email del usuario si el envio esta deshabilitado", async () => {
    isEmailEnabledMock.mockReturnValue(false);

    await crearNoLeidas(input);
    await flush();

    expect(prismaMock.usuario.findUnique).not.toHaveBeenCalled();
    expect(sendEmailSeguroMock).not.toHaveBeenCalled();
  });

  it("envia el email al destinatario cuando esta habilitado", async () => {
    isEmailEnabledMock.mockReturnValue(true);
    prismaMock.usuario.findUnique.mockResolvedValue({ email: "alumno@edu.ai" });
    sendEmailSeguroMock.mockResolvedValue(true);

    await crearNoLeidas(input);
    await flush();

    expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith({
      where: { id: USUARIO_ID },
      select: { email: true },
    });
    expect(sendEmailSeguroMock).toHaveBeenCalledWith({
      to: "alumno@edu.ai",
      subject: "Nueva entrega",
      text: "Corregi el TP1",
    });
  });

  it("no envia si el usuario no tiene email", async () => {
    isEmailEnabledMock.mockReturnValue(true);
    prismaMock.usuario.findUnique.mockResolvedValue({ email: null });

    await crearNoLeidas(input);
    await flush();

    expect(sendEmailSeguroMock).not.toHaveBeenCalled();
  });
});
