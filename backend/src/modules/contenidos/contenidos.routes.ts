import { Router } from "express";
import multer from "multer";
import { validateBody } from "../../middlewares/validate";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { env } from "../../config/env";
import { actualizarContenidoSchema, crearContenidoSchema } from "./contenidos.schemas";
import * as contenidosController from "./contenidos.controller";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

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
router.post(
  "/secciones/:seccionId/contenidos/archivo",
  requireAuth,
  requireRole("PROFESOR"),
  upload.single("archivo"),
  contenidosController.crearArchivo
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
