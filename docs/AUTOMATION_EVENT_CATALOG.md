# Automation Event Catalog
## Antalya Real Estate Platform (AREP)

**Version:** 1.0.0  
**Last Updated:** 2026-02-18  
**Status:** Canonical Reference

---

## 1. Overview

This document defines the canonical event catalog for AREP automation system. Events are organized by phase and follow strict JSON schema definitions.

### 1.1 Event Categories
- **Moderation Workflow**: Listing lifecycle and moderation events
- **Lead Management**: Visitor inquiries and lead conversion
- **CRM Integration**: External CRM synchronization
- **Marketing Automation**: Campaign triggers and notifications
- **Analytics**: Tracking and measurement events

### 1.2 Event Structure
All events follow a common envelope structure:
```json
{
  "eventId": "UUID v4",
  "eventType": "EVENT_NAME",
  "eventVersion": "semantic version",
  "timestamp": "ISO 8601 UTC",
  "source": {
    "service": "string",
    "version": "string",
    "instanceId": "string"
  },
  "correlationId": "UUID v4",
  "causationId": "UUID v4 | null",
  "payload": { /* event-specific */ },
  "metadata": {
    "idempotencyKey": "UUID v4",
    "retryCount": "integer",
    "priority": "NORMAL | HIGH",
    "traceContext": {
      "traceId": "string",
      "spanId": "string"
    }
  }
}
```

---

## 2. Phase 1 Events (MVP)

### 2.1 LISTING_SUBMITTED

**Event Name:** `LISTING_SUBMITTED`

**Trigger Source:** `web | mobile`

**Description:** Consultant submits listing for admin review. Transitions listing from DRAFT or NEEDS_CHANGES to PENDING_REVIEW.

**Required Payload Schema:**
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

**Idempotency Key Rule:**
- Format: `SHA-256(listingId + consultantId + submittedAt + listing.version)`
- TTL: 24 hours
- Scope: Per listing submission attempt

**Downstream Consumers:**
- `moderation-agent`: AI moderation analysis
- `deterministic-scorer`: Rule-based scoring
- `admin-notification-service`: Queue notification
- `analytics-service`: Submission tracking

**Expected Output Artifacts:**
- `moderationReportId`: UUID v4
- `deterministicScores`: Completeness and quality scores
- `aiAnalysisReport`: AI moderation analysis (if enabled)
- `adminQueueEntry`: Queue entry for admin review

---

### 2.2 LISTING_APPROVED

**Event Name:** `LISTING_APPROVED`

**Trigger Source:** `admin`

**Description:** Administrator approves listing for publication. Transitions listing from PENDING_REVIEW to PUBLISHED.

**Required Payload Schema:**
```json
{
  "eventId": "string (UUID v4)",
  "eventType": "LISTING_APPROVED",
  "eventVersion": "1.0.0",
  "timestamp": "ISO 8601 datetime (UTC)",
  "source": {
    "service": "admin-api",
    "version": "string",
    "instanceId": "string"
  },
  "correlationId": "string (UUID v4)",
  "causationId": "string (UUID v4)",
  "payload": {
    "listingId": "string (UUID v4)",
    "consultantId": "string (UUID v4)",
    "adminId": "string (UUID v4)",
    "approvedAt": "ISO 8601 datetime (UTC)",
    "previousState": "PENDING_REVIEW",
    "moderationReportId": "string (UUID v4)",
    "approvalNotes": "string (max: 1000) | null",
    "publishedAt": "ISO 8601 datetime (UTC)",
    "listing": {
      "title": "string",
      "category": "RENT | SALE",
      "propertyType": "APARTMENT | VILLA | HOUSE | LAND | COMMERCIAL | OTHER",
      "price": {
        "amount": "number",
        "currency": "TRY | USD | EUR"
      },
      "location": {
        "district": "string",
        "neighborhood": "string",
        "coordinates": {
          "latitude": "number",
          "longitude": "number"
        }
      }
    }
  },
  "metadata": {
    "idempotencyKey": "string (UUID v4)",
    "retryCount": "integer (min: 0)",
    "priority": "NORMAL",
    "traceContext": {
      "traceId": "string",
      "spanId": "string"
    }
  }
}
```

**Idempotency Key Rule:**
- Format: `SHA-256(listingId + adminId + approvedAt)`
- TTL: 7 days
- Scope: Per approval action

