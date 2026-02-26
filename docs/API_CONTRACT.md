# AREP API Contract

**Version:** 1.0.0
**Last Updated:** 2026-02-25
**Status:** Current Implementation

---

## Overview

| Property | Value |
|----------|-------|
| Base URL | `http(s)://<host>/api` |
| Default port | `3001` |
| Global prefix | `/api` (set in `main.ts`) |
| Content-Type | `application/json` |
| Input validation | Global `ValidationPipe({ whitelist: true })` — unknown fields are silently stripped |
| Auth | Not enforced in current phase (JWT planned for Phase 2) |

---

## Table of Contents

1. [Shared Types](#1-shared-types)
2. [Listings](#2-listings)
3. [Admin Moderation](#3-admin-moderation)
4. [Leads](#4-leads)
5. [Marketing](#5-marketing)
6. [CRM Sync](#6-crm-sync)
7. [Error Responses](#7-error-responses)

---

## 1. Shared Types

### `Listing`

```typescript
{
  id:          string;   // UUID v4
  title:       string;
  consultantId: string;  // UUID v4 or "anonymous"
  status:      "DRAFT" | "PENDING_REVIEW" | "NEEDS_CHANGES" | "PUBLISHED" | "ARCHIVED";
  submittedAt: string;   // ISO 8601 UTC
  createdAt:   string;   // ISO 8601 UTC
  updatedAt:   string;   // ISO 8601 UTC
}
```

### `ModerationReport`

```typescript
{
  reportId:        string;   // UUID v4
  listingId:       string;   // UUID v4
  adminId:         string;
  decision:        "APPROVE" | "REQUEST_CHANGES" | "REJECT";
  appliedRules:    string[];
  previousStatus:  ListingStatus;
  newStatus:       ListingStatus;
  decidedAt:       string;   // ISO 8601 UTC
  reason:          string;
  feedback?:       string;   // Present when decision = REQUEST_CHANGES
  notes?:          string;   // Present on APPROVE
  scoringReportId?: string;  // UUID v4 | undefined
}
```

### `ScoringReport`

```typescript
{
  reportId:    string;   // UUID v4
  listingId:   string;   // UUID v4
  generatedAt: string;   // ISO 8601 UTC
  deterministicScores: {
    completenessScore:        number;   // 0–100
    descriptionQualityScore:  number;   // 0–100
    missingFields:            string[];
    warnings: Array<{
      code:     string;
      severity: "LOW" | "MEDIUM" | "HIGH";
      message:  string;
      field:    string | null;
    }>;
  };
  llmResult?: {
    status: "SUCCESS" | "PARTIAL" | "ERROR";
    contentModeration?: {
      status:  "PASS" | "FAIL" | "WARNING";
      passed:  boolean;
      issues:  Array<{
        type:       string;
        severity:   "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        message:    string;
        field?:     string | null;
        confidence?: number;
      }>;
    };
    factVerification?: {
      status:           "CONSISTENT" | "INCONSISTENT" | "INSUFFICIENT_DATA";
      consistencyScore?: number | null;
      inconsistencies:  Array<{
        type:     string;
        severity: "LOW" | "MEDIUM" | "HIGH";
        message:  string;
        field:    string;
      }>;
    };
    riskAssessment?: {
      riskLevel:            "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      requiresManualReview: boolean;
      fraudIndicators:      Array<{
        indicator: string;
        severity:  "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        message:   string;
        evidence:  string;
      }>;
    };
    error?: { code: string; message: string };
  };
}
```

### `Lead`

```typescript
{
  leadId:         string;   // UUID v4
  idempotencyKey: string;
  listingId:      string;   // UUID v4
  channel:        "WHATSAPP" | "CALL" | "FORM";
  name:           string;
  phone:          string;   // E.164
  message?:       string;
  preferredTime?: string;
  utmSource?:     string;
  utmMedium?:     string;
  utmCampaign?:   string;
  consentGiven:   boolean;
  createdAt:      string;   // ISO 8601 UTC
}
```

### `LeadScoreReport`

```typescript
{
  reportId:    string;   // UUID v4
  leadId:      string;   // UUID v4
  listingId:   string;   // UUID v4
  score:       number;   // 0–100
  tier:        "HOT" | "WARM" | "COLD";
  reasonCodes: string[];
  scoredAt:    string;   // ISO 8601 UTC
}
```

### `MarketingAssetPackRequest`

```typescript
{
  requestId:    string;   // UUID v4
  listingId:    string;   // UUID v4
  listingTitle: string;
  status:       "PENDING_OPERATOR" | "COMPLETED";
  hitlPrompt:   string;
  result?: {
    packId:            string;  // UUID v4
    listingId:         string;
    generatedAt:       string;  // ISO 8601 UTC
    seoTitle:          { tr: string; en: string };
    metaDescription:   { tr: string; en: string };
    socialCaptions:    string[];  // 3 items
    whatsappBroadcast: string;
    hashtags:          string[];  // 5 items
  };
  createdAt:    string;   // ISO 8601 UTC
  completedAt?: string;   // ISO 8601 UTC
}
```

### `CRMSyncResult`

```typescript
{
  syncId:         string;   // UUID v4
  trigger:        "LEAD_CREATED" | "LISTING_PUBLISHED";
  entityId:       string;   // UUID v4 (leadId or listingId)
  idempotencyKey: string;
  status:         "SUCCESS" | "FAILED" | "SKIPPED_DUPLICATE";
  attempt:        number;
  externalRef?:   string;   // CRM-side reference ID
  error?:         string;
  syncedAt:       string;   // ISO 8601 UTC
}
```

---

## 2. Listings

Base path: `/api/listings`

---

### `POST /api/listings`

Create a new listing. The listing is created directly in `PENDING_REVIEW` status (current implementation; `DRAFT` → `PENDING_REVIEW` flow is the target).

**Request Body**

```json
{
  "title": "string (required, non-empty)",
  "consultantId": "string (optional)"
}
```

| Field | Required | Validation |
|-------|----------|-----------|
| `title` | Yes | Non-empty string |
| `consultantId` | No | String; defaults to `"anonymous"` if omitted |

**Response — `201 Created`**

```json
{
  "id": "uuid",
  "title": "string",
  "consultantId": "string",
  "status": "PENDING_REVIEW",
  "submittedAt": "2026-02-25T10:00:00.000Z",
  "createdAt": "2026-02-25T10:00:00.000Z",
  "updatedAt": "2026-02-25T10:00:00.000Z"
}
```

---

### `GET /api/listings/:id`

Retrieve a listing by ID.

**Path Parameters**

| Param | Description |
|-------|-------------|
| `id` | Listing UUID |

**Response — `200 OK`**

Returns a `Listing` object.

**Errors**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Listing ID does not exist |

---

### `PATCH /api/listings/:id/resubmit`

Resubmit a listing from `NEEDS_CHANGES` back to `PENDING_REVIEW`. This is the Consultant's action after revising their listing based on Admin feedback.

**Path Parameters**

| Param | Description |
|-------|-------------|
| `id` | Listing UUID |

**Request Body** — none required.

**Response — `200 OK`**

Returns the updated `Listing` object with `status: "PENDING_REVIEW"` and a refreshed `submittedAt` timestamp.

**Errors**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Listing ID does not exist |
| `409 Conflict` | Listing is not in `NEEDS_CHANGES` status |

---

## 3. Admin Moderation

Base path: `/api/admin/moderation`

All endpoints in this group are intended for Admin use. In Phase 2, they will be protected by role-based guards.

---

### `GET /api/admin/moderation/queue`

Retrieve all listings currently in `PENDING_REVIEW` status.

**Response — `200 OK`**

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "string",
      "consultantId": "string",
      "status": "PENDING_REVIEW",
      "submittedAt": "2026-02-25T10:00:00.000Z",
      "createdAt": "2026-02-25T10:00:00.000Z",
      "updatedAt": "2026-02-25T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### `GET /api/admin/moderation/:listingId/report`

Retrieve the most recent `ModerationReport` for a listing.

**Path Parameters**

| Param | Description |
|-------|-------------|
| `listingId` | Listing UUID |

**Response — `200 OK`**

Returns a `ModerationReport` object.

**Errors**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Listing does not exist |
| `404 Not Found` | No moderation report has been created yet for this listing |

---

### `GET /api/admin/moderation/:listingId/score`

Retrieve the most recent `ScoringReport` for a listing.

**Response — `200 OK`**

Returns a `ScoringReport` object.

**Errors**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Listing does not exist |
| `404 Not Found` | No scoring report exists for this listing |

---

### `POST /api/admin/moderation/:listingId/score`

Create or overwrite the `ScoringReport` for a listing with deterministic scoring results. Typically called by the automation worker after evaluating the listing payload.

**Request Body**

```json
{
  "deterministicScores": {
    "completenessScore": 80,
    "descriptionQualityScore": 65,
    "missingFields": [],
    "warnings": [
      {
        "code": "INSUFFICIENT_IMAGES",
        "severity": "MEDIUM",
        "message": "Only 2 images provided; recommend at least 3.",
        "field": "media.imageCount"
      }
    ]
  }
}
```

| Field | Required | Type |
|-------|----------|------|
| `deterministicScores` | Yes | Object |
| `deterministicScores.completenessScore` | Yes | number (0–100) |
| `deterministicScores.descriptionQualityScore` | Yes | number (0–100) |
| `deterministicScores.missingFields` | Yes | string[] |
| `deterministicScores.warnings` | Yes | Array of warning objects |
| `warnings[].code` | Yes | string |
| `warnings[].severity` | Yes | `"LOW"` \| `"MEDIUM"` \| `"HIGH"` |
| `warnings[].message` | Yes | string |
| `warnings[].field` | No | string \| null |

**Response — `201 Created`**

Returns the created `ScoringReport` (without `llmResult`, which is attached separately).

**Errors**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Listing does not exist |

---

### `PATCH /api/admin/moderation/:listingId/score/llm`

Attach LLM enrichment results to an existing `ScoringReport`. Must be called after `POST /score`.

**Request Body**

```json
{
  "llmResult": {
    "status": "SUCCESS",
    "contentModeration": {
      "status": "PASS",
      "passed": true,
      "issues": []
    },
    "factVerification": {
      "status": "CONSISTENT",
      "consistencyScore": 95,
      "inconsistencies": []
    },
    "riskAssessment": {
      "riskLevel": "LOW",
      "requiresManualReview": false,
      "fraudIndicators": []
    }
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `llmResult` | Yes | Object |
| `llmResult.status` | Yes | `"SUCCESS"` \| `"PARTIAL"` \| `"ERROR"` |
| `llmResult.contentModeration` | No | Content moderation result |
| `llmResult.factVerification` | No | Fact verification result |
| `llmResult.riskAssessment` | No | Risk/fraud assessment |
| `llmResult.error` | No | Error details when `status = "ERROR"` |

**Response — `200 OK`**

Returns the updated `ScoringReport` with `llmResult` attached.

**Errors**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Listing does not exist |
| `404 Not Found` | No scoring report exists; call `POST /score` first |

---

### `PATCH /api/admin/moderation/:listingId/approve`

Approve a listing. Transitions it to `PUBLISHED`, creates a `MarketingAssetPackRequest`, and fires a CRM sync event.

**Precondition:** Listing must be in `PENDING_REVIEW` status.

**Request Body**

```json
{
  "adminId": "admin-001",
  "notes": "Listing meets all quality thresholds."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `adminId` | No | Defaults to `"system"` if omitted |
| `notes` | No | Admin notes stored in report |

**Response — `200 OK`**

```json
{
  "listing": { "...Listing with status: PUBLISHED..." },
  "report": {
    "reportId": "uuid",
    "listingId": "uuid",
    "adminId": "admin-001",
    "decision": "APPROVE",
    "appliedRules": ["ADMIN_MANUAL_APPROVE"],
    "previousStatus": "PENDING_REVIEW",
    "newStatus": "PUBLISHED",
    "decidedAt": "2026-02-25T10:05:00.000Z",
    "reason": "Listing meets all quality thresholds.",
    "notes": "Listing meets all quality thresholds.",
    "scoringReportId": "uuid-or-null"
  }
}
```

**Side effects:**
- `listing.status` → `PUBLISHED`
- `MarketingAssetPackRequest` created with `status: PENDING_OPERATOR`
- CRM sync: `LISTING_PUBLISHED` fired

**Errors**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Listing does not exist |
| `409 Conflict` | Listing is not in `PENDING_REVIEW` status |

---

### `PATCH /api/admin/moderation/:listingId/request-changes`

Return a listing to the Consultant with mandatory written feedback. Transitions to `NEEDS_CHANGES`.

**Precondition:** Listing must be in `PENDING_REVIEW` status.

**Request Body**

```json
{
  "adminId": "admin-001",
  "feedback": "Description is too short. Please add at least 200 characters describing key features."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `adminId` | No | Defaults to `"system"` if omitted |
| `feedback` | **Yes** | Non-empty string; required per spec |

**Response — `200 OK`**

```json
{
  "listing": { "...Listing with status: NEEDS_CHANGES..." },
  "report": {
    "reportId": "uuid",
    "listingId": "uuid",
    "adminId": "admin-001",
    "decision": "REQUEST_CHANGES",
    "appliedRules": ["ADMIN_MANUAL_REQUEST_CHANGES"],
    "previousStatus": "PENDING_REVIEW",
    "newStatus": "NEEDS_CHANGES",
    "decidedAt": "2026-02-25T10:06:00.000Z",
    "reason": "Listing returned to consultant for revision",
    "feedback": "Description is too short. Please add at least 200 characters describing key features.",
    "scoringReportId": "uuid-or-null"
  }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Listing does not exist |
| `409 Conflict` | Listing is not in `PENDING_REVIEW` status |
| `400 Bad Request` | `feedback` field is missing or empty |

---

### `PATCH /api/admin/moderation/:listingId/reject`

Permanently reject a listing. Transitions it to `ARCHIVED`.

**Precondition:** Listing must be in `PENDING_REVIEW` status.

**Request Body**

```json
{
  "adminId": "admin-001",
  "reason": "Listing violates content policy — fraudulent price."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `adminId` | No | Defaults to `"system"` if omitted |
| `reason` | No | Defaults to `"Listing rejected by admin"` if omitted |

**Response — `200 OK`**

```json
{
  "listing": { "...Listing with status: ARCHIVED..." },
  "report": {
    "reportId": "uuid",
    "listingId": "uuid",
    "adminId": "admin-001",
    "decision": "REJECT",
    "appliedRules": ["ADMIN_MANUAL_REJECT"],
    "previousStatus": "PENDING_REVIEW",
    "newStatus": "ARCHIVED",
    "decidedAt": "2026-02-25T10:07:00.000Z",
    "reason": "Listing violates content policy — fraudulent price.",
    "scoringReportId": "uuid-or-null"
  }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Listing does not exist |
| `409 Conflict` | Listing is not in `PENDING_REVIEW` status |

---

## 4. Leads

Base path: `/api/leads`

---

### `POST /api/leads`

Create a new lead inquiry. Idempotent: if the `idempotencyKey` was already used, the existing `{ lead, score }` is returned without side effects.

**Request Body**

```json
{
  "idempotencyKey": "lead-abc123-v1",
  "listingId": "11112222-3333-4444-5555-666677778888",
  "channel": "WHATSAPP",
  "name": "Ali Yılmaz",
  "phone": "+905551234567",
  "message": "Bu daireyi bu hafta görmek istiyorum, bütçem 5M TL.",
  "preferredTime": "Salı sabahı 10:00",
  "utmSource": "google_ads",
  "utmMedium": "cpc",
  "utmCampaign": "antalya-summer-2026",
  "consentGiven": true
}
```

| Field | Required | Validation |
|-------|----------|-----------|
| `idempotencyKey` | **Yes** | Non-empty string |
| `listingId` | **Yes** | UUID v4 |
| `channel` | **Yes** | `"WHATSAPP"` \| `"CALL"` \| `"FORM"` |
| `name` | **Yes** | Non-empty string |
| `phone` | **Yes** | E.164 format (`/^\+[1-9]\d{7,14}$/`) |
| `consentGiven` | **Yes** | Must be `true`; `false` → `400` |
| `message` | No | string |
| `preferredTime` | No | string |
| `utmSource` | No | string |
| `utmMedium` | No | string |
| `utmCampaign` | No | string |

**Response — `201 Created`**

```json
{
  "lead": {
    "leadId": "uuid",
    "idempotencyKey": "lead-abc123-v1",
    "listingId": "uuid",
    "channel": "WHATSAPP",
    "name": "Ali Yılmaz",
    "phone": "+905551234567",
    "message": "Bu daireyi bu hafta görmek istiyorum, bütçem 5M TL.",
    "preferredTime": "Salı sabahı 10:00",
    "utmSource": "google_ads",
    "utmMedium": "cpc",
    "utmCampaign": "antalya-summer-2026",
    "consentGiven": true,
    "createdAt": "2026-02-25T10:00:00.000Z"
  },
  "score": {
    "reportId": "uuid",
    "leadId": "uuid",
    "listingId": "uuid",
    "score": 75,
    "tier": "HOT",
    "reasonCodes": [
      "MSG_DETAILED",
      "URGENCY_HIGH",
      "BUDGET_MENTION",
      "CHANNEL_WHATSAPP",
      "TIME_SPECIFIED",
      "CONSENT_EXPLICIT"
    ],
    "scoredAt": "2026-02-25T10:00:00.000Z"
  }
}
```

**Side effects:**
- Lead saved to store
- `LeadScoreReport` created synchronously
- CRM sync: `LEAD_CREATED` fired (`sync(LEAD_CREATED, leadId, "lead-created-{idempotencyKey}")`)

**Errors**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | `consentGiven` is `false` |
| `404 Not Found` | `listingId` does not exist in the store |

> **Idempotency:** If `idempotencyKey` was already used, returns `200 OK` (not `201`) with the existing `{ lead, score }` and performs no side effects.

---

### `GET /api/leads/:leadId`

Retrieve a lead by ID.

**Path Parameters**

| Param | Description |
|-------|-------------|
| `leadId` | Lead UUID |

**Response — `200 OK`**

Returns a `Lead` object.

**Errors**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Lead does not exist |

---

### `GET /api/leads/:leadId/score`

Retrieve the `LeadScoreReport` for a lead.

**Response — `200 OK`**

Returns a `LeadScoreReport` object.

**Errors**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Lead does not exist |
| `404 Not Found` | No score report found for the lead |

---

## 5. Marketing

Base path: `/api/marketing`

---

### `GET /api/marketing/:listingId/pack`

Retrieve the `MarketingAssetPackRequest` for a listing. The `hitlPrompt` field contains the pre-built LLM prompt that operators or automated workers use to generate the asset pack.

**Path Parameters**

| Param | Description |
|-------|-------------|
| `listingId` | Listing UUID |

**Response — `200 OK`**

Returns a `MarketingAssetPackRequest` object. The `result` field is `undefined` until the pack is completed.

**Errors**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | No pack request found for this listing (listing may not be PUBLISHED yet) |

---

### `PATCH /api/marketing/:listingId/pack/result`

Attach a completed `MarketingAssetPack` to an existing pack request. Transitions the request to `COMPLETED`.

**Request Body**

```json
{
  "result": {
    "packId": "uuid",
    "listingId": "uuid",
    "generatedAt": "2026-02-25T10:10:00.000Z",
    "seoTitle": {
      "tr": "Konyaaltı'nda Kiralık 3+1 Daire — ₺45.000/ay",
      "en": "3+1 Apartment for Rent in Konyaaltı — ₺45,000/mo"
    },
    "metaDescription": {
      "tr": "Konyaaltı, Çınar Mahallesi'nde 120m² kiralık daire. 3+1, balkon, otopark. Ayda ₺45.000.",
      "en": "120m² apartment for rent in Çınar, Konyaaltı. 3+1, balcony, parking. ₺45,000/month."
    },
    "socialCaptions": [
      "Konyaaltı'nda hayalinizdeki daire! 3+1, balkon ve otopark dahil. ₺45.000/ay 🏠",
      "Çınar Mahallesi'nde ferah 120m² kiralık daire. Hemen iletişime geçin! #Antalya",
      "Konyaaltı kiralık 3+1 daire. Balkon, otopark, merkezi konum. ₺45.000/ay."
    ],
    "whatsappBroadcast": "🏠 Konyaaltı'nda Kiralık 3+1 Daire! Çınar Mah. 120m², balkon, otopark. ₺45.000/ay. Detaylar için yazın.",
    "hashtags": [
      "#Antalya",
      "#Konyaaltı",
      "#KiralıkDaire",
      "#3Plus1",
      "#ÇınarMahallesi"
    ]
  }
}
```

| Field | Required | Validation |
|-------|----------|-----------|
| `result` | Yes | Object conforming to `MarketingAssetPack` shape |
| `result.packId` | Yes | UUID v4 |
| `result.listingId` | Yes | UUID v4 |
| `result.generatedAt` | Yes | ISO 8601 UTC |
| `result.seoTitle` | Yes | `{ tr: string, en: string }` |
| `result.metaDescription` | Yes | `{ tr: string, en: string }` |
| `result.socialCaptions` | Yes | Array of 3 strings |
| `result.whatsappBroadcast` | Yes | string |
| `result.hashtags` | Yes | Array of 5 strings beginning with `#` |

**Response — `200 OK`**

Returns the updated `MarketingAssetPackRequest` with `status: "COMPLETED"`, `result` attached, and `completedAt` set.

**Errors**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | No pack request found for this listing |

---

## 6. CRM Sync

Base path: `/api/crm-sync`

---

### `GET /api/crm-sync/:entityId`

Retrieve all CRM synchronization attempts for a given entity (lead or listing).

**Path Parameters**

| Param | Description |
|-------|-------------|
| `entityId` | UUID of the lead or listing |

**Response — `200 OK`**

```json
[
  {
    "syncId": "uuid",
    "trigger": "LEAD_CREATED",
    "entityId": "uuid",
    "idempotencyKey": "lead-created-lead-abc123-v1",
    "status": "SUCCESS",
    "attempt": 1,
    "externalRef": "CRM-A1B2C3D4",
    "syncedAt": "2026-02-25T10:00:01.000Z"
  }
]
```

Returns an empty array `[]` if no sync results exist for this entity.

---

## 7. Error Responses

All errors follow NestJS's default exception format:

```json
{
  "statusCode": 404,
  "message": "Listing abc123 not found",
  "error": "Not Found"
}
```

### HTTP Status Code Reference

| Status | Used when |
|--------|-----------|
| `400 Bad Request` | Validation failure (`ValidationPipe`), business rule violation (e.g., `consentGiven: false`) |
| `404 Not Found` | Entity does not exist in the store |
| `409 Conflict` | State machine violation (e.g., resubmit from wrong state, moderation action on non-`PENDING_REVIEW` listing) |
| `500 Internal Server Error` | Unexpected server error |

### Validation Errors (`400`)

When `ValidationPipe` rejects a request, the response shape is:

```json
{
  "statusCode": 400,
  "message": [
    "phone must be E.164 format",
    "listingId must be a UUID"
  ],
  "error": "Bad Request"
}
```

---

## Appendix: Endpoint Summary

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/listings` | Create listing |
| `GET` | `/api/listings/:id` | Get listing by ID |
| `PATCH` | `/api/listings/:id/resubmit` | Resubmit listing from NEEDS_CHANGES |
| `GET` | `/api/admin/moderation/queue` | Get pending review queue |
| `GET` | `/api/admin/moderation/:listingId/report` | Get moderation report |
| `GET` | `/api/admin/moderation/:listingId/score` | Get scoring report |
| `POST` | `/api/admin/moderation/:listingId/score` | Create/overwrite scoring report |
| `PATCH` | `/api/admin/moderation/:listingId/score/llm` | Attach LLM result to scoring report |
| `PATCH` | `/api/admin/moderation/:listingId/approve` | Approve listing |
| `PATCH` | `/api/admin/moderation/:listingId/request-changes` | Request changes from consultant |
| `PATCH` | `/api/admin/moderation/:listingId/reject` | Reject listing |
| `POST` | `/api/leads` | Create lead inquiry |
| `GET` | `/api/leads/:leadId` | Get lead by ID |
| `GET` | `/api/leads/:leadId/score` | Get lead score report |
| `GET` | `/api/marketing/:listingId/pack` | Get marketing asset pack request |
| `PATCH` | `/api/marketing/:listingId/pack/result` | Attach completed marketing pack |
| `GET` | `/api/crm-sync/:entityId` | Get CRM sync results for entity |
