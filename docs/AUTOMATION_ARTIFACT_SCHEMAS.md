# Automation Artifact Schemas
## Antalya Real Estate Platform (AREP)

**Version:** 1.0.0  
**Last Updated:** 2026-02-18  
**Status:** Canonical Reference

---

## 1. Overview

This document defines the canonical schemas for automation artifacts produced by AREP automation system. All artifacts follow strict JSON schema definitions with validation rules and anti-hallucination safeguards.

### 1.1 Artifact Categories
- **ModerationReport**: AI and rule-based moderation analysis results
- **LeadScoreReport**: Lead scoring and qualification analysis
- **CRMSyncResult**: CRM synchronization operation results
- **MarketingAssetPack**: Marketing content assets (SEO, social, messaging)

### 1.2 Common Principles
- **Strict JSON**: All artifacts MUST be valid JSON
- **No Hallucination**: Artifacts MUST NOT invent property features not in source data
- **Evidence-Based**: All claims MUST reference source data fields
- **Validation**: All artifacts MUST pass schema validation before use

---

## 2. ModerationReport

### 2.1 Schema Definition

**Artifact Name:** `ModerationReport`

**Event:** `LISTING_SUBMITTED`

**Purpose:** Comprehensive moderation analysis combining deterministic scoring and AI analysis.

