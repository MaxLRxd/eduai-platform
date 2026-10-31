-- Metrica de latencia del tutor: tiempo hasta la primera respuesta visible.
ALTER TABLE "mensajes_ia" ADD COLUMN "primer_token_ms" INTEGER;
