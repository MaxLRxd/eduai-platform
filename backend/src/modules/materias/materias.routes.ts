import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { createMateriaSchema, crearClaveSchema, unirseSchema } from "./materias.schemas";
import * as materiasController from "./materias.controller";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(createMateriaSchema),
  materiasController.crear
);
router.get("/mias", requireAuth, materiasController.mias);
router.post(
  "/unirse",
  requireAuth,
  requireRole("ALUMNO"),
  validateBody(unirseSchema),
  materiasController.unirse
);
router.post(
  "/:id/claves",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(crearClaveSchema),
  materiasController.crearClave
);
router.get("/:id", requireAuth, materiasController.detalle);

export default router;
