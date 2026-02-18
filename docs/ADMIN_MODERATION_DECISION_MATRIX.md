# Admin Moderation Decision Matrix
## Antalya Real Estate Platform

**Version:** 1.0.0  
**Type:** Deterministic, Rule-Based Decision System  
**Last Updated:** 2026-02-18

---

## 1. System Overview

### 1.1 Purpose
This document defines the objective, rule-based decision matrix for admin moderation decisions. The system processes deterministic scores, AI enrichment output, and warning flags to produce one of three decisions: `APPROVE`, `REQUEST_CHANGES`, or `REJECT`.

### 1.2 Decision Outputs
- **APPROVE**: Listing meets all quality thresholds, publish to live site
- **REQUEST_CHANGES**: Listing has fixable issues, return to consultant with feedback
- **REJECT**: Listing has critical violations or unfixable issues, permanently archive

### 1.3 Principles
- **Deterministic**: Same inputs always produce same output
- **Objective**: All thresholds are numeric, no subjective evaluation
- **Explainable**: Every decision can be traced to specific rule violations
- **Prioritized**: Critical issues override other factors

---

## 2. Input Schema

### 2.1 Deterministic Scores
```json
{
  "completenessScore": "integer (0-100)",
  "descriptionQualityScore": "integer (0-100)",
  "missingFields": ["string"],
  "warnings": [
    {
      "code": "string",
      "severity": "LOW | MEDIUM | HIGH",
      "message": "string",
      "field": "string | null"
    }
  ]
}
```

### 2.2 AI Enrichment Output
```json
{
  "status": "SUCCESS | ERROR | PARTIAL",
  "contentModeration": {
    "status": "PASS | FAIL | WARNING",
    "issues": [
      {
        "type": "INAPPROPRIATE_LANGUAGE | SPAM_DETECTED | CONTACT_IN_DESCRIPTION | PRICE_MANIPULATION | SUSPICIOUS_PATTERNS | POLICY_VIOLATION",
        "severity": "LOW | MEDIUM | HIGH | CRITICAL",
        "message": "string",
        "field": "string | null",
        "confidence": "number (0.0-1.0)"
      }
    ],
    "passed": "boolean"
  },
  "factVerification": {
    "status": "CONSISTENT | INCONSISTENT | INSUFFICIENT_DATA",
    "inconsistencies": [
      {
        "type": "DESCRIPTION_DATA_MISMATCH | PRICE_SIZE_MISMATCH | LOCATION_COORDINATE_MISMATCH | FEATURE_CONTRADICTION",
        "severity": "LOW | MEDIUM | HIGH",
        "message": "string",
        "field": "string"
      }
    ],
    "consistencyScore": "number (0-100) | null"
  },
  "riskAssessment": {
    "fraudIndicators": [
      {
        "indicator": "SUSPICIOUS_PRICE | UNREALISTIC_CLAIMS | CONTACT_EVASION | LOCATION_MISMATCH | IMAGE_ISSUES",
        "severity": "LOW | MEDIUM | HIGH | CRITICAL",
        "message": "string",
        "evidence": "string"
      }
    ],
    "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL",
    "requiresManualReview": "boolean"
  }
}
```

### 2.3 Warning Flags (From Deterministic System)
```json
{
  "warnings": [
    {
      "code": "PRICE_TOO_LOW | PRICE_TOO_HIGH | SIZE_TOO_SMALL | SIZE_ROOM_MISMATCH | NO_ROOMS | TOO_MANY_ROOMS | COORDINATES_OUT_OF_BOUNDS | INVALID_DISTRICT | DESCRIPTION_TOO_SHORT | DESCRIPTION_TOO_LONG | SPAM_PATTERN_DETECTED | CONTACT_IN_DESCRIPTION | TITLE_TOO_SHORT | TITLE_TOO_LONG | TITLE_ALL_CAPS | NO_IMAGES | INSUFFICIENT_IMAGES | BALCONY_COUNT_HIGH",
      "severity": "LOW | MEDIUM | HIGH",
      "message": "string",
      "field": "string | null"
    }
  ]
}
```

---

## 3. Decision Matrix Structure

### 3.1 Decision Flow
```
1. Check Critical Blockers (REJECT if any)
2. Check High-Severity Issues (REJECT if threshold exceeded)
3. Check Completeness Thresholds (REQUEST_CHANGES if below)
4. Check Quality Thresholds (REQUEST_CHANGES if below)
5. Check Medium-Severity Issues (REQUEST_CHANGES if threshold exceeded)
6. Default: APPROVE
```

