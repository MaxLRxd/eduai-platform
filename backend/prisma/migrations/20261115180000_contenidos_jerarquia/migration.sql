-- Jerarquía de contenidos: unidad → clases → archivos.
-- Una clase pertenece opcionalmente a una unidad y un contenido puede colgar de una clase.

ALTER TABLE "planning_clases" ADD COLUMN "seccion_id" UUID;
ALTER TABLE "contenidos" ADD COLUMN "clase_id" UUID;

CREATE INDEX "planning_clases_seccion_id_idx" ON "planning_clases"("seccion_id");
CREATE INDEX "contenidos_clase_id_idx" ON "contenidos"("clase_id");

ALTER TABLE "planning_clases"
  ADD CONSTRAINT "planning_clases_seccion_id_fkey"
  FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "contenidos"
  ADD CONSTRAINT "contenidos_clase_id_fkey"
  FOREIGN KEY ("clase_id") REFERENCES "planning_clases"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
