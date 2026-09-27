import { Request, Response, NextFunction } from "express";
import multer from "multer";

export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ error: "Not found" });
}

function resolverError(err: Error): { statusCode: number; message: string } {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, message: err.message };
  }
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return { statusCode: 413, message: "El archivo supera el tamaño máximo permitido." };
    }
    return { statusCode: 400, message: `Error en la subida del archivo: ${err.message}` };
  }
  return { statusCode: 500, message: "Internal server error" };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    next(err);
    return;
  }
  const { statusCode, message } = resolverError(err);
  res.status(statusCode).json({ error: message });
}