import { Router } from "express";
import { health } from "../controllers/health.controller";

const router = Router();

router.get("/healthz", health);

export default router;