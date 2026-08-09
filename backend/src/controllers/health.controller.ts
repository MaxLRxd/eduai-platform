import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function health(req: Request, res: Response): Promise<void> {
  let db = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }
  res.json({ status: "ok", db, uptime: process.uptime() });
}