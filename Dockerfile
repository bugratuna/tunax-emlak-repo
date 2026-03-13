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

# Copy built artefacts and transfer ownership to the built-in non-root `node`
# user (uid 1000). Running as root inside a container is unnecessary and
# increases blast radius if the app is compromised.
COPY --from=builder --chown=node:node /app /app
USER node

EXPOSE 3000 4000

CMD ["npm", "run", "start:all:prod"]