**Strict JSON Schema:**
```json
{
  "reportId": "string (UUID v4, required)",
  "listingId": "string (UUID v4, required)",
  "eventId": "string (UUID v4, required)",
  "generatedAt": "ISO 8601 datetime (UTC, required)",
  "processingDurationMs": "integer (min: 0, required)",
  "status": "SUCCESS | PARTIAL_SUCCESS | FAILED (required)",
  "moderationReport": {
    "overallScore": "integer (0-100, required)",
    "completenessScore": "integer (0-100, required)",
    "qualityScore": "integer (0-100, required)",
    "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL (required)",
    "checks": {
      "contentModeration": {
        "status": "PASS | FAIL | WARNING (required)",
        "issues": [
          {
            "type": "INAPPROPRIATE_LANGUAGE | SPAM_DETECTED | CONTACT_IN_DESCRIPTION | PRICE_MANIPULATION | SUSPICIOUS_PATTERNS | POLICY_VIOLATION (required)",
            "severity": "LOW | MEDIUM | HIGH | CRITICAL (required)",
            "message": "string (Turkish, required)",
            "field": "title | description | price | location | null (required)",
            "evidence": "string (exact text or data from source, required)",
            "confidence": "number (0.0-1.0, required)",
            "sourceField": "string (field path in source data, required)",
            "sourceValue": "any (exact value from source, required)"
          }
        ],
        "passed": "boolean (required)"
      },
      "imageModeration": {
        "status": "PASS | FAIL | WARNING (required)",
        "issues": [
          {
            "imageId": "string (UUID v4, required)",
            "type": "INAPPROPRIATE_CONTENT | LOW_QUALITY | DUPLICATE | WATERMARK_DETECTED | WRONG_ORIENTATION (required)",
            "severity": "LOW | MEDIUM | HIGH (required)",
            "message": "string (Turkish, required)",
            "confidence": "number (0.0-1.0, required)",
            "suggestedAction": "REPLACE | REMOVE | ROTATE | null (required)"
          }
        ],
        "passed": "boolean (required)",
        "totalImagesChecked": "integer (min: 0, required)",
        "imagesPassed": "integer (min: 0, required)"
      },
      "dataQuality": {
        "status": "PASS | FAIL | WARNING (required)",
        "issues": [
          {
            "field": "string (JSONPath, required)",
            "type": "MISSING_REQUIRED | INVALID_FORMAT | OUT_OF_RANGE | INCONSISTENT_DATA (required)",
            "severity": "LOW | MEDIUM | HIGH (required)",
            "message": "string (Turkish, required)",
            "currentValue": "any | null (required)",
            "expectedValue": "any | null (required)",
            "sourceField": "string (field path, required)"
          }
        ],
        "passed": "boolean (required)"
      },
      "geospatialValidation": {
        "status": "PASS | FAIL | WARNING (required)",
        "issues": [
          {
            "type": "COORDINATES_OUT_OF_BOUNDS | ADDRESS_MISMATCH | INVALID_POSTAL_CODE (required)",
            "severity": "LOW | MEDIUM | HIGH (required)",
            "message": "string (Turkish, required)",
            "coordinates": {
              "latitude": "number (required)",
              "longitude": "number (required)"
            } | null,
            "sourceField": "string (location.coordinates, required)"
          }
        ],
        "passed": "boolean (required)"
      }
    },
    "recommendations": [
      {
        "category": "CONTENT | IMAGES | DATA | SEO | PRICING (required)",
        "priority": "LOW | MEDIUM | HIGH (required)",
        "message": "string (Turkish, required)",
        "actionable": "boolean (required)",
        "estimatedImpact": "string | null (optional)",
        "sourceField": "string (field path referenced, optional)"
      }
    ]
  },
  "deterministicScores": {
    "completenessScore": "integer (0-100, required)",
    "descriptionQualityScore": "integer (0-100, required)",
    "missingFields": ["string"] | [],
    "warnings": [
      {
        "code": "string (required)",
        "severity": "LOW | MEDIUM | HIGH (required)",
        "message": "string (Turkish, required)",
        "field": "string | null (required)"
      }
    ] | [],
    "tags": ["string"] | [],
    "seoTitle": "string (required)"
  },
  "aiAnalysis": {
    "status": "SUCCESS | ERROR | PARTIAL (required)",
    "contentModeration": {
      "status": "PASS | FAIL | WARNING (required)",
      "issues": [
        {
          "type": "INAPPROPRIATE_LANGUAGE | SPAM_DETECTED | CONTACT_IN_DESCRIPTION | PRICE_MANIPULATION | SUSPICIOUS_PATTERNS | POLICY_VIOLATION (required)",
          "severity": "LOW | MEDIUM | HIGH | CRITICAL (required)",
          "message": "string (Turkish, required)",
          "field": "title | description | price | location | null (required)",
          "evidence": "string (exact text from source, required)",
          "confidence": "number (0.0-1.0, required)",
          "sourceField": "string (field path, required)",
          "sourceValue": "any (exact value from source, required)"
        }
      ] | [],
      "passed": "boolean (required)"
    },
    "factVerification": {
      "status": "CONSISTENT | INCONSISTENT | INSUFFICIENT_DATA (required)",
      "inconsistencies": [
        {
          "type": "DESCRIPTION_DATA_MISMATCH | PRICE_SIZE_MISMATCH | LOCATION_COORDINATE_MISMATCH | FEATURE_CONTRADICTION (required)",
          "severity": "LOW | MEDIUM | HIGH (required)",
          "message": "string (Turkish, required)",
          "descriptionClaim": "string | null (exact text from description, required)",
          "structuredDataValue": "string | null (exact value from structured data, required)",
          "field": "string (field path, required)",
          "recommendation": "string (Turkish, required)",
          "sourceDescription": "string (exact excerpt from description, required)",
          "sourceStructuredField": "string (field path, required)"
        }
      ] | [],
      "consistencyScore": "integer (0-100) | null (required)"
    },
    "riskAssessment": {
      "fraudIndicators": [
        {
          "indicator": "SUSPICIOUS_PRICE | UNREALISTIC_CLAIMS | CONTACT_EVASION | LOCATION_MISMATCH | IMAGE_ISSUES (required)",
          "severity": "LOW | MEDIUM | HIGH | CRITICAL (required)",
          "message": "string (Turkish, required)",
          "evidence": "string (exact data from source, required)",
          "recommendation": "string (Turkish, required)",
          "sourceField": "string (field path, required)",
          "sourceValue": "any (exact value from source, required)"
        }
      ] | [],
      "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL (required)",
      "requiresManualReview": "boolean (required)"
    }
  },
  "suggestedTags": [
    {
      "tag": "string (required)",
      "confidence": "number (0.0-1.0, required)",
      "source": "IMAGE_ANALYSIS | DESCRIPTION_ANALYSIS | LOCATION_BASED | STRUCTURED_DATA | MANUAL (required)",
      "category": "AMENITY | LOCATION | PROPERTY_TYPE | FEATURE (required)",
      "sourceField": "string (field path that generated tag, required)",
      "sourceValue": "any (value that generated tag, required)"
    }
  ] | [],
  "seoSuggestions": {
    "titleSuggestion": "string | null (optional)",
    "descriptionSuggestion": "string | null (optional)",
    "keywords": ["string"] | [],
    "metaDescription": "string | null (optional)",
    "improvements": [
      {
        "field": "title | description (required)",
        "current": "string (exact current text, required)",
        "suggested": "string (improved version, required)",
        "reason": "string (Turkish, required)",
        "sourceFields": ["string"] | []
      }
    ] | []
  },
  "comparison": {
    "previousReportId": "string (UUID v4) | null (optional)",
    "delta": {
      "scoreChange": "number (required)",
      "issuesResolved": "integer (min: 0, required)",
      "issuesNew": "integer (min: 0, required)",
      "fieldsChanged": ["string"] | [],
      "improvementPercentage": "number (0-100, required)"
    }
  } | null,
  "metadata": {
    "agentVersion": "string (required)",
    "modelVersion": "string | null (optional)",
    "processingSteps": [
      {
        "step": "string (required)",
        "durationMs": "integer (min: 0, required)",
        "status": "SUCCESS | FAILED (required)",
        "error": "string | null (optional)"
      }
    ] | [],
    "costEstimate": {
      "currency": "USD (required)",
      "amount": "number (min: 0, required)"
    } | null
  },
  "error": {
    "code": "string (required)",
    "message": "string (Turkish, required)",
    "details": "string | null (optional)"
  } | null
}
```

### 2.2 Validation Rules

#### Required Fields
- `reportId`, `listingId`, `eventId`, `generatedAt`, `status`
- `moderationReport.overallScore`, `moderationReport.completenessScore`, `moderationReport.qualityScore`, `moderationReport.riskLevel`
- `deterministicScores.completenessScore`, `deterministicScores.descriptionQualityScore`, `deterministicScores.seoTitle`
- `aiAnalysis.status`, `aiAnalysis.contentModeration.status`, `aiAnalysis.factVerification.status`, `aiAnalysis.riskAssessment.riskLevel`

