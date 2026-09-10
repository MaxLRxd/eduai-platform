import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { validateBody } from "../../middlewares/validate";
import { generarMaterialSchema } from "./asistente.schemas";
import * as asistenteController from "./asistente.controller";

const router = Router();

router.post(
  "/asistente/generar",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(generarMaterialSchema),
  asistenteController.generarMaterial
);

export default router;