import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { actualizarNotaSchema, crearNotaSchema } from "./notas.schemas";
import * as notasController from "./notas.controller";

const router = Router();

router.get("/materias/:materiaId/notas", requireAuth, notasController.listarPorMateria);
router.post(
  "/materias/:materiaId/notas",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(crearNotaSchema),
  notasController.crear
);
router.get("/notas/mias", requireAuth, notasController.mías);
router.put(
  "/notas/:notaId",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(actualizarNotaSchema),
  notasController.actualizar
);

export default router;