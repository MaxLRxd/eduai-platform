import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { requireAuth, requireRole } from "../../middlewares/auth";
import {
  actualizarPreguntaFrecuenteSchema,
  crearPreguntaFrecuenteSchema,
} from "./analytics.schemas";
import * as analyticsController from "./analytics.controller";

const router = Router();

router.get(
  "/materias/:materiaId/analytics/comprension",
  requireAuth,
  requireRole("PROFESOR"),
  analyticsController.comprension
);
router.get(
  "/materias/:materiaId/analytics/riesgo",
  requireAuth,
  requireRole("PROFESOR"),
  analyticsController.riesgo
);
router.get(
  "/materias/:materiaId/analytics/dudas",
  requireAuth,
  requireRole("PROFESOR"),
  analyticsController.dudas
);
router.get(
  "/materias/:materiaId/preguntas-frecuentes",
  requireAuth,
  analyticsController.listarPreguntas
);
router.post(
  "/materias/:materiaId/preguntas-frecuentes",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(crearPreguntaFrecuenteSchema),
  analyticsController.crearPregunta
);
router.put(
  "/preguntas-frecuentes/:preguntaId",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(actualizarPreguntaFrecuenteSchema),
  analyticsController.actualizarPregunta
);
router.delete(
  "/preguntas-frecuentes/:preguntaId",
  requireAuth,
  requireRole("PROFESOR"),
  analyticsController.eliminarPregunta
);

export default router;
