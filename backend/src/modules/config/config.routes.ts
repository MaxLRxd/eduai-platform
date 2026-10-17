import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { validateBody } from "../../middlewares/validate";
import { env } from "../../config/env";
import { brandingSchema } from "./config.schemas";
import * as configController from "./config.controller";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

// Publico: el shell lo consume sin token para mostrar nombre, logo y colores.
router.get("/config/branding", configController.getBrandingPublico);

router.get("/admin/branding", requireAuth, requireRole("ADMIN"), configController.getBranding);
router.get(
  "/admin/branding/presets",
  requireAuth,
  requireRole("ADMIN"),
  configController.getPresets
);
router.post(
  "/admin/branding/logo",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("logo"),
  configController.subirLogo
);
router.put(
  "/admin/branding",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(brandingSchema),
  configController.updateBranding
);

export default router;