#### Conditional Fields
- If `status === "FAILED"`: `error` object MUST be present
- If `status === "PARTIAL_SUCCESS"`: At least one check section MUST have status other than "PASS"
- If `comparison.previousReportId` is not null: `comparison.delta` MUST be present

#### Type Constraints
- All scores: Integer 0-100
- All confidence values: Float 0.0-1.0
- All severity/enum fields: Must match exact values (case-sensitive)
- All timestamps: ISO 8601 format, UTC timezone
- Empty arrays: MUST be `[]`, never `null`

#### Array Size Limits
- `moderationReport.checks.contentModeration.issues`: Max 20 items
- `moderationReport.checks.dataQuality.issues`: Max 15 items
- `moderationReport.recommendations`: Max 10 items
- `aiAnalysis.factVerification.inconsistencies`: Max 15 items
- `suggestedTags`: Max 15 items

### 2.3 Anti-Hallucination Rules

#### Rule AH-MR-1: Evidence Requirement
**Rule:** Every issue, inconsistency, or recommendation MUST include `sourceField` and `sourceValue` fields referencing exact source data.

**Validation:**
- `sourceField` MUST be a valid JSONPath to source listing data
- `sourceValue` MUST exactly match the value at `sourceField` in source data
- `evidence` field MUST contain exact text/data from source, not interpretation

#### Rule AH-MR-2: No Feature Invention
**Rule:** Tags, suggestions, and recommendations MUST NOT reference property features not present in source data.

**Validation:**
- All tags MUST have `sourceField` and `sourceValue` proving feature exists
- SEO suggestions MUST only reference features present in source
- Recommendations MUST NOT suggest adding features not in source

#### Rule AH-MR-3: Fact Verification Evidence
**Rule:** Fact verification inconsistencies MUST include exact excerpts from source.

**Validation:**
- `descriptionClaim` MUST be extractable substring from `listing.description`
- `structuredDataValue` MUST exactly match value at `field` in source
- `sourceDescription` MUST be exact excerpt (min 10, max 200 characters)

#### Rule AH-MR-4: Null Value Handling
**Rule:** If source field is `null` or missing, analysis MUST state "not_provided", never infer value.

**Validation:**
- If `sourceValue` is `null`, `structuredDataValue` MUST be `"not_provided"`
- Analysis MUST NOT assume `null` means `false` or any other value
- Missing fields MUST be listed in `deterministicScores.missingFields`

### 2.4 Field Requirements Summary

| Field Path | Required | Nullable | Notes |
|------------|----------|----------|-------|
| `reportId` | ✅ | ❌ | UUID v4 |
| `listingId` | ✅ | ❌ | UUID v4 |
| `status` | ✅ | ❌ | Enum |
| `moderationReport.overallScore` | ✅ | ❌ | 0-100 |
| `moderationReport.riskLevel` | ✅ | ❌ | Enum |
| `deterministicScores.completenessScore` | ✅ | ❌ | 0-100 |
| `aiAnalysis.status` | ✅ | ❌ | Enum |
| `error` | Conditional | ✅ | Required if status=FAILED |
| `comparison` | ❌ | ✅ | Optional |
| `suggestedTags` | ✅ | ❌ | Array (can be empty) |
| `seoSuggestions.titleSuggestion` | ❌ | ✅ | Optional |

---

## 3. LeadScoreReport

### 3.1 Schema Definition

**Artifact Name:** `LeadScoreReport`

**Event:** `LEAD_CREATED`

**Purpose:** Lead scoring and qualification analysis for visitor inquiries.

