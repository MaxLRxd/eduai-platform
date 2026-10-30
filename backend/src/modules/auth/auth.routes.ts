import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { requireAuth } from "../../middlewares/auth";
import { cambiarPasswordSchema, loginSchema, registerSchema } from "./auth.schemas";
import * as authController from "./auth.controller";
import { rateLimit } from "../../middlewares/security";

const router = Router();

// Frena fuerza bruta de contraseñas: 10 intentos FALLIDOS cada 15 minutos por cuenta e IP.
// Los logins correctos no cuentan, así un aula entera detrás de la misma IP puede ingresar.
const VENTANA = 15 * 60 * 1000;
const limiteLoginPorCuenta = rateLimit({ max: 10, ventanaMs: VENTANA, soloFallos: true, porEmail: true });
// Tope más alto por IP para frenar el rociado de contraseñas sobre muchas cuentas.
const limiteLoginPorIp = rateLimit({ max: 100, ventanaMs: VENTANA, soloFallos: true });
// Altas: cuentan todas (también las exitosas) para frenar la creación masiva de cuentas.
const limiteRegistro = rateLimit({ max: 30, ventanaMs: VENTANA });
// Cambio de contraseña: solo los intentos con la contraseña actual equivocada.
const limiteCredenciales = rateLimit({ max: 10, ventanaMs: VENTANA, soloFallos: true });

router.post("/register", limiteRegistro, validateBody(registerSchema), authController.register);
router.post("/login", limiteLoginPorIp, limiteLoginPorCuenta, validateBody(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);
router.post(
  "/password",
  requireAuth,
  limiteCredenciales,
  validateBody(cambiarPasswordSchema),
  authController.cambiarPassword
);

export default router;
