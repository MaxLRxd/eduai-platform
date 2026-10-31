import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { obtenerProfesorAsignado } from "./materias.service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function promedio(valores: number[]): number | null {
  return valores.length ? Math.round((valores.reduce((s, v) => s + v, 0) / valores.length) * 100) / 100 : null;
}

/**
 * Vista del docente sobre un alumno de su materia: notas, asistencia, entregas, uso del tutor
 * IA, simulacros y material consultado (CU-P08 / historial de interacciones).
 */
export async function perfilAlumno(materiaId: string, alumnoId: string, docenteUsuarioId: string) {
  if (!UUID.test(materiaId)) throw new AppError(404, "Materia no encontrada");
  if (!UUID.test(alumnoId)) throw new AppError(404, "Alumno no encontrado");

  if (!(await obtenerProfesorAsignado(materiaId, docenteUsuarioId))) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const inscripcion = await prisma.inscripcion.findUnique({
    where: { alumno_id_materia_id: { alumno_id: alumnoId, materia_id: materiaId } },
    include: { alumno: { select: { id: true, nombre: true, email: true } }, materia: { select: { nombre: true } } },
  });

  if (!inscripcion) {
    throw new AppError(404, "El alumno no esta inscripto en esta materia");
  }

  const delAlumno = { alumno_id: alumnoId, materia_id: materiaId };

  const [notas, asistencias, actividades, sesiones, mensajesUsuario, ultimasConsultas, simulacros, contenidos, accesos, alertas] =
    await Promise.all([
      prisma.nota.findMany({ where: delAlumno, orderBy: { registrado_en: "asc" } }),
      prisma.asistencia.groupBy({ by: ["estado"], where: delAlumno, _count: { _all: true } }),
      prisma.actividad.findMany({
        where: { activo: true, seccion: { materia_id: materiaId } },
        select: {
          id: true,
          nombre: true,
          fecha_limite: true,
          entregas: {
            where: { alumno_id: alumnoId },
            select: { publicado: true, calificacion_final: true, entregado_en: true },
            take: 1,
          },
        },
        orderBy: { fecha_limite: "asc" },
      }),
      prisma.sesionIA.count({ where: delAlumno }),
      prisma.mensajeIA.count({ where: { rol: "USER", sesion: delAlumno } }),
      prisma.mensajeIA.findMany({
        where: { rol: "USER", sesion: delAlumno },
        orderBy: { creado_en: "desc" },
        take: 10,
        select: { id: true, contenido: true, modo: true, creado_en: true },
      }),
      prisma.intentoSimulacro.findMany({ where: delAlumno, orderBy: { creado_en: "desc" }, take: 5 }),
      prisma.contenido.count({ where: { seccion: { materia_id: materiaId } } }),
      prisma.accesoContenido.findMany({
        where: { alumno_id: alumnoId, contenido: { seccion: { materia_id: materiaId } } },
        select: { contenido_id: true },
      }),
      prisma.alertaRiesgoAcademico.findMany({ where: { ...delAlumno, activa: true }, orderBy: { generada_en: "desc" } }),
    ]);

  const totalAsistencias = asistencias.reduce((s, a) => s + a._count._all, 0);
  const presentes = asistencias
    .filter((a) => a.estado === "PRESENTE" || a.estado === "TARDANZA")
    .reduce((s, a) => s + a._count._all, 0);

  const entregadas = actividades.filter((a) => a.entregas.length > 0);
  const calificadas = entregadas
    .map((a) => a.entregas[0])
    .filter((e) => e.publicado && e.calificacion_final !== null)
    .map((e) => e.calificacion_final!.toNumber());

  return {
    alumno: { ...inscripcion.alumno, inscripto_en: inscripcion.inscripto_en },
    materia: inscripcion.materia.nombre,
    notas: {
      promedio: promedio(notas.map((n) => n.calificacion.toNumber())),
      detalle: notas.map((n) => ({
        periodo: n.periodo,
        calificacion: n.calificacion.toNumber(),
        observaciones: n.observaciones,
      })),
    },
    asistencia: {
      registros: totalAsistencias,
      porcentaje: totalAsistencias ? Math.round((presentes / totalAsistencias) * 100) : null,
      por_estado: Object.fromEntries(asistencias.map((a) => [a.estado, a._count._all])),
    },
    entregas: {
      actividades: actividades.length,
      entregadas: entregadas.length,
      pendientes: actividades.length - entregadas.length,
      calificadas: calificadas.length,
      promedio_calificadas: promedio(calificadas),
    },
    tutor: {
      sesiones,
      consultas: mensajesUsuario,
      ultimas_consultas: ultimasConsultas.map((m) => ({
        id: m.id,
        consulta: m.contenido,
        modo: m.modo,
        fecha: m.creado_en,
      })),
    },
    simulacros: simulacros.map((s) => ({
      id: s.id,
      titulo: s.titulo,
      dificultad: s.dificultad,
      puntaje: s.puntaje.toNumber(),
      fecha: s.creado_en,
    })),
    material: {
      total: contenidos,
      vistos: new Set(accesos.map((a) => a.contenido_id)).size,
    },
    alertas: alertas.map((a) => ({
      id: a.id,
      tipo: a.tipo_alerta,
      severidad: a.nivel_severidad,
      descripcion: a.descripcion,
    })),
  };
}