**Strict JSON Schema:**
```json
{
  "reportId": "string (UUID v4, required)",
  "leadId": "string (UUID v4, required)",
  "listingId": "string (UUID v4, required)",
  "eventId": "string (UUID v4, required)",
  "generatedAt": "ISO 8601 datetime (UTC, required)",
  "processingDurationMs": "integer (min: 0, required)",
  "status": "SUCCESS | ERROR (required)",
  "leadScore": {
    "overallScore": "integer (0-100, required)",
    "qualificationLevel": "HOT | WARM | COLD (required)",
    "conversionProbability": "number (0.0-1.0, required)",
    "scoreBreakdown": {
      "intentScore": "integer (0-100, required)",
      "engagementScore": "integer (0-100, required)",
      "fitScore": "integer (0-100, required)",
      "urgencyScore": "integer (0-100, required)"
    },
    "factors": [
      {
        "factor": "string (required)",
        "category": "INTENT | ENGAGEMENT | FIT | URGENCY (required)",
        "score": "integer (0-100, required)",
        "weight": "number (0.0-1.0, required)",
        "evidence": "string (exact data from source, required)",
        "sourceField": "string (field path, required)",
        "sourceValue": "any (exact value from source, required)"
      }
    ] | [],
    "signals": [
      {
        "signal": "string (required)",
        "type": "POSITIVE | NEGATIVE | NEUTRAL (required)",
        "impact": "LOW | MEDIUM | HIGH (required)",
        "description": "string (Turkish, required)",
        "evidence": "string (exact data from source, required)",
        "sourceField": "string (field path, required)",
        "sourceValue": "any (exact value from source, required)"
      }
    ] | []
  },
  "leadProfile": {
    "contactQuality": "HIGH | MEDIUM | LOW (required)",
    "contactCompleteness": "integer (0-100, required)",
    "contactMethods": ["EMAIL", "PHONE", "WHATSAPP"] | [],
    "inquiryAnalysis": {
      "messageLength": "integer (min: 0, required)",
      "hasQuestions": "boolean (required)",
      "questionCount": "integer (min: 0, required)",
      "urgencyIndicators": ["string"] | [],
      "intentKeywords": ["string"] | [],
      "sourceFields": ["string"] | []
    },
    "behavioralSignals": [
      {
        "signal": "string (required)",
        "type": "VIEW_DURATION | PAGE_VIEWS | RETURN_VISIT | SEARCH_MATCH (required)",
        "value": "number | string (required)",
        "sourceField": "string (field path, required)",
        "sourceValue": "any (exact value from source, required)"
      }
    ] | []
  },
  "listingMatch": {
    "matchScore": "integer (0-100, required)",
    "matchFactors": [
      {
        "factor": "string (required)",
        "matchType": "PRICE | LOCATION | PROPERTY_TYPE | FEATURES (required)",
        "score": "integer (0-100, required)",
        "evidence": "string (exact data from source, required)",
        "sourceField": "string (field path, required)",
        "sourceValue": "any (exact value from source, required)"
      }
    ] | [],
    "mismatches": [
      {
        "field": "string (required)",
        "leadPreference": "any | null (required)",
        "listingValue": "any (required)",
        "severity": "LOW | MEDIUM | HIGH (required)",
        "sourceLeadField": "string (field path, required)",
        "sourceListingField": "string (field path, required)"
      }
    ] | []
  },
  "recommendations": [
    {
      "category": "CONTACT | FOLLOW_UP | QUALIFICATION | LISTING (required)",
      "priority": "HIGH | MEDIUM | LOW (required)",
      "action": "string (Turkish, required)",
      "reason": "string (Turkish, required)",
      "sourceFields": ["string"] | []
    }
  ] | [],
  "nextActions": [
    {
      "action": "string (Turkish, required)",
      "priority": "HIGH | MEDIUM | LOW (required)",
      "suggestedTime": "ISO 8601 datetime (UTC) | null (optional)",
      "channel": "EMAIL | PHONE | WHATSAPP | IN_PERSON (required)",
      "reason": "string (Turkish, required)"
    }
  ] | [],
  "metadata": {
    "scoringModelVersion": "string (required)",
    "processingSteps": [
      {
        "step": "string (required)",
        "durationMs": "integer (min: 0, required)",
        "status": "SUCCESS | FAILED (required)"
      }
    ] | []
  },
  "error": {
    "code": "string (required)",
    "message": "string (Turkish, required)",
    "details": "string | null (optional)"
  } | null
}
```

### 3.2 Validation Rules

#### Required Fields
- `reportId`, `leadId`, `listingId`, `eventId`, `generatedAt`, `status`
- `leadScore.overallScore`, `leadScore.qualificationLevel`, `leadScore.conversionProbability`
- `leadScore.scoreBreakdown.intentScore`, `leadScore.scoreBreakdown.engagementScore`, `leadScore.scoreBreakdown.fitScore`, `leadScore.scoreBreakdown.urgencyScore`
- `leadProfile.contactQuality`, `leadProfile.contactCompleteness`
- `listingMatch.matchScore`

#### Conditional Fields
- If `status === "ERROR"`: `error` object MUST be present
- If `leadProfile.inquiryAnalysis.hasQuestions === true`: `leadProfile.inquiryAnalysis.questionCount` MUST be > 0
- If `listingMatch.mismatches` array has items: Each mismatch MUST have both `leadPreference` and `listingValue`

#### Type Constraints
- All scores: Integer 0-100
- `conversionProbability`: Float 0.0-1.0
- All enum fields: Must match exact values (case-sensitive)
- Empty arrays: MUST be `[]`, never `null`

#### Score Calculation Rules
- `overallScore` MUST be weighted average: `(intentScore * 0.3 + engagementScore * 0.2 + fitScore * 0.3 + urgencyScore * 0.2)`
- `qualificationLevel` MUST be derived from `overallScore`:
  - HOT: score >= 70
  - WARM: score >= 40 and < 70
  - COLD: score < 40

### 3.3 Anti-Hallucination Rules

#### Rule AH-LSR-1: Source Data Evidence
**Rule:** All scoring factors and signals MUST reference exact source data with `sourceField` and `sourceValue`.

**Validation:**
- Every factor in `leadScore.factors` MUST have `sourceField` and `sourceValue`
- Every signal in `leadScore.signals` MUST have `sourceField` and `sourceValue`
- `evidence` field MUST contain exact data from source, not interpretation

#### Rule AH-LSR-2: No Assumed Preferences
**Rule:** Lead preferences MUST NOT be inferred or assumed. Only use explicit data from inquiry or behavior.

**Validation:**
- `listingMatch.matchFactors` MUST only reference explicit lead data
- `listingMatch.mismatches` MUST only flag when lead explicitly stated preference
- Behavioral signals MUST reference actual tracked events, not inferred intent

#### Rule AH-LSR-3: Inquiry Analysis Evidence
**Rule:** Inquiry analysis MUST reference exact text from lead message.

