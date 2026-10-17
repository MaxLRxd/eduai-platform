import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "../config/logger";

export type EmailProvider = "none" | "resend" | "brevo" | "smtp";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export function getEmailProvider(): EmailProvider {
  return env.EMAIL_PROVIDER;
}

// Solo se envia si el proveedor esta configurado con sus credenciales minimas.
// Con `none` (default) la funcion devuelve false: ningun evento de notificacion
// dispara una consulta ni una llamada de red.
export function isEmailEnabled(): boolean {
  switch (env.EMAIL_PROVIDER) {
    case "none":
      return false;
    case "resend":
    case "brevo":
      return Boolean(env.EMAIL_FROM && env.EMAIL_API_KEY);
    case "smtp":
      return Boolean(env.EMAIL_FROM && env.EMAIL_SMTP_HOST);
  }
}

function htmlDe(msg: EmailMessage): string {
  if (msg.html) return msg.html;
  const escapado = msg.text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${escapado.replace(/\n/g, "<br>")}</p>`;
}

async function enviarResend(msg: EmailMessage): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.EMAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [msg.to],
      subject: msg.subject,
      html: htmlDe(msg),
    }),
  });

  if (!res.ok) {
    throw new Error(`resend respondio ${res.status}: ${await res.text()}`);
  }
}

async function enviarBrevo(msg: EmailMessage): Promise<void> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.EMAIL_API_KEY as string,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: env.EMAIL_FROM },
      to: [{ email: msg.to }],
      subject: msg.subject,
      htmlContent: htmlDe(msg),
    }),
  });

  if (!res.ok) {
    throw new Error(`brevo respondio ${res.status}: ${await res.text()}`);
  }
}

let transporter: Transporter | null = null;

function obtenerTransporter(): Transporter {
  if (!transporter) {
    const port = env.EMAIL_SMTP_PORT ?? 587;
    transporter = nodemailer.createTransport({
      host: env.EMAIL_SMTP_HOST,
      port,
      secure: port === 465,
      auth: env.EMAIL_SMTP_USER
        ? { user: env.EMAIL_SMTP_USER, pass: env.EMAIL_SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

async function enviarSmtp(msg: EmailMessage): Promise<void> {
  await obtenerTransporter().sendMail({
    from: env.EMAIL_FROM,
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    html: htmlDe(msg),
  });
}

// Envia un email con el proveedor configurado. Lanza si el proveedor falla.
export async function sendEmail(msg: EmailMessage): Promise<void> {
  switch (env.EMAIL_PROVIDER) {
    case "none":
      logger.debug({ to: msg.to }, "email omitido (provider none)");
      return;
    case "resend":
      return enviarResend(msg);
    case "brevo":
      return enviarBrevo(msg);
    case "smtp":
      return enviarSmtp(msg);
  }
}

// Variante best-effort: nunca lanza. Devuelve true si el envio fue exitoso.
export async function sendEmailSeguro(msg: EmailMessage): Promise<boolean> {
  if (!isEmailEnabled()) return false;
  try {
    await sendEmail(msg);
    return true;
  } catch (err) {
    logger.warn({ err, to: msg.to }, "no se pudo enviar el email");
    return false;
  }
}