**Downstream Consumers:**
- `listing-service`: State transition to PUBLISHED
- `notification-service`: Consultant notification
- `search-index-service`: Index listing for search
- `analytics-service`: Approval tracking
- `marketing-service`: New listing campaign triggers

**Expected Output Artifacts:**
- `publicationRecord`: Publication timestamp and metadata
- `consultantNotification`: Approval notification sent
- `searchIndexEntry`: Search index entry created
- `analyticsEvent`: Approval event logged

---

### 2.3 LISTING_REJECTED

**Event Name:** `LISTING_REJECTED`

**Trigger Source:** `admin`

**Description:** Administrator rejects listing permanently. Transitions listing from PENDING_REVIEW to ARCHIVED with rejection reason.

**Required Payload Schema:**
```json
{
  "eventId": "string (UUID v4)",
  "eventType": "LISTING_REJECTED",
  "eventVersion": "1.0.0",
  "timestamp": "ISO 8601 datetime (UTC)",
  "source": {
    "service": "admin-api",
    "version": "string",
    "instanceId": "string"
  },
  "correlationId": "string (UUID v4)",
  "causationId": "string (UUID v4)",
  "payload": {
    "listingId": "string (UUID v4)",
    "consultantId": "string (UUID v4)",
    "adminId": "string (UUID v4)",
    "rejectedAt": "ISO 8601 datetime (UTC)",
    "previousState": "PENDING_REVIEW",
    "moderationReportId": "string (UUID v4)",
    "rejectionReason": "string (required, max: 2000)",
    "rejectionCategory": "POLICY_VIOLATION | QUALITY_ISSUES | FRAUD | SPAM | OTHER",
    "isAppealable": "boolean",
    "listing": {
      "title": "string",
      "category": "RENT | SALE"
    }
  },
  "metadata": {
    "idempotencyKey": "string (UUID v4)",
    "retryCount": "integer (min: 0)",
    "priority": "NORMAL",
    "traceContext": {
      "traceId": "string",
      "spanId": "string"
    }
  }
}
```

**Idempotency Key Rule:**
- Format: `SHA-256(listingId + adminId + rejectedAt)`
- TTL: 30 days
- Scope: Per rejection action

**Downstream Consumers:**
- `listing-service`: State transition to ARCHIVED
- `notification-service`: Consultant notification with rejection reason
- `analytics-service`: Rejection tracking
- `fraud-detection-service`: Pattern analysis (if fraud category)

**Expected Output Artifacts:**
- `rejectionRecord`: Rejection timestamp and reason
- `consultantNotification`: Rejection notification sent
- `analyticsEvent`: Rejection event logged
- `fraudAnalysisReport`: Fraud analysis (if applicable)

---

### 2.4 LISTING_CHANGES_REQUESTED

**Event Name:** `LISTING_CHANGES_REQUESTED`

**Trigger Source:** `admin`

**Description:** Administrator requests changes to listing. Transitions listing from PENDING_REVIEW to NEEDS_CHANGES with feedback.

**Required Payload Schema:**
```json
{
  "eventId": "string (UUID v4)",
  "eventType": "LISTING_CHANGES_REQUESTED",
  "eventVersion": "1.0.0",
  "timestamp": "ISO 8601 datetime (UTC)",
  "source": {
    "service": "admin-api",
    "version": "string",
    "instanceId": "string"
  },
  "correlationId": "string (UUID v4)",
  "causationId": "string (UUID v4)",
  "payload": {
    "listingId": "string (UUID v4)",
    "consultantId": "string (UUID v4)",
    "adminId": "string (UUID v4)",
    "requestedAt": "ISO 8601 datetime (UTC)",
    "previousState": "PENDING_REVIEW",
    "moderationReportId": "string (UUID v4)",
    "feedback": {
      "requiredChanges": [
        {
          "field": "string",
          "issue": "string (required)",
          "severity": "HIGH | MEDIUM | LOW",
          "suggestion": "string | null"
        }
      ],
      "optionalImprovements": [
        {
          "field": "string",
          "suggestion": "string"
        }
      ],
      "notes": "string (max: 2000) | null"
    },
    "deadline": "ISO 8601 datetime (UTC) | null",
    "listing": {
      "title": "string",
      "category": "RENT | SALE"
    }
  },
  "metadata": {
    "idempotencyKey": "string (UUID v4)",
    "retryCount": "integer (min: 0)",
    "priority": "NORMAL",
    "traceContext": {
      "traceId": "string",
      "spanId": "string"
    }
  }
}
```

