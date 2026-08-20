-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ALUMNO', 'PROFESOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "TipoProfesor" AS ENUM ('TITULAR', 'ADJUNTO');

-- CreateEnum
CREATE TYPE "TipoSeccion" AS ENUM ('TEORIA', 'PRACTICA');

-- CreateEnum
CREATE TYPE "TipoContenido" AS ENUM ('TEXTO', 'PDF', 'DOCX', 'PPTX', 'IMAGEN', 'VIDEO');

-- CreateEnum
CREATE TYPE "TipoActividad" AS ENUM ('MULTIPLE_CHOICE', 'DESARROLLO', 'ARCHIVO', 'CODIGO');

-- CreateEnum
CREATE TYPE "RevisionTipo" AS ENUM ('IA', 'MANUAL');

-- CreateEnum
CREATE TYPE "ModoSesionIA" AS ENUM ('NORMAL', 'SOCRATIC', 'HINTS');

-- CreateEnum
CREATE TYPE "RolMensajeIA" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "EstadoAsistencia" AS ENUM ('PRESENTE', 'AUSENTE', 'TARDANZA', 'JUSTIFICADO');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('ASISTENCIA', 'NOTAS', 'INTERACCIONES');

-- CreateEnum
CREATE TYPE "NivelSeveridad" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "TipoErrorDuda" AS ENUM ('ERROR', 'DUDA');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('ENTREGA', 'FEEDBACK', 'ALERTA', 'MENSAJE');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profesores" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "tipo_profesor" "TipoProfesor" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profesores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materias" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "nivel_educativo" VARCHAR(100) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materia_profesores" (
    "id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "profesor_id" UUID NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "asignado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "desasignado_en" TIMESTAMP(3),

    CONSTRAINT "materia_profesores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claves_matriculacion" (
    "id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "clave" VARCHAR(50) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "vencimiento" TIMESTAMP(3),
    "max_usos" INTEGER,
    "usos_actuales" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocada_en" TIMESTAMP(3),

    CONSTRAINT "claves_matriculacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscripciones" (
    "id" UUID NOT NULL,
    "alumno_id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "clave_id" UUID NOT NULL,
    "inscripto_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secciones" (
    "id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoSeccion" NOT NULL,
    "orden" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contenidos" (
    "id" UUID NOT NULL,
    "seccion_id" UUID NOT NULL,
    "tipo" "TipoContenido" NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "texto_contenido" TEXT,
    "archivo_url" TEXT,
    "archivo_nombre" VARCHAR(255),
    "archivo_formato" VARCHAR(20),
    "archivo_tamano_kb" INTEGER,
    "rag_indexado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contenidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubricas" (
    "id" UUID NOT NULL,
    "profesor_id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "criterios" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rubricas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" UUID NOT NULL,
    "seccion_id" UUID NOT NULL,
    "rubrica_id" UUID,
    "nombre" VARCHAR(200) NOT NULL,
    "consigna" TEXT NOT NULL,
    "tipo" "TipoActividad" NOT NULL,
    "opciones_mc" JSONB,
    "formatos_permitidos" VARCHAR(100),
    "fecha_limite" TIMESTAMP(3) NOT NULL,
    "correccion_manual" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entregas" (
    "id" UUID NOT NULL,
    "actividad_id" UUID NOT NULL,
    "alumno_id" UUID NOT NULL,
    "respuesta_texto" TEXT,
    "respuesta_codigo" TEXT,
    "archivo_url" TEXT,
    "archivo_nombre" VARCHAR(255),
    "entregado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feedback_ia" TEXT,
    "calificacion_ia" DECIMAL(5,2),
    "feedback_final" TEXT,
    "calificacion_final" DECIMAL(5,2),
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "revision_tipo" "RevisionTipo",
    "publicado_en" TIMESTAMP(3),
    "feedback_revisado_alumno" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "entregas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_ia" (
    "id" UUID NOT NULL,
    "alumno_id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "modo" "ModoSesionIA" NOT NULL,
    "iniciada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada_en" TIMESTAMP(3),

    CONSTRAINT "sesiones_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_ia" (
    "id" UUID NOT NULL,
    "sesion_id" UUID NOT NULL,
    "rol" "RolMensajeIA" NOT NULL,
    "prompt_original" TEXT,
    "prompt_depurado" TEXT,
    "contenido" TEXT NOT NULL,
    "tokens_prompt" INTEGER,
    "tokens_respuesta" INTEGER,
    "tiempo_respuesta_ms" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas_frecuentes" (
    "id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "pregunta" TEXT NOT NULL,
    "respuesta" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preguntas_frecuentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas" (
    "id" UUID NOT NULL,
    "alumno_id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "profesor_id" UUID NOT NULL,
    "periodo" VARCHAR(100) NOT NULL,
    "calificacion" DECIMAL(5,2) NOT NULL,
    "observaciones" TEXT,
    "registrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editado_en" TIMESTAMP(3),

    CONSTRAINT "notas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistencias" (
    "id" UUID NOT NULL,
    "alumno_id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "profesor_id" UUID NOT NULL,
    "fecha_clase" DATE NOT NULL,
    "estado" "EstadoAsistencia" NOT NULL,
    "registrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editado_en" TIMESTAMP(3),

    CONSTRAINT "asistencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_comprension_temas" (
    "id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "seccion_id" UUID,
    "total_consultas" INTEGER NOT NULL,
    "total_errores" INTEGER NOT NULL,
    "nivel_comprension" DECIMAL(4,2) NOT NULL,
    "periodo" VARCHAR(50) NOT NULL,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_comprension_temas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas_riesgo_academico" (
    "id" UUID NOT NULL,
    "alumno_id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "tipo_alerta" "TipoAlerta" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "nivel_severidad" "NivelSeveridad" NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "generada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resuelta_en" TIMESTAMP(3),

    CONSTRAINT "alertas_riesgo_academico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "errores_dudas_frecuentes" (
    "id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "seccion_id" UUID,
    "tipo" "TipoErrorDuda" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "frecuencia" INTEGER NOT NULL,
    "periodo" VARCHAR(50) NOT NULL,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "errores_dudas_frecuentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "referencia_tipo" VARCHAR(50),
    "referencia_id" UUID,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leida_en" TIMESTAMP(3),

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profesores_usuario_id_key" ON "profesores"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_token_hash_key" ON "sesiones"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "materia_profesores_materia_id_profesor_id_key" ON "materia_profesores"("materia_id", "profesor_id");

-- CreateIndex
CREATE UNIQUE INDEX "claves_matriculacion_clave_key" ON "claves_matriculacion"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_alumno_id_materia_id_key" ON "inscripciones"("alumno_id", "materia_id");

-- CreateIndex
CREATE UNIQUE INDEX "entregas_actividad_id_alumno_id_key" ON "entregas"("actividad_id", "alumno_id");

-- CreateIndex
CREATE INDEX "mensajes_ia_sesion_id_idx" ON "mensajes_ia"("sesion_id");

-- CreateIndex
CREATE UNIQUE INDEX "notas_alumno_id_materia_id_periodo_key" ON "notas"("alumno_id", "materia_id", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "asistencias_alumno_id_materia_id_fecha_clase_key" ON "asistencias"("alumno_id", "materia_id", "fecha_clase");

-- CreateIndex
CREATE INDEX "analytics_comprension_temas_materia_id_idx" ON "analytics_comprension_temas"("materia_id");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_idx" ON "notificaciones"("usuario_id");

-- AddForeignKey
ALTER TABLE "profesores" ADD CONSTRAINT "profesores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materia_profesores" ADD CONSTRAINT "materia_profesores_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materia_profesores" ADD CONSTRAINT "materia_profesores_profesor_id_fkey" FOREIGN KEY ("profesor_id") REFERENCES "profesores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claves_matriculacion" ADD CONSTRAINT "claves_matriculacion_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_clave_id_fkey" FOREIGN KEY ("clave_id") REFERENCES "claves_matriculacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secciones" ADD CONSTRAINT "secciones_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contenidos" ADD CONSTRAINT "contenidos_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubricas" ADD CONSTRAINT "rubricas_profesor_id_fkey" FOREIGN KEY ("profesor_id") REFERENCES "profesores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubricas" ADD CONSTRAINT "rubricas_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_rubrica_id_fkey" FOREIGN KEY ("rubrica_id") REFERENCES "rubricas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_ia" ADD CONSTRAINT "sesiones_ia_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_ia" ADD CONSTRAINT "sesiones_ia_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_ia" ADD CONSTRAINT "mensajes_ia_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesiones_ia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas_frecuentes" ADD CONSTRAINT "preguntas_frecuentes_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_profesor_id_fkey" FOREIGN KEY ("profesor_id") REFERENCES "profesores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_profesor_id_fkey" FOREIGN KEY ("profesor_id") REFERENCES "profesores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_comprension_temas" ADD CONSTRAINT "analytics_comprension_temas_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_comprension_temas" ADD CONSTRAINT "analytics_comprension_temas_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_riesgo_academico" ADD CONSTRAINT "alertas_riesgo_academico_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_riesgo_academico" ADD CONSTRAINT "alertas_riesgo_academico_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "errores_dudas_frecuentes" ADD CONSTRAINT "errores_dudas_frecuentes_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "errores_dudas_frecuentes" ADD CONSTRAINT "errores_dudas_frecuentes_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
