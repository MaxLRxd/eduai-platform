import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CLAVE = "Clave1234";

// ─────────────────────────── LIMPIEZA (idempotente) ───────────────────────────
async function limpiar(): Promise<void> {
  await prisma.$transaction([
    prisma.mensajeDirecto.deleteMany(),
    prisma.conversacionMiembro.deleteMany(),
    prisma.conversacion.deleteMany(),
    prisma.mensajeBroadcast.deleteMany(),
    prisma.planningClase.deleteMany(),
    prisma.institution.deleteMany(),
    prisma.notificacion.deleteMany(),
    prisma.alertaRiesgoAcademico.deleteMany(),
    prisma.analyticsComprensionTema.deleteMany(),
    prisma.errorDudaFrecuente.deleteMany(),
    prisma.preguntaFrecuente.deleteMany(),
    prisma.mensajeIA.deleteMany(),
    prisma.sesionIA.deleteMany(),
    prisma.entrega.deleteMany(),
    prisma.actividad.deleteMany(),
    prisma.rubrica.deleteMany(),
    prisma.contenido.deleteMany(),
    prisma.seccion.deleteMany(),
    prisma.inscripcion.deleteMany(),
    prisma.claveMatriculacion.deleteMany(),
    prisma.asistencia.deleteMany(),
    prisma.nota.deleteMany(),
    prisma.sesion.deleteMany(),
    prisma.materiaProfesor.deleteMany(),
    prisma.materia.deleteMany(),
    prisma.profesor.deleteMany(),
    prisma.usuario.deleteMany(),
  ]);
}

function fechaClase(offsetDias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  d.setHours(9, 0, 0, 0);
  return d;
}

const estadoAsistencia = ["PRESENTE", "PRESENTE", "PRESENTE", "TARDANZA", "AUSENTE", "JUSTIFICADO"] as const;

