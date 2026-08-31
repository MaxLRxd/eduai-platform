import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import * as dashboardController from "./dashboard.controller";

const router = Router();

router.get("/dashboard", requireAuth, dashboardController.dashboard);
router.get("/dashboard/alumno", requireAuth, dashboardController.dashboardAlumno);
router.get("/dashboard/profesor", requireAuth, dashboardController.dashboardProfesor);

export default router;
