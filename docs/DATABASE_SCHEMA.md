# AREP Database Schema

**Version:** 1.0.0
**Last Updated:** 2026-02-25
**Status:** Phase 2 Target (PostgreSQL + PostGIS)

> **Note:** The current implementation uses an in-memory store (`apps/api/src/store/store.ts`).
> This document describes the PostgreSQL target schema to be implemented when Prisma is wired up.
> All type definitions in `store.ts` are the source of truth for field names and shapes.

---

## Table of Contents

1. [Extensions & Enums](#1-extensions--enums)
2. [Tables](#2-tables)
3. [Indexes](#3-indexes)
4. [Relationships Diagram](#4-relationships-diagram)
5. [Prisma Schema (Target)](#5-prisma-schema-target)
6. [Migration Notes](#6-migration-notes)

---

## 1. Extensions & Enums

```sql
-- Required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Listing lifecycle states
CREATE TYPE listing_status AS ENUM (
  'DRAFT',
  'PENDING_REVIEW',
  'NEEDS_CHANGES',
  'PUBLISHED',
  'ARCHIVED',
  'REJECTED'
);

-- Admin moderation decisions
CREATE TYPE moderation_decision AS ENUM (
  'APPROVE',
  'REQUEST_CHANGES',
  'REJECT'
);

-- Listing category
CREATE TYPE listing_category AS ENUM ('RENT', 'SALE');

-- Property types
CREATE TYPE property_type AS ENUM (
  'APARTMENT',
  'VILLA',
  'HOUSE',
  'LAND',
  'COMMERCIAL',
  'OTHER'
);

-- Supported currencies
CREATE TYPE currency_code AS ENUM ('TRY', 'USD', 'EUR');

-- Lead contact channels
CREATE TYPE lead_channel AS ENUM ('WHATSAPP', 'CALL', 'FORM');

-- Lead score buckets
CREATE TYPE lead_tier AS ENUM ('HOT', 'WARM', 'COLD');

-- Lead lifecycle states
CREATE TYPE lead_status AS ENUM (
  'NEW',
  'OPEN',
  'CONTACTED',
  'QUALIFIED',
  'UNQUALIFIED',
  'CLOSED'
);

-- CRM sync outcomes
CREATE TYPE crm_sync_status AS ENUM (
  'SUCCESS',
  'FAILED',
  'SKIPPED_DUPLICATE'
);

-- CRM sync trigger events
CREATE TYPE crm_sync_trigger AS ENUM (
  'LEAD_CREATED',
  'LISTING_PUBLISHED'
);

-- Marketing asset pack states
CREATE TYPE pack_status AS ENUM (
  'PENDING_OPERATOR',
  'COMPLETED'
);
```

---

## 2. Tables

### 2.1 `listings`

Core listing record. City is always `Antalya`; district must pass the 19-district whitelist.

```sql
CREATE TABLE listings (
  id                  UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id       UUID             NOT NULL,

  -- Content
  title               VARCHAR(200)     NOT NULL,
  description         TEXT,
  category            listing_category,
  property_type       property_type,

  -- Price
  price_amount        NUMERIC(15, 2),
  price_currency      currency_code,
  price_is_negotiable BOOLEAN,

  -- Specifications
  sq_meters           NUMERIC(10, 2),
  room_count          SMALLINT,
  bathroom_count      SMALLINT,
  floor_number        SMALLINT,
  total_floors        SMALLINT,
  build_year          SMALLINT,
  furnished           BOOLEAN,
  balcony             BOOLEAN,
  parking             BOOLEAN,
  elevator            BOOLEAN,
  pool                BOOLEAN,
  sea_view            BOOLEAN,

  -- Location
  city                VARCHAR(50)      NOT NULL DEFAULT 'Antalya',
  district            VARCHAR(100),
  neighborhood        VARCHAR(200),
  address             TEXT,
  postal_code         VARCHAR(10),
  coordinates         GEOGRAPHY(POINT, 4326),  -- PostGIS; SRID 4326 (WGS84)

  -- Contact (denormalized on listing)
  contact_phone       VARCHAR(25),   -- E.164
  contact_email       VARCHAR(254),
  contact_whatsapp    VARCHAR(25),   -- E.164

  -- Metadata
  status              listing_status   NOT NULL DEFAULT 'DRAFT',
  submitted_at        TIMESTAMPTZ,
  version             INTEGER          NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
```

### 2.2 `listing_images`

Images are stored separately and ordered per listing. Cascade-deleted with parent listing.

```sql
CREATE TABLE listing_images (
  image_id      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID         NOT NULL REFERENCES listings(id) ON DELETE CASCADE,

  url           TEXT         NOT NULL,
  storage_key   TEXT         NOT NULL,   -- S3 / MinIO object key
  order_index   SMALLINT     NOT NULL DEFAULT 0,

  -- Metadata
  width         INTEGER,
  height        INTEGER,
  size_bytes    INTEGER,
  mime_type     VARCHAR(50),
  checksum      CHAR(64),               -- SHA-256 hex

  uploaded_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### 2.3 `moderation_reports`

One report per listing; overwritten on each admin action.

```sql
CREATE TABLE moderation_reports (
  report_id         UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        UUID                 NOT NULL REFERENCES listings(id),

  admin_id          VARCHAR(100)         NOT NULL,
  decision          moderation_decision  NOT NULL,
  applied_rules     TEXT[]               NOT NULL,

  previous_status   listing_status       NOT NULL,
  new_status        listing_status       NOT NULL,
  decided_at        TIMESTAMPTZ          NOT NULL,
  reason            TEXT                 NOT NULL,

  -- Conditional fields
  feedback          TEXT,    -- Required when decision = REQUEST_CHANGES
  notes             TEXT,    -- Present on APPROVE

  -- Links
  scoring_report_id UUID,    -- References scoring_reports.report_id (nullable)

  created_at        TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);
```

### 2.4 `scoring_reports`

Deterministic scoring output plus optional LLM enrichment. One per listing; overwritten on new run.

```sql
CREATE TABLE scoring_reports (
  report_id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id                UUID         NOT NULL REFERENCES listings(id),

  -- Deterministic scores
  completeness_score        SMALLINT     NOT NULL,   -- 0–100
  description_quality_score SMALLINT     NOT NULL,   -- 0–100
  missing_fields            TEXT[],
  warnings                  JSONB        NOT NULL DEFAULT '[]',
  -- warnings shape:
  -- [{ "code": string, "severity": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
  --    "message": string, "field": string|null }]

  -- LLM enrichment (nullable until attached)
  llm_status                VARCHAR(20),  -- SUCCESS | PARTIAL | ERROR
  content_moderation        JSONB,
  -- shape: { status: "PASS"|"FAIL"|"WARNING", passed: bool,
  --          issues: [{type, severity, message, field?, confidence?}] }
  fact_verification         JSONB,
  -- shape: { status: "CONSISTENT"|"INCONSISTENT"|"INSUFFICIENT_DATA",
  --          consistencyScore?: number|null,
  --          inconsistencies: [{type, severity, message, field}] }
  risk_assessment           JSONB,
  -- shape: { riskLevel: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
  --          requiresManualReview: bool,
  --          fraudIndicators: [{indicator, severity, message, evidence}] }
  llm_error                 JSONB,
  -- shape: { code: string, message: string }

  generated_at              TIMESTAMPTZ  NOT NULL,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### 2.5 `marketing_asset_pack_requests`

HITL workflow for AI-generated marketing content. Created automatically on listing approval.

```sql
CREATE TABLE marketing_asset_pack_requests (
  request_id      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID         NOT NULL REFERENCES listings(id),
  listing_title   VARCHAR(200) NOT NULL,

  status          pack_status  NOT NULL DEFAULT 'PENDING_OPERATOR',
  hitl_prompt     TEXT         NOT NULL,

  -- Completed pack (NULL until COMPLETED)
  result          JSONB,
  -- shape: { packId, listingId, generatedAt,
  --          seoTitle:{tr,en}, metaDescription:{tr,en},
  --          socialCaptions:[str×3], whatsappBroadcast,
  --          hashtags:[str×5] }

  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);
```

### 2.6 `leads`

Visitor inquiry records. PII fields (`name`, `phone`, `message`) must be encrypted at rest in production.

```sql
CREATE TABLE leads (
  lead_id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key   VARCHAR(500) NOT NULL UNIQUE,

  listing_id        UUID         NOT NULL REFERENCES listings(id),
  channel           lead_channel NOT NULL,

  -- PII — encrypt at rest in production (pgcrypto or application-layer)
  name              VARCHAR(120) NOT NULL,
  phone             VARCHAR(25)  NOT NULL,  -- E.164
  message           TEXT,
  preferred_time    VARCHAR(100),

  -- Attribution
  utm_source        VARCHAR(200),
  utm_medium        VARCHAR(200),
  utm_campaign      VARCHAR(200),

  -- Consent & lifecycle
  consent_given     BOOLEAN      NOT NULL DEFAULT FALSE,
  status            lead_status  NOT NULL DEFAULT 'NEW',
  admin_notes       TEXT,

  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### 2.7 `lead_score_reports`

Deterministic lead scoring output. One per lead; created synchronously on lead creation.

```sql
CREATE TABLE lead_score_reports (
  report_id     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID         NOT NULL REFERENCES leads(lead_id),
  listing_id    UUID         NOT NULL REFERENCES listings(id),

  score         SMALLINT     NOT NULL,  -- 0–100
  tier          lead_tier    NOT NULL,  -- HOT | WARM | COLD
  reason_codes  TEXT[]       NOT NULL,

  scored_at     TIMESTAMPTZ  NOT NULL
);
```

### 2.8 `crm_sync_results`

Audit log of all CRM synchronization attempts. All attempts per entity are retained.

```sql
CREATE TABLE crm_sync_results (
  sync_id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger           crm_sync_trigger  NOT NULL,
  entity_id         UUID              NOT NULL,  -- leadId or listingId

  idempotency_key   VARCHAR(500)      NOT NULL,
  status            crm_sync_status   NOT NULL,
  attempt           SMALLINT          NOT NULL DEFAULT 1,

  external_ref      VARCHAR(200),     -- CRM-side reference ID on SUCCESS
  error             TEXT,

  synced_at         TIMESTAMPTZ       NOT NULL
);
```

---

## 3. Indexes

```sql
-- listings: geospatial search (Bounding Box, radius)
CREATE INDEX listings_coordinates_gist  ON listings USING GIST(coordinates);

-- listings: common filter columns
CREATE INDEX listings_status_idx        ON listings(status);
CREATE INDEX listings_district_idx      ON listings(district);
CREATE INDEX listings_category_idx      ON listings(category);
CREATE INDEX listings_consultant_idx    ON listings(consultant_id);

-- listing_images: retrieval per listing ordered by position
CREATE INDEX listing_images_listing_idx ON listing_images(listing_id, order_index);

-- moderation_reports: one-to-one by listing (enforces overwrite semantics)
CREATE UNIQUE INDEX moderation_reports_listing_uq ON moderation_reports(listing_id);

-- scoring_reports: one-to-one by listing
CREATE UNIQUE INDEX scoring_reports_listing_uq    ON scoring_reports(listing_id);

-- marketing_asset_pack_requests: one-to-one by listing
CREATE UNIQUE INDEX pack_requests_listing_uq      ON marketing_asset_pack_requests(listing_id);

-- leads: idempotency dedup + common lookups
CREATE INDEX leads_listing_idx          ON leads(listing_id);
CREATE INDEX leads_phone_idx            ON leads(phone);      -- repeat-inquiry frequency queries
CREATE INDEX leads_status_idx           ON leads(status);

-- lead_score_reports: one-to-one by lead
CREATE UNIQUE INDEX lead_scores_lead_uq ON lead_score_reports(lead_id);

-- crm_sync_results: entity lookups + idempotency dedup
CREATE INDEX crm_sync_entity_idx        ON crm_sync_results(entity_id);
CREATE INDEX crm_sync_ikey_idx          ON crm_sync_results(idempotency_key);
```

---

## 4. Relationships Diagram

```
listings (1)
  ├──< listing_images         (1:N, CASCADE delete)
  ├──── moderation_reports    (1:1, overwrite — UNIQUE on listing_id)
  │       └── → scoring_reports  (via scoring_report_id FK)
  ├──── scoring_reports       (1:1, overwrite — UNIQUE on listing_id)
  ├──── marketing_asset_pack_requests  (1:1 — UNIQUE on listing_id)
  └──< leads (1:N)
         ├──── lead_score_reports  (1:1 — UNIQUE on lead_id)
         └──< crm_sync_results     (1:N — entity_id = leadId)

crm_sync_results also linked to listings:
  listings ──< crm_sync_results  (entity_id = listingId when trigger = LISTING_PUBLISHED)
```

---

## 5. Prisma Schema (Target)

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [uuidOssp(map: "uuid-ossp"), postgis]
}

// ─── Enums ────────────────────────────────────────────────────

enum ListingStatus {
  DRAFT
  PENDING_REVIEW
  NEEDS_CHANGES
  PUBLISHED
  ARCHIVED
  REJECTED
}

enum ModerationDecision {
  APPROVE
  REQUEST_CHANGES
  REJECT
}

enum ListingCategory { RENT; SALE }

enum PropertyType { APARTMENT; VILLA; HOUSE; LAND; COMMERCIAL; OTHER }

enum CurrencyCode { TRY; USD; EUR }

enum LeadChannel { WHATSAPP; CALL; FORM }

enum LeadTier { HOT; WARM; COLD }

enum LeadStatus { NEW; OPEN; CONTACTED; QUALIFIED; UNQUALIFIED; CLOSED }

enum CrmSyncStatus { SUCCESS; FAILED; SKIPPED_DUPLICATE }

enum CrmSyncTrigger { LEAD_CREATED; LISTING_PUBLISHED }

enum PackStatus { PENDING_OPERATOR; COMPLETED }

// ─── Models ───────────────────────────────────────────────────

model Listing {
  id                String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  consultantId      String           @db.Uuid

  title             String           @db.VarChar(200)
  description       String?          @db.Text
  category          ListingCategory?
  propertyType      PropertyType?

  priceAmount       Decimal?         @db.Decimal(15, 2)
  priceCurrency     CurrencyCode?
  priceIsNegotiable Boolean?

  sqMeters          Decimal?         @db.Decimal(10, 2)
  roomCount         Int?             @db.SmallInt
  bathroomCount     Int?             @db.SmallInt
  floorNumber       Int?             @db.SmallInt
  totalFloors       Int?             @db.SmallInt
  buildYear         Int?             @db.SmallInt
  furnished         Boolean?
  balcony           Boolean?
  parking           Boolean?
  elevator          Boolean?
  pool              Boolean?
  seaView           Boolean?

  city              String           @default("Antalya") @db.VarChar(50)
  district          String?          @db.VarChar(100)
  neighborhood      String?          @db.VarChar(200)
  address           String?          @db.Text
  postalCode        String?          @db.VarChar(10)
  // coordinates: use @db.Unsupported("geography(Point, 4326)") + raw migration SQL
  coordinates       Unsupported("geography(Point, 4326)")?

  contactPhone      String?          @db.VarChar(25)
  contactEmail      String?          @db.VarChar(254)
  contactWhatsapp   String?          @db.VarChar(25)

  status            ListingStatus    @default(DRAFT)
  submittedAt       DateTime?        @db.Timestamptz
  version           Int              @default(1)
  createdAt         DateTime         @default(now()) @db.Timestamptz
  updatedAt         DateTime         @updatedAt @db.Timestamptz

  images            ListingImage[]
  moderationReport  ModerationReport?
  scoringReport     ScoringReport?
  packRequest       MarketingAssetPackRequest?
  leads             Lead[]

  @@map("listings")
}

model ListingImage {
  imageId    String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  listingId  String   @db.Uuid
  listing    Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  url        String   @db.Text
  storageKey String   @db.Text
  orderIndex Int      @default(0) @db.SmallInt

  width      Int?
  height     Int?
  sizeBytes  Int?
  mimeType   String?  @db.VarChar(50)
  checksum   String?  @db.Char(64)

  uploadedAt DateTime @default(now()) @db.Timestamptz

  @@map("listing_images")
}

model ModerationReport {
  reportId        String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  listingId       String             @unique @db.Uuid
  listing         Listing            @relation(fields: [listingId], references: [id])

  adminId         String             @db.VarChar(100)
  decision        ModerationDecision
  appliedRules    String[]
  previousStatus  ListingStatus
  newStatus       ListingStatus
  decidedAt       DateTime           @db.Timestamptz
  reason          String             @db.Text

  feedback        String?            @db.Text
  notes           String?            @db.Text
  scoringReportId String?            @db.Uuid

  createdAt       DateTime           @default(now()) @db.Timestamptz

  @@map("moderation_reports")
}

model ScoringReport {
  reportId                String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  listingId               String   @unique @db.Uuid
  listing                 Listing  @relation(fields: [listingId], references: [id])

  completenessScore       Int      @db.SmallInt
  descriptionQualityScore Int      @db.SmallInt
  missingFields           String[]
  warnings                Json     @default("[]")

  llmStatus               String?  @db.VarChar(20)
  contentModeration       Json?
  factVerification        Json?
  riskAssessment          Json?
  llmError                Json?

  generatedAt             DateTime @db.Timestamptz
  createdAt               DateTime @default(now()) @db.Timestamptz

  @@map("scoring_reports")
}

model MarketingAssetPackRequest {
  requestId    String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  listingId    String     @unique @db.Uuid
  listing      Listing    @relation(fields: [listingId], references: [id])
  listingTitle String     @db.VarChar(200)

  status       PackStatus @default(PENDING_OPERATOR)
  hitlPrompt   String     @db.Text
  result       Json?

  createdAt    DateTime   @default(now()) @db.Timestamptz
  completedAt  DateTime?  @db.Timestamptz

  @@map("marketing_asset_pack_requests")
}

model Lead {
  leadId         String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  idempotencyKey String      @unique @db.VarChar(500)

  listingId      String      @db.Uuid
  listing        Listing     @relation(fields: [listingId], references: [id])
  channel        LeadChannel

  name           String      @db.VarChar(120)
  phone          String      @db.VarChar(25)
  message        String?     @db.Text
  preferredTime  String?     @db.VarChar(100)

  utmSource      String?     @db.VarChar(200)
  utmMedium      String?     @db.VarChar(200)
  utmCampaign    String?     @db.VarChar(200)

  consentGiven   Boolean     @default(false)
  status         LeadStatus  @default(NEW)
  adminNotes     String?     @db.Text

  createdAt      DateTime    @default(now()) @db.Timestamptz
  updatedAt      DateTime    @updatedAt @db.Timestamptz

  scoreReport    LeadScoreReport?
  crmSyncResults CrmSyncResult[]

  @@map("leads")
}

model LeadScoreReport {
  reportId    String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  leadId      String   @unique @db.Uuid
  lead        Lead     @relation(fields: [leadId], references: [leadId])
  listingId   String   @db.Uuid

  score       Int      @db.SmallInt
  tier        LeadTier
  reasonCodes String[]

  scoredAt    DateTime @db.Timestamptz

  @@map("lead_score_reports")
}

model CrmSyncResult {
  syncId         String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  trigger        CrmSyncTrigger
  entityId       String          @db.Uuid

  leadId         String?         @db.Uuid
  lead           Lead?           @relation(fields: [leadId], references: [leadId])

  idempotencyKey String          @db.VarChar(500)
  status         CrmSyncStatus
  attempt        Int             @default(1) @db.SmallInt

  externalRef    String?         @db.VarChar(200)
  error          String?         @db.Text

  syncedAt       DateTime        @db.Timestamptz

  @@map("crm_sync_results")
}
```

---

## 6. Migration Notes

### Phase 1 → Phase 2 Checklist

- [ ] Enable `uuid-ossp` and `postgis` extensions in target database before first migration.
- [ ] Add `DATABASE_URL` to secret manager; uncomment in `apps/api/src/config/env.validation.ts`.
- [ ] Wire `PrismaModule` (global) into `AppModule`; replace `InMemoryStore` injections with Prisma service calls.
- [ ] Add raw SQL for `coordinates GEOGRAPHY(POINT, 4326)` column + `GIST` index in migration file (Prisma `@db.Unsupported` approach).
- [ ] Enable column-level encryption for `leads.name`, `leads.phone`, `leads.message` (pgcrypto or application-layer AES).
- [ ] Create separate DB users per environment with least-privilege grants (SELECT/INSERT/UPDATE per table).
- [ ] Set up DB credential rotation per `docs/ENVIRONMENT_SECRETS_MANAGEMENT_SPEC_AREP.md §4`.
- [ ] Verify `UNIQUE` constraints on `moderation_reports.listing_id` and `scoring_reports.listing_id` are enforced at DB level (overwrite semantics).
- [ ] Wire `updated_at` auto-update trigger or rely on Prisma `@updatedAt` for `listings` and `leads`.

### PostGIS Bounding Box Query Pattern

```sql
-- Listings within a map viewport bounding box (all PUBLISHED)
SELECT id, title, price_amount, price_currency, district, neighborhood,
       ST_AsGeoJSON(coordinates::geometry) AS coordinates
FROM listings
WHERE status = 'PUBLISHED'
  AND ST_Within(
    coordinates::geometry,
    ST_MakeEnvelope($1, $2, $3, $4, 4326)
  );
-- Parameters: $1=minLng, $2=minLat, $3=maxLng, $4=maxLat
```

See `docs/POSTGIS_QUERY_OPTIMIZATION.md` for full query patterns, index strategy, and performance considerations.
