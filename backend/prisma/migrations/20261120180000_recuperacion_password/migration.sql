-- Recuperación de contraseña por correo: enlaces de un solo uso, guardados como hash.
CREATE TABLE "tokens_recuperacion" (
  "id" UUID NOT NULL,
  "usuario_id" UUID NOT NULL,
  "token_hash" VARCHAR(255) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "usado_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tokens_recuperacion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tokens_recuperacion_token_hash_key" ON "tokens_recuperacion"("token_hash");
CREATE INDEX "tokens_recuperacion_usuario_id_idx" ON "tokens_recuperacion"("usuario_id");

ALTER TABLE "tokens_recuperacion"
  ADD CONSTRAINT "tokens_recuperacion_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