### 3.2 Decision Priority Order
1. **Critical Blockers** (Immediate REJECT)
2. **High-Severity Violations** (REJECT if count/threshold exceeded)
3. **Completeness Requirements** (REQUEST_CHANGES if below threshold)
4. **Quality Requirements** (REQUEST_CHANGES if below threshold)
5. **Medium-Severity Issues** (REQUEST_CHANGES if count exceeds threshold)
6. **Low-Severity Issues** (Informational, may APPROVE)

---

## 4. Critical Blockers (Immediate REJECT)

### 4.1 Rule Set: CRITICAL_BLOCKERS

#### Rule CR-1: Content Moderation Failure
```
IF aiEnrichment.contentModeration.status === "FAIL"
THEN DECISION = REJECT
REASON = "Content moderation failed: policy violation detected"
```

#### Rule CR-2: Critical Content Moderation Issue
```
IF EXISTS issue IN aiEnrichment.contentModeration.issues 
  WHERE issue.severity === "CRITICAL"
THEN DECISION = REJECT
REASON = "Critical content moderation issue: {issue.type}"
```

#### Rule CR-3: Critical Risk Indicator
```
IF aiEnrichment.riskAssessment.riskLevel === "CRITICAL"
THEN DECISION = REJECT
REASON = "Critical fraud risk indicator detected"
```

#### Rule CR-4: Critical Fraud Indicator
```
IF EXISTS indicator IN aiEnrichment.riskAssessment.fraudIndicators
  WHERE indicator.severity === "CRITICAL"
THEN DECISION = REJECT
REASON = "Critical fraud indicator: {indicator.indicator}"
```

#### Rule CR-5: AI Processing Error
```
IF aiEnrichment.status === "ERROR"
  AND aiEnrichment.error.code IN ["INVALID_INPUT_DATA", "PROCESSING_FAILED"]
THEN DECISION = REJECT
REASON = "AI processing failed: {aiEnrichment.error.message}"
```

#### Rule CR-6: Missing Critical Fields
```
IF deterministicScores.missingFields CONTAINS ANY OF:
  ["title", "description", "price", "squareMeters", "roomCount", 
   "district", "neighborhood", "coordinates", "imageCount"]
THEN DECISION = REJECT
REASON = "Critical required fields missing: {missingFields}"
```

#### Rule CR-7: Zero Completeness Score
```
IF deterministicScores.completenessScore === 0
THEN DECISION = REJECT
REASON = "Completeness score is zero: listing is incomplete"
```

#### Rule CR-8: Invalid Location Coordinates
```
IF EXISTS warning IN deterministicScores.warnings
  WHERE warning.code === "COORDINATES_OUT_OF_BOUNDS"
  AND warning.severity === "HIGH"
THEN DECISION = REJECT
REASON = "Coordinates outside Antalya bounds"
```

#### Rule CR-9: Invalid District
```
IF EXISTS warning IN deterministicScores.warnings
  WHERE warning.code === "INVALID_DISTRICT"
  AND warning.severity === "HIGH"
THEN DECISION = REJECT
REASON = "Invalid Antalya district"
```

#### Rule CR-10: No Images
```
IF EXISTS warning IN deterministicScores.warnings
  WHERE warning.code === "NO_IMAGES"
THEN DECISION = REJECT
REASON = "At least one image is required"
```

---

## 5. High-Severity Violations (REJECT Thresholds)

### 5.1 Rule Set: HIGH_SEVERITY_REJECT

#### Rule HR-1: High-Severity Content Issues Count
```
IF COUNT(issue IN aiEnrichment.contentModeration.issues 
  WHERE issue.severity === "HIGH") >= 3
THEN DECISION = REJECT
REASON = "Multiple high-severity content moderation issues detected"
```

#### Rule HR-2: High-Severity Fact Inconsistencies Count
```
IF COUNT(inconsistency IN aiEnrichment.factVerification.inconsistencies
  WHERE inconsistency.severity === "HIGH") >= 3
THEN DECISION = REJECT
REASON = "Multiple high-severity data inconsistencies detected"
```

#### Rule HR-3: High-Severity Risk Indicators Count
```
IF COUNT(indicator IN aiEnrichment.riskAssessment.fraudIndicators
  WHERE indicator.severity === "HIGH") >= 2
THEN DECISION = REJECT
REASON = "Multiple high-severity fraud risk indicators"
```