**Idempotency Key Rule:**
- Format: `SHA-256(listingId + adminId + requestedAt)`
- TTL: 30 days
- Scope: Per change request action

**Downstream Consumers:**
- `listing-service`: State transition to NEEDS_CHANGES
- `notification-service`: Consultant notification with feedback
- `analytics-service`: Change request tracking

**Expected Output Artifacts:**
- `changeRequestRecord`: Change request timestamp and feedback
- `consultantNotification`: Change request notification sent
- `analyticsEvent`: Change request event logged

---

### 2.5 LISTING_PUBLISHED

**Event Name:** `LISTING_PUBLISHED`

**Trigger Source:** `worker`

**Description:** Listing successfully published to public site. This event is emitted after all publication steps complete.

**Required Payload Schema:**
```json
{
  "eventId": "string (UUID v4)",
  "eventType": "LISTING_PUBLISHED",
  "eventVersion": "1.0.0",
  "timestamp": "ISO 8601 datetime (UTC)",
  "source": {
    "service": "listing-service",
    "version": "string",
    "instanceId": "string"
  },
  "correlationId": "string (UUID v4)",
  "causationId": "string (UUID v4)",
  "payload": {
    "listingId": "string (UUID v4)",
    "consultantId": "string (UUID v4)",
    "publishedAt": "ISO 8601 datetime (UTC)",
    "publicationUrl": "string (URL)",
    "listing": {
      "title": "string",
      "category": "RENT | SALE",
      "propertyType": "APARTMENT | VILLA | HOUSE | LAND | COMMERCIAL | OTHER",
      "price": {
        "amount": "number",
        "currency": "TRY | USD | EUR"
      },
      "location": {
        "district": "string",
        "neighborhood": "string",
        "coordinates": {
          "latitude": "number",
          "longitude": "number"
        }
      },
      "specifications": {
        "squareMeters": "number",
        "roomCount": "integer"
      }
    }
  },
  "metadata": {
    "idempotencyKey": "string (UUID v4)",
    "retryCount": "integer (min: 0)",
    "priority": "NORMAL",
    "traceContext": {
      "traceId": "string",
      "spanId": "string"
    }
  }
}
```

**Idempotency Key Rule:**
- Format: `SHA-256(listingId + publishedAt)`
- TTL: 90 days
- Scope: Per publication

**Downstream Consumers:**
- `search-index-service`: Finalize search index
- `analytics-service`: Publication tracking
- `marketing-service`: New listing campaign triggers
- `sitemap-service`: Update sitemap

**Expected Output Artifacts:**
- `publicationConfirmation`: Publication confirmed
- `searchIndexConfirmation`: Search index updated
- `analyticsEvent`: Publication event logged
- `sitemapUpdate`: Sitemap entry added

---

### 2.6 LISTING_UPDATED

**Event Name:** `LISTING_UPDATED`

**Trigger Source:** `web | mobile`

**Description:** Consultant updates a published listing. Changes require re-moderation if significant.

**Required Payload Schema:**
```json
{
  "eventId": "string (UUID v4)",
  "eventType": "LISTING_UPDATED",
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
    "updatedAt": "ISO 8601 datetime (UTC)",
    "currentState": "PUBLISHED",
    "changes": {
      "fields": ["string"],
      "requiresRemoderation": "boolean",
      "changeType": "MINOR | MAJOR | CRITICAL"
    },
    "previousVersion": "integer",
    "newVersion": "integer",
    "delta": {
      "title": "string | null",
      "description": "string | null",
      "price": {
        "amount": "number | null",
        "currency": "string | null"
      } | null,
      "specifications": "object | null",
      "location": "object | null",
      "media": "object | null"
    }
  },
  "metadata": {
    "idempotencyKey": "string (UUID v4)",
    "retryCount": "integer (min: 0)",
    "priority": "NORMAL",
    "traceContext": {
      "traceId": "string",
      "spanId": "string"
    }
  }
}
```

**Idempotency Key Rule:**
- Format: `SHA-256(listingId + newVersion + updatedAt)`
- TTL: 7 days
- Scope: Per update version

**Downstream Consumers:**
- `moderation-service`: Re-moderation if required
- `search-index-service`: Update search index
- `notification-service`: Admin notification if major changes
- `analytics-service`: Update tracking