**Validation:**
- `urgencyIndicators` MUST be exact keywords found in `lead.inquiry.message`
- `intentKeywords` MUST be exact keywords found in `lead.inquiry.message`
- `sourceFields` MUST include `inquiry.message` for all text-based analysis

#### Rule AH-LSR-4: Behavioral Signal Validation
**Rule:** Behavioral signals MUST reference actual tracked events with timestamps and values.

**Validation:**
- `behavioralSignals` MUST have `sourceField` pointing to analytics event
- `sourceValue` MUST be exact value from analytics event
- Signals MUST NOT be inferred from single data point

### 3.4 Field Requirements Summary

| Field Path | Required | Nullable | Notes |
|------------|----------|----------|-------|
| `reportId` | ✅ | ❌ | UUID v4 |
| `leadId` | ✅ | ❌ | UUID v4 |
| `leadScore.overallScore` | ✅ | ❌ | 0-100 |
| `leadScore.qualificationLevel` | ✅ | ❌ | Enum |
| `leadScore.conversionProbability` | ✅ | ❌ | 0.0-1.0 |
| `leadProfile.contactQuality` | ✅ | ❌ | Enum |
| `listingMatch.matchScore` | ✅ | ❌ | 0-100 |
| `nextActions` | ✅ | ❌ | Array (can be empty) |
| `error` | Conditional | ✅ | Required if status=ERROR |

---

## 4. CRMSyncResult

### 4.1 Schema Definition

**Artifact Name:** `CRMSyncResult`

**Event:** `CRM_SYNC_REQUIRED`

**Purpose:** Result of CRM synchronization operation (lead or listing data).

**Strict JSON Schema:**
```json
{
  "syncId": "string (UUID v4, required)",
  "eventId": "string (UUID v4, required)",
  "syncType": "LISTING | LEAD | CONSULTANT | CONVERSION (required)",
  "entityId": "string (UUID v4, required)",
  "entityType": "LISTING | LEAD | CONSULTANT | CONVERSION (required)",
  "syncDirection": "TO_CRM | FROM_CRM | BIDIRECTIONAL (required)",
  "crmSystem": {
    "provider": "SALESFORCE | HUBSPOT | CUSTOM (required)",
    "endpoint": "string (URL, required)",
    "systemId": "string (required)"
  },
  "status": "SUCCESS | PARTIAL_SUCCESS | FAILED (required)",
  "syncedAt": "ISO 8601 datetime (UTC, required)",
  "processingDurationMs": "integer (min: 0, required)",
  "syncResult": {
    "crmRecordId": "string | null (optional)",
    "crmRecordUrl": "string (URL) | null (optional)",
    "fieldsSynced": [
      {
        "field": "string (field path in AREP, required)",
        "crmField": "string (field name in CRM, required)",
        "value": "any (exact value synced, required)",
        "status": "SYNCED | FAILED | SKIPPED (required)",
        "error": "string | null (optional)"
      }
    ] | [],
    "fieldsFailed": [
      {
        "field": "string (field path in AREP, required)",
        "crmField": "string (field name in CRM, required)",
        "value": "any (value attempted, required)",
        "error": "string (required)",
        "errorCode": "string (required)"
      }
    ] | [],
    "fieldsSkipped": [
      {
        "field": "string (field path in AREP, required)",
        "reason": "MAPPING_NOT_FOUND | VALUE_INVALID | FIELD_NOT_SUPPORTED (required)"
      }
    ] | []
  },
  "dataMapping": {
    "sourceEntity": "object (exact entity data from AREP, required)",
    "mappedFields": [
      {
        "arepField": "string (field path, required)",
        "crmField": "string (field name, required)",
        "transformation": "NONE | FORMAT | CONVERT | null (required)",
        "transformationRule": "string | null (optional)",
        "sourceValue": "any (exact value from AREP, required)",
        "mappedValue": "any (value sent to CRM, required)"
      }
    ] | []
  },
  "validation": {
    "preSyncValidation": {
      "passed": "boolean (required)",
      "issues": [
        {
          "field": "string (required)",
          "issue": "string (required)",
          "severity": "LOW | MEDIUM | HIGH (required)"
        }
      ] | []
    },
    "postSyncValidation": {
      "passed": "boolean (required)",
      "crmRecordValidated": "boolean (required)",
      "issues": [
        {
          "field": "string (required)",
          "issue": "string (required)",
          "severity": "LOW | MEDIUM | HIGH (required)"
        }
      ] | []
    }
  },
  "metadata": {
    "syncVersion": "string (required)",
    "mappingVersion": "string (required)",
    "retryCount": "integer (min: 0, required)",
    "nextRetryAt": "ISO 8601 datetime (UTC) | null (optional)"
  },
  "error": {
    "code": "string (required)",
    "message": "string (Turkish, required)",
    "details": "string | null (optional)",
    "crmErrorCode": "string | null (optional)",
    "crmErrorMessage": "string | null (optional)"
  } | null
}
```

### 4.2 Validation Rules

