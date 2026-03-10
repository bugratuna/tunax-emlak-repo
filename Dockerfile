FROM node:20-bookworm-slim AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

COPY . .

RUN npm install
RUN cd apps/api && npm install
RUN cd apps/worker && npm install
RUN cd apps/web && npm install

RUN cd apps/api && npm run build
RUN cd apps/worker && npm run build
RUN cd apps/web && npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

COPY --from=builder /app /app

EXPOSE 3000 4000

CMD ["npm", "run", "start:all:prod"]