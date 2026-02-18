# LISTING_SUBMITTED Event Specification

**Event Type:** `LISTING_SUBMITTED`  
**Domain:** Antalya Real Estate Platform (AREP)  
**Version:** 1.0.0  
**Last Updated:** 2026-02-18

---

## 1. Event Payload Schema

### 1.1 Core Event Structure

```json
{
  "eventId": "string (UUID v4)",
  "eventType": "LISTING_SUBMITTED",
  "eventVersion": "1.0.0",
  "timestamp": "ISO 8601 datetime (UTC)",
  "source": {
    "service": "api",
    "version": "string",
    "instanceId": "string"
  },
  "correlationId": "string (UUID v4)",
  "causationId": "string (UUID v4) | null",
  "payload": {
    "listingId": "string (UUID v4)",
    "consultantId": "string (UUID v4)",
    "submittedAt": "ISO 8601 datetime (UTC)",
    "previousState": "DRAFT | NEEDS_CHANGES",
    "isResubmission": "boolean",
    "previousModerationReportId": "string (UUID v4) | null",
    "listing": {
      "title": "string (min: 10, max: 200)",
      "description": "string (min: 50, max: 5000)",
      "price": {
        "amount": "number (min: 0, precision: 2)",
        "currency": "TRY | USD | EUR",
        "isNegotiable": "boolean"
      },
      "category": "RENT | SALE",
      "propertyType": "APARTMENT | VILLA | HOUSE | LAND | COMMERCIAL | OTHER",
      "specifications": {
        "squareMeters": "number (min: 1, max: 100000)",
        "roomCount": "integer (min: 0, max: 20)",
        "bathroomCount": "integer (min: 0, max: 20)",
        "floorNumber": "integer | null",
        "totalFloors": "integer | null",
        "buildYear": "integer (min: 1800, max: current year + 1) | null",
        "furnished": "boolean | null",
        "balcony": "boolean | null",
        "parking": "boolean | null",
        "elevator": "boolean | null",
        "pool": "boolean | null",
        "seaView": "boolean | null"
      },
      "location": {
        "city": "Antalya",
        "district": "string (required)",
        "neighborhood": "string (required)",
        "address": "string (max: 500) | null",
        "coordinates": {
          "latitude": "number (-90 to 90, precision: 8)",
          "longitude": "number (-180 to 180, precision: 8)"
        },
        "postalCode": "string (max: 10) | null"
      },
      "media": {
        "images": [
          {
            "imageId": "string (UUID v4)",
            "url": "string (URL)",
            "storageKey": "string",
            "order": "integer (min: 0)",
            "uploadedAt": "ISO 8601 datetime (UTC)",
            "metadata": {
              "width": "integer",
              "height": "integer",
              "sizeBytes": "integer",
              "mimeType": "string",
              "checksum": "string (SHA-256)"
            }
          }
        ],
        "imageCount": "integer (min: 1, max: 50)",
        "hasPrimaryImage": "boolean"
      },
      "contact": {
        "phone": "string (E.164 format) | null",
        "email": "string (email format) | null",
        "whatsapp": "string (E.164 format) | null"
      },
      "metadata": {
        "createdAt": "ISO 8601 datetime (UTC)",
        "updatedAt": "ISO 8601 datetime (UTC)",
        "version": "integer (incrementing)",
        "tags": ["string"] | null,
        "customFields": "object | null"
      }
    }
  },
  "metadata": {
    "idempotencyKey": "string (UUID v4)",
    "retryCount": "integer (min: 0)",
    "priority": "NORMAL | HIGH",
    "traceContext": {
      "traceId": "string",
      "spanId": "string"
    }
  }
}
```

### 1.2 Field Validation Rules

#### Required Fields
- `eventId`, `eventType`, `timestamp`, `payload.listingId`, `payload.consultantId`, `payload.listing.title`, `payload.listing.description`, `payload.listing.price.amount`, `payload.listing.price.currency`, `payload.listing.category`, `payload.listing.propertyType`, `payload.listing.specifications.squareMeters`, `payload.listing.location.city`, `payload.listing.location.district`, `payload.listing.location.neighborhood`, `payload.listing.location.coordinates.latitude`, `payload.listing.location.coordinates.longitude`, `payload.listing.media.imageCount` (min: 1)

