# Realty Tunax - Production Deployment Runbook

Follow this in order. Do not skip steps.

---

## Phase 0: Before Touching Any Server

### 0.1 Rotate Compromised AWS Credentials (DO THIS FIRST)

The key AKIA4NKQYDGQTLYVZTSW was committed to git. Treat it as permanently compromised.

1. AWS IAM Console > Users > Security credentials > Deactivate then Delete AKIA4NKQYDGQTLYVZTSW
2. Create a new key with minimum permissions only:
   s3:PutObject, s3:GetObject, s3:DeleteObject on arn:aws:s3:::YOUR-BUCKET/* only
3. Store new key in password manager
4. Check AWS CloudTrail for unauthorized use of old key

### 0.2 Generate All Production Secrets

\c095vd1mb6a1A48FLjUx/Z8If8OeusS6NpyocPDkOD5mO66T9PbXzfO0WnHA3lJo
262d10bd3e126abeabc8163c4869eff41c1548cf10f7ab8b0ff922feeb7e9369
7dbe342e1ee95eed7040374a8fedc17177ac123987af34db4ae22d1361d30bbf
EGLayzWmcSlHyg4868B/5GEdMl99md6RYkLtQ6e/jqM=
### 0.3 Provision Production Infrastructure

- [ ] Managed PostgreSQL with PostGIS extension, SSL required
- [ ] Managed Redis with TLS (rediss://)
- [ ] S3 bucket (separate from dev, e.g. tunax-prod) with Block All Public Access = ON
- [ ] Hosting platform for API, Worker, Web

---

## Phase 1: Configure Production Environment Variables

### API service env

\
### Worker service env

\
### Web service env

\
---

## Phase 2: Database Migration

Run BEFORE deploying the API code:

\
> api@0.0.1 migration:show
> typeorm-ts-node-commonjs -d src/database/data-source.ts migration:show

Error during migration show:

> api@0.0.1 migration:run
> typeorm-ts-node-commonjs -d src/database/data-source.ts migration:run

Error during migration run:
Expected migrations:
1. 1709000000000-CreateListingsSchema
2. 1709000000001-CreateUsersSchema
3. 1709000000002-AddMediaColumns

---

## Phase 3: Deploy Services (deploy in this order)

### 3.1 API
\
### 3.2 Worker
\
### 3.3 Web
\
---

## Phase 4: Post-Deploy Health Checks

\000000000000
---

## Phase 5: Manual Smoke Tests

1. Public listing browse loads without login
2. Admin login works, reaches /admin/moderation
3. Consultant login works, can create a listing
4. Photo upload completes (file appears in S3 and in UI)
5. Consultant accessing /admin/moderation gets 403
6. Logged-out user accessing /consultant/listings redirects to login
7. Invalid credentials return 401 (not a stack trace)

---

## Rollback Plan

### Web only broken
Redeploy previous web build. API and DB untouched. Zero data risk.

### API broken, no migration ran
Redeploy previous API image. Zero data risk.

### API broken, migration already ran
\
> api@0.0.1 migration:revert
> typeorm-ts-node-commonjs -d src/database/data-source.ts migration:revert

Error during migration revert:
### Complete rollback
1. Restore DB from provider snapshot (taken before deploy)
2. Redeploy all services from last known-good versions
3. Notify users of downtime window

### Credentials compromised
1. Immediately rotate the compromised credential in the provider console
2. Update hosting panel env vars
3. Redeploy affected services (env var changes require restart)
NOTE: Rotating JWT_ACCESS_SECRET invalidates all existing tokens.
All users must log in again. This is correct and expected behavior.

---

## Go Live Gate — All Must PASS

- [ ] Old AWS key AKIA4NKQYDGQTLYVZTSW deleted in IAM
- [ ] New AWS key created with least-privilege S3-only policy
- [ ] JWT_ACCESS_SECRET: 48+ random chars, no dev-default substrings
- [ ] DB password: strong, set in hosting panel only, not in code
- [ ] INTERNAL_API_KEY: random, different from dev value
- [ ] FEATURE_SEED_USERS=false in production env
- [ ] FEATURE_SWAGGER_ENABLED=false in production env
- [ ] CORS_ORIGINS set to production HTTPS domain(s)
- [ ] DATABASE_URL includes ?sslmode=require
- [ ] REDIS_URL uses rediss:// (TLS)
- [ ] All migrations ran successfully against production DB
- [ ] API health check returns 200
- [ ] /api/docs returns 404
- [ ] Login endpoint returns accessToken
- [ ] Unauthenticated admin route returns 401
- [ ] Web home page loads in browser
- [ ] Photo upload works end-to-end
- [ ] S3 bucket Block all public access = ON

If any item is unchecked: DO NOT GO LIVE.
