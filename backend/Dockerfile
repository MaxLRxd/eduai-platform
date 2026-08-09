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
CMD ["npm", "run", "dev"]

# --- Dependencias de producción ---
FROM base AS prod-deps
RUN npm ci --omit=dev

# --- Build ---
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# --- Producción: imagen mínima ---
FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY package.json ./
EXPOSE 3000
CMD ["npm", "run", "db:deploy", "&&", "node", "dist/index.js"]