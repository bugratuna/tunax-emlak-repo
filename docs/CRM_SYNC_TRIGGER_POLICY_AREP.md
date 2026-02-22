# AREP CRM Sync Trigger Policy

## 1) Purpose
Define deterministic trigger rules for outbound CRM synchronization from AREP.

## 2) In-Scope Trigger Events
- `LEAD_CREATED`
- `LEAD_ASSIGNED`
- `LISTING_PUBLISHED`

Only these events MAY trigger CRM sync under this policy.

---

## 3) Global Delivery Rules
1. Delivery model: **at-least-once**.
2. Every sync message MUST include:
   - `messageId` (UUID)
   - `eventType`
   - `eventVersion`
   - `occurredAt` (UTC ISO-8601)
   - `idempotencyKey`
   - `traceId` (if available)
   - `payload`
3. Idempotency key format:
   - `<eventType>:<aggregateKey>:<revisionToken>`
4. Retryable failures: network error, timeout, HTTP `429`, HTTP `5xx`.
5. Non-retryable failures: validation errors, contract mismatch, HTTP `4xx` except `429`.
6. Dead-letter queue (DLQ) retention: **14 days** minimum.
7. DLQ entries MUST include payload hash, error history, attempt count, and first/last failure timestamps.

---

## 4) Trigger Policies by Event

## 4.1 `LEAD_CREATED`

### 4.1.1 Trigger Condition
Trigger when a lead inquiry is successfully persisted in AREP and assigned a stable `leadId`.

### 4.1.2 Sync Payload
```json
{
  "eventType": "LEAD_CREATED",
  "eventVersion": "1.0.0",
  "occurredAt": "date-time",
  "idempotencyKey": "LEAD_CREATED:<leadId>:<createdAt>",
  "payload": {
    "leadId": "string",
    "listingId": "string",
    "contact": {
      "name": "string",
      "phone": "E.164",
      "channel": "call|whatsapp|form"
    },
    "message": "string",
    "preferredTime": "string|null",
    "utmSource": "string|null",
    "createdAt": "date-time",
    "listingReference": {
      "listingId": "string",
      "title": "string|null",
      "category": "rent|sale|unknown",
      "district": "string|null",
      "priceAmount": "number|null",
      "priceCurrency": "TRY|USD|EUR|null"
    }
  }
}
```

### 4.1.3 Retry Schedule
- Attempt 1: immediate
- Attempt 2: +30s
- Attempt 3: +2m
- Attempt 4: +10m
- Attempt 5: +30m
- Attempt 6: +2h
- Max attempts: 6

### 4.1.4 Dead-Letter Rules
Send to DLQ when:
- attempts exhausted (6/6), or
- non-retryable contract/validation failure detected.

DLQ reason codes:
- `LEAD_CREATED_RETRY_EXHAUSTED`
- `LEAD_CREATED_VALIDATION_FAILED`
- `LEAD_CREATED_CONTRACT_MISMATCH`

### 4.1.5 Admin Alerting Policy
- **Warning alert** to admins when retry attempt reaches 4.
- **Critical alert** when message enters DLQ.
- Alert channels: admin panel notification + email.
- Alert payload MUST include: `leadId`, `listingId`, last error code/message, attempt count, first failure time.

---

## 4.2 `LEAD_ASSIGNED`

### 4.2.1 Trigger Condition
Trigger when AREP persists a lead owner assignment or reassignment to a consultant/team.

### 4.2.2 Sync Payload
```json
{
  "eventType": "LEAD_ASSIGNED",
  "eventVersion": "1.0.0",
  "occurredAt": "date-time",
  "idempotencyKey": "LEAD_ASSIGNED:<leadId>:<assignmentRevision>",
  "payload": {
    "leadId": "string",
    "listingId": "string",
    "assignedAt": "date-time",
    "assignedBy": {
      "actorType": "admin|system",
      "actorId": "string"
    },
    "owner": {
      "ownerType": "consultant|team|system_queue",
      "ownerId": "string"
    },
    "contact": {
      "name": "string",
      "phone": "E.164",
      "channel": "call|whatsapp|form"
    }
  }
}
```

