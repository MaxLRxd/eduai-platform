import { prisma } from "../../config/prisma";
import { logger } from "../../config/logger";
import { eliminarArchivo, guardarArchivo } from "../../config/storage";
import { AppError } from "../../middlewares/error";
import type { BrandingInput } from "./config.schemas";

type InstitutionRow = {
  nombre: string;
  logo_url: string | null;
  color_primario: string | null;
  color_secundario: string | null;
  color_claro: string | null;
};

function toBrandingDto(inst: InstitutionRow) {
  return {
    nombre: inst.nombre,
    logo_url: inst.logo_url,
    color_primario: inst.color_primario,
    color_secundario: inst.color_secundario,
    color_claro: inst.color_claro,
  };
}

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
  return toBrandingDto(inst);
}

export async function updateBranding(input: BrandingInput) {
  const existente = await obtenerOSingleton();

  const logoUrl = input.logo_url === undefined ? existente.logo_url : input.logo_url;

  const inst = await prisma.institution.update({
    where: { id: existente.id },
    data: {
      nombre: input.nombre ?? existente.nombre,
      logo_url: logoUrl,
      color_primario: input.color_primario ?? existente.color_primario,
      color_secundario: input.color_secundario ?? existente.color_secundario,
      color_claro: input.color_claro ?? existente.color_claro,
    },
  });

  // Si el logo cambio o se quito, borrar el archivo anterior del storage.
  // Un fallo de borrado no debe romper el guardado (el registro ya esta actualizado).
  if (existente.logo_url && existente.logo_url !== logoUrl) {
    try {
      await eliminarArchivo(existente.logo_url);
    } catch (err) {
      logger.warn({ err, logo_url: existente.logo_url }, "no se pudo eliminar el logo anterior");
    }
  }

  return toBrandingDto(inst);
}

export async function subirLogo(file: {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}) {
  if (!file.mimetype.startsWith("image/")) {
    throw new AppError(400, "El logo debe ser una imagen (PNG, JPG, SVG o similar)");
  }

  const guardado = await guardarArchivo(file.buffer, file.originalname);

  return { logo_url: guardado.url };
}
