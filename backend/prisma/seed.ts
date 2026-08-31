import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

// Seed de datos de prueba para EduAI.
// Dataset objetivo: 3 materias, 3 profesores (+1 admin), 10 alumnos.
// Es IDEMPOTENTE: elimina todos los datos existentes y los recrea.
//
// Ejecutar con:
//   DATABASE_URL="postgresql://eduai:eduai@localhost:5433/eduai" npx tsx prisma/seed.ts

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://eduai:eduai@localhost:5433/eduai?schema=public";

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PASSWORD = "Clave1234";

// IDs fijos para poder referenciar registros y reejecutar de forma determinista.
const ID = {
  admin: randomUUID(),
  profe1: randomUUID(),
  profe2: randomUUID(),
  profe3: randomUUID(),

  alumno1: randomUUID(),
  alumno2: randomUUID(),
  alumno3: randomUUID(),
  alumno4: randomUUID(),
  alumno5: randomUUID(),
  alumno6: randomUUID(),
  alumno7: randomUUID(),
  alumno8: randomUUID(),
  alumno9: randomUUID(),
  alumno10: randomUUID(),

  materia1: randomUUID(),
  materia2: randomUUID(),
  materia3: randomUUID(),

  seccion1t: randomUUID(),
  seccion1p: randomUUID(),
  seccion2t: randomUUID(),
  seccion2p: randomUUID(),
  seccion3t: randomUUID(),
  seccion3p: randomUUID(),
};

const alumnos = [
  { id: ID.alumno1, nombre: "Lautaro Acevedo", email: "alumno1@ies.edu" },
  { id: ID.alumno2, nombre: "Camila Benítez", email: "alumno2@ies.edu" },
  { id: ID.alumno3, nombre: "Tomás Carrizo", email: "alumno3@ies.edu" },
  { id: ID.alumno4, nombre: "Mía Domínguez", email: "alumno4@ies.edu" },
  { id: ID.alumno5, nombre: "Franco Estévez", email: "alumno5@ies.edu" },
  { id: ID.alumno6, nombre: "Valentina Ferreyra", email: "alumno6@ies.edu" },
  { id: ID.alumno7, nombre: "Joaquín Gutiérrez", email: "alumno7@ies.edu" },
  { id: ID.alumno8, nombre: "Sofía Herrera", email: "alumno8@ies.edu" },
  { id: ID.alumno9, nombre: "Nicolás Ibáñez", email: "alumno9@ies.edu" },
  { id: ID.alumno10, nombre: "Julieta Jiménez", email: "alumno10@ies.edu" },
];

const profesores = [
  { id: ID.profe1, nombre: "Prof. Diego Fernández", email: "profe1@ies.edu" },
  { id: ID.profe2, nombre: "Prof. Carolina Ruiz", email: "profe2@ies.edu" },
  { id: ID.profe3, nombre: "Prof. Martín Sosa", email: "profe3@ies.edu" },
];

const materias = [
  {
    id: ID.materia1,
    nombre: "Programación II",
    descripcion: "Orientación a objetos y estructuras de datos en Java.",
    nivelEducativo: "Universitario",
    profeId: ID.profe1,
    seccionTeoriaId: ID.seccion1t,
    seccionPracticaId: ID.seccion1p,
  },
  {
    id: ID.materia2,
    nombre: "Bases de Datos",
    descripcion: "Modelado entidad-relación y SQL.",
    nivelEducativo: "Universitario",
    profeId: ID.profe2,
    seccionTeoriaId: ID.seccion2t,
    seccionPracticaId: ID.seccion2p,
  },
  {
    id: ID.materia3,
    nombre: "Redes de Computadoras",
    descripcion: "Modelo OSI, TCP/IP y subnetting.",
    nivelEducativo: "Universitario",
    profeId: ID.profe3,
    seccionTeoriaId: ID.seccion3t,
    seccionPracticaId: ID.seccion3p,
  },
];

