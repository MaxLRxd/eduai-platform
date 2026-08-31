import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { validateBody } from "../../middlewares/validate";
import * as actividadesController from "./actividades.controller";
import {
  actualizarActividadSchema,
  corregirEntregaSchema,
  crearActividadSchema,
  crearRubricaSchema,
  enviarEntregaSchema,
} from "./actividades.schemas";

const router = Router();

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
router.patch(
  "/entregas/:entregaId/correccion",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(corregirEntregaSchema),
  actividadesController.corregir
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

export default router;