# syntax=docker/dockerfile:1

# ---- Builder: install all deps, generate Prisma client, compile TS ----
FROM node:22-slim AS builder
WORKDIR /app

# Prisma needs openssl on the slim image
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Runner: production deps only + compiled output ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

# Bring over the generated Prisma client and compiled JS
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 5001
# Apply pending migrations, then serve — safe to run on every boot
# (migrate deploy is a no-op when the schema is already current).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
