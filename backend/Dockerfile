# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=development
COPY package.json package-lock.json* ./

# --- Desarrollo: hot reload ---
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "npm install && npx prisma generate && npx prisma migrate deploy && npm run dev"]

# --- Dependencias de producción ---
FROM base AS prod-deps
RUN npm ci --omit=dev

# --- Build ---
FROM base AS build
RUN npm ci
COPY . .
# El cliente de Prisma se genera a partir del schema: sin esto tsc no encuentra los tipos.
RUN npx prisma generate && npm run build

# --- Producción: imagen mínima ---
FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
# Cliente de Prisma generado en el build (prod-deps no tiene el schema al instalar).
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
# `prisma migrate deploy` lee la URL de la base desde prisma.config.ts.
COPY prisma.config.ts package.json ./
# Sin root en produccion; uploads locales (si no se usa R2) viven en data/uploads.
RUN mkdir -p data/uploads && chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/healthz >/dev/null || exit 1
CMD ["sh", "-c", "npm run db:deploy && node dist/index.js"]