async function main(): Promise<void> {
  await limpiar();

  const hash = await bcrypt.hash(CLAVE, 10);

  // ─────────────────────────── USUARIOS ───────────────────────────
  const admin = await prisma.usuario.create({
    data: { nombre: "Administrador", email: "admin@ies.edu", password_hash: hash, rol: "ADMIN" },
  });

  const profesores = [];
  for (let i = 1; i <= 3; i++) {
    const u = await prisma.usuario.create({
      data: { nombre: `Profesor ${i}`, email: `profe${i}@ies.edu`, password_hash: hash, rol: "PROFESOR" },
    });
    const p = await prisma.profesor.create({
      data: { usuario_id: u.id, tipo_profesor: i === 1 ? "TITULAR" : "ADJUNTO" },
    });
    profesores.push({ usuario: u, perfil: p });
  }

  const alumnos = [];
  for (let i = 1; i <= 10; i++) {
    const u = await prisma.usuario.create({
      data: { nombre: `Alumno ${i}`, email: `alumno${i}@ies.edu`, password_hash: hash, rol: "ALUMNO" },
    });
    alumnos.push(u);
  }

  // ─────────────────────────── MATERIAS ───────────────────────────
  const materiasDef = [
    {
      nombre: "Programación II",
      descripcion: "Paradigma orientado a objetos y estructuras de datos",
      nivel: "Técnico",
      profe: profesores[0],
    },
    {
      nombre: "Bases de Datos",
      descripcion: "Modelado relacional y SQL",
      nivel: "Técnico",
      profe: profesores[1],
    },
    {
      nombre: "Redes de Computadoras",
      descripcion: "Modelo OSI, TCP/IP y subnetting",
      nivel: "Técnico",
      profe: profesores[2],
    },
  ];

  for (let m = 0; m < materiasDef.length; m++) {
    const def = materiasDef[m];
    const materia = await prisma.materia.create({
      data: {
        nombre: def.nombre,
        descripcion: def.descripcion,
        nivel_educativo: def.nivel,
      },
    });

    await prisma.materiaProfesor.create({
      data: { materia_id: materia.id, profesor_id: def.profe.perfil.id },
    });

    const clave = await prisma.claveMatriculacion.create({
      data: { materia_id: materia.id, clave: `MAT${m + 1}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, max_usos: 100 },
    });

    for (const alumno of alumnos) {
      await prisma.inscripcion.create({
        data: { alumno_id: alumno.id, materia_id: materia.id, clave_id: clave.id },
      });
    }

    // Secciones
    const seccionTeorica = await prisma.seccion.create({
      data: { materia_id: materia.id, nombre: `Teoría de ${def.nombre}`, descripcion: `Conceptos de ${def.nombre}`, tipo: "TEORIA", orden: 1 },
    });
    const seccionPractica = await prisma.seccion.create({
      data: { materia_id: materia.id, nombre: `Práctica de ${def.nombre}`, descripcion: `Ejercicios de ${def.nombre}`, tipo: "PRACTICA", orden: 2 },
    });

    // Contenidos
    await prisma.contenido.createMany({
      data: [
        { seccion_id: seccionTeorica.id, tipo: "TEXTO", titulo: `Introducción a ${def.nombre}`, texto_contenido: `Material teórico de ${def.nombre}: fundamentos y conceptos principales.`, rag_indexado: true },
        { seccion_id: seccionTeorica.id, tipo: "PDF", titulo: `Guía de ${def.nombre}`, archivo_url: `/materiales/${m + 1}/guia.pdf`, archivo_nombre: "guia.pdf", archivo_formato: "pdf", archivo_tamano_kb: 512, rag_indexado: false },
        { seccion_id: seccionPractica.id, tipo: "TEXTO", titulo: `Ejercicios prácticos de ${def.nombre}`, texto_contenido: `Banco de ejercicios para resolver en clase y en casa.`, rag_indexado: true },
      ],
    });

    // Rúbrica
    const rubrica = await prisma.rubrica.create({
      data: {
        profesor_id: def.profe.perfil.id,
        materia_id: materia.id,
        nombre: `Rúbrica de ${def.nombre}`,
        descripcion: "Criterios de evaluación generales",
        criterios: [
          { nombre: "Cumplimiento", peso: 40, niveles: ["Incompleto", "Parcial", "Completo"] },
          { nombre: "Corrección", peso: 40, niveles: ["Con errores graves", "Con errores menores", "Sin errores"] },
          { nombre: "Presentación", peso: 20, niveles: ["Descuidada", "Aceptable", "Excelente"] },
        ],
      },
    });

    // Actividades
    const actividad1 = await prisma.actividad.create({
      data: {
        seccion_id: seccionPractica.id,
        rubrica_id: rubrica.id,
        nombre: `TP1: ${def.nombre}`,
        consigna: `Resolver el trabajo práctico 1 de ${def.nombre}.`,
        tipo: "DESARROLLO",
        fecha_limite: fechaClase(14),
        correccion_manual: false,
      },
    });
    const actividad2 = await prisma.actividad.create({
      data: {
        seccion_id: seccionPractica.id,
        rubrica_id: rubrica.id,
        nombre: `Parcial: ${def.nombre}`,
        consigna: `Examen parcial de ${def.nombre}.`,
        tipo: "DESARROLLO",
        fecha_limite: fechaClase(30),
        correccion_manual: false,
      },
    });

    // Planning de clases (tabla nueva)
    for (let s = 0; s < 6; s++) {
      await prisma.planningClase.create({
        data: {
          materia_id: materia.id,
          fecha_clase: fechaClase(s * 7 - 21),
          titulo: `Clase ${s + 1}: ${def.nombre}`,
          contenido: `Planificación de la clase de ${def.nombre}.`,
          estado: s < 4 ? "PUBLICADO" : "PLANIFICADO",
        },
      });
    }

    // Notas y asistencias por alumno por materia
    const periodos = ["2026-1", "2026-2"];
    for (let a = 0; a < alumnos.length; a++) {
      const alumno = alumnos[a];
      const base = 0.6 + (((a * 7 + m * 3 + 5) % 40) / 100); // 0.60..0.99

      for (const periodo of periodos) {
        await prisma.nota.create({
          data: {
            alumno_id: alumno.id,
            materia_id: materia.id,
            profesor_id: def.profe.perfil.id,
            periodo,
            calificacion: Math.round(base * 10 * 100) / 100,
            observaciones: `Nota ${periodo} de ${def.nombre}`,
          },
        });
      }

      // Asistencias (fechas únicas por alumno+materia)
      for (let s = 0; s < 6; s++) {
        await prisma.asistencia.create({
          data: {
            alumno_id: alumno.id,
            materia_id: materia.id,
            profesor_id: def.profe.perfil.id,
            fecha_clase: fechaClase(s * 7 - 21),
            estado: estadoAsistencia[(a + m + s) % estadoAsistencia.length],
          },
        });
      }

      // Entregas en las 2 actividades (Alumnos 1-8 entregan, 9-10 no para dejar pendientes)
      if (a < 8) {
        for (const act of [actividad1, actividad2]) {
          await prisma.entrega.create({
            data: {
              actividad_id: act.id,
              alumno_id: alumno.id,
              respuesta_texto: `Entrega de ${alumno.nombre} para ${act.nombre}.`,
              publicado: false,
            },
          });
        }
      }

      // Sesión IA + mensajes
      const sesionIa = await prisma.sesionIA.create({
        data: { alumno_id: alumno.id, materia_id: materia.id, modo: "NORMAL" },
      });
      await prisma.mensajeIA.createMany({
        data: [
          { sesion_id: sesionIa.id, rol: "USER", contenido: `Explícame ${def.nombre}`, tokens_prompt: 30, tokens_respuesta: 120, tiempo_respuesta_ms: 1500 },
          { sesion_id: sesionIa.id, rol: "ASSISTANT", contenido: `Resumen de ${def.nombre} para el alumno.`, prompt_depurado: "resumen", tokens_prompt: 30, tokens_respuesta: 120, tiempo_respuesta_ms: 1800 },
        ],
      });

      // Notificación
      await prisma.notificacion.create({
        data: {
          usuario_id: alumno.id,
          tipo: "FEEDBACK",
          titulo: `Novedades en ${def.nombre}`,
          mensaje: `Tenés nuevas actividades en ${def.nombre}.`,
        },
      });

      // Analytics comprensión (por materia y sección)
      await prisma.analyticsComprensionTema.createMany({
        data: [
          { materia_id: materia.id, seccion_id: seccionTeorica.id, total_consultas: 10 + a, total_errores: Math.max(0, 6 - a), nivel_comprension: Math.round(base * 100 * 100) / 100, periodo: "2026-1" },
          { materia_id: materia.id, seccion_id: seccionPractica.id, total_consultas: 8 + a, total_errores: Math.max(0, 5 - a), nivel_comprension: Math.round(base * 90 * 100) / 100, periodo: "2026-1" },
        ],
      });
    }

    // Alertas de riesgo realistas (algunos alumnos con bajo desempeño en algunas materias)
    for (let a = 0; a < alumnos.length; a++) {
      const alumno = alumnos[a];
      const severidadIdx = (a + m) % 3;
      const niveles = ["BAJA", "MEDIA", "ALTA"] as const;
      const tipoPorIdx = (a + m) % 3 === 0 ? "ASISTENCIA" : (a + m) % 3 === 1 ? "NOTAS" : "INTERACCIONES";
      await prisma.alertaRiesgoAcademico.create({
        data: {
          alumno_id: alumno.id,
          materia_id: materia.id,
          tipo_alerta: tipoPorIdx as never,
          descripcion: `Riesgo ${niveles[severidadIdx].toLowerCase()} detectado en ${def.nombre}.`,
          nivel_severidad: niveles[severidadIdx],
          activa: (a + m) % 3 !== 0,
        },
      });
    }

    // Errores/dudas frecuentes
    await prisma.errorDudaFrecuente.createMany({
      data: [
        { materia_id: materia.id, seccion_id: seccionTeorica.id, tipo: "DUDA", descripcion: `Duda recurrente sobre ${def.nombre}.`, frecuencia: 12, periodo: "2026-1" },
        { materia_id: materia.id, seccion_id: seccionPractica.id, tipo: "ERROR", descripcion: `Error común en ejercicios de ${def.nombre}.`, frecuencia: 8, periodo: "2026-1" },
      ],
    });
  }

  // ─────────────────── TABLAS NUEVAS GLOBALES ───────────────────
  // Conversación alumno1 <-> profe1
  const conv = await prisma.conversacion.create({ data: {} });
  await prisma.conversacionMiembro.createMany({
    data: [
      { conversacion_id: conv.id, usuario_id: alumnos[0].id },
      { conversacion_id: conv.id, usuario_id: profesores[0].usuario.id },
    ],
  });
  await prisma.mensajeDirecto.createMany({
    data: [
      { conversacion_id: conv.id, emisor_id: alumnos[0].id, contenido: "Hola profe, ¿cuándo es la próxima clase?", enviado_en: new Date(Date.now() - 86400000) },
      { conversacion_id: conv.id, emisor_id: profesores[0].usuario.id, contenido: "Hola, la próxima es el lunes a las 9.", enviado_en: new Date(Date.now() - 3600000) },
    ],
  });

  // Broadcast del profe1
  await prisma.mensajeBroadcast.create({
    data: { emisor_id: profesores[0].usuario.id, titulo: "Aviso Programación II", contenido: "Recuerden entregar el TP1 antes del fin de semana.", dirigido_a: "ALUMNO" },
  });

  // Branding institucional
  await prisma.institution.create({
    data: { nombre: "I.E.S. EduAI", logo_url: "https://example.com/logo.png", color_primario: "#2563eb", color_secundario: "#0f172a" },
  });

  // Preguntas frecuentes
  await prisma.preguntaFrecuente.createMany({
    data: [
      { materia_id: (await prisma.materia.findFirstOrThrow({ where: { nombre: "Programación II" } })).id, pregunta: "¿Qué es una clase?", respuesta: "Una plantilla que define atributos y métodos." },
      { materia_id: (await prisma.materia.findFirstOrThrow({ where: { nombre: "Bases de Datos" } })).id, pregunta: "¿Qué es una clave foránea?", respuesta: "Un campo que referencia la clave primaria de otra tabla." },
      { materia_id: (await prisma.materia.findFirstOrThrow({ where: { nombre: "Redes de Computadoras" } })).id, pregunta: "¿Qué es el modelo OSI?", respuesta: "Un modelo de referencia de 7 capas para redes." },
    ],
  });

  // ─────────────────────────── RESUMEN ───────────────────────────
  const [u, mat, sec, n, asis, pla] = await Promise.all([
    prisma.usuario.count(),
    prisma.materia.count(),
    prisma.seccion.count(),
    prisma.nota.count(),
    prisma.asistencia.count(),
    prisma.planningClase.count(),
  ]);

  console.log(`Seed completado: ${u} usuarios, ${mat} materias, ${sec} secciones, ${n} notas, ${asis} asistencias, ${pla} clases planificadas.`);
  console.log("Credenciales de prueba -> password: Clave1234");
  console.log("  admin@ies.edu (ADMIN) | profe1@ies.edu (PROFESOR) | alumno1@ies.edu (ALUMNO)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
