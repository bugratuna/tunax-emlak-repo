FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json apps/api/
COPY apps/worker/package*.json apps/worker/
COPY apps/web/package*.json apps/web/

RUN npm ci

FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build:all

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps ./apps

EXPOSE 3000 4000

CMD ["npm", "run", "start:all:prod"]