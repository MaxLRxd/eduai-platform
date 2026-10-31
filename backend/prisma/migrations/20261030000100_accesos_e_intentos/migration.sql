-- CU-A02: accesos de alumnos al contenido de la materia.
CREATE TABLE "accesos_contenido" (
    "id" UUID NOT NULL,
    "contenido_id" UUID NOT NULL,
    "alumno_id" UUID NOT NULL,
    "accedido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accesos_contenido_pkey" PRIMARY KEY ("id")
);

-- CU-A11: simulacros corregidos.
CREATE TABLE "intentos_simulacro" (
    "id" UUID NOT NULL,
    "alumno_id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "dificultad" VARCHAR(20) NOT NULL,
    "puntaje" DECIMAL(4,2) NOT NULL,
    "correctas" INTEGER NOT NULL,
    "parciales" INTEGER NOT NULL,
    "incorrectas" INTEGER NOT NULL,
    "sin_responder" INTEGER NOT NULL,
    "detalle" JSONB NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intentos_simulacro_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "accesos_contenido_contenido_id_idx" ON "accesos_contenido"("contenido_id");
CREATE INDEX "accesos_contenido_alumno_id_accedido_en_idx" ON "accesos_contenido"("alumno_id", "accedido_en");
CREATE INDEX "intentos_simulacro_alumno_id_materia_id_creado_en_idx" ON "intentos_simulacro"("alumno_id", "materia_id", "creado_en");

ALTER TABLE "accesos_contenido" ADD CONSTRAINT "accesos_contenido_contenido_id_fkey" FOREIGN KEY ("contenido_id") REFERENCES "contenidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accesos_contenido" ADD CONSTRAINT "accesos_contenido_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "intentos_simulacro" ADD CONSTRAINT "intentos_simulacro_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "intentos_simulacro" ADD CONSTRAINT "intentos_simulacro_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
