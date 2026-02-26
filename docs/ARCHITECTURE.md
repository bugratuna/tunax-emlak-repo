# AREP System Architecture

**Version:** 1.0.0
**Last Updated:** 2026-02-25
**Status:** Current Phase (In-Memory Store)

---

## Table of Contents

1. [System Context](#1-system-context)
2. [Service Architecture](#2-service-architecture)
3. [NestJS Module Breakdown](#3-nestjs-module-breakdown)
4. [Data Flows](#4-data-flows)
5. [Current Phase Constraints](#5-current-phase-constraints)
6. [Key Design Decisions](#6-key-design-decisions)

---

## 1. System Context

AREP is a multi-tier real estate platform scoped to the Antalya region. It connects three actor groups through a moderated content pipeline:

```
┌─────────────────────────────────────────────────────────────────┐
│                        External Actors                          │
│                                                                 │
│  Consultant (Agent)    Administrator (Admin)    Visitor         │
│       │                       │                    │           │
└───────┼───────────────────────┼────────────────────┼───────────┘
        │                       │                    │
        ▼                       ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│                     Web / Mobile Clients                     │
│              (Next.js Web  |  Flutter / React Native)        │
└──────────────────────────────┬───────────────────────────────┘
                               │  HTTPS
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      API Service (NestJS)                    │
│                   Port 3001 — Prefix: /api                   │
│                                                              │
│  ┌────────────┐  ┌──────────────┐  ┌──────┐  ┌──────────┐  │
│  │ Listings   │  │  Moderation  │  │ Lead │  │Marketing │  │
│  │ Module     │  │  Module      │  │Module│  │Module    │  │
│  └────────────┘  └──────────────┘  └──────┘  └──────────┘  │
│                                                              │
│  ┌─────────────────────┐   ┌──────────────────────────────┐ │
│  │  CRM Sync Module    │   │  Store Module  (@Global)     │ │
│  │  (@Global)          │   │  InMemoryStore               │ │
│  └─────────────────────┘   └──────────────────────────────┘ │
└──────────────────────────────┬───────────────────────────────┘
                               │
              ┌────────────────┼───────────────────┐
              │                │                   │
              ▼                ▼                   ▼
    ┌──────────────┐  ┌──────────────┐   ┌──────────────────┐
    │  PostgreSQL  │  │    Redis     │   │   External CRM   │
    │  + PostGIS   │  │  (BullMQ +  │   │  (Vendor API)    │
    │  (Phase 2)   │  │   Cache)    │   │                  │
    └──────────────┘  └──────────────┘   └──────────────────┘
              │
              ▼
    ┌──────────────────┐
    │  Worker Service  │
    │  (BullMQ jobs)  │
    │  - Deterministic │
    │    Scorer        │
    │  - LLM Agent    │
    └──────────────────┘
```

---

## 2. Service Architecture

### 2.1 Services Overview

| Service | Technology | Port | Responsibility |
|---------|-----------|------|----------------|
| `api` | NestJS (Node.js) | 3001 | REST API, business logic, state transitions |
| `worker` | NestJS (BullMQ) | — | Background job processing: scoring, AI enrichment |
| `web` | Next.js (React) | — | SSR + CSR web frontend for Consultants, Admins, and Visitors |
| `mobile` | Flutter / React Native | — | Mobile app for Visitors (and optionally Consultants) |

### 2.2 API Service Internal Structure

```
apps/api/src/
├── main.ts                          # Bootstrap: validateEnv() → NestFactory → global prefix /api
├── app.module.ts                    # Root module; imports all feature modules
├── config/
│   └── env.validation.ts            # Fail-fast env var validation at startup
├── store/
│   ├── store.module.ts              # @Global module exporting InMemoryStore
│   └── store.ts                     # InMemoryStore + all entity type definitions
├── listings/
│   ├── listings.module.ts
│   ├── listings.controller.ts       # POST /listings, GET /listings/:id, PATCH /listings/:id/resubmit
│   ├── listings.service.ts
│   └── dto/create-listing.dto.ts
├── admin/
│   └── moderation/
│       ├── moderation.module.ts
│       ├── moderation.controller.ts # GET queue, GET/POST score, PATCH approve/request-changes/reject
│       ├── moderation.service.ts
│       └── dto/                     # approve, request-changes, reject, generate-report, attach-llm
├── leads/
│   ├── leads.module.ts
│   ├── leads.controller.ts          # POST /leads, GET /leads/:id, GET /leads/:id/score
│   ├── leads.service.ts
│   └── dto/create-lead.dto.ts
├── marketing/
│   ├── marketing.module.ts
│   ├── marketing.controller.ts      # GET /marketing/:id/pack, PATCH /marketing/:id/pack/result
│   ├── marketing.service.ts
│   └── dto/attach-pack.dto.ts
└── crm-sync/
    ├── crm-sync.module.ts           # @Global — CrmSyncService injected wherever needed
    ├── crm-sync.controller.ts       # GET /crm-sync/:entityId
    └── crm-sync.service.ts          # sync() called internally by leads and moderation services
```

### 2.3 Cross-Cutting Concerns

| Concern | Implementation |
|---------|---------------|
| Global API prefix | `app.setGlobalPrefix('api')` in `main.ts` |
| Input validation | `ValidationPipe({ whitelist: true })` applied globally; unknown fields are stripped |
| Env validation | `validateEnv()` called before `NestFactory`; process exits on missing required vars |
| Store access | `InMemoryStore` injected as `@Global` singleton via `StoreModule` |
| CRM sync | `CrmSyncService` injected as `@Global` singleton; triggered after key state transitions |
| Internal API auth | `X-Internal-Key-Id` / `X-Internal-Key` / `X-Request-Timestamp` headers required for worker→API calls (Phase 2) |
| PII redaction | All logging must mask `name`, `phone`, `message` fields (see `docs/ENVIRONMENT_SECRETS_MANAGEMENT_SPEC_AREP.md §6`) |

---

## 3. NestJS Module Breakdown

### 3.1 StoreModule (`@Global`)

Provides the `InMemoryStore` singleton to all modules. Acts as the sole persistence layer in the current phase.

**Maps maintained in store:**

| Map | Key | Value | Semantics |
|-----|-----|-------|-----------|
| `listings` | `listingId` | `Listing` | One record per listing |
| `moderationReports` | `listingId` | `ModerationReport` | Overwritten on each admin decision |
| `scoringReports` | `listingId` | `ScoringReport` | Overwritten on each score generation |
| `packRequests` | `listingId` | `MarketingAssetPackRequest` | One HITL request per listing |
| `leads` | `leadId` | `Lead` | One record per lead |
| `leadsByIdempotencyKey` | `idempotencyKey` | `leadId` | Dedup index for lead creation |
| `leadScoreReports` | `leadId` | `LeadScoreReport` | One score per lead |
| `crmSyncResults` | `entityId` | `CRMSyncResult[]` | All sync attempts per entity |
| `syncedKeys` | `idempotencyKey` | (Set) | Dedup set for CRM sync |

### 3.2 ListingsModule

Manages listing creation and the resubmission state transition.

| Method | Guard | Result |
|--------|-------|--------|
| `create(title, consultantId)` | None | New listing in `PENDING_REVIEW` |
| `findById(id)` | 404 if not found | Listing |
| `resubmit(id)` | 404 if not found; 409 if status ≠ `NEEDS_CHANGES` | Listing in `PENDING_REVIEW` |

### 3.3 AdminModerationModule

Handles the full moderation pipeline: scoring ingestion and admin decision actions.

**Key side effects on `approve()`:**
1. Listing transitions to `PUBLISHED`
2. `MarketingAssetPackRequest` created automatically (status `PENDING_OPERATOR`)
3. CRM sync fired: `LISTING_PUBLISHED`

**Scoring pipeline order (worker-driven):**
1. Worker calls `POST /api/admin/moderation/:id/score` with deterministic scores
2. Worker optionally calls `PATCH /api/admin/moderation/:id/score/llm` to attach LLM enrichment
3. Admin reviews at `GET /api/admin/moderation/:id/score` before deciding

### 3.4 LeadsModule

Handles visitor inquiry submission with full idempotency, consent enforcement, and deterministic lead scoring.

**On `create(dto)`:**
1. Idempotency key check — if key exists, return existing `{ lead, score }` (no-op)
2. `consentGiven` must be `true` — throws `400` otherwise
3. Listing must exist — throws `404` otherwise
4. Lead saved to store
5. `scoreSignals(lead)` → `{ score: 0–100, reasonCodes[] }` → `LeadScoreReport` saved
6. `CrmSyncService.sync(LEAD_CREATED, ...)` fired

**Lead scoring components (current implementation):**

| # | Component | Max | Min | Basis |
|---|-----------|-----|-----|-------|
| 1 | Message length (empty / <20 / <100 / ≥100 chars) | +25 | 0 | `lead.message` |
| 2 | Urgency keywords (Turkish + English) | +15 | 0 | keyword list in `leads.service.ts` |
| 3 | Budget keywords in message | +15 | 0 | keyword list in `leads.service.ts` |
| 4 | Channel (FORM > WHATSAPP > CALL) | +20 | +10 | `lead.channel` |
| 5 | Preferred time specified | +10 | 0 | `lead.preferredTime` |
| 6 | Explicit consent | +15 | 0 | `lead.consentGiven` |

Tiers: **HOT** ≥70 · **WARM** ≥40 · **COLD** <40. Score clamped to `[0, 100]`.

### 3.5 MarketingModule

Manages the Human-in-the-Loop (HITL) marketing asset pack workflow.

**Pack states:** `PENDING_OPERATOR` → `COMPLETED`

**Workflow:**
1. `ModerationService.approve()` automatically creates a `MarketingAssetPackRequest` with a pre-built LLM prompt in `hitlPrompt`.
2. Operator calls `GET /api/marketing/:id/pack` to retrieve the prompt.
3. Operator runs LLM externally, gets back a valid `MarketingAssetPack` JSON.
4. Operator calls `PATCH /api/marketing/:id/pack/result` with the pack JSON.
5. Pack transitions to `COMPLETED`; `completedAt` is set.

### 3.6 CrmSyncModule (`@Global`)

Provides fire-and-forget CRM synchronization. Current phase uses a mock adapter.

**`sync(trigger, entityId, idempotencyKey)`:**
- If `idempotencyKey` already in `syncedKeys` → returns `SKIPPED_DUPLICATE`
- Otherwise → mock adapter returns `SUCCESS` with a random `externalRef`
- Result saved to `crmSyncResults[entityId][]`

**Triggers in use:**

| Trigger | Called from | Event |
|---------|------------|-------|
| `LEAD_CREATED` | `LeadsService.create()` | After lead + score saved |
| `LISTING_PUBLISHED` | `ModerationService.approve()` | After listing status updated |

---

## 4. Data Flows

### 4.1 Listing Submission & Moderation Flow

```
Consultant
    │
    │  POST /api/listings  { title, consultantId? }
    ▼
ListingsService.create()
    └── Listing { status: PENDING_REVIEW } → store
    │
    │  [Worker picks up automation job from BullMQ queue "automation"]
    ▼
Worker: Deterministic Scorer
    │  POST /api/admin/moderation/:id/score
    │  { deterministicScores: { completenessScore, descriptionQualityScore,
    │                            missingFields, warnings[] } }
    └── ScoringReport → store
    │
    ▼
Worker: LLM Enrichment Agent  (optional)
    │  PATCH /api/admin/moderation/:id/score/llm
    │  { llmResult: { contentModeration, factVerification, riskAssessment } }
    └── ScoringReport.llmResult updated in store
    │
    ▼
Admin reviews:
    GET /api/admin/moderation/queue       → pending listings
    GET /api/admin/moderation/:id/score   → scoring + LLM result
    │
    ├── APPROVE
    │     PATCH /api/admin/moderation/:id/approve  { adminId?, notes? }
    │         listing.status = PUBLISHED
    │         ModerationReport saved (APPROVE)
    │         MarketingAssetPackRequest created (PENDING_OPERATOR)
    │         CrmSync: LISTING_PUBLISHED
    │
    ├── REQUEST_CHANGES
    │     PATCH /api/admin/moderation/:id/request-changes  { adminId?, feedback }
    │         listing.status = NEEDS_CHANGES
    │         ModerationReport saved (REQUEST_CHANGES + mandatory feedback)
    │         [Consultant revises → PATCH /api/listings/:id/resubmit → loops back]
    │
    └── REJECT
          PATCH /api/admin/moderation/:id/reject  { adminId?, reason? }
              listing.status = ARCHIVED
              ModerationReport saved (REJECT)
```

### 4.2 Lead Inquiry & CRM Sync Flow

```
Visitor
    │
    │  POST /api/leads
    │  { idempotencyKey, listingId, channel, name, phone,
    │    message?, preferredTime?, utmSource?, utmMedium?, utmCampaign?, consentGiven }
    ▼
LeadsService.create()
    ├── idempotency check  → duplicate key: return existing { lead, score }
    ├── consent check      → consentGiven=false: 400
    ├── listing check      → not found: 404
    │
    ├── Lead saved to store
    ├── scoreSignals()     → { score, reasonCodes }
    ├── LeadScoreReport saved
    │
    └── CrmSyncService.sync(LEAD_CREATED, leadId, `lead-created-${idempotencyKey}`)
            Mock adapter: { status: SUCCESS, externalRef: "CRM-XXXXXXXX" }
    │
    ▼
Response: { lead, score: { reportId, score, tier, reasonCodes, scoredAt } }
```

### 4.3 Marketing Asset Pack Flow

```
[Triggered automatically inside ModerationService.approve()]
    │
    ▼
store.createPackRequest(listingId, listingTitle)
    └── MarketingAssetPackRequest { status: PENDING_OPERATOR, hitlPrompt: "..." }
    │
    ▼
Operator polls:
    GET /api/marketing/:listingId/pack
    → receives hitlPrompt
    │
    [Runs prompt through LLM; validates output against MarketingAssetPack schema]
    │
    ▼
    PATCH /api/marketing/:listingId/pack/result
    { result: { packId, listingId, generatedAt, seoTitle, metaDescription,
                socialCaptions, whatsappBroadcast, hashtags } }
    → MarketingAssetPackRequest { status: COMPLETED, completedAt: now }
```

---

## 5. Current Phase Constraints

| Constraint | Detail |
|-----------|--------|
| No persistence | All data is lost on process restart; in-memory only |
| No Prisma / ORM | Explicitly excluded; env var `DATABASE_URL` is commented out |
| No Swagger | Explicitly excluded in current phase |
| No BullMQ wiring | Automation pipeline is manually driven via the scoring HTTP endpoints |
| No JWT enforcement | `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` defined but guards not applied |
| No real CRM adapter | `CrmSyncService` mock always returns `SUCCESS` |
| No image upload | Media endpoints not yet implemented; image metadata not stored |
| No full listing DTO | `CreateListingDto` currently accepts only `title` + `consultantId`; full field set pending |
| Single instance | No horizontal scaling; Redis not yet wired |
| Env vars validated | Only `PORT` and `NODE_ENV` (both optional); all others commented out pending database wiring |

---

## 6. Key Design Decisions

### 6.1 `@Global` Modules for Store and CRM Sync

`StoreModule` and `CrmSyncModule` are marked `@Global` so their services are available across all feature modules without re-declaring imports. This avoids circular dependency graphs in the current monolith and reflects their status as platform-wide infrastructure.

### 6.2 Server-Side State Machine Enforcement

Listing state transitions are enforced exclusively in service methods (`requirePendingReview`, status check in `resubmit`). Invalid transitions return `409 Conflict`. No client-side trust for state.

### 6.3 Caller-Supplied Idempotency Keys for Leads

Lead creation requires the caller to provide an `idempotencyKey`. This shifts deduplication responsibility to the caller (web/mobile client or BullMQ retry) and enables safe retries without side effects. The same key always returns the same `{ lead, score }`.

### 6.4 CRM Sync as Fire-and-Forget (Current Phase)

`CrmSyncService.sync()` is called synchronously within the service method but is intentionally side-effect-safe: it records results independently and failures do not roll back the main operation. In Phase 2 this moves to a BullMQ job with exponential backoff retry and dead-letter queue.

### 6.5 HITL Marketing Pack

The marketing asset pack is HITL by design: the system stores a structured LLM prompt and waits for an operator to supply validated JSON. This prevents unreviewed AI output from reaching clients. Automated pack generation (Phase 2) will submit directly to `PATCH /pack/result` after internal validation.

### 6.6 Overwrite Semantics for Reports

`ModerationReport` and `ScoringReport` follow overwrite semantics: one report per `listingId`, always reflecting the latest state. This keeps the store simple and ensures the Admin always sees the most current analysis.

### 6.7 Strict JSON Policy

All automation artifacts (`ModerationReport`, `ScoringReport`, `MarketingAssetPack`) must be valid, parseable JSON with no markdown wrappers. Artifacts that fail schema validation are rejected atomically — partial writes are not permitted.
