# Antalya Real Estate Platform (AREP) - Product Requirements Document

**Version:** 2.0.0
**Last Updated:** 2026-02-25
**Status:** Living Document

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [User Roles & Permissions (RBAC)](#2-user-roles--permissions-rbac)
3. [Listing Lifecycle (State Machine)](#3-listing-lifecycle-state-machine)
4. [MVP Specifications (Phase 1)](#4-mvp-specifications-phase-1)
   - 4.1 Authentication & Authorization
   - 4.2 Listing Management Module
   - 4.3 Search & Discovery Engine
   - 4.4 Lead Management
   - 4.5 AI-Assisted Moderation Pipeline
   - 4.6 CRM Sync Integration
   - 4.7 Marketing Asset Generation
5. [Non-Functional Requirements](#5-non-functional-requirements)
   - 5.1 Security
   - 5.2 Performance & Scalability
   - 5.3 Observability & Audit Logging
   - 5.4 Environment & Secrets Management
6. [Roadmap & Future Features (Phase 2+)](#6-roadmap--future-features-phase-2)
7. [Technical Stack](#7-technical-stack)

---

## 1. Project Overview

**Objective:** To develop a specialized real estate platform for the Antalya region that ensures high data quality through a strict moderation workflow. The system connects authorized Real Estate Consultants with visitors via Web and Mobile interfaces, governed by an Administrative approval process augmented by an AI-assisted enrichment and scoring pipeline.

**Core Design Principles:**
- **Strict moderation:** Every listing passes through a deterministic scoring gate and optional AI enrichment before it can be published.
- **Data integrity:** All automation artifacts (moderation reports, scoring outputs, marketing packs) must be valid, parseable JSON — no markdown wrappers. Artifacts that fail schema validation are rejected atomically.
- **Hallucination-free AI:** AI-generated content must be grounded exclusively in source listing data. Any invented attributes or prices invalidate the artifact.
- **PII safety:** Lead contact data (name, phone, message) is masked in all logs, traces, and metrics from the moment of ingestion.

---

## 2. User Roles & Permissions (RBAC)

### 👤 Consultant (Agent)
* **Access:** Restricted Dashboard.
* **Capabilities:**
    * Create and manage property listings.
    * Upload, reorder, and delete property photos.
    * Save listings as `DRAFT` to resume editing later.
    * Submit listings for Admin Review (transitions to `PENDING_REVIEW`).
    * Revise listings based on Admin rejection feedback (from `NEEDS_CHANGES` back to `PENDING_REVIEW`).
    * View AI-generated suggestions (SEO title, tags, warnings) attached to their submitted listings.

### 🛡️ Administrator (Admin)
* **Access:** Full Admin Panel.
* **Capabilities:**
    * **Moderation Queue:** Review listings in `PENDING_REVIEW` state along with their AI-generated enrichment report and deterministic completeness score.
    * **Moderation Actions:**
        * `Approve` — Publish listing to live site (`PUBLISHED`).
        * `Request Changes` — Return to Consultant with **mandatory** written feedback (`NEEDS_CHANGES`).
        * `Reject` — Permanently deny the listing (`REJECTED`).
    * **Lead Management:** View, filter, update status, and assign leads to Consultants.
    * **User Management:** Onboard and suspend Consultants.
    * **Report Access:** View moderation reports and scoring reports per listing.

### 🌍 Visitor (End-User)
* **Access:** Public Web/Mobile Interface (No Login Required).
* **Capabilities:**
    * Search and filter properties by Price range, Location, Property Type, Room Count.
    * View property details and high-resolution image galleries.
    * **Map Interaction:** Filter by neighborhood or view properties within the visible map area (Bounding Box query).
    * **Contact:** Submit a lead inquiry via call request, WhatsApp, or contact form.

---

## 3. Listing Lifecycle (State Machine)

Every listing follows a strict state machine. Transitions are enforced server-side and cannot be bypassed.

```
DRAFT
  │
  └──[Consultant submits]──► PENDING_REVIEW
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              PUBLISHED       NEEDS_CHANGES      REJECTED
                    │               │
        [Admin archives]   [Consultant resubmits]
                    ▼               │
               ARCHIVED     PENDING_REVIEW (cycle)
```

| State | Description | Visible To |
|-------|-------------|------------|
| `DRAFT` | Being authored by Consultant. Not submitted. | Consultant only |
| `PENDING_REVIEW` | Awaiting Admin decision. Locked for editing. | Consultant (read-only), Admin |
| `NEEDS_CHANGES` | Returned to Consultant with mandatory Admin feedback. | Consultant, Admin |
| `PUBLISHED` | Live on the public site. | Everyone |
| `REJECTED` | Permanently denied. Archived from public view. | Consultant (read-only), Admin |
| `ARCHIVED` | Removed from public view (Sold/Rented or Admin action). | Admin only |

**Transition Rules:**
- `DRAFT` → `PENDING_REVIEW`: triggers `LISTING_SUBMITTED` automation event.
- `NEEDS_CHANGES` → `PENDING_REVIEW`: triggers `LISTING_SUBMITTED` event with `isResubmission: true` and a mandatory `delta` object.
- `PUBLISHED` → `ARCHIVED`: Admin-only action; no automation event.
- `REJECTED` is a terminal state. Re-listing requires creating a new listing.

---

## 4. MVP Specifications (Phase 1)

### 4.1 Authentication & Authorization

- [ ] Secure Login/Logout for Consultants and Admins (email + password).
- [ ] **Role-Based Access Control (RBAC):** Server-side middleware protects all admin routes and separates Consultant/Admin privileges.
- [ ] JWT implementation for cross-platform session management (Web + Mobile).
    - Separate `ACCESS` token (short-lived) and `REFRESH` token.
    - Secrets: `JWT_ACCESS_SECRET` (min 32 chars), `JWT_REFRESH_SECRET` (min 32 chars).
- [ ] **Internal API Key Authentication:** Service-to-service calls (e.g., worker → API) must include `X-Internal-Key-Id`, `X-Internal-Key`, and `X-Request-Timestamp` headers.
    - Requests with timestamp skew > 5 minutes are rejected.
    - Keys are environment-scoped and never logged.

---

### 4.2 Listing Management Module

#### Form Fields

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | string | min 10, max 200 — **required** |
| `description` | string | min 50, max 5000 — **required** |
| `price.amount` | number | min 0, precision 2 — **required** |
| `price.currency` | enum | `TRY \| USD \| EUR` — **required** |
| `price.isNegotiable` | boolean | **required** |
| `category` | enum | `RENT \| SALE` — **required** |
| `propertyType` | enum | `APARTMENT \| VILLA \| HOUSE \| LAND \| COMMERCIAL \| OTHER` — **required** |
| `specifications.squareMeters` | number | min 1, max 100,000 — **required** |
| `specifications.roomCount` | integer | min 0, max 20 — **required** |
| `specifications.bathroomCount` | integer | min 0, max 20 — **required** |
| `specifications.floorNumber` | integer | optional |
| `specifications.totalFloors` | integer | optional |
| `specifications.buildYear` | integer | min 1800, max currentYear+1 — optional |
| `specifications.furnished` | boolean | optional |
| `specifications.balcony` | boolean | optional |
| `specifications.parking` | boolean | optional |
| `specifications.elevator` | boolean | optional |
| `specifications.pool` | boolean | optional |
| `specifications.seaView` | boolean | optional |
| `contact.phone` | string | E.164 format — optional |
| `contact.email` | string | email format — optional |
| `contact.whatsapp` | string | E.164 format — optional |

#### Location Services
- [ ] City is fixed to `Antalya`.
- [ ] District selection must pass the **19-district whitelist** (Muratpaşa, Kepez, Konyaaltı, Döşemealtı, Aksu, Alanya, Manavgat, Serik, Kemer, Kumluca, Finike, Kaş, Demre, Elmalı, Korkuteli, Akseki, Gündoğmuş, İbradı, Gazipaşa). Any other value is rejected.
- [ ] Neighborhood (Mahalle) text input — **required**.
- [ ] Pin placement on map with Lat/Long storage (precision: 8 decimal places). Coordinates must fall within Antalya bounding box.
- [ ] Optional postal code and full address string.

#### Media Handling
- [ ] Image upload with client-side resizing and server-side compression.
- [ ] Each image stores: `url`, `storageKey`, `order`, `uploadedAt`, `width`, `height`, `sizeBytes`, `mimeType`, `checksum` (SHA-256).
- [ ] Minimum 1 image required for submission (0 images → automatic `REJECT`).
- [ ] Recommended minimum: 3 images (1–2 images triggers `INSUFFICIENT_IMAGES` warning).
- [ ] Maximum: 50 images per listing.
- [ ] Consultant can reorder and delete images.

---

### 4.3 Search & Discovery Engine

- [ ] **Filtering:** Price range, Property Type (`APARTMENT | VILLA | HOUSE | LAND | COMMERCIAL | OTHER`), Room Count, Category (`RENT | SALE`), District.
- [ ] **Geospatial Search (PostGIS):**
    - "Search in this area" button triggers a Bounding Box query against stored coordinates.
    - Neighborhood (Mahalle) based filtering.
    - Coordinate index optimized with PostGIS spatial index.
- [ ] Results return only `PUBLISHED` listings.
- [ ] Pagination with stable cursor ordering.

---

### 4.4 Lead Management

Leads are created when a Visitor submits an inquiry on a listing page.

#### Lead Creation
- [ ] Visitor submits inquiry via:
    - **Call request** (`contactChannel: "call"`)
    - **WhatsApp** (`contactChannel: "whatsapp"`)
    - **Contact form** (`contactChannel: "form"`)
- [ ] Required fields: `name`, `phone` (E.164), `message`, `preferredTime`, `listingId`.
- [ ] Optional fields: `utmSource` (traffic attribution).
- [ ] Lead creation fires a `LEAD_CREATED` event with full event envelope (eventId, eventVersion 1.0.0, idempotencyKey, producer, occurredAt).

#### Lead Lifecycle States
`NEW` → `OPEN` → `CONTACTED` → `QUALIFIED | UNQUALIFIED` → `CLOSED`

#### Lead Scoring (Deterministic, Rule-Based)
Every lead is scored `0–100` based on:

| Factor | Max Points | Min Points |
|--------|-----------|-----------|
| Message length | +15 | -12 |
| Contact channel (call > whatsapp > form) | +12 | +3 |
| Preferred time presence & specificity | +6 | -2 |
| UTM source quality | +8 | 0 |
| Repeat inquiry frequency (7d) | +6 | -20 |
| Budget mention alignment to listing price | +20 | -18 |
| Urgency keywords ("today", "this week") | +14 | 0 |
| Location mention (district match) | +10 | -3 |

Score buckets: **HOT** (≥75), **WARM** (45–74), **COLD** (≤44).

- [ ] Score bucket drives CRM lead priority: `HOT → high`, `WARM → normal`, `COLD → low`.
- [ ] All reason codes (one per factor) are stored alongside the score for transparency.

#### PII Handling
- [ ] `name`, `phone`, `message`, `preferredTime` are classified PII and must never appear in raw form in logs, traces, or metrics.
- [ ] Masking rules: name → first char + `***`; phone → country code + last 2 digits; message → length + SHA-256 hash only.
- [ ] PII stored encrypted at rest; transport requires TLS 1.2+.
- [ ] Subject erasure supported via `leadId` tombstone workflow.
- [ ] PII retention: raw data max 365 days; masked logs max 730 days.

#### Lead Admin Operations
- [ ] Admin can view all leads with filtering by status, listing, channel, score bucket.
- [ ] Admin can update lead status and add internal admin notes.
- [ ] Admin can assign lead to a Consultant.
- [ ] Status changes and assignments produce `LEAD_UPDATED` and `LEAD_ASSIGNED` events respectively.

---

### 4.5 AI-Assisted Moderation Pipeline

The moderation pipeline runs automatically when a listing is submitted. It has two parallel components: a **deterministic scorer** and an **AI enrichment agent**. Together they produce artifacts that assist the Admin in making a moderation decision.

#### Pipeline Trigger
- Listing submission (state `DRAFT` or `NEEDS_CHANGES` → `PENDING_REVIEW`) fires a `LISTING_SUBMITTED` event into the `automation` BullMQ queue.
- Event includes full listing payload, idempotency key (SHA-256 of `listingId + consultantId + submittedAt + listing.version`), correlation/causation IDs, and trace context.

#### Deterministic Scoring Gate

Runs **before** AI enrichment. A gate failure populates `deterministicScores.warnings` with structured objects (`code`, `severity`, `message`, `field`).

**Validation Gates:**

| Gate | Rule | Severity | Warning Code |
|------|------|----------|--------------|
| No images | `imageCount === 0` | CRITICAL | `NO_IMAGES` |
| Insufficient images | `1 ≤ imageCount < 3` | MEDIUM | `INSUFFICIENT_IMAGES` |
| Description too short (hard) | `length < 50` | HIGH | `DESCRIPTION_TOO_SHORT` |
| Description too short (recommended) | `50 ≤ length < 200` | MEDIUM | `DESCRIPTION_TOO_SHORT` |
| Description too long | `length > 5000` | MEDIUM | `DESCRIPTION_TOO_LONG` |
| Invalid district | Not in 19-district whitelist | HIGH | `INVALID_DISTRICT` |
| Coordinates out of bounds | Outside Antalya bounding box | HIGH | `COORDINATES_OUT_OF_BOUNDS` |

#### AI Enrichment (LLM Agent)

- [ ] Produces: `moderationReport`, `suggestedTags`, `seoTitleSuggestion`, `warnings`, `completenessScore` (0–100).
- [ ] For resubmissions: additionally produces a `delta` summary comparing resolved vs remaining warnings.
- [ ] **Hallucination policy (hard fail):** Every claim in AI output must reference a `sourceField` from the submitted listing payload. AI must not assert features (e.g., `seaView`, `pool`, `furnished`) unless the source data sets that field to `true`. AI must not interpolate or invent prices.
- [ ] AI artifacts that fail hallucination checks are flagged `INVALID`, not stored, and the listing reverts to `PENDING_REVIEW` for re-evaluation.

#### Moderation Decision Matrix

The Admin decision is guided by a six-tier priority matrix (first matching tier wins):

| Tier | Rule Set | Outcome |
|------|----------|---------|
| 1 | Critical Blockers (CR-1–CR-10, e.g., no images, out-of-bounds coords, critical content violations) | `REJECT` |
| 2 | High-Severity Violations (HR-1–HR-8, e.g., completeness < 40, description quality < 30) | `REJECT` |
| 3 | Completeness Requirements (CRQ-1–CRQ-4, e.g., 40 ≤ completeness < 70) | `REQUEST_CHANGES` |
| 4 | Quality Requirements (QRQ-1–QRQ-3, e.g., description quality 30–60) | `REQUEST_CHANGES` |
| 5 | Medium-Severity Issues (MRQ-1–MRQ-2, e.g., ≥5 MEDIUM warnings) | `REQUEST_CHANGES` |
| 6 | Default (all thresholds pass) | `APPROVE` |

**Default `APPROVE` requires:**
- completeness score ≥ 70
- description quality score ≥ 60
- zero HIGH/CRITICAL content issues
- content moderation status = `PASS`
- risk level = `LOW` or `MEDIUM`
- fact verification status = `CONSISTENT` or `INSUFFICIENT_DATA`

#### Moderation Report Artifact
Every Admin action (Approve / Request Changes / Reject) produces a `ModerationReport` stored per listing:

| Field | Type | Notes |
|-------|------|-------|
| `reportId` | UUID v4 | Unique report ID |
| `listingId` | UUID v4 | Target listing |
| `adminId` | string | Actor |
| `decision` | enum | `APPROVE \| REQUEST_CHANGES \| REJECT` |
| `appliedRules` | string[] | At least one rule code |
| `previousStatus` | ListingStatus | Before action |
| `newStatus` | ListingStatus | After action |
| `decidedAt` | ISO 8601 UTC | Timestamp |
| `reason` | string | Human-readable summary |
| `feedback` | string | **Required** when `decision = REQUEST_CHANGES` |
| `notes` | string | Present on `APPROVE` |
| `scoringReportId` | UUID v4 \| null | Links to ScoringReport if available |

- A `REQUEST_CHANGES` report without `feedback` is invalid and rejected with HTTP 400.
- The store keeps exactly one report per `listingId`; a new action overwrites the previous.
- All artifacts must be syntactically valid JSON, pass schema validation (defined in `docs/AUTOMATION_ARTIFACT_SCHEMAS.md`), or be rejected with HTTP 422.
- Store writes are atomic: full artifact or nothing.

---

### 4.6 CRM Sync Integration

AREP syncs lead and listing data to an external CRM via a vendor-neutral interface. All sync operations are asynchronous and idempotent.

#### Canonical Entities Synced
- **Contact** — Visitor contact details (mapped from lead payload).
- **LeadDeal** — The inquiry/deal record linked to a Contact and a listing reference.
- **ActivityNote** — Timeline entries (status changes, assignment, admin notes).
- **ListingReference** — Denormalized listing snapshot attached to each LeadDeal.

#### Operations
| Operation | Trigger |
|-----------|---------|
| `upsertContact` | `LEAD_CREATED` event |
| `createLead` | `LEAD_CREATED` event (after contact upsert) |
| `updateLeadStatus` | `LEAD_UPDATED` event (status change) |
| `addNote` | `LEAD_UPDATED` (admin notes) or `LEAD_ASSIGNED` |
| `assignOwner` | `LEAD_ASSIGNED` event |

#### Ordering (mandatory for new inquiry)
1. `upsertContact`
2. `createLead`
3. `addNote` (optional)
4. `assignOwner` (optional)

#### Retry Policy
- At-least-once delivery.
- Exponential backoff: immediate → +30s → +2m → +10m → +30m → +2h.
- Max 6 attempts; dead-letter after max.
- No retry on permanent `4xx` errors (except `429`).

#### CRM Idempotency Key Format
`<operation>:<sourceKey>:<revisionToken>`

#### Compliance
- Raw PII must never appear in idempotency keys.
- Phone transmitted as E.164 only.
- Note text must strip control characters before outbound sync.

---

### 4.7 Marketing Asset Generation

For each published listing, an AI-generated `MarketingAssetPack` can be produced on demand by the Admin.

#### Artifact Contents

| Field | Description |
|-------|-------------|
| `seo.titleEn` / `seo.titleTr` | SEO title in English and Turkish (10–70 chars) |
| `seo.metaDescriptionEn` / `seo.metaDescriptionTr` | Meta description in English and Turkish (50–160 chars) |
| `socialCaptionsTr` | 3 unique Turkish social media captions (20–140 chars each) |
| `whatsappBroadcastTr` | Turkish WhatsApp broadcast message (40–280 chars) |
| `hashtagsTr` | Exactly 5 Turkish hashtags; at least 1 encodes district/neighborhood |
| `highlights` | 1–10 factual highlight bullets (3–160 chars each) |

#### Hard Validation Rules
- [ ] **No invention:** Every claim must derive from `listingContext.facts`, category, price, or location.
- [ ] **Location required:** District and neighborhood must appear in SEO and social content.
- [ ] **Category reflected:** Listings with `RENT` must include `kiralık`/`kiralama` in ≥2 fields; `SALE` must include `satılık`/`satış`.
- [ ] **Price reflected:** TRY price must appear in Turkish-facing content with `₺`, `TL`, or `TRY` marker.
- [ ] **Language:** English fields in English; Turkish fields in Turkish.
- [ ] **No superlatives** (e.g., "en iyi", "mükemmel") unless verbatim present in source facts.
- [ ] **No markdown or HTML** in output unless URL exists in source facts.

---

## 5. Non-Functional Requirements

### 5.1 Security

- [ ] All endpoints over HTTPS; TLS 1.2 minimum.
- [ ] CORS restricted to allowed origins per environment.
- [ ] RBAC enforced via server-side middleware (no client-side trust).
- [ ] Input validation on all API boundaries (DTOs with strict schemas).
- [ ] SQL injection prevented via parameterized queries / ORM.
- [ ] Internal service-to-service calls require signed headers with replay protection (timestamp skew ≤5 min, nonce window 10 min).
- [ ] Secrets never committed to the repository. All secrets in approved secret manager.
- [ ] Separate secret namespaces for `staging` and `production`.
- [ ] No secret or PII appears in logs, traces, error payloads, or metric labels.

---

### 5.2 Performance & Scalability

- [ ] Geospatial queries use PostGIS spatial index (`GIST` index on geometry column).
- [ ] Listing search results paginated with stable cursor.
- [ ] Image uploads are processed asynchronously; response does not block on compression.
- [ ] AI enrichment runs in a background worker queue (BullMQ), not on the request path.
- [ ] Worker concurrency bounded via `WORKER_CONCURRENCY` env var (1–200).
- [ ] Dead-letter queue configured for failed automation jobs.

---

### 5.3 Observability & Audit Logging

- [ ] All automation events carry `correlationId`, `causationId`, and OpenTelemetry trace context (`traceId`, `spanId`).
- [ ] Every moderation action produces an immutable audit log entry.
- [ ] All artifacts rejected at validation are logged with `correlationId` and `listingId` (HTTP 422).
- [ ] Structured JSON logging; `LOG_LEVEL` configurable per environment (`debug` forbidden in production).
- [ ] Sentry DSN configured per service per environment.
- [ ] OTEL exporter endpoint configured per environment.
- [ ] PII redaction enforced at all logging/tracing points (see §5.4).

---

### 5.4 Environment & Secrets Management

Two deployment environments: `staging` and `production`. Infrastructure, databases, queues, caches, storage buckets, secret namespaces, and telemetry projects are **strictly separated** per environment.

#### Startup Validation
- [ ] All required environment variables validated at startup/build time.
- [ ] Service refuses to start if any required var is missing or malformed.
- [ ] `NODE_ENV` and `APP_ENV` must be consistent; mismatch → startup failure.
- [ ] Unknown vars with protected prefixes (`API_`, `JWT_`, `INTERNAL_`, `DATABASE_`) cause a warning in staging and fail in production.

#### Key Environment Variables (Summary)

| Service | Key Variables |
|---------|--------------|
| All | `APP_ENV`, `NODE_ENV`, `LOG_LEVEL`, `SENTRY_DSN`, `OTEL_EXPORTER_OTLP_ENDPOINT` |
| API | `API_PORT`, `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `INTERNAL_API_KEYS`, `CORS_ALLOWED_ORIGINS`, `CRM_SYNC_BASE_URL`, `CRM_SYNC_API_KEY` |
| Worker | `WORKER_CONCURRENCY`, `QUEUE_URL`, `QUEUE_NAME`, `DLQ_NAME`, `JOB_MAX_RETRIES`, `INTERNAL_API_BASE_URL`, `INTERNAL_API_KEY`, `OPENAI_API_KEY` (conditional) |
| Web | `WEB_PORT`, `API_BASE_URL_SERVER`, `NEXT_PUBLIC_API_BASE_URL`, `SESSION_SECRET` |
| Mobile | `MOBILE_ENV`, `MOBILE_API_BASE_URL`, `MOBILE_SENTRY_DSN` |

#### Secret Rotation Policy

| Secret Type | Max Lifetime | Rotation Cadence | Overlap Window |
|-------------|--------------|-----------------|----------------|
| Internal API keys | 90 days | Every 60 days | 7 days |
| JWT secrets | 180 days | Every 90 days | 14 days |
| CRM/3rd-party keys | 90 days | Every 60–90 days | 7 days |
| DB credentials | 180 days | Every 90 days | 14 days |
| Queue/Broker credentials | 180 days | Every 90 days | 14 days |

#### PII Logging Redaction (All Services)

| Field | Log Format |
|-------|-----------|
| `name` | First character + `***` |
| `phone` | Country code + last 2 digits |
| `email` | First char + partial domain mask |
| `message` / `notes` | Length + SHA-256 hash only |
| Tokens / secrets | Fully redacted |
| `address` | District/neighborhood only |

---

## 6. Roadmap & Future Features (Phase 2+)

### Engagement & Social
- [ ] **Favorites:** Allow visitors to save listings (requires Visitor Auth).
- [ ] **Comments/Q&A:** Moderated public questions on listing pages.

### Notifications
- [ ] **Transactional Emails:** "Your listing was approved", "New listing for review", "Lead assigned to you".
- [ ] **Push Notifications:** Mobile alerts for status changes and new leads.

### Enhanced AI Automation
- [ ] **Automated Decision Support:** Surface AI decision recommendation to Admin alongside the moderation queue item (currently advisory only).
- [ ] **Content Moderation:** Auto-detect inappropriate images before Admin sees them.
- [ ] **Smart Tagging:** AI analysis of photos to auto-fill tags (e.g., "Pool", "Sea View") directly from image content.
- [ ] **Copywriting Assistant:** Generative AI to improve Consultant listing descriptions inline.
- [ ] **Lead Summarization:** AI-generated natural language summary of a lead inquiry for fast Admin triage.

### Data & Analytics
- [ ] **Submission Analytics:** Track submission rates, rejection reasons, average time-to-publish by district.
- [ ] **Lead Funnel Analytics:** Conversion rates by channel, UTM source, and score bucket.
- [ ] **Listing Performance Dashboard:** Views, inquiry rate, and time-on-market per listing.

### Visitor Auth & Personalization
- [ ] Visitor registration and login.
- [ ] Saved search alerts ("New listings matching your filters").
- [ ] Comparison tool (side-by-side listing comparison).

---

## 7. Technical Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Backend** | Node.js (NestJS) | API service, global prefix `/api`, default port `3001` |
| **Job Queue** | BullMQ | Queue name: `automation`; backed by Redis |
| **Database** | PostgreSQL + PostGIS | PostGIS for geospatial search; separate DB per environment |
| **Cache / Queue Broker** | Redis | Session support and BullMQ backing store |
| **Frontend (Web)** | Next.js (React) | SSR + client; public env vars via `NEXT_PUBLIC_*` |
| **Mobile** | Flutter or React Native | No long-lived secrets in bundle; runtime token fetch |
| **Media Storage** | AWS S3 or MinIO | Environment-specific buckets; server-side compression |
| **AI / LLM** | OpenAI API (or compatible) | Worker-side only; key in secret manager |
| **Observability** | OpenTelemetry + Sentry | Per-service, per-environment DSN and OTLP endpoint |
| **Current Phase** | In-memory store | No ORM/Prisma; no Swagger — explicitly excluded from current implementation |
