# Realty Tunax — Security Checklist

Use this before every production deployment. All PENDING items must be resolved before go-live.

Legend: [x] PASS  [ ] PENDING  [!] RISK ACCEPTED

---

## A. Secrets and Credentials

- [x] No real secrets in `.env.example` files — replaced with `YOUR_*` placeholders
- [x] `.env` files gitignored in all apps — root, api, web, mobile updated
- [ ] **PENDING** AWS credentials rotated — old key `AKIA4NKQYDGQTLYVZTSW` deleted in IAM console
- [ ] **PENDING** Production JWT_ACCESS_SECRET is 32+ random chars (generate: `openssl rand -base64 48`)
- [ ] **PENDING** Production DB password is strong (32+ chars, random)
- [ ] **PENDING** Production INTERNAL_API_KEY is different from dev key
- [x] pgAdmin credentials read from env vars, not hardcoded
- [ ] **PENDING** No secrets in git history — run: `git log --all -p -- "**/.env*"`

## B. Authentication and Authorization

- [x] JWT secret read from `JWT_ACCESS_SECRET` env var only — no fallback
- [x] JWT expiry configurable via `JWT_ACCESS_TOKEN_EXPIRES_IN`
- [ ] **PENDING** Set `JWT_ACCESS_TOKEN_EXPIRES_IN=1h` in production (currently default 24h)
- [x] Passwords hashed with bcrypt, 10 salt rounds
- [x] PENDING_APPROVAL and SUSPENDED users blocked at login
- [x] Global `RolesGuard` applied as `APP_GUARD`
- [x] `InternalApiKeyGuard` on all worker-to-API endpoints
- [x] JWT payload contains `sub`, `email`, `role` only — no sensitive fields
- [x] Dev seed accounts disabled in production — `FEATURE_SEED_USERS` guard implemented
- [!] No refresh token mechanism — risk accepted; mitigate by setting 1h expiry in production

## C. CORS and Security Headers

- [x] CORS origin driven by `CORS_ORIGINS` env var — no hardcoded localhost
- [ ] **PENDING** Set `CORS_ORIGINS=https://yourdomain.com` in production
- [x] Helmet security headers enabled on API (`app.use(helmet())`)
- [x] Security headers on Next.js web (X-Frame-Options, HSTS, Referrer-Policy, etc.)
- [x] HSTS only applied when `NODE_ENV=production` — does not break localhost dev

## D. Swagger

- [x] Swagger gated by `FEATURE_SWAGGER_ENABLED=true` flag
- [x] `validateEnv()` rejects `FEATURE_SWAGGER_ENABLED=true` in production — app crashes on boot
- [x] Swagger title updated from "AREP API" to "Realty Tunax API"

## E. File Uploads

- [x] MIME type whitelist: jpg, png, webp
- [x] Max file size: 10 MB per file (listing photos), 5 MB (profile photo)
- [x] Max 20 files per upload request
- [x] Listing ownership enforced before upload (403 on consultantId mismatch)
- [x] Presigned URLs used — AWS credentials never sent to client
- [!] MIME type from Content-Type header only — no magic bytes validation (low risk: files go to S3, not executed server-side)
- [ ] **PENDING** Verify S3 bucket has "Block all public access" = ON in AWS Console

## F. Database

- [x] `synchronize: false` — no auto-schema changes
- [x] SSL enforced in production (`extra.ssl` conditional)
- [x] Query timeout: 30 seconds (`extra.statement_timeout: 30_000`)
- [x] SQL query logging: only `error` level in production
- [x] Hardcoded fallback URL removed from `data-source.ts`
- [x] `validateEnv()` rejects `DATABASE_URL` pointing to localhost in production
- [ ] **PENDING** Set strong database password in production hosting panel

## G. Infrastructure

- [x] pgAdmin is local dev only — not in production docker-compose
- [x] Worker has no HTTP server (uses `createApplicationContext()`)
- [x] Worker validates required env vars on boot — fail-fast
- [x] API validates all env vars on boot — fail-fast
- [x] Web validates required vars at build time — build fails if missing
- [ ] **PENDING** Use `rediss://` (TLS) for Redis URL in production

## H. Rate Limiting (Highest Priority Remaining Work)

- [x] `@nestjs/throttler` installed
- [ ] **PENDING — HIGH** Wire `ThrottlerModule` in `app.module.ts`
- [ ] **PENDING — HIGH** Apply rate limit to `POST /api/auth/login` (5 requests / 15 min per IP)
- [ ] **PENDING — HIGH** Apply rate limit to `POST /api/auth/register` (3 requests / hour per IP)
- [ ] **PENDING — HIGH** Apply rate limit to `POST /api/listings/:id/photos` (20 requests / hour per user)

## I. Logging

- [x] No secrets logged at startup — `validateEnv()` logs key names only
- [x] DB connection log shows host/port/db/user only — not password
- [ ] **PENDING — MEDIUM** Structured JSON logging (Winston) and log aggregation