#### Rule HR-4: High-Severity Deterministic Warnings Count
```
IF COUNT(warning IN deterministicScores.warnings
  WHERE warning.severity === "HIGH") >= 4
THEN DECISION = REJECT
REASON = "Multiple high-severity validation warnings"
```

#### Rule HR-5: Completeness Score Below Critical Threshold
```
IF deterministicScores.completenessScore < 40
THEN DECISION = REJECT
REASON = "Completeness score below critical threshold: {completenessScore}/100"
```

#### Rule HR-6: Description Quality Score Below Critical Threshold
```
IF deterministicScores.descriptionQualityScore < 30
THEN DECISION = REJECT
REASON = "Description quality score below critical threshold: {descriptionQualityScore}/100"
```

#### Rule HR-7: Fact Verification Status Inconsistent
```
IF aiEnrichment.factVerification.status === "INCONSISTENT"
  AND aiEnrichment.factVerification.consistencyScore < 50
THEN DECISION = REJECT
REASON = "Data inconsistencies detected with consistency score below threshold"
```

#### Rule HR-8: High Risk Level with Multiple Indicators
```
IF aiEnrichment.riskAssessment.riskLevel === "HIGH"
  AND COUNT(aiEnrichment.riskAssessment.fraudIndicators) >= 3
THEN DECISION = REJECT
REASON = "High risk level with multiple fraud indicators"
```

---

## 6. Completeness Requirements (REQUEST_CHANGES Thresholds)

### 6.1 Rule Set: COMPLETENESS_REQUEST_CHANGES

#### Rule CRQ-1: Completeness Score Below Minimum
```
IF deterministicScores.completenessScore >= 40 
  AND deterministicScores.completenessScore < 70
THEN DECISION = REQUEST_CHANGES
REASON = "Completeness score below minimum threshold: {completenessScore}/100 (minimum: 70)"
```

#### Rule CRQ-2: Missing Recommended Fields
```
IF COUNT(deterministicScores.missingFields) > 0
  AND deterministicScores.completenessScore < 80
THEN DECISION = REQUEST_CHANGES
REASON = "Missing recommended fields: {missingFields}"
```

#### Rule CRQ-3: Insufficient Images
```
IF EXISTS warning IN deterministicScores.warnings
  WHERE warning.code === "INSUFFICIENT_IMAGES"
  AND deterministicScores.completenessScore < 75
THEN DECISION = REQUEST_CHANGES
REASON = "Insufficient images: at least 3-5 images recommended"
```

#### Rule CRQ-4: Missing Location Details
```
IF deterministicScores.missingFields CONTAINS ANY OF:
  ["neighborhood", "address"]
  AND deterministicScores.completenessScore < 80
THEN DECISION = REQUEST_CHANGES
REASON = "Missing location details: neighborhood or address required"
```

---

## 7. Quality Requirements (REQUEST_CHANGES Thresholds)

### 7.1 Rule Set: QUALITY_REQUEST_CHANGES

#### Rule QRQ-1: Description Quality Score Below Minimum
```
IF deterministicScores.descriptionQualityScore >= 30
  AND deterministicScores.descriptionQualityScore < 60
THEN DECISION = REQUEST_CHANGES
REASON = "Description quality score below minimum threshold: {descriptionQualityScore}/100 (minimum: 60)"
```

#### Rule QRQ-2: Description Too Short
```
IF EXISTS warning IN deterministicScores.warnings
  WHERE warning.code === "DESCRIPTION_TOO_SHORT"
  AND deterministicScores.descriptionQualityScore < 70
THEN DECISION = REQUEST_CHANGES
REASON = "Description is too short: minimum 200 characters recommended"
```

#### Rule QRQ-3: Title Quality Issues
```
IF EXISTS warning IN deterministicScores.warnings
  WHERE warning.code IN ["TITLE_TOO_SHORT", "TITLE_TOO_LONG", "TITLE_ALL_CAPS"]
  AND deterministicScores.descriptionQualityScore < 70
THEN DECISION = REQUEST_CHANGES
REASON = "Title quality issues detected: {warning.message}"
```

#### Rule QRQ-4: Content Moderation Warning
```
IF aiEnrichment.contentModeration.status === "WARNING"
  AND COUNT(aiEnrichment.contentModeration.issues 
    WHERE issue.severity IN ["MEDIUM", "HIGH"]) >= 1
THEN DECISION = REQUEST_CHANGES
REASON = "Content moderation warnings detected: review required"
```

