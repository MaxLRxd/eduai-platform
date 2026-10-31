import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { requireAuth, requireRole } from "../../middlewares/auth";
import {
  corregirExamenSchema,
  crearSesionSchema,
  enviarMensajeSchema,
  examenSchema,
  resumenPdfSchema,
  resumenSchema,
} from "./tutor.schemas";
import * as tutorController from "./tutor.controller";

const router = Router();

router.post(
  "/materias/:materiaId/tutor/sesiones",
  requireAuth,
  requireRole("ALUMNO"),
  validateBody(crearSesionSchema),
  tutorController.crearSesion
);
router.post(
  "/materias/:materiaId/tutor/resumen",
  requireAuth,
  requireRole("ALUMNO"),
  validateBody(resumenSchema),
  tutorController.resumen
);
router.post(
  "/materias/:materiaId/tutor/resumen/pdf",
  requireAuth,
  requireRole("ALUMNO"),
  validateBody(resumenPdfSchema),
  tutorController.resumenAPdf
);
router.post(
  "/materias/:materiaId/tutor/examen",
  requireAuth,
  requireRole("ALUMNO"),
  validateBody(examenSchema),
  tutorController.examen
);
router.post(
  "/materias/:materiaId/tutor/examen/corregir",
  requireAuth,
  requireRole("ALUMNO"),
  validateBody(corregirExamenSchema),
  tutorController.corregirSimulacro
);
router.get(
  "/materias/:materiaId/tutor/simulacros",
  requireAuth,
  requireRole("ALUMNO"),
  tutorController.listarSimulacros
);
router.get(
  "/materias/:materiaId/tutor/latencia",
  requireAuth,
  requireRole("PROFESOR"),
  tutorController.latenciaDeMateria
);
router.get("/admin/tutor/latencia", requireAuth, requireRole("ADMIN"), tutorController.latenciaGlobal);
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