### 4.2.3 Retry Schedule
- Attempt 1: immediate
- Attempt 2: +20s
- Attempt 3: +90s
- Attempt 4: +5m
- Attempt 5: +20m
- Attempt 6: +60m
- Max attempts: 6

### 4.2.4 Dead-Letter Rules
Send to DLQ when:
- attempts exhausted (6/6), or
- non-retryable not-found dependency (`leadId` missing in CRM after consistency window), or
- payload validation failure.

DLQ reason codes:
- `LEAD_ASSIGNED_RETRY_EXHAUSTED`
- `LEAD_ASSIGNED_LEAD_NOT_FOUND`
- `LEAD_ASSIGNED_VALIDATION_FAILED`

Special handling:
- If CRM returns `not_found` for lead, perform one prerequisite sync check for `LEAD_CREATED`; if unresolved after 10 minutes, DLQ.

### 4.2.5 Admin Alerting Policy
- **Warning alert** at first `not_found` response from CRM.
- **Warning alert** at retry attempt 4.
- **Critical alert** on DLQ insertion.
- Alert channels: admin panel notification + email.
- Alert payload MUST include: `leadId`, `owner.ownerId`, `assignedAt`, dependency status (`lead_exists_in_crm`), last error.

---

## 4.3 `LISTING_PUBLISHED`

### 4.3.1 Trigger Condition
Trigger when listing state transitions to published/active and is visible to end users.

### 4.3.2 Sync Payload
```json
{
  "eventType": "LISTING_PUBLISHED",
  "eventVersion": "1.0.0",
  "occurredAt": "date-time",
  "idempotencyKey": "LISTING_PUBLISHED:<listingId>:<publishedAt>",
  "payload": {
    "listingId": "string",
    "publishedAt": "date-time",
    "consultantId": "string|null",
    "title": "string",
    "category": "rent|sale",
    "propertyType": "string",
    "district": "string",
    "price": {
      "amount": "number",
      "currency": "TRY|USD|EUR"
    },
    "publicUrl": "string|null",
    "media": {
      "imageCount": "integer"
    }
  }
}
```

### 4.3.3 Retry Schedule
- Attempt 1: immediate
- Attempt 2: +60s
- Attempt 3: +5m
- Attempt 4: +20m
- Attempt 5: +90m
- Attempt 6: +4h
- Max attempts: 6

### 4.3.4 Dead-Letter Rules
Send to DLQ when:
- attempts exhausted (6/6), or
- non-retryable schema/validation failure.

DLQ reason codes:
- `LISTING_PUBLISHED_RETRY_EXHAUSTED`
- `LISTING_PUBLISHED_VALIDATION_FAILED`
- `LISTING_PUBLISHED_CONTRACT_MISMATCH`

### 4.3.5 Admin Alerting Policy
- **Warning alert** at retry attempt 4.
- **Critical alert** when DLQ entry created.
- Alert channels: admin panel notification + email.
- Alert payload MUST include: `listingId`, `publishedAt`, last error code/message, attempt count.

---

## 5) Alert Severity & Escalation Matrix

| Condition | Severity | SLA | Escalation |
|---|---|---|---|
| Retry attempt 4 reached | Warning | Notify within 5 min | Assigned on-call admin |
| First CRM `not_found` on `LEAD_ASSIGNED` | Warning | Notify within 5 min | Integration owner + admin |
| DLQ insertion (any trigger) | Critical | Notify within 1 min | On-call admin + engineering lead |
| DLQ backlog > 25 messages for 15 min | Critical | Notify within 1 min | Incident channel + engineering lead |

---

## 6) Operational Controls
1. Metrics required per trigger:
   - `sync_sent_total`
   - `sync_success_total`
   - `sync_retry_total`
   - `sync_dlq_total`
   - `sync_latency_ms`
2. Metrics MUST be tagged by `eventType` and `result` only (no raw PII tags).
3. Manual replay from DLQ MUST preserve original `idempotencyKey`.
4. Replay actions MUST be audit-logged with operator identity and timestamp.
