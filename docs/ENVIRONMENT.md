# Realty Tunax — Environment Configuration Guide

## Overview

This document is the canonical reference for all environment variables used across the monorepo. Every variable has exactly one scope:

| Scope | Description | Rule |
|---|---|---|
| **Secret / Server** | Never reaches browser or mobile client | No `NEXT_PUBLIC_` or `EXPO_PUBLIC_` prefix |
| **Web Public** | Safe to expose in browser bundle | Must use `NEXT_PUBLIC_` prefix |
| **Mobile Public** | Safe to expose in Expo/RN bundle | Must use `EXPO_PUBLIC_` prefix |

## Repository Layout

```
.env.example                      ← canonical full reference (all apps)
apps/api/.env.example             ← API + Worker variables (detailed)
apps/api/.env                     ← local dev values (gitignored)
apps/web/.env.example             ← Web variables (detailed)
apps/web/.env.local               ← local dev values (gitignored)
apps/mobile/.env.example          ← Mobile variables (if applicable)
apps/mobile/.env                  ← local dev values (gitignored)
```

## Per-App Variable Reference

### API (NestJS — apps/api/)

| Variable | Required | Secret | Default | Notes |
|---|---|---|---|---|
| `NODE_ENV` | No | No | `development` | `development \| production \| test` |
| `PORT` | No | No | `3001` | API HTTP port |
| `CORS_ORIGINS` | Prod only | No | `http://localhost:3000` | Comma-separated allowed origins |
| `FEATURE_SWAGGER_ENABLED` | No | No | absent | `true` = enable `/api/docs`. **Must be absent in prod.** |
| `FEATURE_SEED_USERS` | No | No | absent | `true` = seed dev accounts on boot. **Must be absent in prod.** |
| `DATABASE_URL` | Yes | Yes | — | PostgreSQL connection URL. Prod: `?sslmode=require` |
| `REDIS_URL` | Yes | Yes | — | Redis URL. Prod: `rediss://` (TLS) |
| `INTERNAL_API_KEYS` | Yes | Yes | — | Comma-separated internal API keys (worker→API auth) |
| `JWT_ACCESS_SECRET` | Yes | Yes | — | ≥32 random chars. Generate: `openssl rand -base64 48` |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | No | No | `24h` | Recommend `1h` in production |
| `AWS_ACCESS_KEY_ID` | Yes | Yes | — | IAM key scoped to S3 bucket only |
| `AWS_SECRET_ACCESS_KEY` | Yes | Yes | — | IAM secret |
| `AWS_REGION` | Yes | No | — | e.g. `eu-north-1` |
| `AWS_BUCKET_NAME` | Yes | No | — | S3 bucket name |
| `S3_PUBLIC_BASE_URL` | No | No | derived | CloudFront or custom CDN URL |

### Worker (NestJS ApplicationContext — apps/worker/)

| Variable | Required | Secret | Notes |
|---|---|---|---|
| `REDIS_URL` | Yes | Yes | Same as API |
| `INTERNAL_API_KEY` | Yes | Yes | Single key from `INTERNAL_API_KEYS` list |
| `INTERNAL_API_BASE_URL` | Yes | No | URL of the API service (e.g. `https://api.yourdomain.com`) |

### Web (Next.js — apps/web/)

| Variable | Required | Secret | Browser-visible | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | No | Yes | API base URL for browser fetch |
| `NEXT_PUBLIC_APP_NAME` | No | No | Yes | App display name |
| `NEXT_PUBLIC_S3_CDN_BASE_URL` | No | No | Yes | Optional CDN URL for media |
| `API_BASE_URL_SERVER` | Yes | No | No | Internal API URL for server-side Next.js calls |
| `INTERNAL_API_KEY` | Yes | Yes | No | Key for `/api/proxy/*` Route Handlers |

### Mobile (Expo — apps/mobile/)

| Variable | Required | Secret | Notes |
|---|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Yes | No | API base URL. Falls back to `http://localhost:3001` in local dev. |

## Local Development Setup

### First-time setup

```bash
# API
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — fill in your local DB password, AWS key, etc.

# Web
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local — usually no changes needed for local dev

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
# Edit apps/mobile/.env if needed
```

### Start local services

```bash
# Set POSTGRES_PASSWORD and pgAdmin credentials before starting Docker
export POSTGRES_PASSWORD="your-strong-local-password"
export PGADMIN_DEFAULT_EMAIL="admin@local.dev"
export PGADMIN_DEFAULT_PASSWORD="your-pgadmin-password"

docker compose up -d postgres_gis redis
```

### Run migrations

```bash
cd apps/api
npm run migration:run
```

### Start apps

```bash
# Terminal 1 — API
cd apps/api && npm run start:dev

# Terminal 2 — Worker
cd apps/worker && npm run start:dev

# Terminal 3 — Web
cd apps/web && npm run dev
```

## Production Configuration Rules

The API enforces these rules at boot time (`validateEnv()`). Violating any of them causes an immediate crash with a clear error message:

1. `JWT_ACCESS_SECRET` must be ≥32 characters
2. `JWT_ACCESS_SECRET` must not contain `dev`, `change-me`, `secret`, `example`, or `arep-dev`
3. `DATABASE_URL` must not point to `localhost` or `127.0.0.1`
4. `CORS_ORIGINS` must be set
5. `FEATURE_SEED_USERS` must not be `true`
6. `FEATURE_SWAGGER_ENABLED` must not be `true`

The web validates at build time (`next.config.ts`) that `API_BASE_URL_SERVER`, `INTERNAL_API_KEY`, and `NEXT_PUBLIC_API_BASE_URL` are present.

## Secret Generation Reference

```bash
# JWT secret (48 bytes, base64)
openssl rand -base64 48

# Internal API key (32 bytes, hex)
openssl rand -hex 32

# Database password (32 bytes, base64)
openssl rand -base64 32

# pgAdmin password (16 bytes, hex)
openssl rand -hex 16
```

## Secret Scope Diagram

```
Browser / Mobile Client
  │  Can only see:
  │    NEXT_PUBLIC_API_BASE_URL
  │    NEXT_PUBLIC_APP_NAME
  │    NEXT_PUBLIC_S3_CDN_BASE_URL
  │    EXPO_PUBLIC_API_BASE_URL
  │
Next.js Server (SSR / Route Handlers)
  │  Additionally sees:
  │    API_BASE_URL_SERVER
  │    INTERNAL_API_KEY
  │
NestJS API
  │  Sees all API vars:
  │    DATABASE_URL, REDIS_URL, JWT_ACCESS_SECRET
  │    AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
  │    INTERNAL_API_KEYS, CORS_ORIGINS
  │
Worker
     Sees: REDIS_URL, INTERNAL_API_KEY, INTERNAL_API_BASE_URL
```
