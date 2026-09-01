import type { Rol } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";

export async function dashboardAlumno(alumnoId: string) {
  const [inscripciones, materias, notas, asistencias, pendientes, alertas] = await Promise.all([
    prisma.inscripcion.count({ where: { alumno_id: alumnoId } }),
    prisma.inscripcion.findMany({
      where: { alumno_id: alumnoId },
      include: {
        materia: { select: { id: true, nombre: true } },
      },
      orderBy: { inscripto_en: "desc" },
    }),
    prisma.nota.findMany({
      where: { alumno_id: alumnoId },
      select: { materia_id: true, calificacion: true, periodo: true },
    }),
    prisma.asistencia.groupBy({
      by: ["estado"],
      where: { alumno_id: alumnoId },
      _count: { _all: true },
    }),
    prisma.entrega.count({
      where: {
        alumno_id: alumnoId,
        publicado: false,
      },
    }),
    prisma.alertaRiesgoAcademico.count({
      where: { alumno_id: alumnoId, activa: true },
    }),
  ]);

  const notaPorMateria = new Map<string, number[]>();
  for (const n of notas) {
    const arr = notaPorMateria.get(n.materia_id) ?? [];
    arr.push(n.calificacion.toNumber());
    notaPorMateria.set(n.materia_id, arr);
  }

  let promedioGlobal = 0;
  let promPeriodoActual: number | null = null;

  const materiasResumen = materias.map((insc) => {
    const valores = notaPorMateria.get(insc.materia_id) ?? [];
    const promedio =
      valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
    if (promedio !== null) {
      promedioGlobal += promedio;
    }
    return {
      id: insc.materia.id,
      nombre: insc.materia.nombre,
      promedio: promedio !== null ? Math.round(promedio * 100) / 100 : null,
    };
  });

  if (materiasResumen.length > 0) {
    const conPromedio = materiasResumen.filter((m) => m.promedio !== null);
    if (conPromedio.length > 0) {
      promedioGlobal = promedioGlobal / conPromedio.length;
    }

    const notasPeriodo = notas.filter((n) => n.periodo === PERIODO_ACTUAL);
    if (notasPeriodo.length > 0) {
      promPeriodoActual =
        notasPeriodo.reduce((a, b) => a + b.calificacion.toNumber(), 0) / notasPeriodo.length;
    }
  }

  const asistencia = asistencias.map((a) => ({
    estado: a.estado,
    count: a._count._all,
  }));

  return {
    rol: "ALUMNO",
    resumen: {
      materias: inscripciones,
      entregasPendientes: pendientes,
      alertasActivas: alertas,
      promedioGlobal: Math.round(promedioGlobal * 100) / 100,
      promedioPeriodoActual: promPeriodoActual !== null ? Math.round(promPeriodoActual * 100) / 100 : null,
    },
    materias: materiasResumen,
    asistencia,
  };
}

const PERIODO_ACTUAL = "2026-1";

export async function dashboardProfesor(usuarioId: string) {
  const perfil = await prisma.profesor.findUnique({ where: { usuario_id: usuarioId } });

  if (!perfil) {
    throw new AppError(403, "No sos profesor");
  }

  const asignaciones = await prisma.materiaProfesor.findMany({
    where: { profesor_id: perfil.id, activo: true },
  });

  const materiaIds = asignaciones.map((a) => a.materia_id);

  const [materias, actividades, pendientes, alumnos, alertas, seccionesConteo] = await Promise.all([
    prisma.materia.findMany({
      where: { id: { in: materiaIds } },
      select: {
        id: true,
        nombre: true,
        nivel_educativo: true,
        _count: { select: { inscripciones: true, secciones: true } },
      },
      orderBy: { created_at: "desc" },
    }),
    prisma.actividad.count({
      where: { seccion: { materia_id: { in: materiaIds } } },
    }),
    prisma.entrega.count({
      where: {
        publicado: false,
        actividad: { seccion: { materia_id: { in: materiaIds } } },
      },
    }),
    prisma.inscripcion.groupBy({
      by: ["materia_id"],
      where: { materia_id: { in: materiaIds } },
      _count: { _all: true },
    }),
    prisma.alertaRiesgoAcademico.count({
      where: { materia_id: { in: materiaIds }, activa: true },
    }),
    prisma.seccion.findMany({
      where: { materia_id: { in: materiaIds } },
      select: { materia_id: true, _count: { select: { actividades: true } } },
    }),
  ]);

  const alumnosCount = alumnos.reduce((a, b) => a + b._count._all, 0);

  const actividadesPorMateria = new Map<string, number>();
  for (const s of seccionesConteo) {
    actividadesPorMateria.set(
      s.materia_id,
      (actividadesPorMateria.get(s.materia_id) ?? 0) + s._count.actividades
    );
  }

  return {
    rol: "PROFESOR",
    resumen: {
      materias: materias.length,
      actividades,
      entregasPendientes: pendientes,
      alumnos: alumnosCount,
      alertasActivas: alertas,
    },
    materias: materias.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      nivel_educativo: m.nivel_educativo,
      inscriptos: m._count.inscripciones,
      secciones: m._count.secciones,
      actividades: actividadesPorMateria.get(m.id) ?? 0,
    })),
  };
}

export async function dashboard(usuarioId: string, rol: Rol) {
  if (rol === "ALUMNO") {
    return dashboardAlumno(usuarioId);
  }
  if (rol === "PROFESOR") {
    return dashboardProfesor(usuarioId);
  }
  return dashboardAdmin(usuarioId);
}

export async function dashboardAdmin(usuarioId: string) {
  const [usuarios, materias, inscripciones, entregas, alertas] = await Promise.all([
    prisma.usuario.groupBy({
      by: ["rol"],
      _count: { _all: true },
    }),
    prisma.materia.count(),
    prisma.inscripcion.count(),
    prisma.entrega.count({ where: { publicado: false } }),
    prisma.alertaRiesgoAcademico.count({ where: { activa: true } }),
  ]);

  return {
    rol: "ADMIN",
    resumen: {
      materias,
      inscripciones,
      entregasPendientes: entregas,
      alertasActivas: alertas,
      usuarios: usuarios.map((u) => ({ rol: u.rol, count: u._count._all })),
    },
  };
}
