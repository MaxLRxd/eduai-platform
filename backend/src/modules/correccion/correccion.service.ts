import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { corregirEntregaIA } from "../../config/aiClient";
import { obtenerProfesorAsignado } from "../materias/materias.service";

function assertUuid(id: string, mensaje: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new AppError(404, mensaje);
  }
}

export async function generarCorreccionIA(entregaId: string, usuarioId: string) {
  assertUuid(entregaId, "Entrega no encontrada");

  const entrega = await prisma.entrega.findUnique({
    where: { id: entregaId },
    include: {
      actividad: {
        include: {
          rubrica: true,
          seccion: { select: { materia_id: true } },
        },
      },
    },
  });

  if (!entrega) {
    throw new AppError(404, "Entrega no encontrada");
  }

  const materiaId = entrega.actividad.seccion.materia_id;
  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const textoEntrega = entrega.respuesta_texto ?? entrega.respuesta_codigo ?? null;

  if (!textoEntrega) {
    throw new AppError(400, "La entrega no tiene contenido de texto para corregir");
  }

  const resultado = await corregirEntregaIA({
    subject_id: materiaId,
    material_id: null,
    entrega: textoEntrega,
    rubrica: entrega.actividad.rubrica?.criterios ?? null,
  });

  if (!resultado) {
    throw new AppError(
      501,
      "La correccion IA no esta disponible todavia. Podes corregir manualmente."
    );
  }

  const actualizada = await prisma.entrega.update({
    where: { id: entregaId },
    data: {
      feedback_ia: resultado.feedback,
      calificacion_ia: resultado.calificacion,
      revision_tipo: "IA",
    },
  });

  return {
    feedback_ia: actualizada.feedback_ia,
    calificacion_ia: actualizada.calificacion_ia?.toString() ?? null,
  };
}
