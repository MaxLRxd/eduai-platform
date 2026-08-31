import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { actualizarContenidoSchema, crearContenidoSchema } from "./contenidos.schemas";
import * as contenidosController from "./contenidos.controller";

const router = Router();

router.get(
  "/secciones/:seccionId/contenidos",
  requireAuth,
  contenidosController.listarPorSeccion
);
router.post(
  "/secciones/:seccionId/contenidos",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(crearContenidoSchema),
  contenidosController.crear
);
router.put(
  "/contenidos/:contenidoId",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(actualizarContenidoSchema),
  contenidosController.actualizar
);
router.delete(
  "/contenidos/:contenidoId",
  requireAuth,
  requireRole("PROFESOR"),
  contenidosController.eliminar
);

export default router;