#### Rule QRQ-5: Fact Verification Warnings
```
IF aiEnrichment.factVerification.status === "INCONSISTENT"
  AND aiEnrichment.factVerification.consistencyScore >= 50
  AND aiEnrichment.factVerification.consistencyScore < 70
THEN DECISION = REQUEST_CHANGES
REASON = "Data inconsistencies detected: consistency score {consistencyScore}/100"
```

#### Rule QRQ-6: Medium-Severity Inconsistencies
```
IF COUNT(inconsistency IN aiEnrichment.factVerification.inconsistencies
  WHERE inconsistency.severity === "MEDIUM") >= 2
THEN DECISION = REQUEST_CHANGES
REASON = "Multiple medium-severity data inconsistencies detected"
```

---

## 8. Medium-Severity Issues (REQUEST_CHANGES Thresholds)

### 8.1 Rule Set: MEDIUM_SEVERITY_REQUEST_CHANGES

#### Rule MRQ-1: Medium-Severity Content Issues Count
```
IF COUNT(issue IN aiEnrichment.contentModeration.issues
  WHERE issue.severity === "MEDIUM") >= 3
THEN DECISION = REQUEST_CHANGES
REASON = "Multiple medium-severity content moderation issues"
```

#### Rule MRQ-2: Medium-Severity Deterministic Warnings Count
```
IF COUNT(warning IN deterministicScores.warnings
  WHERE warning.severity === "MEDIUM") >= 5
THEN DECISION = REQUEST_CHANGES
REASON = "Multiple medium-severity validation warnings"
```

#### Rule MRQ-3: Medium Risk Level
```
IF aiEnrichment.riskAssessment.riskLevel === "MEDIUM"
  AND COUNT(aiEnrichment.riskAssessment.fraudIndicators) >= 2
THEN DECISION = REQUEST_CHANGES
REASON = "Medium risk level with multiple indicators: manual review recommended"
```

#### Rule MRQ-4: Price Validation Warnings
```
IF EXISTS warning IN deterministicScores.warnings
  WHERE warning.code IN ["PRICE_TOO_LOW", "PRICE_TOO_HIGH"]
  AND warning.severity === "MEDIUM"
THEN DECISION = REQUEST_CHANGES
REASON = "Price validation warning: {warning.message}"
```

#### Rule MRQ-5: Size Validation Warnings
```
IF EXISTS warning IN deterministicScores.warnings
  WHERE warning.code IN ["SIZE_TOO_SMALL", "SIZE_ROOM_MISMATCH"]
  AND warning.severity === "MEDIUM"
  AND deterministicScores.completenessScore < 75
THEN DECISION = REQUEST_CHANGES
REASON = "Size validation warning: {warning.message}"
```

---

## 9. Approval Conditions (APPROVE Thresholds)

### 9.1 Rule Set: APPROVE

#### Rule AP-1: All Thresholds Met
```
IF ALL OF THE FOLLOWING ARE TRUE:
  - No critical blockers (CR-1 through CR-10 all false)
  - No high-severity rejections (HR-1 through HR-8 all false)
  - deterministicScores.completenessScore >= 70
  - deterministicScores.descriptionQualityScore >= 60
  - COUNT(deterministicScores.warnings WHERE severity === "HIGH") < 4
  - aiEnrichment.contentModeration.status === "PASS"
  - aiEnrichment.factVerification.status IN ["CONSISTENT", "INSUFFICIENT_DATA"]
  - aiEnrichment.riskAssessment.riskLevel IN ["LOW", "MEDIUM"]
  - COUNT(aiEnrichment.contentModeration.issues WHERE severity IN ["HIGH", "CRITICAL"]) === 0
THEN DECISION = APPROVE
REASON = "Listing meets all quality thresholds"
```

#### Rule AP-2: High Quality with Minor Issues
```
IF ALL OF THE FOLLOWING ARE TRUE:
  - No critical blockers
  - No high-severity rejections
  - deterministicScores.completenessScore >= 80
  - deterministicScores.descriptionQualityScore >= 70
  - COUNT(deterministicScores.warnings WHERE severity === "HIGH") === 0
  - COUNT(deterministicScores.warnings WHERE severity === "MEDIUM") < 5
  - aiEnrichment.contentModeration.status IN ["PASS", "WARNING"]
  - COUNT(aiEnrichment.contentModeration.issues WHERE severity IN ["HIGH", "CRITICAL"]) === 0
  - aiEnrichment.riskAssessment.riskLevel IN ["LOW", "MEDIUM"]
THEN DECISION = APPROVE
REASON = "High quality listing with minor issues acceptable"
```

---

## 10. Edge Cases

### 10.1 Edge Case: AI Enrichment Unavailable

