import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { actualizarSeccionSchema, crearSeccionSchema } from "./secciones.schemas";
import * as seccionesController from "./secciones.controller";

const router = Router();

router.get(
  "/materias/:materiaId/secciones",
  requireAuth,
  seccionesController.listarPorMateria
);
router.post(
  "/materias/:materiaId/secciones",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(crearSeccionSchema),
  seccionesController.crear
);
router.put(
  "/secciones/:seccionId",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(actualizarSeccionSchema),
  seccionesController.actualizar
);
router.delete(
  "/secciones/:seccionId",
  requireAuth,
  requireRole("PROFESOR"),
  seccionesController.eliminar
);

export default router;
