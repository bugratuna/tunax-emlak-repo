# AI Automation Reference
## Antalya Real Estate Platform (AREP)

**Version:** 1.1.0
**Last Updated:** 2026-02-24
**Status:** Production Reference

---

## Automation Events (MVP)

### EVENT: LISTING_SUBMITTED
Trigger: Consultant submits listing for admin review
Outputs:
- moderationReport (JSON)
- suggestedTags (array)
- seoTitleSuggestion (string)
- warnings (array)
- completenessScore (0-100)
Action:
- Save report
- Notify admin queue

### EVENT: LISTING_UPDATED_AFTER_CHANGES
Trigger: Consultant edits after NEEDS_CHANGES and resubmits
Outputs:
- delta summary
- warnings resolved/remaining
Action:
- Save new report
- Notify admin queue

---

## 1. System Constants

| Constant | Value | Notes |
|----------|-------|-------|
| Queue name | `automation` | BullMQ queue identifier |
| Job name (primary) | `LISTING_SUBMITTED` | Used for both initial submit and resubmission |
| Internal API header | `x-internal-api-key` | Required on all inter-service requests |
| API global prefix | `/api` | All endpoints are mounted under `/api` |
| Default port | `3001` | `process.env.PORT ?? 3001` |
| JSON policy | Strict | All artifacts MUST be valid, parseable JSON — no markdown wrappers |
| Persistence layer | In-memory | No Prisma / no database in current phase |
| ORM / Swagger | Not used | Explicitly excluded from implementation |

---

## 2. Event Payload Schemas

### 2.1 LISTING_SUBMITTED (Strict JSON)

Triggered when a consultant submits a listing from `DRAFT` or `NEEDS_CHANGES` state.

```json
{
  "eventId": "string (UUID v4, required)",
  "eventType": "LISTING_SUBMITTED",
  "eventVersion": "1.0.0",
  "timestamp": "ISO 8601 datetime (UTC, required)",
  "source": {
    "service": "api",
    "version": "string (required)",
    "instanceId": "string (required)"
  },
  "correlationId": "string (UUID v4, required)",
  "causationId": "string (UUID v4) | null",
  "payload": {
    "listingId": "string (UUID v4, required)",
    "consultantId": "string (UUID v4, required)",
    "submittedAt": "ISO 8601 datetime (UTC, required)",
    "previousState": "DRAFT | NEEDS_CHANGES (required)",
    "isResubmission": "boolean (required)",
    "previousModerationReportId": "string (UUID v4) | null",
    "listing": {
      "title": "string (min: 10, max: 200, required)",
      "description": "string (min: 50, max: 5000, required)",
      "price": {
        "amount": "number (min: 0, precision: 2, required)",
        "currency": "TRY | USD | EUR (required)",
        "isNegotiable": "boolean (required)"
      },
      "category": "RENT | SALE (required)",
      "propertyType": "APARTMENT | VILLA | HOUSE | LAND | COMMERCIAL | OTHER (required)",
      "specifications": {
        "squareMeters": "number (min: 1, max: 100000, required)",
        "roomCount": "integer (min: 0, max: 20, required)",
        "bathroomCount": "integer (min: 0, max: 20, required)",
        "floorNumber": "integer | null",
        "totalFloors": "integer | null",
        "buildYear": "integer (min: 1800, max: currentYear+1) | null",
        "furnished": "boolean | null",
        "balcony": "boolean | null",
        "parking": "boolean | null",
        "elevator": "boolean | null",
        "pool": "boolean | null",
        "seaView": "boolean | null"
      },
      "location": {
        "city": "Antalya (fixed, required)",
        "district": "string (required, must pass whitelist — see §5.3)",
        "neighborhood": "string (required)",
        "address": "string (max: 500) | null",
        "coordinates": {
          "latitude": "number (-90 to 90, precision: 8, required)",
          "longitude": "number (-180 to 180, precision: 8, required)"
        },
        "postalCode": "string (max: 10) | null"
      },
      "media": {
        "images": [
          {
            "imageId": "string (UUID v4, required)",
            "url": "string (URL, required)",
            "storageKey": "string (required)",
            "order": "integer (min: 0, required)",
            "uploadedAt": "ISO 8601 datetime (UTC, required)",
            "metadata": {
              "width": "integer (required)",
              "height": "integer (required)",
              "sizeBytes": "integer (required)",
              "mimeType": "string (required)",
              "checksum": "string (SHA-256, required)"
            }
          }
        ],
        "imageCount": "integer (min: 1, max: 50, required)",
        "hasPrimaryImage": "boolean (required)"
      },
      "contact": {
        "phone": "string (E.164 format) | null",
        "email": "string (email format) | null",
        "whatsapp": "string (E.164 format) | null"
      },
      "metadata": {
        "createdAt": "ISO 8601 datetime (UTC, required)",
        "updatedAt": "ISO 8601 datetime (UTC, required)",
        "version": "integer (incrementing, required)",
        "tags": ["string"] | null,
        "customFields": "object | null"
      }
    }
  },
  "metadata": {
    "idempotencyKey": "string (UUID v4, required)",
    "retryCount": "integer (min: 0, required)",
    "priority": "NORMAL | HIGH (required)",
    "traceContext": {
      "traceId": "string (required)",
      "spanId": "string (required)"
    }
  }
}
```