#### Rule EC-1: AI Status ERROR or PARTIAL
```
IF aiEnrichment.status === "ERROR" 
  AND aiEnrichment.error.code NOT IN ["INVALID_INPUT_DATA", "PROCESSING_FAILED"]
THEN:
  - Skip AI-based rules (HR-1, HR-2, HR-3, HR-7, HR-8, QRQ-4, QRQ-5, QRQ-6, MRQ-1, MRQ-3)
  - Use only deterministic scores and warnings
  - Apply remaining rules normally
REASON = "AI enrichment unavailable, using deterministic scores only"
```

#### Rule EC-2: AI Status PARTIAL
```
IF aiEnrichment.status === "PARTIAL"
THEN:
  - Use available AI analysis sections
  - For missing sections, assume neutral values:
    - contentModeration.status = "PASS" (if not available)
    - factVerification.status = "INSUFFICIENT_DATA" (if not available)
    - riskAssessment.riskLevel = "LOW" (if not available)
  - Apply all rules with available data
REASON = "AI enrichment partially available, using available data"
```

### 10.2 Edge Case: Conflicting Indicators

#### Rule EC-3: High Completeness, Low Quality
```
IF deterministicScores.completenessScore >= 80
  AND deterministicScores.descriptionQualityScore < 50
THEN DECISION = REQUEST_CHANGES
REASON = "High completeness but low description quality: improve description content"
PRIORITY = Quality requirements take precedence over completeness when quality is critically low
```

#### Rule EC-4: High Quality, Low Completeness
```
IF deterministicScores.completenessScore < 60
  AND deterministicScores.descriptionQualityScore >= 70
THEN DECISION = REQUEST_CHANGES
REASON = "High description quality but low completeness: add missing required fields"
PRIORITY = Completeness requirements take precedence when completeness is critically low
```

### 10.3 Edge Case: Borderline Scores

#### Rule EC-5: Scores at Exact Thresholds
```
IF deterministicScores.completenessScore === 70
  AND deterministicScores.descriptionQualityScore === 60
  AND No warnings with severity HIGH
  AND aiEnrichment.contentModeration.status === "PASS"
THEN DECISION = APPROVE
REASON = "Scores meet minimum thresholds exactly"
```

#### Rule EC-6: Scores Just Below Thresholds
```
IF deterministicScores.completenessScore === 69
  OR deterministicScores.descriptionQualityScore === 59
THEN DECISION = REQUEST_CHANGES
REASON = "Score(s) just below minimum threshold: {completenessScore}/100 completeness, {descriptionQualityScore}/100 quality"
```

### 10.4 Edge Case: Multiple Warning Types

#### Rule EC-7: Mixed Severity Warnings
```
IF COUNT(deterministicScores.warnings WHERE severity === "HIGH") >= 2
  AND COUNT(deterministicScores.warnings WHERE severity === "MEDIUM") >= 3
THEN DECISION = REQUEST_CHANGES
REASON = "Multiple warnings across severity levels: review all issues"
PRIORITY = High-severity warnings are evaluated first, then medium-severity count
```

### 10.5 Edge Case: AI Confidence Low

#### Rule EC-8: Low Confidence AI Issues
```
IF EXISTS issue IN aiEnrichment.contentModeration.issues
  WHERE issue.severity === "HIGH"
  AND issue.confidence < 0.7
THEN:
  - Do not apply HR-1 (high-severity content issues count)
  - Flag for manual review instead
  - If other reject conditions met, still REJECT
REASON = "High-severity issue with low confidence: requires manual review"
```

---

## 11. Decision Algorithm Implementation

### 11.1 Algorithm Pseudocode

