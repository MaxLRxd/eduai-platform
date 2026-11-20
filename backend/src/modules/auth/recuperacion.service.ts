import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { isEmailEnabled, sendEmailSeguro } from "../../services/email.service";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** URL pública del frontend: APP_URL o, si falta, el primer origen permitido por CORS. */
export function urlDeLaApp(): string {
  const base = env.APP_URL ?? env.CORS_ORIGIN.split(",")[0] ?? "http://localhost:5173";
  return base.trim().replace(/\/+$/, "");
}

export function enlaceDeRecuperacion(token: string): string {
  return `${urlDeLaApp()}/restablecer?token=${encodeURIComponent(token)}`;
}

/**
 * Pide un enlace de recuperación. NUNCA revela si el email existe: la respuesta es la misma
 * para una cuenta real, una inexistente o una desactivada (no se puede usar para listar cuentas).
 * El envío del correo no se espera, para que el tiempo de respuesta tampoco delate nada.
 */
export async function solicitarRecuperacion(email: string): Promise<void> {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.activo) {
    logger.info("Recuperación pedida para una cuenta inexistente o desactivada");
    return;
  }

  const token = randomBytes(32).toString("hex");
  const vence = new Date(Date.now() + env.RESET_TOKEN_MINUTES * 60 * 1000);

  // Un solo enlace vigente por cuenta: pedir otro invalida el anterior.
  await prisma.$transaction([
    prisma.tokenRecuperacion.deleteMany({ where: { usuario_id: usuario.id, usado_at: null } }),
    prisma.tokenRecuperacion.create({
      data: { usuario_id: usuario.id, token_hash: hashToken(token), expires_at: vence },
    }),
  ]);

  const enlace = enlaceDeRecuperacion(token);
  if (!isEmailEnabled() && process.env.NODE_ENV !== "production") {
    // Solo en desarrollo, con el correo sin configurar: así se puede probar el flujo completo.
    logger.info({ enlace }, "EMAIL_PROVIDER sin configurar: enlace de recuperación (solo desarrollo)");
  } else if (!isEmailEnabled()) {
    logger.error("Se pidió recuperar una contraseña pero el correo no está configurado (EMAIL_PROVIDER)");
  }

  void sendEmailSeguro({
    to: usuario.email,
    subject: "Recuperá tu contraseña de EduAI",
    text:
      `Hola ${usuario.nombre},\n\n` +
      `Recibimos un pedido para restablecer tu contraseña. Usá este enlace (vale ${env.RESET_TOKEN_MINUTES} minutos y se puede usar una sola vez):\n\n` +
      `${enlace}\n\n` +
      "Si no lo pediste vos, ignorá este correo: tu contraseña no cambia.",
  });
}

const ENLACE_INVALIDO = "El enlace no es válido o ya venció. Pedí uno nuevo.";

/**
 * Cambia la contraseña con el enlace recibido por correo. El enlace sirve una sola vez, vence,
 * y al usarlo se cierran TODAS las sesiones de la cuenta (quien tuviera acceso queda afuera).
 */
export async function restablecerPassword(token: string, passwordNueva: string): Promise<void> {
  const registro = await prisma.tokenRecuperacion.findUnique({
    where: { token_hash: hashToken(token) },
    include: { usuario: true },
  });

  if (!registro || registro.usado_at || registro.expires_at < new Date() || !registro.usuario.activo) {
    throw new AppError(400, ENLACE_INVALIDO);
  }

  const passwordHash = await bcrypt.hash(passwordNueva, 10);

  await prisma.$transaction(async (tx) => {
    // updateMany condicionado: si dos pedidos usan el mismo enlace a la vez, solo uno lo consume.
    const consumido = await tx.tokenRecuperacion.updateMany({
      where: { id: registro.id, usado_at: null },
      data: { usado_at: new Date() },
    });
    if (consumido.count !== 1) {
      throw new AppError(400, ENLACE_INVALIDO);
    }
    await tx.usuario.update({ where: { id: registro.usuario_id }, data: { password_hash: passwordHash } });
    await tx.sesion.updateMany({ where: { usuario_id: registro.usuario_id, revocado: false }, data: { revocado: true } });
    await tx.tokenRecuperacion.deleteMany({ where: { usuario_id: registro.usuario_id, usado_at: null } });
  });

  void sendEmailSeguro({
    to: registro.usuario.email,
    subject: "Tu contraseña de EduAI fue cambiada",
    text:
      `Hola ${registro.usuario.nombre},\n\nTu contraseña se cambió correctamente y se cerraron tus sesiones abiertas. ` +
      "Si no fuiste vos, pedí otro enlace de recuperación de inmediato o avisá a tu institución.",
  });
}
