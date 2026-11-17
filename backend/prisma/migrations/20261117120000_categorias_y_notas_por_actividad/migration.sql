-- Categorias de calificacion por materia, con peso en la nota final.
CREATE TABLE "categorias_nota" (
  "id" UUID NOT NULL,
  "materia_id" UUID NOT NULL,
  "nombre" VARCHAR(80) NOT NULL,
  "peso" DECIMAL(5,2) NOT NULL,
  "orden" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "categorias_nota_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categorias_nota_materia_id_nombre_key" ON "categorias_nota"("materia_id", "nombre");

ALTER TABLE "categorias_nota"
  ADD CONSTRAINT "categorias_nota_materia_id_fkey"
  FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Una nota puede tener nombre de evaluacion, categoria y estar ligada a una actividad.
ALTER TABLE "notas"
  ADD COLUMN "evaluacion" VARCHAR(200) NOT NULL DEFAULT '',
  ADD COLUMN "categoria_id" UUID,
  ADD COLUMN "actividad_id" UUID;

-- Ya no hay una sola nota por (alumno, materia, periodo): puede haber varias evaluaciones por periodo.
DROP INDEX "notas_alumno_id_materia_id_periodo_key";

CREATE INDEX "notas_alumno_id_materia_id_periodo_idx" ON "notas"("alumno_id", "materia_id", "periodo");
CREATE INDEX "notas_categoria_id_idx" ON "notas"("categoria_id");
CREATE UNIQUE INDEX "notas_alumno_id_actividad_id_key" ON "notas"("alumno_id", "actividad_id");

ALTER TABLE "notas"
  ADD CONSTRAINT "notas_categoria_id_fkey"
  FOREIGN KEY ("categoria_id") REFERENCES "categorias_nota"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notas"
  ADD CONSTRAINT "notas_actividad_id_fkey"
  FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id") ON DELETE SET NULL ON UPDATE CASCADE;
