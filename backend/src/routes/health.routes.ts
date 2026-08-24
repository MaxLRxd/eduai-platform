import { Router } from "express";
import { prisma } from "../config/prisma";

const router = Router();

router.get("/healthz", async (_req, res) => {
  let db = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }

  const ok = db === "ok";
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "degraded",
    db,
    uptime: process.uptime(),
  });
});

export default router;
