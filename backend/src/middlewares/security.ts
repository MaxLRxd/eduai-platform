import { NextFunction, Request, Response } from "express";
import { AppError } from "./error";

/**
 * Headers de seguridad básicos (subset de lo que haría helmet, sin agregar dependencias).
 * La API solo devuelve JSON y archivos, así que no necesita una CSP compleja.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }
  next();
}

interface Ventana {
  intentos: number;
  reinicio: number;
}

/**
 * Rate limiter en memoria por IP + ruta. Pensado para endpoints sensibles (login/registro)
 * en una sola instancia; si se escala a varias réplicas hay que moverlo a Redis.
 * Desactivado en tests para no interferir con las suites.
 */
export function rateLimit(opciones: {
  max: number;
  ventanaMs: number;
  /** Solo cuentan los intentos que terminan en error (4xx/5xx): un login correcto no gasta cupo. */
  soloFallos?: boolean;
  /** Separa el contador por email del body, para frenar fuerza bruta sobre una cuenta puntual. */
  porEmail?: boolean;
}) {
  const ventanas = new Map<string, Ventana>();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV === "test") {
      return next();
    }

    const ahora = Date.now();
    const email = opciones.porEmail ? `:${String(req.body?.email ?? "").trim().toLowerCase()}` : "";
    const clave = `${req.ip}:${req.baseUrl}${req.path}${email}`;
    const actual = ventanas.get(clave);

    if (opciones.soloFallos) {
      res.on("finish", () => {
        const ventana = ventanas.get(clave);
        if (res.statusCode < 400 && ventana && ventana.intentos > 0) {
          ventana.intentos -= 1;
        }
      });
    }

    if (!actual || actual.reinicio <= ahora) {
      ventanas.set(clave, { intentos: 1, reinicio: ahora + opciones.ventanaMs });
      // Limpieza perezosa para que el Map no crezca indefinidamente.
      if (ventanas.size > 10_000) {
        for (const [k, v] of ventanas) {
          if (v.reinicio <= ahora) ventanas.delete(k);
        }
      }
      return next();
    }

    actual.intentos += 1;
    if (actual.intentos > opciones.max) {
      res.setHeader("Retry-After", Math.ceil((actual.reinicio - ahora) / 1000).toString());
      return next(new AppError(429, "Demasiados intentos. Proba de nuevo en unos minutos."));
    }
    next();
  };
}
