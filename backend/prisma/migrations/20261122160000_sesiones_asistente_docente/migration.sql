CREATE TABLE "sesiones_asistente_docente" (
  "id" UUID NOT NULL,
  "profesor_id" UUID NOT NULL,
  "materia_id" UUID NOT NULL,
  "titulo" VARCHAR(200),
  "iniciada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cerrada_en" TIMESTAMP(3),
  CONSTRAINT "sesiones_asistente_docente_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sesiones_asistente_docente_profesor_id_materia_id_idx" ON "sesiones_asistente_docente"("profesor_id", "materia_id");

CREATE TABLE "mensajes_asistente_docente" (
  "id" UUID NOT NULL,
  "sesion_id" UUID NOT NULL,
  "rol" "RolMensajeIA" NOT NULL,
  "contenido" TEXT NOT NULL,
  "sources" JSONB,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mensajes_asistente_docente_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mensajes_asistente_docente_sesion_id_idx" ON "mensajes_asistente_docente"("sesion_id");

ALTER TABLE "sesiones_asistente_docente"
  ADD CONSTRAINT "sesiones_asistente_docente_profesor_id_fkey"
  FOREIGN KEY ("profesor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sesiones_asistente_docente"
  ADD CONSTRAINT "sesiones_asistente_docente_materia_id_fkey"
  FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mensajes_asistente_docente"
  ADD CONSTRAINT "mensajes_asistente_docente_sesion_id_fkey"
  FOREIGN KEY ("sesion_id") REFERENCES "sesiones_asistente_docente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
