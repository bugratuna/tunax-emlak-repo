# AREP Environment & Secrets Management Specification

## 1) Scope
Applies to AREP automation services:
- `api`
- `worker`
- `web`
- `mobile`

Objectives:
- deterministic environment configuration
- secure secret lifecycle
- strict separation of staging and production
- PII-safe telemetry/logging

---

## 2) Technical Checklist (Implementation-Ready)

## 2.1 Global Checklist
- [ ] Maintain a single source of truth for env var contracts per service (name, required/optional, format, default policy).
- [ ] Fail fast on startup if any required env var is missing or malformed.
- [ ] Store secrets only in approved secret manager (never in repo, never in `.env` committed files).
- [ ] Enforce separate secret namespaces for `staging` and `production`.
- [ ] Enforce environment-scoped internal API keys (no cross-environment reuse).
- [ ] Implement key/secret rotation runbook and automation hooks.
- [ ] Redact PII/secrets in logs, traces, and error payloads.
- [ ] Validate build/runtime env parity in CI before deployment.

## 2.2 API Service Checklist
- [ ] Require DB, cache, JWT, internal auth, and observability env vars.
- [ ] Validate CORS and public origin configuration against environment.
- [ ] Reject startup if `NODE_ENV` and `APP_ENV` are inconsistent.
- [ ] Expose health endpoint without leaking config/secrets.

## 2.3 Worker Service Checklist
- [ ] Require queue/broker credentials and internal API auth credentials.
- [ ] Validate retry/DLQ env vars are bounded numeric values.
- [ ] Ensure worker cannot call production API endpoints from staging config (and vice versa).
- [ ] Ensure job payload logging is redacted by default.

## 2.4 Web Service Checklist
- [ ] Distinguish server-only secrets from client-exposed env vars.
- [ ] Allow `NEXT_PUBLIC_*` (or equivalent) only for non-sensitive config.
- [ ] Validate public API base URL matches environment domain policy.
- [ ] Reject build if sensitive keys are accidentally marked public.

## 2.5 Mobile Service Checklist
- [ ] Keep mobile bundle free of long-lived secrets.
- [ ] Use only public environment config inside app binary.
- [ ] Fetch sensitive tokens from backend at runtime using authenticated flow.
- [ ] Pin environment endpoint sets per release channel (staging/prod).

---

## 3) Required Environment Variables by Service

## 3.1 Common Variables (All Services)
| Variable | Required | Format / Allowed Values | Secret | Notes |
|---|---|---|---|---|
| `APP_ENV` | Yes | `staging` \| `production` | No | Deployment environment switch. |
| `NODE_ENV` | Yes | `production` | No | Runtime mode must be production for deployed services. |
| `LOG_LEVEL` | Yes | `error` \| `warn` \| `info` | No | `debug` forbidden in production. |
| `SENTRY_DSN` | Yes | DSN string | Yes | Separate DSN per environment. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Yes | URL | No | Environment-scoped telemetry endpoint. |
| `OTEL_EXPORTER_OTLP_HEADERS` | Optional | header string | Yes | If includes auth token. |

## 3.2 API Service Variables
| Variable | Required | Format / Allowed Values | Secret | Notes |
|---|---|---|---|---|
| `API_PORT` | Yes | integer (1-65535) | No | Service listen port. |
| `DATABASE_URL` | Yes | connection string | Yes | Separate DB user per env. |
| `REDIS_URL` | Yes | connection string | Yes | Cache/session or queue support. |
| `JWT_ACCESS_SECRET` | Yes | min 32 chars | Yes | HS/secret material, rotate regularly. |
| `JWT_REFRESH_SECRET` | Yes | min 32 chars | Yes | Distinct from access secret. |
| `INTERNAL_API_KEYS` | Yes | comma-separated key IDs + hashes | Yes | For service-to-service auth. |
| `CORS_ALLOWED_ORIGINS` | Yes | CSV URLs | No | Must match env domains. |
| `CRM_SYNC_BASE_URL` | Yes | URL | No | Environment-specific endpoint. |
| `CRM_SYNC_API_KEY` | Yes | opaque token | Yes | Rotate with overlap window. |

## 3.3 Worker Service Variables
| Variable | Required | Format / Allowed Values | Secret | Notes |
|---|---|---|---|---|
| `WORKER_CONCURRENCY` | Yes | integer (1-200) | No | Bounded for safety. |
| `QUEUE_URL` | Yes | connection string | Yes | Queue/broker auth in URL or secret refs. |
| `QUEUE_NAME` | Yes | string | No | Environment-specific namespace. |
| `DLQ_NAME` | Yes | string | No | Must be distinct from main queue. |
| `JOB_MAX_RETRIES` | Yes | integer (0-20) | No | Retry policy cap. |
| `INTERNAL_API_BASE_URL` | Yes | URL | No | Must target same `APP_ENV`. |
| `INTERNAL_API_KEY` | Yes | opaque token | Yes | Scoped key for worker->api calls. |
| `OPENAI_API_KEY` (if used) | Conditional | token | Yes | Only if AI tasks enabled. |

## 3.4 Web Service Variables
| Variable | Required | Format / Allowed Values | Secret | Notes |
|---|---|---|---|---|
| `WEB_PORT` | Yes | integer (1-65535) | No | Runtime port. |
| `API_BASE_URL_SERVER` | Yes | URL | No | Server-side API endpoint. |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | URL | No | Public client endpoint only. |
| `SESSION_SECRET` | Yes | min 32 chars | Yes | For encrypted session/cookie logic. |
| `INTERNAL_WEBHOOK_SECRET` | Optional | token | Yes | If web receives internal callbacks. |

