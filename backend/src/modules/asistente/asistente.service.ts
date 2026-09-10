import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { generarMaterialDocente } from "../../config/aiClient";
import { obtenerProfesorAsignado } from "../materias/materias.service";
import type { GenerarMaterialInput } from "./asistente.schemas";

function assertUuid(id: string, mensaje: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new AppError(404, mensaje);
  }
}

export async function generarMaterial(materiaId: string, input: GenerarMaterialInput, usuarioId: string) {
  assertUuid(materiaId, "Materia no encontrada");

  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  let prompt = input.prompt;

  if (input.class_date) {
    const fecha = new Date(input.class_date);
    if (!Number.isNaN(fecha.getTime())) {
      const planning = await prisma.planningClase.findUnique({
        where: { materia_id_fecha_clase: { materia_id: materiaId, fecha_clase: fecha } },
      });
      if (planning?.contenido || planning?.titulo) {
        prompt = `${prompt}\n\nPLANIFICACIÓN DE LA CLASE (${input.class_date}): "${planning.titulo}"\n${planning.contenido ?? ""}`;
      }
    }
  }

  const resultado = await generarMaterialDocente(materiaId, prompt);

  if (!resultado) {
    throw new AppError(
      501,
      "El asistente docente no esta disponible todavia. Verificá que AI_SERVICE_URL este configurado."
    );
  }

  return { material: resultado.material, sources: resultado.sources };
}