#### Required Fields
- `syncId`, `eventId`, `syncType`, `entityId`, `entityType`, `syncDirection`
- `crmSystem.provider`, `crmSystem.endpoint`, `crmSystem.systemId`
- `status`, `syncedAt`
- `syncResult.fieldsSynced`, `syncResult.fieldsFailed`, `syncResult.fieldsSkipped`
- `dataMapping.sourceEntity`, `dataMapping.mappedFields`
- `validation.preSyncValidation.passed`, `validation.postSyncValidation.passed`

#### Conditional Fields
- If `status === "FAILED"`: `error` object MUST be present
- If `status === "SUCCESS"`: `syncResult.crmRecordId` MUST be present
- If `status === "PARTIAL_SUCCESS"`: `syncResult.fieldsFailed` array MUST have items
- If `syncResult.fieldsFailed` has items: Each failure MUST have `error` and `errorCode`

#### Type Constraints
- All timestamps: ISO 8601 format, UTC timezone
- All enum fields: Must match exact values (case-sensitive)
- Empty arrays: MUST be `[]`, never `null`
- URLs: Must be valid URL format

#### Field Mapping Rules
- `dataMapping.mappedFields` MUST include all fields attempted to sync
- `sourceValue` MUST exactly match value in `sourceEntity` at `arepField`
- `mappedValue` MUST be the exact value sent to CRM (after transformation if any)

### 4.3 Anti-Hallucination Rules

#### Rule AH-CSR-1: Source Data Preservation
**Rule:** `dataMapping.sourceEntity` MUST contain exact entity data from AREP, no modifications or additions.

**Validation:**
- `sourceEntity` MUST be exact JSON representation of entity from AREP database
- No fields MUST be added that don't exist in source
- No values MUST be modified or inferred

#### Rule AH-CSR-2: Field Mapping Evidence
**Rule:** Every mapped field MUST reference exact source value and show transformation if applied.

**Validation:**
- `sourceValue` MUST exactly match value at `arepField` in `sourceEntity`
- If `transformation !== "NONE"`: `transformationRule` MUST explain transformation
- `mappedValue` MUST be derivable from `sourceValue` using `transformationRule`

#### Rule AH-CSR-3: No Data Invention
**Rule:** CRM sync MUST NOT add fields or values not present in source entity.

**Validation:**
- All fields in `fieldsSynced` MUST exist in `sourceEntity`
- `mappedValue` MUST NOT contain data not derivable from `sourceValue`
- Default values MUST only be used if explicitly configured in mapping rules

#### Rule AH-CSR-4: Sync Status Accuracy
**Rule:** Sync status MUST accurately reflect what was actually synced to CRM.

**Validation:**
- If `status === "SUCCESS"`: All required fields MUST be in `fieldsSynced` with status "SYNCED"
- If `status === "PARTIAL_SUCCESS"`: At least one field MUST be in `fieldsFailed`
- If `status === "FAILED"`: No fields MUST be in `fieldsSynced` with status "SYNCED"

### 4.4 Field Requirements Summary

| Field Path | Required | Nullable | Notes |
|------------|----------|----------|-------|
| `syncId` | ✅ | ❌ | UUID v4 |
| `syncType` | ✅ | ❌ | Enum |
| `status` | ✅ | ❌ | Enum |
| `syncResult.crmRecordId` | Conditional | ✅ | Required if status=SUCCESS |
| `syncResult.fieldsSynced` | ✅ | ❌ | Array (can be empty) |
| `dataMapping.sourceEntity` | ✅ | ❌ | Exact source data |
| `validation.preSyncValidation.passed` | ✅ | ❌ | Boolean |
| `error` | Conditional | ✅ | Required if status=FAILED |

---

## 5. MarketingAssetPack

### 5.1 Schema Definition

**Artifact Name:** `MarketingAssetPack`

**Event:** `LISTING_PUBLISHED`, `MARKETING_CAMPAIGN_TRIGGERED`

**Purpose:** Marketing content assets generated from listing data (SEO, social media, messaging).

