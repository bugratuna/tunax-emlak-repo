FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY . .

# Root dependencies
RUN npm install

# App dependencies
RUN cd apps/api && npm install
RUN cd apps/worker && npm install
RUN cd apps/web && npm install

# Build apps
RUN cd apps/api && npm run build
RUN cd apps/worker && npm run build
RUN cd apps/web && npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app /app

EXPOSE 3000 4000

CMD ["npm", "run", "start:all:prod"]