```javascript
function makeModerationDecision(deterministicScores, aiEnrichment) {
  let decision = null
  let reason = null
  let appliedRules = []
  
  // Phase 1: Check Critical Blockers (REJECT)
  if (checkCriticalBlockers(deterministicScores, aiEnrichment)) {
    const blocker = findCriticalBlocker(deterministicScores, aiEnrichment)
    return {
      decision: "REJECT",
      reason: blocker.reason,
      appliedRules: blocker.rules,
      priority: "CRITICAL"
    }
  }
  
  // Phase 2: Check High-Severity Rejections
  if (checkHighSeverityRejections(deterministicScores, aiEnrichment)) {
    const rejection = findHighSeverityRejection(deterministicScores, aiEnrichment)
    return {
      decision: "REJECT",
      reason: rejection.reason,
      appliedRules: rejection.rules,
      priority: "HIGH"
    }
  }
  
  // Phase 3: Check Completeness Requirements
  if (checkCompletenessRequirements(deterministicScores)) {
    const requirement = findCompletenessRequirement(deterministicScores)
    return {
      decision: "REQUEST_CHANGES",
      reason: requirement.reason,
      appliedRules: requirement.rules,
      priority: "COMPLETENESS"
    }
  }
  
  // Phase 4: Check Quality Requirements
  if (checkQualityRequirements(deterministicScores, aiEnrichment)) {
    const requirement = findQualityRequirement(deterministicScores, aiEnrichment)
    return {
      decision: "REQUEST_CHANGES",
      reason: requirement.reason,
      appliedRules: requirement.rules,
      priority: "QUALITY"
    }
  }
  
  // Phase 5: Check Medium-Severity Issues
  if (checkMediumSeverityIssues(deterministicScores, aiEnrichment)) {
    const issue = findMediumSeverityIssue(deterministicScores, aiEnrichment)
    return {
      decision: "REQUEST_CHANGES",
      reason: issue.reason,
      appliedRules: issue.rules,
      priority: "MEDIUM"
    }
  }
  
  // Phase 6: Default to APPROVE
  return {
    decision: "APPROVE",
    reason: "Listing meets all quality thresholds",
    appliedRules: ["AP-1"],
    priority: "APPROVAL"
  }
}

function checkCriticalBlockers(deterministicScores, aiEnrichment) {
  // CR-1: Content moderation failure
  if (aiEnrichment?.contentModeration?.status === "FAIL") return true
  
  // CR-2: Critical content moderation issue
  if (aiEnrichment?.contentModeration?.issues?.some(i => i.severity === "CRITICAL")) return true
  
  // CR-3: Critical risk level
  if (aiEnrichment?.riskAssessment?.riskLevel === "CRITICAL") return true
  
  // CR-4: Critical fraud indicator
  if (aiEnrichment?.riskAssessment?.fraudIndicators?.some(i => i.severity === "CRITICAL")) return true
  
  // CR-5: AI processing error (specific codes)
  if (aiEnrichment?.status === "ERROR" && 
      ["INVALID_INPUT_DATA", "PROCESSING_FAILED"].includes(aiEnrichment?.error?.code)) {
    return true
  }
  
  // CR-6: Missing critical fields
  const criticalFields = ["title", "description", "price", "squareMeters", "roomCount", 
                          "district", "neighborhood", "coordinates", "imageCount"]
  if (deterministicScores.missingFields?.some(f => criticalFields.includes(f))) return true
  
  // CR-7: Zero completeness score
  if (deterministicScores.completenessScore === 0) return true
  
  // CR-8: Invalid coordinates
  if (deterministicScores.warnings?.some(w => 
      w.code === "COORDINATES_OUT_OF_BOUNDS" && w.severity === "HIGH")) return true
  
  // CR-9: Invalid district
  if (deterministicScores.warnings?.some(w => 
      w.code === "INVALID_DISTRICT" && w.severity === "HIGH")) return true
  
  // CR-10: No images
  if (deterministicScores.warnings?.some(w => w.code === "NO_IMAGES")) return true
  
  return false
}

function checkHighSeverityRejections(deterministicScores, aiEnrichment) {
  // HR-1: High-severity content issues count >= 3
  const highContentIssues = aiEnrichment?.contentModeration?.issues?.filter(
    i => i.severity === "HIGH"
  ) || []
  if (highContentIssues.length >= 3) return true
  
  // HR-2: High-severity inconsistencies >= 3
  const highInconsistencies = aiEnrichment?.factVerification?.inconsistencies?.filter(
    i => i.severity === "HIGH"
  ) || []
  if (highInconsistencies.length >= 3) return true
  
  // HR-3: High-severity risk indicators >= 2
  const highRiskIndicators = aiEnrichment?.riskAssessment?.fraudIndicators?.filter(
    i => i.severity === "HIGH"
  ) || []
  if (highRiskIndicators.length >= 2) return true
  
  // HR-4: High-severity warnings >= 4
  const highWarnings = deterministicScores.warnings?.filter(w => w.severity === "HIGH") || []
  if (highWarnings.length >= 4) return true
  
  // HR-5: Completeness < 40
  if (deterministicScores.completenessScore < 40) return true
  
  // HR-6: Description quality < 30
  if (deterministicScores.descriptionQualityScore < 30) return true
  
  // HR-7: Fact verification inconsistent with low score
  if (aiEnrichment?.factVerification?.status === "INCONSISTENT" &&
      (aiEnrichment?.factVerification?.consistencyScore ?? 100) < 50) {
    return true
  }
  
  // HR-8: High risk with multiple indicators
  if (aiEnrichment?.riskAssessment?.riskLevel === "HIGH" &&
      (aiEnrichment?.riskAssessment?.fraudIndicators?.length ?? 0) >= 3) {
    return true
  }
  
  return false
}

function checkCompletenessRequirements(deterministicScores) {
  // CRQ-1: Completeness 40-69
  if (deterministicScores.completenessScore >= 40 && 
      deterministicScores.completenessScore < 70) {
    return true
  }
  
  // CRQ-2: Missing fields with completeness < 80
  if (deterministicScores.missingFields?.length > 0 &&
      deterministicScores.completenessScore < 80) {
    return true
  }
  
  // CRQ-3: Insufficient images with completeness < 75
  if (deterministicScores.warnings?.some(w => w.code === "INSUFFICIENT_IMAGES") &&
      deterministicScores.completenessScore < 75) {
    return true
  }
  
  // CRQ-4: Missing location details
  if (deterministicScores.missingFields?.some(f => ["neighborhood", "address"].includes(f)) &&
      deterministicScores.completenessScore < 80) {
    return true
  }
  
  return false
}

function checkQualityRequirements(deterministicScores, aiEnrichment) {
  // QRQ-1: Description quality 30-59
  if (deterministicScores.descriptionQualityScore >= 30 &&
      deterministicScores.descriptionQualityScore < 60) {
    return true
  }
  
  // QRQ-2: Description too short
  if (deterministicScores.warnings?.some(w => w.code === "DESCRIPTION_TOO_SHORT") &&
      deterministicScores.descriptionQualityScore < 70) {
    return true
  }
  
  // QRQ-3: Title quality issues
  if (deterministicScores.warnings?.some(w => 
      ["TITLE_TOO_SHORT", "TITLE_TOO_LONG", "TITLE_ALL_CAPS"].includes(w.code)) &&
      deterministicScores.descriptionQualityScore < 70) {
    return true
  }
  
  // QRQ-4: Content moderation warning
  if (aiEnrichment?.contentModeration?.status === "WARNING" &&
      aiEnrichment?.contentModeration?.issues?.some(i => 
        ["MEDIUM", "HIGH"].includes(i.severity))) {
    return true
  }
  
  // QRQ-5: Fact verification inconsistent 50-69
  if (aiEnrichment?.factVerification?.status === "INCONSISTENT" &&
      (aiEnrichment?.factVerification?.consistencyScore ?? 100) >= 50 &&
      (aiEnrichment?.factVerification?.consistencyScore ?? 100) < 70) {
    return true
  }
  
  // QRQ-6: Medium-severity inconsistencies >= 2
  const mediumInconsistencies = aiEnrichment?.factVerification?.inconsistencies?.filter(
    i => i.severity === "MEDIUM"
  ) || []
  if (mediumInconsistencies.length >= 2) return true
  
  return false
}

function checkMediumSeverityIssues(deterministicScores, aiEnrichment) {
  // MRQ-1: Medium-severity content issues >= 3
  const mediumContentIssues = aiEnrichment?.contentModeration?.issues?.filter(
    i => i.severity === "MEDIUM"
  ) || []
  if (mediumContentIssues.length >= 3) return true
  
  // MRQ-2: Medium-severity warnings >= 5
  const mediumWarnings = deterministicScores.warnings?.filter(w => w.severity === "MEDIUM") || []
  if (mediumWarnings.length >= 5) return true
  
  // MRQ-3: Medium risk with indicators >= 2
  if (aiEnrichment?.riskAssessment?.riskLevel === "MEDIUM" &&
      (aiEnrichment?.riskAssessment?.fraudIndicators?.length ?? 0) >= 2) {
    return true
  }
  
  // MRQ-4: Price validation warnings
  if (deterministicScores.warnings?.some(w => 
      ["PRICE_TOO_LOW", "PRICE_TOO_HIGH"].includes(w.code) &&
      w.severity === "MEDIUM")) {
    return true
  }
  
  // MRQ-5: Size validation warnings
  if (deterministicScores.warnings?.some(w => 
      ["SIZE_TOO_SMALL", "SIZE_ROOM_MISMATCH"].includes(w.code) &&
      w.severity === "MEDIUM" &&
      deterministicScores.completenessScore < 75)) {
    return true
  }
  
  return false
}
```

