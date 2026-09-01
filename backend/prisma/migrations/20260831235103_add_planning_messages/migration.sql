-- CreateEnum
CREATE TYPE "EstadoPlanningClase" AS ENUM ('PLANIFICADO', 'PUBLICADO');

-- CreateTable
CREATE TABLE "planning_clases" (
    "id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "fecha_clase" DATE NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "contenido" TEXT,
    "estado" "EstadoPlanningClase" NOT NULL DEFAULT 'PLANIFICADO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planning_clases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversaciones" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada_en" TIMESTAMP(3),

    CONSTRAINT "conversaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversacion_miembros" (
    "id" UUID NOT NULL,
    "conversacion_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "unido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversacion_miembros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_directos" (
    "id" UUID NOT NULL,
    "conversacion_id" UUID NOT NULL,
    "emisor_id" UUID NOT NULL,
    "contenido" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "enviado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_directos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_broadcast" (
    "id" UUID NOT NULL,
    "emisor_id" UUID NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "contenido" TEXT NOT NULL,
    "dirigido_a" "Rol",
    "enviado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutions" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "logo_url" VARCHAR(500),
    "color_primario" VARCHAR(20),
    "color_secundario" VARCHAR(20),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "planning_clases_materia_id_fecha_clase_key" ON "planning_clases"("materia_id", "fecha_clase");

-- CreateIndex
CREATE UNIQUE INDEX "conversacion_miembros_conversacion_id_usuario_id_key" ON "conversacion_miembros"("conversacion_id", "usuario_id");

-- CreateIndex
CREATE INDEX "mensajes_directos_conversacion_id_idx" ON "mensajes_directos"("conversacion_id");

-- AddForeignKey
ALTER TABLE "planning_clases" ADD CONSTRAINT "planning_clases_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversacion_miembros" ADD CONSTRAINT "conversacion_miembros_conversacion_id_fkey" FOREIGN KEY ("conversacion_id") REFERENCES "conversaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversacion_miembros" ADD CONSTRAINT "conversacion_miembros_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_directos" ADD CONSTRAINT "mensajes_directos_conversacion_id_fkey" FOREIGN KEY ("conversacion_id") REFERENCES "conversaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_directos" ADD CONSTRAINT "mensajes_directos_emisor_id_fkey" FOREIGN KEY ("emisor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_broadcast" ADD CONSTRAINT "mensajes_broadcast_emisor_id_fkey" FOREIGN KEY ("emisor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
