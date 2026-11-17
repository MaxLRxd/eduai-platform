import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { requireAuth, requireRole } from "../../middlewares/auth";
import {
  actualizarNotaSchema,
  categoriasNotaSchema,
  crearNotaSchema,
  sincronizarActividadSchema,
} from "./notas.schemas";
import * as notasController from "./notas.controller";

const router = Router();

router.get("/materias/:materiaId/notas", requireAuth, notasController.listarPorMateria);
router.get(
  "/materias/:materiaId/calificaciones/fuentes",
  requireAuth,
  requireRole("PROFESOR", "ADMIN"),
  notasController.listarFuentesCalificacion
);
router.post(
  "/materias/:materiaId/notas",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(crearNotaSchema),
  notasController.crear
);
router.get("/materias/:materiaId/categorias-nota", requireAuth, notasController.listarCategorias);
router.put(
  "/materias/:materiaId/categorias-nota",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(categoriasNotaSchema),
  notasController.reemplazarCategorias
);
router.get(
  "/materias/:materiaId/calificaciones",
  requireAuth,
  requireRole("PROFESOR"),
  notasController.resumenCalificaciones
);
router.post(
  "/actividades/:actividadId/notas/sincronizar",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(sincronizarActividadSchema),
  notasController.sincronizarDesdeActividad
);
router.get("/notas/mias", requireAuth, notasController.mías);
router.put(
  "/notas/:notaId",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(actualizarNotaSchema),
  notasController.actualizar
);

export default router;