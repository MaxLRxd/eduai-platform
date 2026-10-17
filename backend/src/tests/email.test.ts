jest.mock("../config/env", () => ({
  env: {
    EMAIL_PROVIDER: "none",
    EMAIL_FROM: undefined,
    EMAIL_API_KEY: undefined,
    EMAIL_SMTP_HOST: undefined,
    EMAIL_SMTP_PORT: undefined,
    EMAIL_SMTP_USER: undefined,
    EMAIL_SMTP_PASS: undefined,
  },
}));

jest.mock("../config/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: jest.fn(() => ({ sendMail: jest.fn() })) },
}));

import nodemailer from "nodemailer";
import { env } from "../config/env";
import { getEmailProvider, isEmailEnabled, sendEmail, sendEmailSeguro } from "../services/email.service";

const mensaje = { to: "alumno@edu.ai", subject: "Nueva actividad", text: "Tenes una novedad" };

describe("email.service", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    env.EMAIL_PROVIDER = "none";
    env.EMAIL_FROM = undefined;
    env.EMAIL_API_KEY = undefined;
    env.EMAIL_SMTP_HOST = undefined;
    env.EMAIL_SMTP_PORT = undefined;
  });

  describe("isEmailEnabled", () => {
    it("esta deshabilitado con provider none", () => {
      env.EMAIL_PROVIDER = "none";
      expect(getEmailProvider()).toBe("none");
      expect(isEmailEnabled()).toBe(false);
    });

    it("resend necesita EMAIL_FROM y EMAIL_API_KEY", () => {
      env.EMAIL_PROVIDER = "resend";
      env.EMAIL_FROM = "noreply@edu.ai";
      expect(isEmailEnabled()).toBe(false);

      env.EMAIL_API_KEY = "clave";
      expect(isEmailEnabled()).toBe(true);
    });

    it("brevo necesita EMAIL_FROM y EMAIL_API_KEY", () => {
      env.EMAIL_PROVIDER = "brevo";
      env.EMAIL_API_KEY = "clave";
      expect(isEmailEnabled()).toBe(false);

      env.EMAIL_FROM = "noreply@edu.ai";
      expect(isEmailEnabled()).toBe(true);
    });

    it("smtp necesita EMAIL_FROM y EMAIL_SMTP_HOST", () => {
      env.EMAIL_PROVIDER = "smtp";
      env.EMAIL_FROM = "noreply@edu.ai";
      expect(isEmailEnabled()).toBe(false);

      env.EMAIL_SMTP_HOST = "smtp.edu.ai";
      expect(isEmailEnabled()).toBe(true);
    });
  });

  describe("sendEmail", () => {
    it("con provider none no hace llamada de red", async () => {
      const fetchSpy = jest.spyOn(globalThis, "fetch");
      env.EMAIL_PROVIDER = "none";

      await sendEmail(mensaje);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("resend hace POST a la API con remitente, destinatario y html", async () => {
      const fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({ ok: true } as Response);
      env.EMAIL_PROVIDER = "resend";
      env.EMAIL_FROM = "noreply@edu.ai";
      env.EMAIL_API_KEY = "clave-resend";

      await sendEmail(mensaje);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe("https://api.resend.com/emails");
      expect(init?.method).toBe("POST");
      expect(init?.headers).toMatchObject({ Authorization: "Bearer clave-resend" });

      const body = JSON.parse(String(init?.body));
      expect(body).toMatchObject({
        from: "noreply@edu.ai",
        to: ["alumno@edu.ai"],
        subject: "Nueva actividad",
      });
      expect(body.html).toContain("Tenes una novedad");
    });

    it("resend lanza si el proveedor responde con error", async () => {
      jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 422,
        text: () => Promise.resolve("invalid"),
      } as Response);
      env.EMAIL_PROVIDER = "resend";
      env.EMAIL_FROM = "noreply@edu.ai";
      env.EMAIL_API_KEY = "clave-resend";

      await expect(sendEmail(mensaje)).rejects.toThrow(/resend respondio 422/);
    });

    it("brevo usa el header api-key", async () => {
      const fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({ ok: true } as Response);
      env.EMAIL_PROVIDER = "brevo";
      env.EMAIL_FROM = "noreply@edu.ai";
      env.EMAIL_API_KEY = "clave-brevo";

      await sendEmail(mensaje);

      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe("https://api.brevo.com/v3/smtp/email");
      expect(init?.headers).toMatchObject({ "api-key": "clave-brevo" });

      const body = JSON.parse(String(init?.body));
      expect(body).toMatchObject({
        sender: { email: "noreply@edu.ai" },
        to: [{ email: "alumno@edu.ai" }],
        subject: "Nueva actividad",
      });
    });

    it("smtp envia via nodemailer", async () => {
      const fetchSpy = jest.spyOn(globalThis, "fetch");
      env.EMAIL_PROVIDER = "smtp";
      env.EMAIL_FROM = "noreply@edu.ai";
      env.EMAIL_SMTP_HOST = "smtp.edu.ai";
      env.EMAIL_SMTP_PORT = 587;

      await sendEmail(mensaje);

      const createTransport = nodemailer.createTransport as unknown as jest.Mock;
      expect(createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ host: "smtp.edu.ai", port: 587, secure: false })
      );

      const transporter = createTransport.mock.results[0].value as { sendMail: jest.Mock };
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ from: "noreply@edu.ai", to: "alumno@edu.ai", subject: "Nueva actividad" })
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("sendEmailSeguro", () => {
    it("devuelve false sin lanzar si el email esta deshabilitado", async () => {
      env.EMAIL_PROVIDER = "none";
      await expect(sendEmailSeguro(mensaje)).resolves.toBe(false);
    });

    it("devuelve false sin lanzar si el proveedor falla", async () => {
      jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("red caida"));
      env.EMAIL_PROVIDER = "resend";
      env.EMAIL_FROM = "noreply@edu.ai";
      env.EMAIL_API_KEY = "clave-resend";

      await expect(sendEmailSeguro(mensaje)).resolves.toBe(false);
    });
  });
});
