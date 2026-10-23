import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { requireAuth } from "../../middlewares/auth";
import { loginSchema, registerSchema } from "./auth.schemas";
import * as authController from "./auth.controller";
import { rateLimit } from "../../middlewares/security";

const router = Router();

// Frena fuerza bruta de contraseñas y altas masivas: 10 intentos cada 15 minutos por IP.
const limiteCredenciales = rateLimit({ max: 10, ventanaMs: 15 * 60 * 1000 });

router.post("/register", limiteCredenciales, validateBody(registerSchema), authController.register);
router.post("/login", limiteCredenciales, validateBody(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

export default router;