## 3.5 Mobile Service Variables
| Variable | Required | Format / Allowed Values | Secret | Notes |
|---|---|---|---|---|
| `MOBILE_ENV` | Yes | `staging` \| `production` | No | Build/release channel selector. |
| `MOBILE_API_BASE_URL` | Yes | URL | No | Public backend endpoint. |
| `MOBILE_SENTRY_DSN` | Yes | DSN | No | Public DSN acceptable; separate per env. |
| `MOBILE_ANALYTICS_KEY` | Optional | string | No | Public write key only. |

### 3.6 Env Validation Requirements
- All required vars MUST be validated with schema at startup/build time.
- Unknown env vars SHOULD trigger warning in staging and fail in production for protected prefixes (`API_`, `JWT_`, `INTERNAL_`, `DATABASE_`).
- Empty-string values are treated as missing for required vars.

---

## 4) Secret Rotation Policy

### 4.1 Rotation Intervals
| Secret Type | Max Lifetime | Rotation Cadence | Overlap Window |
|---|---|---|---|
| Internal API keys | 90 days | every 60 days recommended | 7 days |
| JWT secrets | 180 days | every 90 days recommended | 14 days |
| CRM/API third-party keys | per provider or 90 days max | every 60-90 days | 7 days |
| DB credentials | 180 days | every 90 days | 14 days |
| Queue/Broker credentials | 180 days | every 90 days | 14 days |

### 4.2 Rotation Procedure (Mandatory)
1. Generate new secret in secret manager with version tag.
2. Deploy consumers with dual-read support (old + new) where possible.
3. Promote new secret to active.
4. Monitor auth error rate for at least 30 minutes.
5. Revoke old secret after overlap window.
6. Record rotation in audit log (who, when, systems affected, rollback plan).

### 4.3 Emergency Rotation
Trigger immediately if compromise suspected:
- revoke active keys/secrets
- rotate affected credentials within 1 hour
- force token/session invalidation where applicable
- create incident record and postmortem

---

## 5) Internal API Key Policy

1. Internal keys MUST be service-scoped and environment-scoped.
   - Example scopes: `worker->api`, `api->worker-callback`.
2. Keys MUST NOT be shared across services or environments.
3. Keys MUST be stored hashed at rest when represented in API allowlists.
4. Requests using internal keys MUST include:
   - `X-Internal-Key-Id`
   - `X-Internal-Key`
   - `X-Request-Timestamp` (UTC)
   - `X-Request-Signature` (HMAC over canonical request, when enabled)
5. Replay protection:
   - reject requests with timestamp skew > 5 minutes
   - enforce nonce or request-id uniqueness window of 10 minutes
6. Key deactivation:
   - immediate disable supported via configuration reload
   - revoked keys return `401` and security audit event
7. Internal keys MUST NEVER appear in logs, traces, metrics labels, or client bundles.

---

## 6) Logging Redaction Rules for PII

### 6.1 PII Classes (Minimum)
- Direct identifiers: full name, phone number, email, national ID/passport
- Sensitive content: inquiry message text, admin notes, free-form user text
- Indirect identifiers: exact address, precise coordinates, device identifiers

### 6.2 Redaction Rules
1. `name` => keep first character only + `***`.
2. `phone` => keep country code + last 2 digits; mask middle.
3. `email` => keep first character + domain TLD mask partial local-part.
4. `message` / `notes` => do not log raw text; log length + SHA-256 hash.
5. `address` => redact house/building details; keep district/neighborhood only if needed.
6. Tokens/secrets (`*_KEY`, `*_SECRET`, `*_TOKEN`, connection strings) => fully redacted.

### 6.3 Enforcement Points
- App logger serializers
- HTTP access logs
- Error handlers and exception reporters
- Queue/job payload logs
- APM/trace attributes

### 6.4 Prohibited Logging
- Raw request/response body dumps in production
- Raw auth headers
- Raw env var dumps at startup
- Stack traces containing unredacted payload objects

---

## 7) Staging vs Production Separation Policy

1. Infrastructure separation is mandatory:
   - distinct DBs, queues, caches, storage buckets, secret namespaces, and telemetry projects.
2. Network and endpoint separation is mandatory:
   - staging services call only staging dependencies;
   - production services call only production dependencies.
3. Credential separation is mandatory:
   - no shared keys/tokens/secrets between staging and production.
4. Data separation is mandatory:
   - production PII MUST NOT be copied to staging unless formally anonymized.
5. Release control:
   - staging validation required before production deploy.
   - environment diff check required in CI for protected vars.
6. Access control:
   - least privilege by environment role; production access restricted and audited.
7. Incident isolation:
   - staging incidents must not degrade production service paths.

---

## 8) Compliance & Audit Checklist
- [ ] Quarterly secret inventory review completed.
- [ ] Rotation SLAs met for all secret classes.
- [ ] Key revocation drill performed at least twice per year.
- [ ] Redaction tests exist for logger serializers.
- [ ] Production log sampling confirms no secret/PII leakage.
- [ ] Environment boundary checks enabled in CI/CD.
- [ ] All access to secret manager is audit-logged and retained.