**Idempotency Key Rule:**
- Format: `SHA-256(listingId + consultantId + submittedAt + listing.version)`
- TTL: 24 hours
- Scope: Per listing submission attempt

**Downstream Consumers:**
- `moderation-agent` — AI moderation analysis
- `deterministic-scorer` — rule-based scoring
- `admin-notification-service` — queue notification
- `analytics-service` — submission tracking

---

### 2.2 LISTING_UPDATED_AFTER_CHANGES (Strict JSON)

Triggered when a consultant resubmits a listing that was previously in `NEEDS_CHANGES` state. This is a specialisation of `LISTING_SUBMITTED` with `isResubmission: true` and a mandatory delta object.

```json
{
  "eventId": "string (UUID v4, required)",
  "eventType": "LISTING_SUBMITTED",
  "eventVersion": "1.0.0",
  "timestamp": "ISO 8601 datetime (UTC, required)",
  "source": {
    "service": "api",
    "version": "string (required)",
    "instanceId": "string (required)"
  },
  "correlationId": "string (UUID v4, required)",
  "causationId": "string (UUID v4, required — the previous REQUEST_CHANGES event)",
  "payload": {
    "listingId": "string (UUID v4, required)",
    "consultantId": "string (UUID v4, required)",
    "submittedAt": "ISO 8601 datetime (UTC, required)",
    "previousState": "NEEDS_CHANGES (fixed)",
    "isResubmission": true,
    "previousModerationReportId": "string (UUID v4, required)",
    "delta": {
      "fieldsChanged": ["string (field path)"],
      "previousVersion": "integer (required)",
      "currentVersion": "integer (required)",
      "adminFeedbackAddressed": "boolean (required)",
      "warningsResolved": ["string (warning code)"],
      "warningsRemaining": ["string (warning code)"]
    },
    "listing": "object (same shape as LISTING_SUBMITTED §2.1)"
  },
  "metadata": {
    "idempotencyKey": "string (UUID v4, required)",
    "retryCount": "integer (min: 0, required)",
    "priority": "NORMAL | HIGH (required)",
    "traceContext": {
      "traceId": "string (required)",
      "spanId": "string (required)"
    }
  }
}
```

**Differences from initial LISTING_SUBMITTED:**
- `previousState` is always `"NEEDS_CHANGES"`
- `isResubmission` is always `true`
- `causationId` is required (links to the REQUEST_CHANGES admin event)
- `previousModerationReportId` is required
- `delta` object is required

---

## 3. Artifact Schemas

### 3.1 ModerationReport

**Artifact Name:** `ModerationReport`
**Produced by:** Admin moderation action endpoints
**Stored at:** `POST /api/admin/moderation/:listingId/approve|request-changes|reject`
**Retrieved at:** `GET /api/admin/moderation/:listingId/report`

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `reportId` | UUID v4 | Unique report identifier |
| `listingId` | UUID v4 | The listing this report covers |
| `adminId` | string | Identifier of the admin who took the action |
| `decision` | `APPROVE \| REQUEST_CHANGES \| REJECT` | The outcome of moderation |
| `appliedRules` | `string[]` | Symbolic rule codes that drove the decision |
| `previousStatus` | `ListingStatus` | Listing status before the action |
| `newStatus` | `ListingStatus` | Listing status after the action |
| `decidedAt` | ISO 8601 UTC | Timestamp of the decision |
| `reason` | string | Human-readable reason (derived from applied rules) |

#### Optional Fields

| Field | Type | Condition |
|-------|------|-----------|
| `feedback` | string | Present only on `REQUEST_CHANGES`; admin guidance for consultant |
| `notes` | string | Present only on `APPROVE`; admin notes |
| `scoringReportId` | UUID v4 | Links to the pre-decision `ScoringReport` if one was generated |

#### Validation Notes

- `feedback` is **required** when `decision === "REQUEST_CHANGES"`. A `REQUEST_CHANGES` ModerationReport without `feedback` is invalid and must be rejected with HTTP 400.
- `appliedRules` must contain at least one entry. For manual admin actions use: `ADMIN_MANUAL_APPROVE`, `ADMIN_MANUAL_REQUEST_CHANGES`, or `ADMIN_MANUAL_REJECT`.
- `decidedAt` must be UTC and expressed in ISO 8601 format.
- The store keeps exactly one report per `listingId`; a new action overwrites the previous report.

