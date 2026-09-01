import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { validateBody } from "../../middlewares/validate";
import { broadcastSchema, enviarMensajeSchema } from "./messages.schemas";
import * as messagesController from "./messages.controller";

const router = Router();

router.get("/messages", requireAuth, messagesController.listarConversaciones);
router.get("/messages/historial", requireAuth, messagesController.obtenerMensajes);
router.post(
  "/messages",
  requireAuth,
  validateBody(enviarMensajeSchema),
  messagesController.enviarMensaje
);
router.post(
  "/messages/broadcast",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(broadcastSchema),
  messagesController.enviarBroadcast
);

export default router;
