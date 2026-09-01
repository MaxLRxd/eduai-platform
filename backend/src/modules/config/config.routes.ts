import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { validateBody } from "../../middlewares/validate";
import { brandingSchema } from "./config.schemas";
import * as configController from "./config.controller";

const router = Router();

router.get("/admin/branding", requireAuth, requireRole("ADMIN"), configController.getBranding);
router.put(
  "/admin/branding",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(brandingSchema),
  configController.updateBranding
);

export default router;