#### Strict JSON Example (APPROVE)

```json
{
  "reportId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "listingId": "11112222-3333-4444-5555-666677778888",
  "adminId": "admin-001",
  "decision": "APPROVE",
  "appliedRules": ["ADMIN_MANUAL_APPROVE"],
  "previousStatus": "PENDING_REVIEW",
  "newStatus": "PUBLISHED",
  "decidedAt": "2026-02-24T10:00:00.000Z",
  "reason": "Listing meets all quality thresholds",
  "notes": "Meets all quality thresholds.",
  "scoringReportId": null
}
```

#### Strict JSON Example (REQUEST_CHANGES)

```json
{
  "reportId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "listingId": "22223333-4444-5555-6666-777788889999",
  "adminId": "admin-001",
  "decision": "REQUEST_CHANGES",
  "appliedRules": ["ADMIN_MANUAL_REQUEST_CHANGES"],
  "previousStatus": "PENDING_REVIEW",
  "newStatus": "NEEDS_CHANGES",
  "decidedAt": "2026-02-24T10:05:00.000Z",
  "reason": "Description too short. Add at least 200 chars.",
  "feedback": "Description too short. Add at least 200 chars and describe key features."
}
```

---

## 4. Decision Matrix

The admin moderation decision matrix operates on six priority tiers evaluated in order. The first matching tier wins.

### Priority Order

| Tier | Rule Set | Outcome |
|------|----------|---------|
| 1 | Critical Blockers (CR-1 – CR-10) | `REJECT` |
| 2 | High-Severity Violations (HR-1 – HR-8) | `REJECT` |
| 3 | Completeness Requirements (CRQ-1 – CRQ-4) | `REQUEST_CHANGES` |
| 4 | Quality Requirements (QRQ-1 – QRQ-6) | `REQUEST_CHANGES` |
| 5 | Medium-Severity Issues (MRQ-1 – MRQ-5) | `REQUEST_CHANGES` |
| 6 | Default | `APPROVE` |

### 4.1 REJECT Thresholds (Critical Blockers)

| Rule | Condition | Reason |
|------|-----------|--------|
| CR-1 | `aiEnrichment.contentModeration` contains CRITICAL severity issue | Critical content violation |
| CR-2 | `aiEnrichment.riskAssessment.riskLevel === "CRITICAL"` | Critical fraud risk |
| CR-3 | `aiEnrichment.factVerification` contains CRITICAL inconsistency | Critical data inconsistency |
| CR-4 | `deterministicScores.warnings` contains CRITICAL warning | Critical validation error |
| CR-5 | `deterministicScores.missingFields` contains any of `["title","description","price","propertyType","location"]` | Missing critical fields |
| CR-6 | `deterministicScores.missingFields` contains any of `["district","neighborhood","coordinates","imageCount"]` | Missing required location/media |
| CR-7 | `deterministicScores.completenessScore === 0` | Listing is incomplete |
| CR-8 | Warning code `COORDINATES_OUT_OF_BOUNDS` with severity `HIGH` | Location outside Antalya bounds |
| CR-9 | Warning code `INVALID_DISTRICT` with severity `HIGH` | District not in Antalya whitelist |
| CR-10 | Warning code `NO_IMAGES` | No images provided |

### 4.2 REJECT Thresholds (High-Severity Violations)

| Rule | Condition |
|------|-----------|
| HR-5 | `deterministicScores.completenessScore < 40` |
| HR-6 | `deterministicScores.descriptionQualityScore < 30` |
| HR-1 | ≥ 3 content issues with `severity === "HIGH"` |
| HR-2 | ≥ 3 fact inconsistencies with `severity === "HIGH"` |
| HR-3 | ≥ 2 fraud indicators with `severity === "HIGH"` |
| HR-4 | ≥ 4 deterministic warnings with `severity === "HIGH"` |
| HR-7 | `factVerification.status === "INCONSISTENT"` AND `consistencyScore < 50` |
| HR-8 | `riskLevel === "HIGH"` AND ≥ 3 fraud indicators |

### 4.3 REQUEST_CHANGES Thresholds

