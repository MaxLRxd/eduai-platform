# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

# --- Desarrollo: hot reload ---
FROM base AS dev
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# --- Build (compila TS) ---
FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

# --- Dependencias de produccion ---
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Produccion: imagen minima ---
FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY package.json ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