**Expected Output Artifacts:**
- `updateRecord`: Update timestamp and changes
- `remoderationRequest`: Re-moderation request (if required)
- `searchIndexUpdate`: Search index updated
- `analyticsEvent`: Update event logged

---

### 2.7 LISTING_ARCHIVED

**Event Name:** `LISTING_ARCHIVED`

**Trigger Source:** `web | mobile | admin`

**Description:** Listing archived (sold, rented, or removed). Removed from public view.

**Required Payload Schema:**
```json
{
  "eventId": "string (UUID v4)",
  "eventType": "LISTING_ARCHIVED",
  "eventVersion": "1.0.0",
  "timestamp": "ISO 8601 datetime (UTC)",
  "source": {
    "service": "api | admin-api",
    "version": "string",
    "instanceId": "string"
  },
  "correlationId": "string (UUID v4)",
  "causationId": "string (UUID v4) | null",
  "payload": {
    "listingId": "string (UUID v4)",
    "consultantId": "string (UUID v4)",
    "archivedAt": "ISO 8601 datetime (UTC)",
    "previousState": "PUBLISHED",
    "archiveReason": "SOLD | RENTED | REMOVED | EXPIRED",
    "archivedBy": "CONSULTANT | ADMIN | SYSTEM",
    "archivedById": "string (UUID v4) | null",
    "notes": "string (max: 500) | null",
    "listing": {
      "title": "string",
      "category": "RENT | SALE",
      "price": {
        "amount": "number",
        "currency": "TRY | USD | EUR"
      }
    }
  },
  "metadata": {
    "idempotencyKey": "string (UUID v4)",
    "retryCount": "integer (min: 0)",
    "priority": "NORMAL",
    "traceContext": {
      "traceId": "string",
      "spanId": "string"
    }
  }
}
```

**Idempotency Key Rule:**
- Format: `SHA-256(listingId + archivedAt + archiveReason)`
- TTL: 365 days
- Scope: Per archive action

**Downstream Consumers:**
- `listing-service`: State transition to ARCHIVED
- `search-index-service`: Remove from search index
- `analytics-service`: Archive tracking
- `crm-service`: Update CRM records (Phase 2)

**Expected Output Artifacts:**
- `archiveRecord`: Archive timestamp and reason
- `searchIndexRemoval`: Removed from search index
- `analyticsEvent`: Archive event logged
- `crmSyncRequest`: CRM sync request (Phase 2)

---

## 3. Phase 2 Events (Extended)

### 3.1 LEAD_CREATED

**Event Name:** `LEAD_CREATED`

**Trigger Source:** `web | mobile`

**Description:** Visitor creates inquiry/lead for a listing. Visitor shows interest in property.

**Required Payload Schema:**
```json
{
  "eventId": "string (UUID v4)",
  "eventType": "LEAD_CREATED",
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
    "leadId": "string (UUID v4)",
    "listingId": "string (UUID v4)",
    "consultantId": "string (UUID v4)",
    "createdAt": "ISO 8601 datetime (UTC)",
    "leadSource": "LISTING_PAGE | SEARCH_RESULTS | MAP_VIEW | RECOMMENDATION",
    "visitor": {
      "visitorId": "string (UUID v4) | null",
      "contact": {
        "name": "string (required)",
        "email": "string (email format, required)",
        "phone": "string (E.164 format) | null"
      },
      "ipAddress": "string (hashed)",
      "userAgent": "string",
      "location": {
        "country": "string | null",
        "city": "string | null"
      }
    },
    "inquiry": {
      "message": "string (max: 2000) | null",
      "preferredContactMethod": "EMAIL | PHONE | WHATSAPP",
      "urgency": "LOW | MEDIUM | HIGH",
      "questions": ["string"] | null
    },
    "listing": {
      "title": "string",
      "category": "RENT | SALE",
      "price": {
        "amount": "number",
        "currency": "TRY | USD | EUR"
      },
      "location": {
        "district": "string",
        "neighborhood": "string"
      }
    }
  },
  "metadata": {
    "idempotencyKey": "string (UUID v4)",
    "retryCount": "integer (min: 0)",
    "priority": "NORMAL",
    "traceContext": {
      "traceId": "string",
      "spanId": "string"
    }
  }
}
```

**Idempotency Key Rule:**
- Format: `SHA-256(listingId + visitor.email + createdAt)`
- TTL: 24 hours
- Scope: Per listing-visitor combination

**Downstream Consumers:**
- `notification-service`: Consultant notification
- `crm-service`: Create CRM lead record
- `analytics-service`: Lead creation tracking
- `marketing-service`: Lead scoring and segmentation

