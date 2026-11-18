import { Router } from "express";
import multer from "multer";
import { validateBody } from "../../middlewares/validate";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { env } from "../../config/env";
import { actualizarContenidoSchema, crearContenidoSchema, reportarContenidoSchema } from "./contenidos.schemas";
import * as contenidosController from "./contenidos.controller";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

router.post(
  "/contenidos/:contenidoId/acceso",
  requireAuth,
  requireRole("ALUMNO"),
  contenidosController.registrarAcceso
);
router.post(
  "/contenidos/:contenidoId/reportes",
  requireAuth,
  requireRole("ALUMNO"),
  validateBody(reportarContenidoSchema),
  contenidosController.reportarProblema
);
router.get(
  "/materias/:materiaId/reportes-contenido",
  requireAuth,
  requireRole("PROFESOR"),
  contenidosController.listarReportes
);
router.post(
  "/contenidos/:contenidoId/reportes/resolver",
  requireAuth,
  requireRole("PROFESOR"),
  contenidosController.resolverReportes
);
router.get(
  "/materias/:materiaId/accesos",
  requireAuth,
  requireRole("PROFESOR"),
  contenidosController.estadisticasDeAcceso
);
router.get(
  "/materias/:materiaId/contenidos",
  requireAuth,
  contenidosController.obtenerArbol
);
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
