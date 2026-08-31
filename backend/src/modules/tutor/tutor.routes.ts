import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { crearSesionSchema, enviarMensajeSchema } from "./tutor.schemas";
import * as tutorController from "./tutor.controller";

const router = Router();

router.post(
  "/materias/:materiaId/tutor/sesiones",
  requireAuth,
  requireRole("ALUMNO"),
  validateBody(crearSesionSchema),
  tutorController.crearSesion
);
router.get(
  "/tutor/sesiones",
  requireAuth,
  requireRole("ALUMNO"),
  tutorController.listarSesiones
);
router.get(
  "/tutor/sesiones/:sesionId/mensajes",
  requireAuth,
  requireRole("ALUMNO"),
  tutorController.listarMensajes
);
router.post(
  "/tutor/sesiones/:sesionId/mensajes",
  requireAuth,
  requireRole("ALUMNO"),
  validateBody(enviarMensajeSchema),
  tutorController.enviarMensaje
);
router.post(
  "/tutor/sesiones/:sesionId/stream",
  requireAuth,
  requireRole("ALUMNO"),
  validateBody(enviarMensajeSchema),
  tutorController.stream
);

export default router;
