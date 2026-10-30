import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { asegurarDirectorioUploads, UPLOADS_DIR } from "./config/storage";
import { errorHandler, notFound } from "./middlewares/error";
import { securityHeaders } from "./middlewares/security";
import authRoutes from "./modules/auth/auth.routes";
import materiasRoutes from "./modules/materias/materias.routes";
import notasRoutes from "./modules/notas/notas.routes";
import asistenciasRoutes from "./modules/asistencias/asistencias.routes";
import actividadesRoutes from "./modules/actividades/actividades.routes";
import seccionesRoutes from "./modules/secciones/secciones.routes";
import contenidosRoutes from "./modules/contenidos/contenidos.routes";
import notificacionesRoutes from "./modules/notificaciones/notificaciones.routes";
import tutorRoutes from "./modules/tutor/tutor.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import adminRoutes from "./modules/admin/admin.routes";
import correccionRoutes from "./modules/correccion/correccion.routes";
import asistenteRoutes from "./modules/asistente/asistente.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import planningRoutes from "./modules/planning/planning.routes";
import messagesRoutes from "./modules/messages/messages.routes";
import configRoutes from "./modules/config/config.routes";
import healthRoutes from "./routes/health.routes";

const EXTENSIONES_EJECUTABLES = /\.(html?|xhtml|svg|xml|js|mjs)$/i;

/**
 * Los archivos de /uploads los suben alumnos y docentes y se sirven desde el mismo origen
 * que la API. Un .html o .svg abierto ahi podria ejecutar scripts con las cookies de la
 * sesion (p. ej. pedir /api/auth/refresh), asi que se descargan y, si se abren, quedan en
 * un sandbox sin origen. PDFs e imagenes se siguen viendo en el navegador.
 */
function protegerArchivoSubido(res: express.Response, rutaArchivo: string): void {
  if (EXTENSIONES_EJECUTABLES.test(rutaArchivo)) {
    res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
    res.setHeader("Content-Disposition", "attachment");
  }
}

export function createApp(): express.Express {
  const app = express();

  // No anunciar el framework en cada respuesta.
  app.disable("x-powered-by");
  // Detrás del proxy del proveedor (Fly/Railway/etc.) req.ip tiene que salir de X-Forwarded-For.
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(pinoHttp({ logger }));
  app.use(securityHeaders);
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  asegurarDirectorioUploads();
  app.use("/uploads", express.static(UPLOADS_DIR, { fallthrough: true, setHeaders: protegerArchivoSubido }));

  app.get("/", (_req, res) => {
    res.json({ service: "eduai-backend", status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/materias", materiasRoutes);
  app.use("/api", notasRoutes);
  app.use("/api", asistenciasRoutes);
  app.use("/api", actividadesRoutes);
  app.use("/api", seccionesRoutes);
  app.use("/api", contenidosRoutes);
  app.use("/api", notificacionesRoutes);
  app.use("/api", tutorRoutes);
  app.use("/api", analyticsRoutes);
  app.use("/api", adminRoutes);
  app.use("/api", correccionRoutes);
  app.use("/api", asistenteRoutes);
  app.use("/api", dashboardRoutes);
  app.use("/api", planningRoutes);
  app.use("/api", messagesRoutes);
  app.use("/api", configRoutes);
  app.use("/api", healthRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