### 11.2 Output Schema

```json
{
  "decision": "APPROVE | REQUEST_CHANGES | REJECT",
  "reason": "string",
  "appliedRules": ["string"],
  "priority": "CRITICAL | HIGH | COMPLETENESS | QUALITY | MEDIUM | APPROVAL",
  "thresholds": {
    "completenessScore": {
      "value": "integer",
      "threshold": "integer",
      "met": "boolean"
    },
    "descriptionQualityScore": {
      "value": "integer",
      "threshold": "integer",
      "met": "boolean"
    }
  },
  "violations": [
    {
      "type": "CRITICAL_BLOCKER | HIGH_SEVERITY | COMPLETENESS | QUALITY | MEDIUM_SEVERITY",
      "rule": "string",
      "description": "string"
    }
  ],
  "recommendations": ["string"]
}
```

---

## 12. Testing Scenarios

### 12.1 Test Case 1: Perfect Listing
**Input:**
- Completeness: 95
- Description Quality: 90
- Warnings: []
- AI: PASS, CONSISTENT, LOW risk

**Expected:** APPROVE  
**Applied Rules:** AP-1

### 12.2 Test Case 2: Critical Blocker
**Input:**
- Completeness: 80
- Description Quality: 75
- Warnings: [{code: "NO_IMAGES", severity: "HIGH"}]
- AI: PASS, CONSISTENT, LOW risk