**Expected Output Artifacts:**
- `leadRecord`: Lead record created
- `consultantNotification`: New lead notification sent
- `crmLeadId`: CRM lead ID (if integrated)
- `analyticsEvent`: Lead creation event logged

---

### 3.2 LEAD_CONTACTED

**Event Name:** `LEAD_CONTACTED`

**Trigger Source:** `web | mobile`

**Description:** Consultant contacts lead (calls, emails, or messages). Tracks consultant-lead interaction.

**Required Payload Schema:**
```json
{
  "eventId": "string (UUID v4)",
  "eventType": "LEAD_CONTACTED",
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
    "leadId": "string (UUID v4)",
    "listingId": "string (UUID v4)",
    "consultantId": "string (UUID v4)",
    "contactedAt": "ISO 8601 datetime (UTC)",
    "contactMethod": "EMAIL | PHONE | WHATSAPP | IN_PERSON | OTHER",
    "contactDetails": {
      "subject": "string | null",
      "message": "string (max: 5000) | null",
      "duration": "integer (seconds) | null",
      "outcome": "CONTACTED | NO_ANSWER | VOICEMAIL | BUSY | OTHER"
    },
    "notes": "string (max: 1000) | null",
    "nextFollowUp": "ISO 8601 datetime (UTC) | null"
  },
  "metadata": {
    "idempotencyKey": "string (UUID v4)",
    "retryCount": "integer (min: 0)",
    "priority": "NORMAL",
    "traceContext": {
      "traceId": "string",
      "spanId": "string"
    }
  }
}
```

**Idempotency Key Rule:**
- Format: `SHA-256(leadId + consultantId + contactedAt + contactMethod)`
- TTL: 7 days
- Scope: Per contact attempt

**Downstream Consumers:**
- `crm-service`: Update CRM activity log
- `analytics-service`: Contact tracking
- `lead-scoring-service`: Update lead score
- `notification-service`: Lead notification (if first contact)

**Expected Output Artifacts:**
- `contactRecord`: Contact record created
- `crmActivityUpdate`: CRM activity logged
- `analyticsEvent`: Contact event logged
- `leadScoreUpdate`: Lead score updated

---

### 3.3 LEAD_CONVERTED

**Event Name:** `LEAD_CONVERTED`

**Trigger Source:** `web | mobile | admin`

**Description:** Lead converts to customer (property sold/rented to lead). Marks successful conversion.

**Required Payload Schema:**
```json
{
  "eventId": "string (UUID v4)",
  "eventType": "LEAD_CONVERTED",
  "eventVersion": "1.0.0",
  "timestamp": "ISO 8601 datetime (UTC)",
  "source": {
    "service": "api | admin-api",
    "version": "string",
    "instanceId": "string"
  },
  "correlationId": "string (UUID v4)",
  "causationId": "string (UUID v4)",
  "payload": {
    "leadId": "string (UUID v4)",
    "listingId": "string (UUID v4)",
    "consultantId": "string (UUID v4)",
    "convertedAt": "ISO 8601 datetime (UTC)",
    "conversionType": "SALE | RENTAL",
    "conversionDetails": {
      "finalPrice": {
        "amount": "number",
        "currency": "TRY | USD | EUR"
      },
      "contractSignedAt": "ISO 8601 datetime (UTC) | null",
      "commission": {
        "amount": "number | null",
        "currency": "TRY | USD | EUR | null"
      }
    },
    "customer": {
      "name": "string",
      "email": "string",
      "phone": "string | null"
    },
    "notes": "string (max: 2000) | null"
  },
  "metadata": {
    "idempotencyKey": "string (UUID v4)",
    "retryCount": "integer (min: 0)",
    "priority": "HIGH",
    "traceContext": {
      "traceId": "string",
      "spanId": "string"
    }
  }
}
```

**Idempotency Key Rule:**
- Format: `SHA-256(leadId + listingId + convertedAt)`
- TTL: 365 days
- Scope: Per conversion

**Downstream Consumers:**
- `listing-service`: Archive listing
- `crm-service`: Update CRM with conversion
- `analytics-service`: Conversion tracking
- `commission-service`: Commission calculation (if applicable)
- `marketing-service`: Conversion attribution

