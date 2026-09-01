import { Request, Response } from "express";
import * as configService from "./config.service";
import type { BrandingInput } from "./config.schemas";

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
