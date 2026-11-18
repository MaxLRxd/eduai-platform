-- Niveles de desempeno de una rubrica (Excelente, Bueno...). Las rubricas existentes quedan sin niveles.
ALTER TABLE "rubricas" ADD COLUMN "niveles" JSONB;