| Rule | Condition |
|------|-----------|
| CRQ-1 | `40 ≤ completenessScore < 70` |
| CRQ-2 | `missingFields.length > 0` AND `completenessScore < 80` |
| CRQ-3 | Warning `INSUFFICIENT_IMAGES` AND `completenessScore < 75` |
| CRQ-4 | Missing `neighborhood` or `address` AND `completenessScore < 80` |
| QRQ-1 | `30 ≤ descriptionQualityScore < 60` |
| QRQ-2 | Warning `DESCRIPTION_TOO_SHORT` AND `descriptionQualityScore < 70` |
| QRQ-3 | Warning `TITLE_TOO_SHORT \| TITLE_TOO_LONG \| TITLE_ALL_CAPS` AND `descriptionQualityScore < 70` |
| MRQ-2 | ≥ 5 deterministic warnings with `severity === "MEDIUM"` |
| MRQ-1 | ≥ 3 content issues with `severity === "MEDIUM"` |

### 4.4 APPROVE Thresholds (Default — all conditions must hold)

| Condition |
|-----------|
| No critical blockers (CR-1 through CR-10) |
| No high-severity rejections (HR-1 through HR-8) |
| `deterministicScores.completenessScore >= 70` |
| `deterministicScores.descriptionQualityScore >= 60` |
| `COUNT(warnings WHERE severity === "HIGH") < 4` |
| `contentModeration.status === "PASS"` |
| `factVerification.status IN ["CONSISTENT", "INSUFFICIENT_DATA"]` |
| `riskAssessment.riskLevel IN ["LOW", "MEDIUM"]` |
| Zero content issues with `severity IN ["HIGH", "CRITICAL"]` |

---

## 5. Validation Gates

All validation gates are evaluated deterministically before the AI enrichment step. A gate failure populates the `deterministicScores.warnings` array with a structured warning object containing `code`, `severity`, `message`, and `field`.

### 5.1 Description Length

| Gate | Rule | Severity | Warning Code |
|------|------|----------|--------------|
| Minimum (hard) | `description.length < 50` | HIGH | `DESCRIPTION_TOO_SHORT` |
| Minimum (recommended) | `50 ≤ description.length < 200` | MEDIUM | `DESCRIPTION_TOO_SHORT` |
| Maximum | `description.length > 5000` | MEDIUM | `DESCRIPTION_TOO_LONG` |

The Decision Matrix interprets `DESCRIPTION_TOO_SHORT` with `descriptionQualityScore < 70` as `REQUEST_CHANGES` (QRQ-2).

### 5.2 Image Count

| Gate | Rule | Severity | Warning Code |
|------|------|----------|--------------|
| Zero images | `imageCount === 0` | CRITICAL | `NO_IMAGES` |
| Insufficient | `1 ≤ imageCount < 3` | MEDIUM | `INSUFFICIENT_IMAGES` |
| Recommended | `imageCount >= 3` | — | (no warning) |

`NO_IMAGES` triggers an immediate `REJECT` (CR-10). `INSUFFICIENT_IMAGES` with `completenessScore < 75` triggers `REQUEST_CHANGES` (CRQ-3).

### 5.3 Antalya District Whitelist

The `location.district` field must exactly match (case-insensitive) one of the following 19 official Antalya districts:

```
Muratpaşa, Kepez, Konyaaltı, Döşemealtı, Aksu,
Alanya, Manavgat, Serik, Kemer, Kumluca,
Finike, Kaş, Demre, Elmalı, Korkuteli,
Akseki, Gündoğmuş, İbradı, Gazipaşa
```

A district not on this list produces warning code `INVALID_DISTRICT` with `severity: "HIGH"`, which triggers `REJECT` (CR-9). The `city` field must always be `"Antalya"`.

### 5.4 Hallucination Rejection Policy

Any AI-generated artifact (LLM enrichment result, ScoringReport `llmResult`, MarketingAssetPack) that contains property features not present in the source listing data is **invalid** and must be discarded.

Rules:
1. **Evidence required** — Every claim in an AI artifact must reference a `sourceField` that exists in the submitted listing payload.
2. **No invented attributes** — AI output must not assert `furnished`, `seaView`, `pool`, or any other boolean feature unless the source data sets that field to `true`.
3. **No price interpolation** — AI output must not state, imply, or derive a price other than the exact `price.amount` in the source payload.
4. **Rejection trigger** — If a human operator or automated validator detects hallucinated content, the artifact is flagged as `INVALID` and the moderation report is not accepted. The listing reverts to `PENDING_REVIEW` for re-evaluation.

### 5.5 JSON Schema Validation Rule

Before any artifact is stored or acted upon:
1. The artifact must be **syntactically valid JSON** (parseable without error).
2. The artifact must **pass schema validation** against the canonical schema defined in `docs/AUTOMATION_ARTIFACT_SCHEMAS.md`.
3. Artifacts that fail validation are **rejected with HTTP 422** and logged with `correlationId` and `listingId` for audit purposes.
4. No partial or incomplete artifacts may be stored. The store operation is atomic: the full artifact passes validation or nothing is written.
