import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import * as notificacionesController from "./notificaciones.controller";

const router = Router();

router.get("/notificaciones", requireAuth, notificacionesController.listar);
router.get("/notificaciones/no-leidas", requireAuth, notificacionesController.contarNoLeidas);
router.patch("/notificaciones/leer-todas", requireAuth, notificacionesController.marcarTodasLeidas);
router.patch(
  "/notificaciones/:notificacionId/leida",
  requireAuth,
  notificacionesController.marcarLeida
);

export default router;