#### Conditional Requirements
- If `isResubmission: true`, then `previousModerationReportId` MUST be present
- If `previousState: NEEDS_CHANGES`, then `isResubmission` MUST be `true`
- `payload.listing.media.images` array MUST contain at least 1 image
- At least one contact method (`phone`, `email`, or `whatsapp`) MUST be provided

#### Business Rules
- `city` MUST be exactly "Antalya" (case-sensitive)
- `price.amount` MUST be positive
- `coordinates` MUST be within Antalya bounding box (approximately: lat 36.0-37.0, lon 30.0-32.0)
- `imageCount` MUST match the length of `images` array
- All image URLs MUST be accessible (validation performed asynchronously)

---

## 2. Expected Agent Output Schema

### 2.1 Agent Response Structure

```json
{
  "reportId": "string (UUID v4)",
  "listingId": "string (UUID v4)",
  "eventId": "string (UUID v4)",
  "generatedAt": "ISO 8601 datetime (UTC)",
  "processingDurationMs": "integer",
  "status": "SUCCESS | PARTIAL_SUCCESS | FAILED",
  "moderationReport": {
    "overallScore": "number (0-100)",
    "completenessScore": "number (0-100)",
    "qualityScore": "number (0-100)",
    "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL",
    "checks": {
      "contentModeration": {
        "status": "PASS | FAIL | WARNING",
        "issues": [
          {
            "type": "INAPPROPRIATE_LANGUAGE | SPAM_DETECTED | CONTACT_IN_DESCRIPTION | PRICE_MANIPULATION | SUSPICIOUS_PATTERNS",
            "severity": "LOW | MEDIUM | HIGH",
            "message": "string",
            "confidence": "number (0-1)",
            "location": "title | description | contact | price",
            "suggestedAction": "string | null"
          }
        ],
        "passed": "boolean"
      },
      "imageModeration": {
        "status": "PASS | FAIL | WARNING",
        "issues": [
          {
            "imageId": "string (UUID v4)",
            "type": "INAPPROPRIATE_CONTENT | LOW_QUALITY | DUPLICATE | WATERMARK_DETECTED | WRONG_ORIENTATION",
            "severity": "LOW | MEDIUM | HIGH",
            "message": "string",
            "confidence": "number (0-1)",
            "suggestedAction": "REPLACE | REMOVE | ROTATE | null"
          }
        ],
        "passed": "boolean",
        "totalImagesChecked": "integer",
        "imagesPassed": "integer"
      },
      "dataQuality": {
        "status": "PASS | FAIL | WARNING",
        "issues": [
          {
            "field": "string",
            "type": "MISSING_REQUIRED | INVALID_FORMAT | OUT_OF_RANGE | INCONSISTENT_DATA",
            "severity": "LOW | MEDIUM | HIGH",
            "message": "string",
            "currentValue": "any | null",
            "expectedValue": "any | null"
          }
        ],
        "passed": "boolean"
      },
      "geospatialValidation": {
        "status": "PASS | FAIL | WARNING",
        "issues": [
          {
            "type": "COORDINATES_OUT_OF_BOUNDS | ADDRESS_MISMATCH | INVALID_POSTAL_CODE",
            "severity": "LOW | MEDIUM | HIGH",
            "message": "string",
            "coordinates": {
              "latitude": "number",
              "longitude": "number"
            } | null
          }
        ],
        "passed": "boolean"
      }
    },
    "recommendations": [
      {
        "category": "CONTENT | IMAGES | DATA | SEO | PRICING",
        "priority": "LOW | MEDIUM | HIGH",
        "message": "string",
        "actionable": "boolean",
        "estimatedImpact": "string | null"
      }
    ]
  },
  "suggestedTags": [
    {
      "tag": "string",
      "confidence": "number (0-1)",
      "source": "IMAGE_ANALYSIS | DESCRIPTION_ANALYSIS | LOCATION_BASED | MANUAL",
      "category": "AMENITY | LOCATION | PROPERTY_TYPE | FEATURE"
    }
  ],
  "seoSuggestions": {
    "titleSuggestion": "string | null",
    "descriptionSuggestion": "string | null",
    "keywords": ["string"],
    "metaDescription": "string | null",
    "improvements": [
      {
        "field": "title | description",
        "current": "string",
        "suggested": "string",
        "reason": "string"
      }
    ]
  },
  "warnings": [
    {
      "code": "string",
      "severity": "LOW | MEDIUM | HIGH",
      "message": "string",
      "field": "string | null",
      "actionRequired": "boolean",
      "relatedIssueId": "string (UUID v4) | null"
    }
  ],
  "completenessScore": {
    "overall": "number (0-100)",
    "breakdown": {
      "basicInfo": "number (0-100)",
      "description": "number (0-100)",
      "specifications": "number (0-100)",
      "location": "number (0-100)",
      "media": "number (0-100)",
      "contact": "number (0-100)"
    },
    "missingFields": ["string"],
    "recommendations": ["string"]
  },
  "comparison": {
    "previousReportId": "string (UUID v4) | null",
    "delta": {
      "scoreChange": "number",
      "issuesResolved": "integer",
      "issuesNew": "integer",
      "fieldsChanged": ["string"],
      "improvementPercentage": "number (0-100)"
    }
  } | null,
  "metadata": {
    "agentVersion": "string",
    "modelVersion": "string | null",
    "processingSteps": [
      {
        "step": "string",
        "durationMs": "integer",
        "status": "SUCCESS | FAILED",
        "error": "string | null"
      }
    ],
    "costEstimate": {
      "currency": "USD",
      "amount": "number"
    } | null
  }
}
```

