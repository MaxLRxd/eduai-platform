import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { validateBody } from "../../middlewares/validate";
import { env } from "../../config/env";
import { upsertPlanningSchema } from "./planning.schemas";
import * as planningController from "./planning.controller";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

router.get("/materias/:materiaId/planning", requireAuth, planningController.listarPlanning);
router.put(
  "/materias/:materiaId/planning/:fecha",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(upsertPlanningSchema),
  planningController.upsertPlanning
);
router.post(
  "/materias/:materiaId/planning/:fecha/material",
  requireAuth,
  requireRole("PROFESOR"),
  upload.single("archivo"),
  planningController.subirMaterial
);
router.delete(
  "/materias/:materiaId/planning/:fecha/material",
  requireAuth,
  requireRole("PROFESOR"),
  planningController.eliminarMaterial
);

export default router;
