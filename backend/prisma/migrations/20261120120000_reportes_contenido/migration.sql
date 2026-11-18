-- CU-A02 (5A): reportes de archivos que no abren o estan danados.
CREATE TABLE "reportes_contenido" (
  "id" UUID NOT NULL,
  "contenido_id" UUID NOT NULL,
  "alumno_id" UUID NOT NULL,
  "motivo" VARCHAR(300),
  "reportado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resuelto_en" TIMESTAMP(3),
  CONSTRAINT "reportes_contenido_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reportes_contenido_contenido_id_alumno_id_key" ON "reportes_contenido"("contenido_id", "alumno_id");
CREATE INDEX "reportes_contenido_contenido_id_idx" ON "reportes_contenido"("contenido_id");

ALTER TABLE "reportes_contenido"
  ADD CONSTRAINT "reportes_contenido_contenido_id_fkey"
  FOREIGN KEY ("contenido_id") REFERENCES "contenidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reportes_contenido"
  ADD CONSTRAINT "reportes_contenido_alumno_id_fkey"
  FOREIGN KEY ("alumno_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