### 2.2 Output Validation Rules

#### Required Fields
- `reportId`, `listingId`, `eventId`, `generatedAt`, `status`, `moderationReport.overallScore`, `moderationReport.completenessScore`, `moderationReport.riskLevel`, `completenessScore.overall`

#### Score Constraints
- All scores MUST be integers between 0-100
- `overallScore` MUST be calculated as weighted average of `completenessScore` and `qualityScore`
- `riskLevel` MUST be derived from `moderationReport.checks` results

#### Status Semantics
- `SUCCESS`: All checks passed, report complete
- `PARTIAL_SUCCESS`: Some checks failed or warnings present, but report usable
- `FAILED`: Critical failure preventing report generation

---

## 3. State Transition Rules

### 3.1 Valid State Transitions

```
DRAFT → PENDING_REVIEW (via LISTING_SUBMITTED)
  Conditions:
    - listing.media.imageCount >= 1
    - All required fields present
    - No critical validation failures
  
NEEDS_CHANGES → PENDING_REVIEW (via LISTING_SUBMITTED with isResubmission: true)
  Conditions:
    - previousModerationReportId exists
    - At least one issue from previous report addressed
    - No new critical issues introduced
  
PENDING_REVIEW → [No direct transition via LISTING_SUBMITTED]
  Note: Admin actions (APPROVE, REQUEST_CHANGES, REJECT) handle transitions from PENDING_REVIEW
```

### 3.2 State Transition Validation

#### Pre-Transition Checks
1. **Current State Validation**
   - Current state MUST be `DRAFT` or `NEEDS_CHANGES`
   - If `NEEDS_CHANGES`, verify `previousModerationReportId` exists and is valid

2. **Data Completeness**
   - All required fields present and non-null
   - Minimum image count satisfied
   - At least one contact method provided

3. **Business Rule Validation**
   - Price is positive
   - Coordinates within Antalya bounds
   - City is "Antalya"

4. **Idempotency Check**
   - Verify event has not been processed (using `idempotencyKey`)

#### Post-Transition Actions
1. **State Update**
   - Set listing state to `PENDING_REVIEW`
   - Set `submittedAt` timestamp
   - Increment `version` counter

2. **Agent Trigger**
   - Dispatch event to automation agent
   - Store event in event store with `PENDING` status

3. **Notification**
   - Queue admin notification (async)
   - Log state transition

### 3.3 Invalid Transition Handling

#### Rejection Scenarios
- **Current state is PENDING_REVIEW**: Return `409 CONFLICT` - "Listing already under review"
- **Current state is PUBLISHED**: Return `400 BAD_REQUEST` - "Cannot resubmit published listing"
- **Current state is ARCHIVED**: Return `400 BAD_REQUEST` - "Cannot submit archived listing"
- **Missing required fields**: Return `422 UNPROCESSABLE_ENTITY` with field-level errors
- **Validation failures**: Return `422 UNPROCESSABLE_ENTITY` with validation details

#### Error Response Schema
```json
{
  "error": {
    "code": "INVALID_STATE_TRANSITION | VALIDATION_FAILED | IDEMPOTENCY_VIOLATION",
    "message": "string",
    "details": {
      "currentState": "string",
      "requestedState": "PENDING_REVIEW",
      "validationErrors": [
        {
          "field": "string",
          "code": "string",
          "message": "string"
        }
      ],
      "idempotencyKey": "string | null"
    },
    "timestamp": "ISO 8601 datetime (UTC)"
  }
}
```