**Strict JSON Schema:**
```json
{
  "assetPackId": "string (UUID v4, required)",
  "listingId": "string (UUID v4, required)",
  "eventId": "string (UUID v4, required)",
  "generatedAt": "ISO 8601 datetime (UTC, required)",
  "processingDurationMs": "integer (min: 0, required)",
  "status": "SUCCESS | ERROR (required)",
  "seoAssets": {
    "title": {
      "value": "string (min: 20, max: 70, required)",
      "characterCount": "integer (min: 20, max: 70, required)",
      "includesKeywords": ["string"] | [],
      "sourceFields": ["string"] | [],
      "validation": {
        "passes": "boolean (required)",
        "issues": [
          {
            "type": "TOO_SHORT | TOO_LONG | MISSING_KEYWORDS | INVALID_CHARACTERS (required)",
            "message": "string (Turkish, required)"
          }
        ] | []
      }
    },
    "metaDescription": {
      "value": "string (min: 120, max: 160, required)",
      "characterCount": "integer (min: 120, max: 160, required)",
      "includesKeywords": ["string"] | [],
      "includesCallToAction": "boolean (required)",
      "sourceFields": ["string"] | [],
      "validation": {
        "passes": "boolean (required)",
        "issues": [
          {
            "type": "TOO_SHORT | TOO_LONG | MISSING_KEYWORDS | MISSING_CTA (required)",
            "message": "string (Turkish, required)"
          }
        ] | []
      }
    },
    "keywords": {
      "primary": ["string"] | [],
      "secondary": ["string"] | [],
      "longTail": ["string"] | [],
      "sourceFields": ["string"] | []
    },
    "structuredData": {
      "schemaType": "PRODUCT | REAL_ESTATE_LISTING (required)",
      "jsonLd": "object (required)",
      "sourceFields": ["string"] | []
    }
  },
  "socialAssets": {
    "shortCopy": {
      "value": "string (min: 50, max: 280, required)",
      "characterCount": "integer (min: 50, max: 280, required)",
      "platform": "TWITTER | FACEBOOK | INSTAGRAM | LINKEDIN | GENERIC (required)",
      "hashtags": ["string"] | [],
      "includesImage": "boolean (required)",
      "includesLink": "boolean (required)",
      "sourceFields": ["string"] | [],
      "validation": {
        "passes": "boolean (required)",
        "issues": [
          {
            "type": "TOO_SHORT | TOO_LONG | MISSING_HASHTAGS | MISSING_LINK (required)",
            "message": "string (Turkish, required)"
          }
        ] | []
      }
    },
    "longCopy": {
      "value": "string (min: 200, max: 2000, optional)",
      "characterCount": "integer (min: 200, max: 2000, optional)",
      "platform": "FACEBOOK | LINKEDIN | BLOG | GENERIC (required)",
      "hashtags": ["string"] | [],
      "includesImage": "boolean (required)",
      "includesLink": "boolean (required)",
      "sourceFields": ["string"] | [],
      "validation": {
        "passes": "boolean (required)",
        "issues": [
          {
            "type": "TOO_SHORT | TOO_LONG | MISSING_HASHTAGS (required)",
            "message": "string (Turkish, required)"
          }
        ] | []
      }
    } | null
  },
  "messagingAssets": {
    "whatsappScript": {
      "value": "string (min: 100, max: 1000, required)",
      "characterCount": "integer (min: 100, max: 1000, required)",
      "sections": [
        {
          "section": "GREETING | PROPERTY_DETAILS | PRICE | LOCATION | CALL_TO_ACTION (required)",
          "content": "string (required)",
          "sourceFields": ["string"] | []
        }
      ] | [],
      "includesEmoji": "boolean (required)",
      "includesContactInfo": "boolean (required)",
      "sourceFields": ["string"] | [],
      "validation": {
        "passes": "boolean (required)",
        "issues": [
          {
            "type": "TOO_SHORT | TOO_LONG | MISSING_SECTIONS | MISSING_CTA (required)",
            "message": "string (Turkish, required)"
          }
        ] | []
      }
    },
    "smsScript": {
      "value": "string (min: 50, max: 160, optional)",
      "characterCount": "integer (min: 50, max: 160, optional)",
      "includesLink": "boolean (required)",
      "sourceFields": ["string"] | [],
      "validation": {
        "passes": "boolean (required)",
        "issues": [
          {
            "type": "TOO_SHORT | TOO_LONG | MISSING_LINK (required)",
            "message": "string (Turkish, required)"
          }
        ] | []
      }
    } | null,
    "emailSubject": {
      "value": "string (min: 20, max: 60, required)",
      "characterCount": "integer (min: 20, max: 60, required)",
      "includesKeywords": ["string"] | [],
      "sourceFields": ["string"] | [],
      "validation": {
        "passes": "boolean (required)",
        "issues": [
          {
            "type": "TOO_SHORT | TOO_LONG | MISSING_KEYWORDS (required)",
            "message": "string (Turkish, required)"
          }
        ] | []
      }
    }
  },
  "sourceData": {
    "listing": "object (exact listing data used, required)",
    "fieldsUsed": ["string"] | []
  },
  "metadata": {
    "generatorVersion": "string (required)",
    "templateVersion": "string (required)",
    "language": "TR | EN (required)",
    "processingSteps": [
      {
        "step": "string (required)",
        "durationMs": "integer (min: 0, required)",
        "status": "SUCCESS | FAILED (required)"
      }
    ] | []
  },
  "error": {
    "code": "string (required)",
    "message": "string (Turkish, required)",
    "details": "string | null (optional)"
  } | null
}
```

### 5.2 Validation Rules

#### Required Fields
- `assetPackId`, `listingId`, `eventId`, `generatedAt`, `status`
- `seoAssets.title.value`, `seoAssets.title.characterCount`
- `seoAssets.metaDescription.value`, `seoAssets.metaDescription.characterCount`
- `socialAssets.shortCopy.value`, `socialAssets.shortCopy.characterCount`, `socialAssets.shortCopy.platform`
- `messagingAssets.whatsappScript.value`, `messagingAssets.whatsappScript.characterCount`
- `messagingAssets.emailSubject.value`, `messagingAssets.emailSubject.characterCount`
- `sourceData.listing`, `sourceData.fieldsUsed`

#### Conditional Fields
- If `status === "ERROR"`: `error` object MUST be present
- If `socialAssets.longCopy` is not null: `socialAssets.longCopy.value` and `socialAssets.longCopy.characterCount` MUST be present
- If `messagingAssets.smsScript` is not null: `messagingAssets.smsScript.value` and `messagingAssets.smsScript.characterCount` MUST be present

