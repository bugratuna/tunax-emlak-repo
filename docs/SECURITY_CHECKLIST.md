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
- [ ] **PENDING** Set `JWT_ACCESS_TOKEN_EXPIRES_IN=1h` in production (validateEnv warns if unset/24h)
- [x] Passwords hashed with bcrypt, 10 salt rounds
- [x] PENDING_APPROVAL and SUSPENDED users blocked at login
- [x] PENDING_APPROVAL and SUSPENDED users blocked on every JWT-authenticated request (JwtStrategy re-checks status)
- [x] Global `RolesGuard` applied as `APP_GUARD`
- [x] `InternalApiKeyGuard` on all worker-to-API endpoints
- [x] JWT payload contains `sub`, `email`, `role` only — no sensitive fields
- [x] Dev seed accounts disabled in production — `FEATURE_SEED_USERS` guard implemented
- [x] User enumeration via register fixed — ConflictException no longer echoes the email address
- [!] No refresh token mechanism — risk accepted; mitigate by setting 1h expiry in production

## C. CORS and Security Headers

- [x] CORS origin driven by `CORS_ORIGINS` env var — no hardcoded localhost
- [ ] **PENDING** Set `CORS_ORIGINS=https://yourdomain.com` in production
- [x] Helmet security headers enabled on API (`app.use(helmet())`)
- [x] Security headers on Next.js web (X-Frame-Options, HSTS, Referrer-Policy, etc.)
- [x] HSTS only applied when `NODE_ENV=production` — does not break localhost dev
- [x] CSP header added to Next.js (`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`)

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
- [x] JSON request body capped at 512 KB (`app.use(json({ limit: '512kb' }))` in main.ts)
- [x] `POST /api/listings/:id/photos` — rate-limited: 30 requests / hour per IP
- [!] MIME type from Content-Type header only — no magic bytes validation (low risk: files go to S3, not executed server-side)
- [ ] **PENDING** Verify S3 bucket has "Block all public access" = ON in AWS Console

## F. Database

- [x] `synchronize: false` — no auto-schema changes
- [x] SSL enforced in production (`extra.ssl` conditional)
- [x] Query timeout: 30 seconds (`extra.statement_timeout: 30_000`)
- [x] SQL query logging: only `error` level in production
- [x] Hardcoded fallback URL removed from `data-source.ts`
- [x] `validateEnv()` rejects `DATABASE_URL` pointing to localhost in production
- [x] All query builder WHERE clauses use named parameters — no SQL injection vectors
- [x] `search` query param bounded: `@MaxLength(200)` prevents oversized `ILIKE` patterns
- [x] `consultantId` filter validates UUID v4 format — no arbitrary string accepted
- [ ] **PENDING** Set strong database password in production hosting panel

## G. Infrastructure / Docker

- [x] pgAdmin is local dev only — not in production docker-compose
- [x] Worker has no HTTP server (uses `createApplicationContext()`)
- [x] Worker validates required env vars on boot — fail-fast
- [x] API validates all env vars on boot — fail-fast
- [x] Web validates required vars at build time — build fails if missing
- [x] Dockerfile runner stage uses `USER node` (non-root) + `--chown=node:node` copy
- [x] docker-compose: prominent ⚠️ comments on postgres (5432) and redis (6379) port mappings to remove in production
- [ ] **PENDING** Use `rediss://` (TLS) for Redis URL in production
- [ ] **PENDING** In production: remove or comment out `ports: 5432` and `ports: 6379` from docker-compose / override file
- [ ] **PENDING** EC2 security group: deny inbound 5432 and 6379 from 0.0.0.0/0

## H. Rate Limiting

- [x] `@nestjs/throttler` installed
- [x] `ThrottlerModule` wired in `app.module.ts` — global default 120 req/min per IP
- [x] `ThrottlerGuard` registered as global `APP_GUARD`
- [x] `POST /api/auth/login` — 5 requests / 15 min per IP
- [x] `POST /api/auth/register` — 3 requests / hour per IP
- [x] `POST /api/contact` — 5 requests / 10 min per IP
- [x] `POST /api/leads` — 10 requests / 10 min per IP
- [x] `POST /api/listings/:id/photos` — 30 requests / hour per IP
- [x] Worker-to-API internal endpoints decorated with `@SkipThrottle()`

## I. Input Validation

- [x] Global `ValidationPipe({ whitelist: true, transform: true })` — strips unknown properties
- [x] `forbidNonWhitelisted: true` added — actively rejects (400) requests with unknown fields
- [x] `register` endpoint uses `RegisterDto` for class-validator (was `Record<string,string>`)
- [x] `search` field bounded by `@MaxLength(200)` — caps ILIKE query cost
- [x] `roomCounts` field bounded by `@MaxLength(200)` — caps IN() list construction
- [x] `consultantId` filter: `@IsUUID('4')` — rejects non-UUID strings at validation layer
- [x] XSS: `RichTextRenderer` uses DOMPurify with strict ALLOWED_TAGS/ALLOWED_ATTR whitelist
- [x] JSON-LD in page.tsx uses hardcoded static object — no user data in `dangerouslySetInnerHTML`

## J. Logging

- [x] No secrets logged at startup — `validateEnv()` logs key names only
- [x] DB connection log shows host/port/db/user only — not password
- [x] NestJS default exception filter: 4xx/5xx responses contain `{ statusCode, message }` only — no stack traces
- [ ] **PENDING — MEDIUM** Structured JSON logging (Winston) and log aggregation

---

## Infrastructure Hardening Checklist (Manual — AWS / EC2 / Docker)

These cannot be enforced in code. All must be verified before go-live:

- [ ] EC2 security group: inbound 80/443 allowed only from Cloudflare IP ranges (not 0.0.0.0/0)
- [ ] EC2 security group: port 5432 (PostgreSQL) — DENY from 0.0.0.0/0
- [ ] EC2 security group: port 6379 (Redis) — DENY from 0.0.0.0/0
- [ ] Production docker-compose: remove `ports: 5432` and `ports: 6379` host mappings
- [ ] S3 bucket: "Block all public access" ON; bucket policy allows GetObject only from CloudFront OAC
- [ ] CloudFront distribution in front of S3 for media delivery (not raw S3 URLs in responses)
- [ ] Cloudflare proxy: WAF + DDoS protection + bot score threshold + rate limiting at CDN edge
- [ ] Redis TLS: set `REDIS_URL=rediss://...` (ElastiCache TLS mode or self-managed with stunnel)
- [ ] IAM least privilege: API credentials scoped to `s3:PutObject` + `s3:DeleteObject` on one bucket prefix only
- [ ] Delete old AWS key `AKIA4NKQYDGQTLYVZTSW` from IAM console; generate new key with minimal scope
- [ ] EC2 IMDSv2 enforced: `aws ec2 modify-instance-metadata-options --http-tokens required --instance-id <id>`
- [ ] Enable AWS CloudTrail for IAM and S3 audit logging
- [ ] Ubuntu UFW: `ufw default deny incoming && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 22/tcp && ufw enable`
- [ ] SSH: disable password auth in `/etc/ssh/sshd_config` (`PasswordAuthentication no`); use key pairs only
- [ ] Set `CORS_ORIGINS=https://yourdomain.com` before starting API in production