---

## 4. Validation Failure Handling

### 4.1 Validation Levels

#### Level 1: Schema Validation (Pre-Processing)
- **When**: Before event acceptance
- **Scope**: JSON schema, data types, required fields
- **Action**: Reject event immediately, return `400 BAD_REQUEST`
- **Recovery**: Client must fix payload and resubmit

#### Level 2: Business Rule Validation (Pre-State-Transition)
- **When**: After schema validation, before state change
- **Scope**: Business rules, constraints, relationships
- **Action**: Reject event, return `422 UNPROCESSABLE_ENTITY`
- **Recovery**: Client must correct data and resubmit

#### Level 3: Agent Processing Validation (Post-State-Transition)
- **When**: After state transition, during agent processing
- **Scope**: Content moderation, image analysis, quality checks
- **Action**: Agent returns `PARTIAL_SUCCESS` or `FAILED` status
- **Recovery**: Admin reviews report, may request changes

### 4.2 Failure Categories

#### Critical Failures (Blocking)
- Schema violations
- Invalid state transitions
- Missing critical fields (listingId, consultantId)
- Idempotency violations (duplicate processing)
- **Response**: Immediate rejection, no state change

#### Non-Critical Failures (Non-Blocking)
- Image quality issues
- SEO suggestions
- Missing optional fields
- Content warnings (non-blocking)
- **Response**: Event accepted, warnings in report

### 4.3 Failure Response Schema

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "category": "SCHEMA | BUSINESS_RULE | PROCESSING",
    "severity": "CRITICAL | WARNING",
    "message": "string",
    "timestamp": "ISO 8601 datetime (UTC)",
    "requestId": "string (UUID v4)",
    "validationErrors": [
      {
        "field": "string (JSONPath)",
        "code": "REQUIRED | INVALID_TYPE | OUT_OF_RANGE | INVALID_FORMAT | BUSINESS_RULE_VIOLATION",
        "message": "string",
        "value": "any | null",
        "constraint": "string | null"
      }
    ],
    "recoverable": "boolean",
    "retryAfter": "integer (seconds) | null"
  }
}
```

### 4.4 Retry Strategy

#### Automatic Retries (System-Level)
- **Schema/Business Rule Failures**: No automatic retry (client must fix)
- **Transient Failures** (network, timeouts): Exponential backoff, max 3 retries
- **Idempotency Conflicts**: No retry (already processed)

#### Manual Retries (User-Level)
- Consultant may resubmit after fixing validation errors
- Previous event ID tracked for audit

---

## 5. Idempotency Strategy

### 5.1 Idempotency Key Generation

#### Client-Provided Key (Preferred)
- Client generates UUID v4 as `metadata.idempotencyKey`
- Key MUST be unique per distinct submission intent
- Key MUST be included in event payload

#### Server-Generated Key (Fallback)
- If client does not provide key, server generates: `SHA-256(listingId + consultantId + submittedAt + payloadHash)`
- Less reliable for true idempotency, but prevents obvious duplicates

### 5.2 Idempotency Check Flow

```
1. Extract idempotencyKey from event metadata
2. Query idempotency store (Redis/Database) for existing key
3. If key exists:
   a. Retrieve previous eventId and result
   b. If previous result was SUCCESS:
      - Return cached response (same reportId)
      - Skip processing
   c. If previous result was FAILED:
      - Allow reprocessing if > 24 hours old
      - Otherwise return cached error
4. If key does not exist:
   a. Store key → (eventId, status: PROCESSING, timestamp)
   b. Proceed with processing
   c. On completion, update: key → (eventId, status: SUCCESS/FAILED, reportId, timestamp)
