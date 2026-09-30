import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { validateBody } from "../../middlewares/validate";
import { env } from "../../config/env";
import * as actividadesController from "./actividades.controller";
import {
  actualizarActividadSchema,
  actualizarRubricaSchema,
  corregirEntregaSchema,
  crearActividadSchema,
  crearRubricaSchema,
  enviarEntregaSchema,
} from "./actividades.schemas";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

router.get("/materias/:materiaId/actividades", requireAuth, actividadesController.listarPorMateria);
router.post(
  "/materias/:materiaId/actividades",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(crearActividadSchema),
  actividadesController.crear
);
router.put(
  "/actividades/:actividadId",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(actualizarActividadSchema),
  actividadesController.actualizar
);
router.delete(
  "/actividades/:actividadId",
  requireAuth,
  requireRole("PROFESOR"),
  actividadesController.eliminar
);

router.get(
  "/actividades/:actividadId/entregas",
  requireAuth,
  requireRole("PROFESOR"),
  actividadesController.listarEntregas
);
router.get(
  "/actividades/:actividadId/entregas/pendientes",
  requireAuth,
  requireRole("PROFESOR"),
  actividadesController.listarPendientes
);
router.get(
  "/entregas/pendientes",
  requireAuth,
  requireRole("PROFESOR"),
  actividadesController.listarPendientes
);
router.post(
  "/actividades/:actividadId/entrega",
  requireAuth,
  requireRole("ALUMNO"),
  validateBody(enviarEntregaSchema),
  actividadesController.enviar
);
router.put(
  "/actividades/:actividadId/entrega",
  requireAuth,
  requireRole("ALUMNO"),
  validateBody(enviarEntregaSchema),
  actividadesController.enviar
);
router.post(
  "/actividades/:actividadId/entrega/archivo",
  requireAuth,
  requireRole("ALUMNO"),
  upload.single("archivo"),
  actividadesController.subirArchivo
);
router.patch(
  "/entregas/:entregaId/correccion",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(corregirEntregaSchema),
  actividadesController.corregir
);
router.post(
  "/entregas/:entregaId/corregir-ia",
  requireAuth,
  requireRole("PROFESOR"),
  actividadesController.corregirConIA
);

router.get(
  "/materias/:materiaId/rubricas",
  requireAuth,
  requireRole("PROFESOR"),
  actividadesController.listarRubricas
);
router.post(
  "/materias/:materiaId/rubricas",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(crearRubricaSchema),
  actividadesController.crearRubrica
);
router.put(
  "/rubricas/:rubricaId",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(actualizarRubricaSchema),
  actividadesController.actualizarRubrica
);
router.delete(
  "/rubricas/:rubricaId",
  requireAuth,
  requireRole("PROFESOR"),
  actividadesController.eliminarRubrica
);

export default router;