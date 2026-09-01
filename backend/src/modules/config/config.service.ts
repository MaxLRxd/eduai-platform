import { prisma } from "../../config/prisma";
import type { BrandingInput } from "./config.schemas";

async function obtenerOSingleton() {
  const existente = await prisma.institution.findFirst({ orderBy: { updated_at: "desc" } });

  if (existente) {
    return existente;
  }

  return prisma.institution.create({
    data: {
      nombre: "EduAI",
    },
  });
}

export async function getBranding() {
  const inst = await obtenerOSingleton();
  return {
    nombre: inst.nombre,
    logo_url: inst.logo_url,
    color_primario: inst.color_primario,
    color_secundario: inst.color_secundario,
  };
}

export async function updateBranding(input: BrandingInput) {
  const existente = await obtenerOSingleton();

  const inst = await prisma.institution.update({
    where: { id: existente.id },
    data: {
      nombre: input.nombre ?? existente.nombre,
      logo_url: input.logo_url === undefined ? existente.logo_url : input.logo_url,
      color_primario: input.color_primario ?? existente.color_primario,
      color_secundario: input.color_secundario ?? existente.color_secundario,
    },
  });

  return {
    nombre: inst.nombre,
    logo_url: inst.logo_url,
    color_primario: inst.color_primario,
    color_secundario: inst.color_secundario,
  };
}
