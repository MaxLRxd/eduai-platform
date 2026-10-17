import { Request, Response } from "express";
import * as configService from "./config.service";
import { COLOR_PRESETS } from "./config.schemas";
import type { BrandingInput } from "./config.schemas";
import { AppError } from "../../middlewares/error";

export async function getBranding(req: Request, res: Response): Promise<void> {
  const branding = await configService.getBranding();
  res.json({ branding });
}

export async function updateBranding(
  req: Request<unknown, unknown, BrandingInput>,
  res: Response
): Promise<void> {
  const branding = await configService.updateBranding(req.body);
  res.json({ branding });
}

export function getPresets(_req: Request, res: Response): void {
  res.json({ presets: COLOR_PRESETS });
}

export async function subirLogo(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new AppError(400, "Falta el archivo del logo");
  }
  const resultado = await configService.subirLogo(req.file);
  res.status(201).json(resultado);
}

// Branding publico: nombre, logo y colores que el shell muestra a todos los roles.
export async function getBrandingPublico(_req: Request, res: Response): Promise<void> {
  const branding = await configService.getBranding();
  res.json({ branding });
}
