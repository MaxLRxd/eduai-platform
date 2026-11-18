-- El nivel de comprension puede quedar sin evaluar: antes el tutor guardaba 0 y todo el tema figuraba como critico.
ALTER TABLE "analytics_comprension_temas" ALTER COLUMN "nivel_comprension" DROP NOT NULL;

-- Los registros que el tutor creo con 0 por falta de dato no son una medicion real.
UPDATE "analytics_comprension_temas" SET "nivel_comprension" = NULL WHERE "nivel_comprension" = 0 AND "total_errores" = 0;