async function limpiar(): Promise<void> {
  const tablas = [
    "notas",
    "asistencias",
    "entregas",
    "actividades",
    "rubricas",
    "contenidos",
    "secciones",
    "inscripciones",
    "claves_matriculacion",
    "materia_profesores",
    "materias",
    "sesiones",
    "profesores",
    "usuarios",
  ];
  for (const t of tablas) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`);
  }
}

async function main(): Promise<void> {
  console.log("Limpiando datos existentes...");
  await limpiar();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  console.log("Creando usuarios (admin + profesores + alumnos)...");
  await prisma.usuario.createMany({
    data: [
      { id: ID.admin, nombre: "Admin IES Santa Fe", email: "admin@ies.edu", password_hash: passwordHash, rol: "ADMIN" },
      ...profesores.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        email: p.email,
        password_hash: passwordHash,
        rol: "PROFESOR" as const,
      })),
      ...alumnos.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        email: a.email,
        password_hash: passwordHash,
        rol: "ALUMNO" as const,
      })),
    ],
  });

  console.log("Creando perfiles de profesor...");
  await prisma.profesor.createMany({
    data: profesores.map((p) => ({
      id: randomUUID(),
      usuario_id: p.id,
      tipo_profesor: "TITULAR" as const,
    })),
  });

  console.log("Creando materias y asignaciones...");
  await prisma.materia.createMany({
    data: materias.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      descripcion: m.descripcion,
      nivel_educativo: m.nivelEducativo,
      activa: true,
    })),
  });

  // Profesores asignados a cada materia
  for (const m of materias) {
    const profe = await prisma.profesor.findUnique({ where: { usuario_id: m.profeId } });
    if (!profe) throw new Error(`Profesor de ${m.nombre} no encontrado`);
    await prisma.materiaProfesor.create({
      data: { materia_id: m.id, profesor_id: profe.id, activo: true },
    });
  }

  console.log("Creando secciones...");
  await prisma.seccion.createMany({
    data: [
      { id: ID.seccion1t, materia_id: ID.materia1, nombre: "Teoría de POO", descripcion: "Conceptos de objetos y clases", tipo: "TEORIA", orden: 1 },
      { id: ID.seccion1p, materia_id: ID.materia1, nombre: "Práctica de Java", descripcion: "Ejercicios de estructuras de datos", tipo: "PRACTICA", orden: 2 },
      { id: ID.seccion2t, materia_id: ID.materia2, nombre: "Modelado de Datos", descripcion: "Diseño de esquemas", tipo: "TEORIA", orden: 1 },
      { id: ID.seccion2p, materia_id: ID.materia2, nombre: "Laboratorio SQL", descripcion: "Consultas y normalización", tipo: "PRACTICA", orden: 2 },
      { id: ID.seccion3t, materia_id: ID.materia3, nombre: "Fundamentos de Redes", descripcion: "Modelo OSI y TCP/IP", tipo: "TEORIA", orden: 1 },
      { id: ID.seccion3p, materia_id: ID.materia3, nombre: "Práctica de Subnetting", descripcion: "Cálculo de subredes", tipo: "PRACTICA", orden: 2 },
    ],
  });

  console.log("Creando contenidos...");
  await prisma.contenido.createMany({
    data: [
      { seccion_id: ID.seccion1t, tipo: "TEXTO", titulo: "Clases y objetos", texto_contenido: "Introducción a la programación orientada a objetos: clases, objetos, atributos y métodos.", rag_indexado: true },
      { seccion_id: ID.seccion1t, tipo: "PDF", titulo: "Herencia y polimorfismo", archivo_url: "https://example.com/herencia.pdf", archivo_nombre: "herencia.pdf", archivo_formato: "pdf", rag_indexado: true },
      { seccion_id: ID.seccion1p, tipo: "TEXTO", titulo: "Ejercicios de listas", texto_contenido: "Implementación de listas enlazadas simples y dobles.", rag_indexado: false },
      { seccion_id: ID.seccion2t, tipo: "TEXTO", titulo: "Diagramas entidad-relación", texto_contenido: "Entidades, atributos y relaciones. Claves primarias y foráneas.", rag_indexado: true },
      { seccion_id: ID.seccion2p, tipo: "TEXTO", titulo: "Normalización", texto_contenido: "Primera, segunda y tercera forma normal.", rag_indexado: false },
      { seccion_id: ID.seccion3t, tipo: "TEXTO", titulo: "Modelo OSI", texto_contenido: "Las 7 capas del modelo OSI y sus funciones.", rag_indexado: true },
      { seccion_id: ID.seccion3p, tipo: "TEXTO", titulo: "Subnetting", texto_contenido: "Máscaras de subred, VLSM y CIDR.", rag_indexado: false },
    ],
  });

  console.log("Creando rúbricas...");
  const rubricaPorMateria: Record<string, string> = {};
  for (const m of materias) {
    const profe = await prisma.profesor.findUnique({ where: { usuario_id: m.profeId } });
    if (!profe) continue;
    const rubrica = await prisma.rubrica.create({
      data: {
        profesor_id: profe.id,
        materia_id: m.id,
        nombre: `Rúbrica de ${m.nombre}`,
        descripcion: "Criterios estándar de evaluación",
        criterios: {
          claridad: { peso: 40 },
          correctitud: { peso: 60 },
        },
      },
    });
    rubricaPorMateria[m.id] = rubrica.id;
  }

  console.log("Creando actividades...");
  const actividades: {
    id: string;
    materiaId: string;
    seccionId: string;
    rubricaId: string | null;
    nombre: string;
    consigna: string;
    tipo: "DESARROLLO" | "MULTIPLE_CHOICE" | "CODIGO";
    fechaLimite: Date;
  }[] = [
    { id: randomUUID(), materiaId: ID.materia1, seccionId: ID.seccion1p, rubricaId: rubricaPorMateria[ID.materia1], nombre: "TP1: Listas enlazadas", consigna: "Implementar una lista enlazada simple y sus operaciones.", tipo: "CODIGO", fechaLimite: new Date("2026-09-10") },
    { id: randomUUID(), materiaId: ID.materia1, seccionId: ID.seccion1p, rubricaId: rubricaPorMateria[ID.materia1], nombre: "Parcial: POO", consigna: "Modelar un sistema con herencia y polimorfismo.", tipo: "DESARROLLO", fechaLimite: new Date("2026-09-20") },
    { id: randomUUID(), materiaId: ID.materia2, seccionId: ID.seccion2p, rubricaId: rubricaPorMateria[ID.materia2], nombre: "TP1: Consultas SQL", consigna: "Escribir consultas SQL sobre un esquema dado.", tipo: "DESARROLLO", fechaLimite: new Date("2026-09-12") },
    { id: randomUUID(), materiaId: ID.materia2, seccionId: ID.seccion2p, rubricaId: rubricaPorMateria[ID.materia2], nombre: "Quiz: Normalización", consigna: "Responde el cuestionario de formas normales.", tipo: "MULTIPLE_CHOICE", fechaLimite: new Date("2026-09-18") },
    { id: randomUUID(), materiaId: ID.materia3, seccionId: ID.seccion3p, rubricaId: rubricaPorMateria[ID.materia3], nombre: "TP1: Subnetting", consigna: "Dividir una red en subredes con VLSM.", tipo: "DESARROLLO", fechaLimite: new Date("2026-09-14") },
    { id: randomUUID(), materiaId: ID.materia3, seccionId: ID.seccion3p, rubricaId: rubricaPorMateria[ID.materia3], nombre: "Parcial: TCP/IP", consigna: "Desarrollar sobre el modelo TCP/IP y direccionamiento.", tipo: "DESARROLLO", fechaLimite: new Date("2026-09-22") },
  ];
  await prisma.actividad.createMany({
    data: actividades.map((a) => ({
      id: a.id,
      seccion_id: a.seccionId,
      rubrica_id: a.rubricaId,
      nombre: a.nombre,
      consigna: a.consigna,
      tipo: a.tipo,
      fecha_limite: a.fechaLimite,
      correccion_manual: false,
    })),
  });

  console.log("Inscribiendo alumnos a todas las materias...");
  // Claves de matriculación por materia
  const claveIdPorMateria: Record<string, string> = {};
  for (let i = 0; i < materias.length; i++) {
    const m = materias[i];
    const clave = await prisma.claveMatriculacion.create({
      data: {
        materia_id: m.id,
        clave: `MAT-2026-${String(i + 1).padStart(3, "0")}`,
        activa: true,
        max_usos: 100,
      },
    });
    claveIdPorMateria[m.id] = clave.id;
  }

  for (const alumno of alumnos) {
    for (const m of materias) {
      await prisma.inscripcion.create({
        data: {
          alumno_id: alumno.id,
          materia_id: m.id,
          clave_id: claveIdPorMateria[m.id],
        },
      });
    }
  }

  console.log("Creando notas...");
  // Notas para cada alumno en cada materia (2 periodos)
  const notasSeed = [
    [8, 7], [6, 8], [9, 9], [7, 6], [5, 7], [8, 8], [4, 5], [9, 8], [6, 6], [7, 9],
  ];
  let idx = 0;
  for (const alumno of alumnos) {
    const [n1, n2] = notasSeed[idx % notasSeed.length];
    for (const m of materias) {
      const profe = await prisma.profesor.findUnique({ where: { usuario_id: m.profeId } });
      if (!profe) continue;
      await prisma.nota.createMany({
        data: [
          { alumno_id: alumno.id, materia_id: m.id, profesor_id: profe.id, periodo: "1er Parcial", calificacion: n1, observaciones: null },
          { alumno_id: alumno.id, materia_id: m.id, profesor_id: profe.id, periodo: "TP Final", calificacion: n2, observaciones: null },
        ],
      });
    }
    idx++;
  }

  console.log("Creando asistencias...");
  const fechasClase = [
    new Date("2026-08-03"),
    new Date("2026-08-10"),
    new Date("2026-08-17"),
    new Date("2026-08-24"),
    new Date("2026-08-31"),
  ];
  const estadosAsistencia = ["PRESENTE", "PRESENTE", "AUSENTE", "TARDANZA", "JUSTIFICADO"];
  for (const m of materias) {
    const profe = await prisma.profesor.findUnique({ where: { usuario_id: m.profeId } });
    if (!profe) continue;
    let j = 0;
    for (const alumno of alumnos) {
      const registros = fechasClase.map((fecha, k) => ({
        alumno_id: alumno.id,
        materia_id: m.id,
        profesor_id: profe.id,
        fecha_clase: fecha,
        estado: estadosAsistencia[(j + k) % estadosAsistencia.length] as "PRESENTE" | "AUSENTE" | "TARDANZA" | "JUSTIFICADO",
      }));
      await prisma.asistencia.createMany({ data: registros });
      j++;
    }
  }

  console.log("Creando entregas de actividades...");
  // Algunos alumnos entregan algunas actividades. Estados varios.
  const entregasDef: {
    alumnoId: string;
    actividadIdx: number;
    respuestaTexto?: string;
    publicado?: boolean;
    califFinal?: number;
    feedbackFinal?: string;
    califIa?: number;
    feedbackIa?: string;
  }[] = [
    { alumnoId: ID.alumno1, actividadIdx: 0, respuestaTexto: "Lista enlazada implementada con nodos.", publicado: true, califFinal: 9, feedbackFinal: "Muy buen trabajo." },
    { alumnoId: ID.alumno2, actividadIdx: 0, respuestaTexto: "Implementación básica de lista.", publicado: false },
    { alumnoId: ID.alumno3, actividadIdx: 0, respuestaTexto: "Lista con métodos de inserción y borrado.", publicado: false, califIa: 7.5, feedbackIa: "Correcto, revisar manejo de bordes." },
    { alumnoId: ID.alumno4, actividadIdx: 1, respuestaTexto: "Modelado de un sistema de biblioteca.", publicado: true, califFinal: 8, feedbackFinal: "Bien, falta el caso de préstamo múltiple." },
    { alumnoId: ID.alumno5, actividadIdx: 2, respuestaTexto: "SELECT con JOIN y agregación.", publicado: false },
    { alumnoId: ID.alumno6, actividadIdx: 2, respuestaTexto: "Consultas normalizadas.", publicado: false, califIa: 6, feedbackIa: "Revisar la normalización a 3FN." },
    { alumnoId: ID.alumno7, actividadIdx: 3, respuestaTexto: "Cuestionario resuelto.", publicado: true, califFinal: 10, feedbackFinal: "Perfecto." },
    { alumnoId: ID.alumno8, actividadIdx: 4, respuestaTexto: "División en subredes VLSM.", publicado: false },
    { alumnoId: ID.alumno9, actividadIdx: 4, respuestaTexto: "Cálculo de subredes /26.", publicado: false, califIa: 8, feedbackIa: "Correcto el subnetting." },
    { alumnoId: ID.alumno10, actividadIdx: 5, respuestaTexto: "Desarrollo sobre TCP/IP.", publicado: false },
  ];
  for (const e of entregasDef) {
    const actividad = actividades[e.actividadIdx];
    if (!actividad) continue;
    await prisma.entrega.create({
      data: {
        actividad_id: actividad.id,
        alumno_id: e.alumnoId,
        respuesta_texto: e.respuestaTexto,
        entregado_en: new Date("2026-08-28T15:00:00Z"),
        feedback_ia: e.feedbackIa ?? null,
        calificacion_ia: e.califIa ?? null,
        feedback_final: e.feedbackFinal ?? null,
        calificacion_final: e.califFinal ?? null,
        publicado: e.publicado ?? false,
        revision_tipo: e.publicado ? "MANUAL" : null,
        publicado_en: e.publicado ? new Date("2026-08-30T10:00:00Z") : null,
      },
    });
  }

  console.log("✅ Seed completado correctamente.");
  console.log("");
  console.log("Usuarios de acceso (password: Clave1234):");
  console.log("  ADMIN   : admin@ies.edu");
  profesores.forEach((p) => console.log(`  PROFESOR: ${p.email} (${p.nombre})`));
  console.log("  Alumnos : alumno1@ies.edu ... alumno10@ies.edu");
  console.log("");
  console.log("Materias:");
  materias.forEach((m) => console.log(`  - ${m.nombre} → ${m.descripcion}`));
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