**Expected:** REJECT  
**Applied Rules:** CR-10

### 12.3 Test Case 3: High-Severity Rejection
**Input:**
- Completeness: 35
- Description Quality: 70
- Warnings: []
- AI: PASS, CONSISTENT, LOW risk

**Expected:** REJECT  
**Applied Rules:** HR-5

### 12.4 Test Case 4: Request Changes - Completeness
**Input:**
- Completeness: 65
- Description Quality: 70
- Warnings: []
- AI: PASS, CONSISTENT, LOW risk

**Expected:** REQUEST_CHANGES  
**Applied Rules:** CRQ-1

### 12.5 Test Case 5: Request Changes - Quality
**Input:**
- Completeness: 75
- Description Quality: 55
- Warnings: []
- AI: PASS, CONSISTENT, LOW risk

**Expected:** REQUEST_CHANGES  
**Applied Rules:** QRQ-1

### 12.6 Test Case 6: Edge Case - Borderline Scores
**Input:**
- Completeness: 70
- Description Quality: 60
- Warnings: []
- AI: PASS, CONSISTENT, LOW risk

**Expected:** APPROVE  
**Applied Rules:** EC-5, AP-1

### 12.7 Test Case 7: Edge Case - AI Unavailable
**Input:**
- Completeness: 75
- Description Quality: 70
- Warnings: []
- AI: {status: "ERROR", error: {code: "NETWORK_ERROR"}}

**Expected:** APPROVE (using deterministic scores only)  
**Applied Rules:** EC-1, AP-1

### 12.8 Test Case 8: Multiple Medium Issues
**Input:**
- Completeness: 75
- Description Quality: 70
- Warnings: 6 medium-severity warnings
- AI: PASS, CONSISTENT, LOW risk

**Expected:** REQUEST_CHANGES  
**Applied Rules:** MRQ-2

---

## 13. Decision Matrix Summary Table

| Completeness | Quality | High Warnings | AI Status | Risk Level | Decision |
|-------------|---------|---------------|-----------|------------|----------|
| 0-39 | Any | Any | Any | Any | REJECT |
| 40-69 | 0-29 | Any | Any | Any | REJECT |
| 40-69 | 30-59 | <4 | PASS | LOW/MED | REQUEST_CHANGES |
| 40-69 | 60+ | <4 | PASS | LOW/MED | REQUEST_CHANGES |
| 70+ | 0-29 | Any | Any | Any | REJECT |
| 70+ | 30-59 | <4 | PASS | LOW/MED | REQUEST_CHANGES |
| 70+ | 60+ | 0 | PASS | LOW | APPROVE |
| 70+ | 60+ | 0-3 | PASS | MEDIUM | APPROVE |
| 80+ | 70+ | 0 | PASS/WARN | LOW/MED | APPROVE |
| Any | Any | 4+ | Any | Any | REJECT |
| Any | Any | Any | FAIL | Any | REJECT |
| Any | Any | Any | Any | CRITICAL | REJECT |

**Note:** This table is a simplified overview. Full decision logic requires evaluation of all rules in priority order.

---

**Document Status:** Complete v1.0.0  
**Implementation Ready:** Yes  
**Testing Required:** All test cases, edge case validation
