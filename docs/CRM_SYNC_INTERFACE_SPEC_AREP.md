# AREP CRM Sync Interface Specification (Vendor-Neutral)

## 1) Scope
Defines a vendor-neutral interface for synchronizing AREP inquiry/listing data to external CRM systems.

---

## 2) Canonical Entities

### 2.1 Contact
```json
{
  "externalContactId": "string|null",
  "sourceSystem": "AREP",
  "sourceContactKey": "string",
  "fullName": "string",
  "phoneE164": "string",
  "preferredChannel": "call|whatsapp|form",
  "consent": {
    "marketing": "boolean|null",
    "contact": "boolean|null"
  },
  "utm": {
    "source": "string|null"
  },
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### 2.2 LeadDeal
```json
{
  "externalLeadId": "string|null",
  "sourceSystem": "AREP",
  "sourceLeadKey": "string",
  "contactRef": {
    "sourceContactKey": "string"
  },
  "listingRef": {
    "listingId": "string"
  },
  "intent": "rent|sale|viewing|question|unknown",
  "status": "new|open|contacted|qualified|unqualified|closed",
  "priority": "low|normal|high",
  "inquiryMessage": "string",
  "preferredTime": "string|null",
  "budgetAmount": "number|null",
  "budgetCurrency": "TRY|USD|EUR|null",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### 2.3 ActivityNote
```json
{
  "externalActivityId": "string|null",
  "sourceSystem": "AREP",
  "sourceActivityKey": "string",
  "leadRef": {
    "sourceLeadKey": "string"
  },
  "activityType": "note|call|whatsapp|status_change|assignment",
  "noteText": "string",
  "createdBy": {
    "actorType": "admin|consultant|system",
    "actorId": "string"
  },
  "createdAt": "date-time"
}
```

### 2.4 ListingReference
```json
{
  "listingId": "string",
  "title": "string|null",
  "category": "rent|sale|unknown",
  "propertyType": "string|null",
  "district": "string|null",
  "priceAmount": "number|null",
  "priceCurrency": "TRY|USD|EUR|null",
  "listingUrl": "string|null",
  "updatedAt": "date-time|null"
}
```

---

## 3) Operations (Logical Interface)

All operations are asynchronous commands over HTTP, queue, or RPC; payloads and semantics are fixed below.

### 3.1 `upsertContact`
**Purpose:** Create or update CRM contact using stable source key.

Request:
```json
{
  "operation": "upsertContact",
  "idempotencyKey": "string",
  "occurredAt": "date-time",
  "contact": { "...Contact" }
}
```
Response:
```json
{
  "status": "accepted|success|duplicate|failed",
  "externalContactId": "string|null",
  "dedupeHit": "boolean",
  "errorCode": "string|null",
  "errorMessage": "string|null"
}
```

### 3.2 `createLead`
**Purpose:** Create CRM lead/deal linked to contact and listing reference.

Request:
```json
{
  "operation": "createLead",
  "idempotencyKey": "string",
  "occurredAt": "date-time",
  "leadDeal": { "...LeadDeal" },
  "listingReference": { "...ListingReference" }
}
```
Response:
```json
{
  "status": "accepted|success|duplicate|failed",
  "externalLeadId": "string|null",
  "dedupeHit": "boolean",
  "errorCode": "string|null",
  "errorMessage": "string|null"
}
```

### 3.3 `updateLeadStatus`
**Purpose:** Synchronize status changes from AREP into CRM.

Request:
```json
{
  "operation": "updateLeadStatus",
  "idempotencyKey": "string",
  "occurredAt": "date-time",
  "sourceLeadKey": "string",
  "status": "new|open|contacted|qualified|unqualified|closed",
  "statusReason": "string|null",
  "updatedBy": {
    "actorType": "admin|system",
    "actorId": "string"
  }
}
```
Response:
```json
{
  "status": "accepted|success|duplicate|failed|not_found",
  "externalLeadId": "string|null",
  "dedupeHit": "boolean",
  "errorCode": "string|null",
  "errorMessage": "string|null"
}
```

### 3.4 `addNote`
**Purpose:** Add timeline note/activity to CRM lead/deal.

Request:
```json
{
  "operation": "addNote",
  "idempotencyKey": "string",
  "occurredAt": "date-time",
  "activityNote": { "...ActivityNote" }
}
```
Response:
```json
{
  "status": "accepted|success|duplicate|failed|not_found",
  "externalActivityId": "string|null",
  "dedupeHit": "boolean",
  "errorCode": "string|null",
  "errorMessage": "string|null"
}
```

### 3.5 `assignOwner`
**Purpose:** Assign or reassign CRM lead owner.

Request:
```json
{
  "operation": "assignOwner",
  "idempotencyKey": "string",
  "occurredAt": "date-time",
  "sourceLeadKey": "string",
  "owner": {
    "ownerType": "consultant|team|system_queue",
    "ownerId": "string"
  },
  "assignedBy": {
    "actorType": "admin|system",
    "actorId": "string"
  }
}
```
Response:
```json
{
  "status": "accepted|success|duplicate|failed|not_found",
  "externalLeadId": "string|null",
  "dedupeHit": "boolean",
  "errorCode": "string|null",
  "errorMessage": "string|null"
}
```

---

## 4) Transport Envelope

```json
{
  "messageId": "uuid",
  "eventType": "string",
  "eventVersion": "1.0.0",
  "producer": "string",
  "traceId": "string|null",
  "idempotencyKey": "string",
  "operationPayload": { "...one operation request above..." }
}
```

Constraints:
- `messageId` MUST be unique per delivery attempt.
- `idempotencyKey` MUST be stable for retries of same logical mutation.
- `operationPayload.operation` MUST match one of the 5 operations.

---

## 5) Mapping Rules (AREP -> CRM Canonical)

### 5.1 Contact Mapping

| AREP Source Field | CRM Canonical Field | Rule |
|---|---|---|
| `leadPayload.name` | `Contact.fullName` | Trim; collapse multiple spaces. |
| `leadPayload.phone` | `Contact.phoneE164` | Must be E.164; reject if invalid. |
| `leadPayload.contactChannel` | `Contact.preferredChannel` | Direct map: `call/whatsapp/form`. |
| `leadPayload.utmSource` | `Contact.utm.source` | Nullable; store as-is (max 200 chars). |
| `leadPayload.createdAt` | `Contact.createdAt` | Direct map on first create. |
| system timestamp | `Contact.updatedAt` | Set on every upsert. |
| `leadPayload.phone + "::" + sourceSystem` | `Contact.sourceContactKey` | Deterministic key, lowercase phone. |

### 5.2 LeadDeal Mapping

| AREP Source Field | CRM Canonical Field | Rule |
|---|---|---|
| `leadPayload.leadId` | `LeadDeal.sourceLeadKey` | Direct stable source key. |
| `leadPayload.message` | `LeadDeal.inquiryMessage` | Preserve raw text; no enrichment. |
| `leadPayload.preferredTime` | `LeadDeal.preferredTime` | Nullable direct map. |
| `leadPayload.createdAt` | `LeadDeal.createdAt` | Direct map. |
| system timestamp | `LeadDeal.updatedAt` | Set on create/update. |
| inferred from message or listing | `LeadDeal.intent` | `rent/sale/viewing/question/unknown`; deterministic parser only. |
| AREP lead lifecycle state | `LeadDeal.status` | Map via status table below. |
| lead scoring bucket (if available) | `LeadDeal.priority` | `HOT->high`, `WARM->normal`, `COLD->low`, else `normal`. |
| extracted budget + listing currency | `LeadDeal.budgetAmount/Currency` | Nullable. |
| contact key | `LeadDeal.contactRef.sourceContactKey` | Must reference upserted Contact key. |
| listing id | `LeadDeal.listingRef.listingId` | Direct map. |

### 5.3 ActivityNote Mapping

| AREP Source Field | CRM Canonical Field | Rule |
|---|---|---|
| `lead updated adminNotes` | `ActivityNote.noteText` | Direct map; sanitize control chars. |
| `lead updated status change` | `ActivityNote.activityType` | `status_change`. |
| `lead assigned event` | `ActivityNote.activityType` | `assignment`. |
| operation timestamp | `ActivityNote.createdAt` | Direct map. |
| actor metadata | `ActivityNote.createdBy.*` | Direct map with type constraints. |
| `leadPayload.leadId + eventId` | `ActivityNote.sourceActivityKey` | Deterministic unique key. |

### 5.4 ListingReference Mapping

| AREP Source Field | CRM Canonical Field | Rule |
|---|---|---|
| `listing.id` / `leadPayload.listingId` | `ListingReference.listingId` | Required direct map. |
| `listing.title` | `ListingReference.title` | Nullable. |
| `listing.category` | `ListingReference.category` | Normalize to `rent|sale|unknown`. |
| `listing.propertyType` | `ListingReference.propertyType` | Nullable direct map. |
| `listing.location.district` | `ListingReference.district` | Nullable direct map. |
| `listing.price.amount` | `ListingReference.priceAmount` | Nullable numeric. |
| `listing.price.currency` | `ListingReference.priceCurrency` | Nullable enum TRY/USD/EUR. |
| `listing.publicUrl` | `ListingReference.listingUrl` | Nullable URL string. |
| `listing.updatedAt` | `ListingReference.updatedAt` | Nullable date-time. |

### 5.5 Lead Status Mapping Table

| AREP Status | CRM Canonical `LeadDeal.status` |
|---|---|
| `NEW` | `new` |
| `OPEN` | `open` |
| `CONTACTED` | `contacted` |
| `QUALIFIED` | `qualified` |
| `UNQUALIFIED` | `unqualified` |
| `CLOSED` | `closed` |

---

## 6) Retry Policy

- Delivery guarantee: **at-least-once**.
- Retries for transient failures (`5xx`, timeout, network, throttling): exponential backoff with jitter.
- Schedule:
  - attempt 1: immediate
  - attempt 2: +30s
  - attempt 3: +2m
  - attempt 4: +10m
  - attempt 5: +30m
  - attempt 6: +2h
- Max attempts: `6`.
- Dead-letter after max attempts with full error context and payload hash.
- Do not retry permanent validation errors (`4xx` except `429`).

---

## 7) Deduplication & Idempotency Strategy

### 7.1 Idempotency Key Format
`<operation>:<sourceKey>:<revisionToken>`

Where:
- `operation` in `upsertContact|createLead|updateLeadStatus|addNote|assignOwner`
- `sourceKey`:
  - `upsertContact` => `Contact.sourceContactKey`
  - other ops => `LeadDeal.sourceLeadKey` (or `ActivityNote.sourceActivityKey` for `addNote`)
- `revisionToken`:
  - monotonic version, eventId, or occurredAt (must be deterministic for same logical mutation)

Example:
`updateLeadStatus:lead_8b1a...:evt_3f2c...`

### 7.2 Consumer Dedup Rules
1. Store `(idempotencyKey, payloadHash, firstSeenAt, status)` before side effects.
2. If same key + same hash => return `duplicate` (idempotent success/no-op).
3. If same key + different hash => return `failed` with conflict (`IDEMPOTENCY_CONFLICT`).
4. Dedup retention TTL: `72h` minimum.
5. For `createLead`, also enforce uniqueness on `sourceLeadKey`.

### 7.3 Operation Ordering Rules
- Preferred order for new inquiry sync:
  1) `upsertContact`
  2) `createLead`
  3) `addNote` (optional)
  4) `assignOwner` (optional)
- `updateLeadStatus` and `assignOwner` MUST resolve existing `sourceLeadKey`; if missing return `not_found`.

---

## 8) Error Model

```json
{
  "errorCode": "VALIDATION_ERROR|NOT_FOUND|RATE_LIMITED|TIMEOUT|TRANSIENT_ERROR|IDEMPOTENCY_CONFLICT|INTERNAL_ERROR",
  "errorMessage": "string",
  "retryable": "boolean",
  "details": {
    "field": "string|null",
    "hint": "string|null"
  }
}
```

---

## 9) Compliance Constraints

- Never place raw PII in idempotency keys.
- Phone is stored and transmitted as E.164 only.
- Note/activity text must strip control characters before outbound sync.
- Unknown CRM-native fields MUST NOT be sent unless explicitly mapped.
