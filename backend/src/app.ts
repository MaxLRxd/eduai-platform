import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import healthRoutes from "./routes/health.routes";
import { errorHandler, notFound } from "./middlewares/error";
import { logger } from "./config/logger";

export function createApp(): express.Express {
  const app = express();

  app.use(pinoHttp({ logger }));
  app.use(cors());
  app.use(express.json());

  app.use("/api", healthRoutes);
  app.get("/", (_req, res) => {
    res.json({ service: "eduai-backend", status: "ok" });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}