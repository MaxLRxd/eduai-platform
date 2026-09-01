import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { validateBody } from "../../middlewares/validate";
import { upsertPlanningSchema } from "./planning.schemas";
import * as planningController from "./planning.controller";

const router = Router();

router.get("/materias/:materiaId/planning", requireAuth, planningController.listarPlanning);
router.put(
  "/materias/:materiaId/planning/:fecha",
  requireAuth,
  requireRole("PROFESOR"),
  validateBody(upsertPlanningSchema),
  planningController.upsertPlanning
);

export default router;
