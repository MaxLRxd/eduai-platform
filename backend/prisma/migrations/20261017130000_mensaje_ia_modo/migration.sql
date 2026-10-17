-- Persiste el modo con el que se respondio cada mensaje de tutor IA.
-- Nullable: las filas historicas quedan sin modo.
ALTER TABLE "mensajes_ia" ADD COLUMN "modo" "ModoSesionIA";