#### Type Constraints
- All character counts: Integer matching actual character count of value
- All enum fields: Must match exact values (case-sensitive)
- Empty arrays: MUST be `[]`, never `null`
- All strings: Must be valid UTF-8

#### Character Count Validation
- `seoAssets.title.characterCount` MUST equal actual character count of `seoAssets.title.value`
- `seoAssets.metaDescription.characterCount` MUST equal actual character count of `seoAssets.metaDescription.value`
- All other character counts MUST match their respective values

### 5.3 Anti-Hallucination Rules

#### Rule AH-MAP-1: Source Field Tracking
**Rule:** Every generated asset MUST include `sourceFields` array listing all source data fields used.

**Validation:**
- `sourceFields` MUST contain valid JSONPaths to `sourceData.listing`
- All fields referenced in `sourceFields` MUST exist in `sourceData.listing`
- `sourceData.fieldsUsed` MUST be union of all `sourceFields` across all assets

#### Rule AH-MAP-2: No Feature Invention
**Rule:** Generated content MUST NOT mention property features not present in source listing data.

**Validation:**
- All keywords in `seoAssets.keywords` MUST reference features in `sourceData.listing`
- All content sections MUST only reference data from `sourceFields`
- Property features mentioned MUST exist in `sourceData.listing.specifications` or `sourceData.listing.location`

#### Rule AH-MAP-3: Exact Source Data Preservation
**Rule:** `sourceData.listing` MUST contain exact listing data, no modifications.

**Validation:**
- `sourceData.listing` MUST be exact JSON representation from database
- No fields MUST be added, removed, or modified
- Values MUST exactly match source listing

#### Rule AH-MAP-4: Content Generation Evidence
**Rule:** Every content section MUST reference source fields that justify its content.

**Validation:**
- `whatsappScript.sections` MUST have `sourceFields` for each section
- `sourceFields` MUST contain fields that provide data for that section
- Content MUST be derivable from source fields listed

#### Rule AH-MAP-5: Keyword Validation
**Rule:** All keywords MUST be extractable from source listing data or be standard location/property type terms.

**Validation:**
- Primary keywords MUST appear in `sourceData.listing` (title, description, or structured fields)
- Secondary keywords MUST be related to primary keywords or be standard real estate terms
- Long-tail keywords MUST combine primary keywords with location/property type from source

### 5.4 Field Requirements Summary

| Field Path | Required | Nullable | Notes |
|------------|----------|----------|-------|
| `assetPackId` | ✅ | ❌ | UUID v4 |
| `listingId` | ✅ | ❌ | UUID v4 |
| `seoAssets.title.value` | ✅ | ❌ | 20-70 chars |
| `seoAssets.metaDescription.value` | ✅ | ❌ | 120-160 chars |
| `socialAssets.shortCopy.value` | ✅ | ❌ | 50-280 chars |
| `socialAssets.longCopy` | ❌ | ✅ | Optional |
| `messagingAssets.whatsappScript.value` | ✅ | ❌ | 100-1000 chars |
| `messagingAssets.smsScript` | ❌ | ✅ | Optional |
| `messagingAssets.emailSubject.value` | ✅ | ❌ | 20-60 chars |
| `sourceData.listing` | ✅ | ❌ | Exact source data |
| `error` | Conditional | ✅ | Required if status=ERROR |

---

## 6. Common Validation Rules

### 6.1 UUID Validation
All UUID fields MUST be valid UUID v4 format:
- Format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Where x is hexadecimal digit
- Version 4 (random)

### 6.2 Timestamp Validation
All timestamp fields MUST be ISO 8601 format in UTC:
- Format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Timezone: UTC (Z suffix)
- Precision: Milliseconds

### 6.3 String Encoding
All string fields MUST be valid UTF-8:
- No invalid byte sequences
- Properly escaped special characters
- Turkish characters supported (İ, Ş, Ğ, Ü, Ö, Ç)

### 6.4 Array Validation
- Empty arrays MUST be `[]`, never `null`
- Arrays MUST contain objects matching item schema
- Array size limits MUST be enforced

### 6.5 Enum Validation
All enum fields MUST match exact values:
- Case-sensitive
- No variations or aliases
- Must be one of defined values

---

## 7. Anti-Hallucination Validation Checklist

### 7.1 Source Field Tracking
- [ ] Every claim has `sourceField` or `sourceFields` array
- [ ] All `sourceField` values are valid JSONPaths
- [ ] All referenced fields exist in source data

### 7.2 Source Value Matching
- [ ] Every `sourceValue` exactly matches value at `sourceField`
- [ ] No values are inferred or assumed
- [ ] Null values are handled as "not_provided"

### 7.3 Evidence Requirements
- [ ] All `evidence` fields contain exact data from source
- [ ] No interpretations or summaries in evidence
- [ ] Evidence is extractable from source data

### 7.4 Feature Validation
- [ ] No property features mentioned that don't exist in source
- [ ] All tags reference actual source data
- [ ] All suggestions only reference source features

### 7.5 Content Generation
- [ ] All generated content derivable from source fields
- [ ] No invented facts or claims
- [ ] All keywords extractable from source or standard terms

---

**Document Status:** Canonical v1.0.0  
**Maintenance:** Update when schemas change or new artifacts added  
**Owner:** Platform Architecture Team
