import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth";
import * as correccionController from "./correccion.controller";

const router = Router();

router.get(
  "/entregas/:entregaId/correccion-ia",
  requireAuth,
  requireRole("PROFESOR"),
  correccionController.generarCorreccionIA
);

export default router;