**Expected Output Artifacts:**
- `conversionRecord`: Conversion record created
- `crmConversionUpdate`: CRM updated with conversion
- `analyticsEvent`: Conversion event logged
- `commissionRecord`: Commission record (if applicable)

---

### 3.4 NOTIFICATION_SENT

**Event Name:** `NOTIFICATION_SENT`

**Trigger Source:** `worker`

**Description:** Notification (email, SMS, or push) successfully sent. Tracks notification delivery.

**Required Payload Schema:**
```json
{
  "eventId": "string (UUID v4)",
  "eventType": "NOTIFICATION_SENT",
  "eventVersion": "1.0.0",
  "timestamp": "ISO 8601 datetime (UTC)",
  "source": {
    "service": "notification-service",
    "version": "string",
    "instanceId": "string"
  },
  "correlationId": "string (UUID v4)",
  "causationId": "string (UUID v4)",
  "payload": {
    "notificationId": "string (UUID v4)",
    "recipientId": "string (UUID v4)",
    "recipientType": "CONSULTANT | ADMIN | VISITOR | LEAD",
    "sentAt": "ISO 8601 datetime (UTC)",
    "channel": "EMAIL | SMS | PUSH | IN_APP",
    "template": "string",
    "templateVersion": "string",
    "deliveryStatus": "SENT | DELIVERED | FAILED | BOUNCED",
    "deliveryDetails": {
      "provider": "string",
      "providerMessageId": "string | null",
      "deliveredAt": "ISO 8601 datetime (UTC) | null",
      "openedAt": "ISO 8601 datetime (UTC) | null",
      "clickedAt": "ISO 8601 datetime (UTC) | null",
      "error": "string | null"
    },
    "content": {
      "subject": "string | null",
      "body": "string",
      "actionUrl": "string (URL) | null"
    },
    "relatedEntity": {
      "type": "LISTING | LEAD | MODERATION_REPORT | OTHER",
      "id": "string (UUID v4) | null"
    }
  },
  "metadata": {
    "idempotencyKey": "string (UUID v4)",
    "retryCount": "integer (min: 0)",
    "priority": "NORMAL",
    "traceContext": {
      "traceId": "string",
      "spanId": "string"
    }
  }
}
```

**Idempotency Key Rule:**
- Format: `SHA-256(notificationId + sentAt)`
- TTL: 30 days
- Scope: Per notification send

**Downstream Consumers:**
- `analytics-service`: Notification tracking
- `notification-service`: Delivery status updates
- `marketing-service`: Engagement tracking

**Expected Output Artifacts:**
- `deliveryRecord`: Delivery record created
- `analyticsEvent`: Notification event logged
- `engagementMetrics`: Open/click tracking (if available)

---

### 3.5 MARKETING_CAMPAIGN_TRIGGERED

**Event Name:** `MARKETING_CAMPAIGN_TRIGGERED`

**Trigger Source:** `worker`

**Description:** Marketing campaign automatically triggered based on conditions (new listing, price drop, etc.).

**Required Payload Schema:**
```json
{
  "eventId": "string (UUID v4)",
  "eventType": "MARKETING_CAMPAIGN_TRIGGERED",
  "eventVersion": "1.0.0",
  "timestamp": "ISO 8601 datetime (UTC)",
  "source": {
    "service": "marketing-service",
    "version": "string",
    "instanceId": "string"
  },
  "correlationId": "string (UUID v4)",
  "causationId": "string (UUID v4)",
  "payload": {
    "campaignId": "string (UUID v4)",
    "campaignName": "string",
    "campaignType": "NEW_LISTING | PRICE_DROP | MATCHING_SEARCH | NEIGHBORHOOD_ALERT | OTHER",
    "triggeredAt": "ISO 8601 datetime (UTC)",
    "trigger": {
      "type": "LISTING_PUBLISHED | PRICE_CHANGED | SEARCH_PERFORMED | OTHER",
      "entityId": "string (UUID v4)",
      "entityType": "LISTING | SEARCH | USER"
    },
    "targetAudience": {
      "segment": "string",
      "criteria": {
        "location": {
          "district": "string | null",
          "neighborhood": "string | null"
        } | null,
        "priceRange": {
          "min": "number | null",
          "max": "number | null"
        } | null,
        "propertyType": ["APARTMENT", "VILLA", "HOUSE", "LAND", "COMMERCIAL", "OTHER"] | null,
        "preferences": "object | null"
      },
      "estimatedRecipients": "integer"
    },
    "content": {
      "template": "string",
      "personalization": "object | null"
    },
    "channels": ["EMAIL", "PUSH", "SMS"],
    "scheduledSendAt": "ISO 8601 datetime (UTC) | null"
  },
  "metadata": {
    "idempotencyKey": "string (UUID v4)",
    "retryCount": "integer (min: 0)",
    "priority": "NORMAL",
    "traceContext": {
      "traceId": "string",
      "spanId": "string"
    }
  }
}
```

