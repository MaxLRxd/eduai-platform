-- Las evaluaciones pueden vincularse opcionalmente a una clase de la unidad.
ALTER TABLE "actividades" ADD COLUMN "clase_id" UUID;

CREATE INDEX "actividades_clase_id_idx" ON "actividades"("clase_id");

ALTER TABLE "actividades"
  ADD CONSTRAINT "actividades_clase_id_fkey"
  FOREIGN KEY ("clase_id") REFERENCES "planning_clases"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
