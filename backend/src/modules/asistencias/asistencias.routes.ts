import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { actualizarAsistenciaSchema, registraAsistenciaSchema } from "./asistencias.schemas";
import * as asistenciasController from "./asistencias.controller";

const router = Router();

router.get("/materias/:materiaId/asistencias", requireAuth, asistenciasController.listarPorMateria);
router.post(
  "/materias/:materiaId/asistencias",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(registraAsistenciaSchema),
  asistenciasController.registrarDia
);
router.get("/asistencias/mias", requireAuth, asistenciasController.mías);
router.put(
  "/asistencias/:asistenciaId",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(actualizarAsistenciaSchema),
  asistenciasController.actualizar
);

export default router;