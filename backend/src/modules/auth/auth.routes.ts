import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { requireAuth } from "../../middlewares/auth";
import { loginSchema, registerSchema } from "./auth.schemas";
import * as authController from "./auth.controller";

const router = Router();

router.post("/register", validateBody(registerSchema), authController.register);
router.post("/login", validateBody(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

export default router;
