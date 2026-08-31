import cookieParser from "cookie-parser"; import cors from "cors"; import express from "express"; import pinoHttp from "pino-http"; import { env } from "./config/env"; import { logger } from "./config/logger"; import { errorHandler, notFound } from "./middlewares/error"; import authRoutes from "./modules/auth/auth.routes";
import materiasRoutes from "./modules/materias/materias.routes";
import notasRoutes from "./modules/notas/notas.routes";
import asistenciasRoutes from "./modules/asistencias/asistencias.routes";
import actividadesRoutes from "./modules/actividades/actividades.routes";
import healthRoutes from "./routes/health.routes";  export function createApp(): express.Express {   const app = express();    app.use(pinoHttp({ logger }));   app.use(     cors({       origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),       credentials: true,     })   );   app.use(express.json({ limit: "1mb" }));   app.use(cookieParser());    app.get("/", (_req, res) => {     res.json({ service: "eduai-backend", status: "ok" });   });    app.use("/api/auth", authRoutes);
  app.use("/api/materias", materiasRoutes);
  app.use("/api", notasRoutes);
  app.use("/api", asistenciasRoutes);
  app.use("/api", actividadesRoutes);
  app.use("/api", healthRoutes);    app.use(notFound);   app.use(errorHandler);    return app; }