**Idempotency Key Rule:**
- Format: `SHA-256(campaignId + trigger.entityId + triggeredAt)`
- TTL: 7 days
- Scope: Per campaign trigger

**Downstream Consumers:**
- `notification-service`: Send campaign notifications
- `analytics-service`: Campaign tracking
- `marketing-service`: Campaign execution

**Expected Output Artifacts:**
- `campaignExecutionRecord`: Campaign execution record
- `notificationBatch`: Batch of notifications created
- `analyticsEvent`: Campaign trigger event logged

---

### 3.6 CRM_SYNC_REQUIRED

**Event Name:** `CRM_SYNC_REQUIRED`

**Trigger Source:** `worker | web | mobile`

**Description:** Data change requires synchronization with external CRM system.

**Required Payload Schema:**
```json
{
  "eventId": "string (UUID v4)",
  "eventType": "CRM_SYNC_REQUIRED",
  "eventVersion": "1.0.0",
  "timestamp": "ISO 8601 datetime (UTC)",
  "source": {
    "service": "api | crm-sync-service",
    "version": "string",
    "instanceId": "string"
  },
  "correlationId": "string (UUID v4)",
  "causationId": "string (UUID v4)",
  "payload": {
    "syncId": "string (UUID v4)",
    "syncType": "LISTING | LEAD | CONSULTANT | CONVERSION",
    "entityId": "string (UUID v4)",
    "entityType": "LISTING | LEAD | CONSULTANT | CONVERSION",
    "syncDirection": "TO_CRM | FROM_CRM | BIDIRECTIONAL",
    "triggeredAt": "ISO 8601 datetime (UTC)",
    "trigger": {
      "eventType": "string",
      "eventId": "string (UUID v4)"
    },
    "data": {
      "entity": "object",
      "changes": "object | null",
      "previousState": "object | null"
    },
    "crmSystem": {
      "provider": "SALESFORCE | HUBSPOT | CUSTOM",
      "endpoint": "string (URL)",
      "credentials": "string (encrypted reference)"
    },
    "priority": "HIGH | NORMAL | LOW",
    "retryPolicy": {
      "maxRetries": "integer",
      "retryDelay": "integer (seconds)"
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

**Idempotency Key Rule:**
- Format: `SHA-256(syncType + entityId + syncDirection + triggeredAt)`
- TTL: 7 days
- Scope: Per sync operation

**Downstream Consumers:**
- `crm-sync-service`: Execute CRM synchronization
- `analytics-service`: Sync tracking
- `error-handler-service`: Handle sync failures

**Expected Output Artifacts:**
- `syncRecord`: Sync record created
- `crmSyncResult`: Sync result (success/failure)
- `analyticsEvent`: Sync event logged

---

### 3.7 ANALYTICS_EVENT

**Event Name:** `ANALYTICS_EVENT`

**Trigger Source:** `web | mobile | worker`

**Description:** Analytics/tracking event for measurement and insights.

**Required Payload Schema:**
```json
{
  "eventId": "string (UUID v4)",
  "eventType": "ANALYTICS_EVENT",
  "eventVersion": "1.0.0",
  "timestamp": "ISO 8601 datetime (UTC)",
  "source": {
    "service": "api | web | mobile",
    "version": "string",
    "instanceId": "string"
  },
  "correlationId": "string (UUID v4)",
  "causationId": "string (UUID v4) | null",
  "payload": {
    "eventName": "string",
    "eventCategory": "LISTING | LEAD | USER | SEARCH | MARKETING | OTHER",
    "userId": "string (UUID v4) | null",
    "sessionId": "string (UUID v4) | null",
    "properties": {
      "listingId": "string (UUID v4) | null",
      "consultantId": "string (UUID v4) | null",
      "leadId": "string (UUID v4) | null",
      "searchQuery": "string | null",
      "filters": "object | null",
      "location": {
        "district": "string | null",
        "neighborhood": "string | null"
      } | null,
      "device": {
        "type": "DESKTOP | MOBILE | TABLET",
        "os": "string | null",
        "browser": "string | null"
      } | null,
      "customProperties": "object | null"
    },
    "context": {
      "page": "string | null",
      "referrer": "string (URL) | null",
      "campaign": "string | null",
      "source": "string | null"
    }
  },
  "metadata": {
    "idempotencyKey": "string (UUID v4)",
    "retryCount": "integer (min: 0)",
    "priority": "LOW",
    "traceContext": {
      "traceId": "string",
      "spanId": "string"
    }
  }
}
```

**Idempotency Key Rule:**
- Format: `SHA-256(eventName + userId + sessionId + timestamp)`
- TTL: 1 day
- Scope: Per event occurrence

**Downstream Consumers:**
- `analytics-service`: Process and store analytics
- `data-warehouse-service`: Load into data warehouse
- `reporting-service`: Generate reports

**Expected Output Artifacts:**
- `analyticsRecord`: Analytics record stored
- `dataWarehouseEntry`: Data warehouse entry created
- `reportUpdate`: Report metrics updated

---

## 4. Event Summary Table

| Event Name | Phase | Trigger Source | Primary Consumer | Output Artifact |
|------------|-------|----------------|------------------|-----------------|
| LISTING_SUBMITTED | 1 | web/mobile | moderation-agent | moderationReportId |
| LISTING_APPROVED | 1 | admin | listing-service | publicationRecord |
| LISTING_REJECTED | 1 | admin | listing-service | rejectionRecord |
| LISTING_CHANGES_REQUESTED | 1 | admin | listing-service | changeRequestRecord |
| LISTING_PUBLISHED | 1 | worker | search-index-service | publicationConfirmation |
| LISTING_UPDATED | 1 | web/mobile | moderation-service | updateRecord |
| LISTING_ARCHIVED | 1 | web/mobile/admin | search-index-service | archiveRecord |
| LEAD_CREATED | 2 | web/mobile | notification-service | leadRecord |
| LEAD_CONTACTED | 2 | web/mobile | crm-service | contactRecord |
| LEAD_CONVERTED | 2 | web/mobile/admin | crm-service | conversionRecord |
| NOTIFICATION_SENT | 2 | worker | analytics-service | deliveryRecord |
| MARKETING_CAMPAIGN_TRIGGERED | 2 | worker | notification-service | campaignExecutionRecord |
| CRM_SYNC_REQUIRED | 2 | worker/web/mobile | crm-sync-service | syncRecord |
| ANALYTICS_EVENT | 2 | web/mobile/worker | analytics-service | analyticsRecord |

---

## 5. Common Envelope Fields

All events MUST include these envelope fields:

### 5.1 Required Envelope Fields
- `eventId`: UUID v4, unique per event instance
- `eventType`: String, exact event name from catalog
- `eventVersion`: Semantic version (e.g., "1.0.0")
- `timestamp`: ISO 8601 UTC datetime
- `source.service`: Service name emitting event
- `source.version`: Service version
- `source.instanceId`: Instance identifier
- `correlationId`: UUID v4, groups related events
- `payload`: Event-specific payload object
- `metadata.idempotencyKey`: UUID v4, for deduplication
- `metadata.retryCount`: Integer, retry attempt number
- `metadata.priority`: NORMAL or HIGH
- `metadata.traceContext.traceId`: Distributed tracing ID
- `metadata.traceContext.spanId`: Span ID for tracing

### 5.2 Optional Envelope Fields
- `causationId`: UUID v4, ID of event that caused this event
- `metadata.traceContext.parentSpanId`: Parent span ID

---

## 6. Idempotency Key Rules Summary

### 6.1 Key Generation Patterns
- **Entity-based**: `SHA-256(entityId + actionTimestamp)`
- **Composite**: `SHA-256(entityId + actorId + actionTimestamp)`
- **Version-based**: `SHA-256(entityId + version + timestamp)`

### 6.2 TTL Guidelines
- **Short-lived** (1-7 days): High-frequency events (analytics, notifications)
- **Medium-lived** (7-30 days): Business events (submissions, approvals)
- **Long-lived** (30-365 days): Critical events (conversions, archives)

### 6.3 Scope Guidelines
- **Per action**: Unique per action attempt
- **Per entity**: Unique per entity instance
- **Per version**: Unique per entity version

---

**Document Status:** Canonical v1.0.0  
**Maintenance:** Update when new events added or schemas change  
**Owner:** Platform Architecture Team