```

### 5.3 Idempotency Storage Schema

```json
{
  "idempotencyKey": "string (UUID v4)",
  "eventId": "string (UUID v4)",
  "listingId": "string (UUID v4)",
  "status": "PROCESSING | SUCCESS | FAILED",
  "reportId": "string (UUID v4) | null",
  "createdAt": "ISO 8601 datetime (UTC)",
  "completedAt": "ISO 8601 datetime (UTC) | null",
  "response": "object | null",
  "ttl": "integer (seconds, default: 86400)"
}
```

### 5.4 Idempotency Scenarios

#### Scenario 1: Duplicate Event (Same Key)
- **Detection**: Key exists, status = SUCCESS
- **Action**: Return cached response immediately
- **Response Time**: < 10ms

#### Scenario 2: Retry After Failure
- **Detection**: Key exists, status = FAILED, age > 24 hours
- **Action**: Allow reprocessing, update key status to PROCESSING
- **Rationale**: Data may have been fixed

#### Scenario 3: Concurrent Processing
- **Detection**: Key exists, status = PROCESSING
- **Action**: 
  - If age < 30 seconds: Return `409 CONFLICT` - "Processing in progress"
  - If age > 30 seconds: Assume stale lock, allow reprocessing

#### Scenario 4: Key Collision (Extremely Rare)
- **Detection**: Different eventId but same idempotencyKey
- **Action**: Log warning, treat as duplicate (prevent double processing)
- **Mitigation**: Use UUID v4 to minimize collision probability

### 5.5 Idempotency Key TTL

- **Success**: 24 hours (allows consultant to query result)
- **Failure**: 1 hour (allows quick retry after fixes)
- **Processing**: 5 minutes (auto-expire stale locks)

---

## 6. Logging Requirements

### 6.1 Log Levels and Categories

#### Log Levels
- **ERROR**: System errors, critical failures, data corruption
- **WARN**: Validation warnings, retries, degraded performance
- **INFO**: State transitions, successful processing, business events
- **DEBUG**: Detailed processing steps, payloads (sanitized), timing

#### Log Categories
- `event.received`: Event ingestion
- `event.validation`: Validation results
- `event.state_transition`: State changes
- `event.idempotency`: Idempotency checks
- `agent.processing`: Agent processing steps
- `agent.completion`: Agent results
- `agent.errors`: Agent failures
- `notification`: Admin notifications

### 6.2 Required Log Fields

#### Standard Log Entry Schema
```json
{
  "timestamp": "ISO 8601 datetime (UTC)",
  "level": "ERROR | WARN | INFO | DEBUG",
  "category": "string",
  "service": "api | agent",
  "version": "string",
  "eventId": "string (UUID v4)",
  "listingId": "string (UUID v4)",
  "consultantId": "string (UUID v4)",
  "correlationId": "string (UUID v4)",
  "traceId": "string",
  "spanId": "string",
  "message": "string",
  "context": {
    "action": "string",
    "previousState": "string | null",
    "newState": "string | null",
    "durationMs": "integer | null",
    "error": {
      "code": "string",
      "message": "string",
      "stack": "string | null"
    } | null,
    "metadata": "object"
  }
}
```

### 6.3 Critical Events to Log

#### Event Reception
- **Level**: INFO
- **Fields**: eventId, listingId, consultantId, idempotencyKey, payload size
- **Message**: "LISTING_SUBMITTED event received"

#### Validation Results
- **Level**: WARN (if failures), INFO (if success)
- **Fields**: eventId, validationErrors array, failure count
- **Message**: "Event validation completed"

#### State Transition
- **Level**: INFO
- **Fields**: eventId, listingId, previousState, newState, transition duration
- **Message**: "Listing state transitioned: {previousState} → {newState}"

#### Idempotency Check
- **Level**: DEBUG (if cache hit), INFO (if new)
- **Fields**: eventId, idempotencyKey, cacheHit (boolean)
- **Message**: "Idempotency check: {result}"

#### Agent Processing Start
- **Level**: INFO
- **Fields**: eventId, listingId, agent version
- **Message**: "Agent processing started"

#### Agent Processing Complete
- **Level**: INFO
- **Fields**: eventId, reportId, status, durationMs, scores
- **Message**: "Agent processing completed: {status}"

#### Agent Processing Failure
- **Level**: ERROR
- **Fields**: eventId, error code, error message, stack trace
- **Message**: "Agent processing failed: {error}"

#### Notification Queued
- **Level**: INFO
- **Fields**: eventId, listingId, notification type, queue name
- **Message**: "Admin notification queued"

### 6.4 Sensitive Data Handling

#### Fields to Sanitize/Redact
- **Contact Information**: Phone numbers, emails (log only last 4 chars)
- **Personal Data**: Consultant names (if included)
- **Financial Data**: Price amounts (log only range buckets: <10K, 10K-50K, etc.)

#### Sanitization Rules
```json
{
  "phone": "REDACTED (last 4: XXXX)",
  "email": "REDACTED (domain only: @example.com)",
  "price": "BUCKET: 100000-500000",
  "coordinates": "ROUNDED: lat=36.XX, lon=30.XX"
}
```

### 6.5 Log Retention and Archival

#### Retention Policy
- **Production Logs**: 30 days in hot storage
- **Error Logs**: 90 days in hot storage
- **Archived Logs**: 1 year in cold storage (S3/Glacier)

#### Archival Triggers
- Daily batch job archives logs older than retention period
- Error logs archived separately with higher priority
- Compliance logs (audit trail) retained per legal requirements

### 6.6 Log Aggregation and Monitoring

#### Metrics to Track
- Event processing rate (events/minute)
- Average processing duration (p50, p95, p99)
- Validation failure rate
- Idempotency cache hit rate
- Agent processing success rate
- State transition success rate

#### Alerts
- **ERROR rate > 1%**: Alert on-call engineer
- **Processing duration p95 > 30s**: Alert performance team
- **Idempotency cache hit rate < 50%**: Investigate key generation
- **Agent failure rate > 5%**: Alert AI/ML team

---

## 7. Architectural Reasoning

### 7.1 Event-Driven Architecture Rationale

**Why Event-Driven?**
- Decouples API service from agent processing
- Enables async processing without blocking consultant
- Supports future scalability (multiple agents, event replay)
- Provides audit trail for compliance

**Trade-offs:**
- Eventual consistency (listing state may lag)
- Requires idempotency handling
- More complex error handling

### 7.2 Idempotency Design Decisions

**Why Client-Provided Keys?**
- True idempotency (client controls retry intent)
- Better UX (consultant can safely retry)
- Prevents accidental duplicate processing

**Why Server-Generated Fallback?**
- Backward compatibility
- Handles legacy clients
- Prevents obvious duplicates

**Why TTL-Based Expiration?**
- Prevents unbounded storage growth
- Allows reprocessing after fixes
- Balances idempotency vs. flexibility

### 7.3 State Machine Design

**Why Explicit State Transitions?**
- Prevents invalid operations
- Clear business rules
- Easier to reason about system behavior
- Supports audit and compliance

**Why PENDING_REVIEW State?**
- Separates "submitted" from "approved"
- Allows admin review workflow
- Supports rejection/changes flow
- Prevents consultant edits during review

### 7.4 Validation Layering

**Why Three-Tier Validation?**
- **Schema**: Fast rejection of malformed data
- **Business Rules**: Domain-specific validation
- **Agent Processing**: Deep content analysis (expensive, async)

**Benefits:**
- Fail fast on obvious errors
- Reduce unnecessary processing
- Cost optimization (agent calls are expensive)

### 7.5 Agent Output Design

**Why Comprehensive Report?**
- Single source of truth for moderation
- Supports admin decision-making
- Enables consultant self-service improvements
- Provides audit trail

**Why Scores and Warnings?**
- Quantifiable quality metrics
- Actionable feedback
- Supports A/B testing and ML training
- Enables automated quality gates

### 7.6 Logging Strategy

**Why Structured Logging?**
- Machine-readable for aggregation
- Supports correlation (traceId, correlationId)
- Enables advanced querying
- Compliance and audit requirements

**Why Sanitization?**
- GDPR/privacy compliance
- Security best practices
- Prevents data leakage in logs
- Maintains log utility while protecting data

---

## 8. Compliance and Security Considerations

### 8.1 Data Privacy
- Personal data (consultant info) logged minimally
- Contact information redacted in logs
- Coordinates rounded to prevent exact location tracking
- Price buckets prevent financial profiling

### 8.2 Audit Requirements
- All state transitions logged
- Idempotency checks logged
- Agent processing results stored
- Event payloads stored (encrypted) for replay

### 8.3 Security
- Event payloads validated for injection attacks
- Image URLs validated (whitelist domains)
- Consultant ID verified against auth token
- Rate limiting on event submission

---

## 9. Future Considerations

### 9.1 Extensibility
- Event versioning supports schema evolution
- Agent output schema allows new check types
- State machine can add new states
- Idempotency strategy supports distributed systems

### 9.2 Performance Optimization
- Idempotency cache (Redis) for fast lookups
- Async agent processing prevents blocking
- Batch processing for high-volume periods
- Caching of agent results for similar listings

### 9.3 Monitoring and Observability
- Distributed tracing (OpenTelemetry)
- Metrics export (Prometheus)
- Log aggregation (ELK/Loki)
- Alerting (PagerDuty/OpsGenie)

---

**Document Status**: Draft v1.0.0  
**Next Review**: After initial implementation  
**Owner**: Backend Architecture Team
