import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { validateBody } from "../../middlewares/validate";
import {
  crearSesionDocenteSchema,
  generarMaterialSchema,
  materialPdfSchema,
  mensajeDocenteSchema,
} from "./asistente.schemas";
import * as asistenteController from "./asistente.controller";

const router = Router();

router.post(
  "/asistente/generar",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(generarMaterialSchema),
  asistenteController.generarMaterial
);

router.post(
  "/asistente/pdf",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(materialPdfSchema),
  asistenteController.generarMaterialPdf
);

router.post(
  "/asistente/sesiones",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(crearSesionDocenteSchema),
  asistenteController.crearSesionDocente
);

router.get(
  "/asistente/sesiones",
  requireAuth,
  requireRole("PROFESOR"),
  asistenteController.listarSesionesDocente
);

router.get(
  "/asistente/sesiones/:id/mensajes",
  requireAuth,
  requireRole("PROFESOR"),
  asistenteController.listarMensajesDocente
);

router.post(
  "/asistente/sesiones/:id/mensajes",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(mensajeDocenteSchema),
  asistenteController.enviarMensajeDocente
);

export default router;