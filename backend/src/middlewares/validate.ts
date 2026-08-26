import { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "./error";

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const detalle = result.error.issues
        .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
        .join("; ");
      return next(new AppError(400, `Datos invalidos. ${detalle}`));
    }

    req.body = result.data;
    next();
  };
}
