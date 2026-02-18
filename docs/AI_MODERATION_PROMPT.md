# AI Moderation Prompt Specification
## Human-in-the-Loop Real Estate Moderation System

**Version:** 1.0.0  
**Platform:** Antalya Real Estate Platform  
**Last Updated:** 2026-02-18

---

## 1. System Overview

### 1.1 Purpose
This prompt system enables AI-assisted moderation of real estate listings with strict constraints to prevent hallucination and ensure factual accuracy. The AI analyzes listings that have already been scored by deterministic rule-based systems and provides additional insights for human administrators.

### 1.2 Workflow
```
Listing Submitted → Deterministic Scoring → AI Analysis → Human Review → Decision
```

### 1.3 Core Principles
- **Fact-Based Only**: AI can only analyze what is explicitly provided
- **No Invention**: Never add, assume, or infer property features
- **Strict JSON**: Output must be valid JSON, no markdown, no explanations
- **Human-in-the-Loop**: AI provides suggestions, human makes final decisions
- **Traceability**: Every AI insight must reference source data

---

## 2. Prompt Structure

### 2.1 System Prompt (Fixed, Never Changes)

```
You are a specialized real estate moderation assistant for Antalya, Turkey. Your role is to analyze property listings and provide structured, factual insights to human administrators.

CRITICAL RULES - YOU MUST FOLLOW THESE STRICTLY:

1. OUTPUT FORMAT
   - You MUST respond with ONLY valid JSON
   - NO markdown formatting (no ```json, no code blocks)
   - NO explanatory text before or after JSON
   - NO comments in JSON
   - JSON must be parseable by standard JSON parsers
   - If you cannot complete analysis, return JSON with error field

2. ANTI-HALLUCINATION RULES
   - NEVER invent, assume, or infer property features not explicitly stated
   - NEVER add amenities, features, or specifications not in the input data
   - NEVER assume property condition, age, or quality unless explicitly stated
   - NEVER infer location details beyond what is provided
   - If information is missing, mark it as "not_provided" or null, DO NOT guess

3. FACT-BASED ANALYSIS ONLY
   - Base ALL analysis solely on the provided listing data
   - Reference specific fields when making observations
   - Use deterministic scores provided - do not recalculate them
   - Flag inconsistencies between description and structured data
   - Identify contradictions within the provided data

4. SEO ENHANCEMENT LOGIC
   - Suggest improvements to existing content, DO NOT rewrite entire fields
   - Provide specific, actionable recommendations
   - Explain WHY each suggestion improves SEO
   - Never suggest adding false or unverified information
   - Focus on keyword optimization, clarity, and user intent

5. CONTENT MODERATION
   - Identify inappropriate language, spam patterns, or policy violations
   - Flag contact information in descriptions (should be in separate fields)
   - Detect suspicious pricing patterns or unrealistic claims
   - Identify potential fraud indicators (without making accusations)

6. QUALITY ASSESSMENT
   - Evaluate description clarity and completeness
   - Assess title effectiveness for search and user engagement
   - Identify missing critical information
   - Compare description against structured data for consistency

7. LANGUAGE REQUIREMENTS
   - All output messages must be in Turkish
   - Property analysis must use Turkish real estate terminology
   - Maintain professional, objective tone
   - Use formal Turkish (resmi Türkçe)

8. ERROR HANDLING
   - If input data is invalid or incomplete, set status to "ERROR"
   - Provide specific error message in Turkish
   - Never attempt to proceed with invalid data
   - Return partial results only if some analysis is possible

Remember: You are an assistant to human moderators. Your output will be reviewed by administrators who make final decisions. Be precise, factual, and helpful.
```

### 2.2 User Prompt Template (Dynamic)

```
Analyze the following real estate listing for moderation purposes.

LISTING DATA:
{
  "listingId": "{listingId}",
  "title": "{title}",
  "description": "{description}",
  "price": {
    "amount": {priceAmount},
    "currency": "{currency}",
    "isNegotiable": {isNegotiable}
  },
  "category": "{category}",
  "propertyType": "{propertyType}",
  "specifications": {
    "squareMeters": {squareMeters},
    "roomCount": {roomCount},
    "bathroomCount": {bathroomCount},
    "floorNumber": {floorNumber},
    "totalFloors": {totalFloors},
    "buildYear": {buildYear},
    "furnished": {furnished},
    "balcony": {balcony},
    "parking": {parking},
    "elevator": {elevator},
    "pool": {pool},
    "seaView": {seaView}
  },
  "location": {
    "city": "{city}",
    "district": "{district}",
    "neighborhood": "{neighborhood}",
    "address": "{address}",
    "coordinates": {
      "latitude": {latitude},
      "longitude": {longitude}
    }
  },
  "media": {
    "imageCount": {imageCount},
    "hasPrimaryImage": {hasPrimaryImage}
  },
  "contact": {
    "phone": "{phone}",
    "email": "{email}",
    "whatsapp": "{whatsapp}"
  }
}

DETERMINISTIC SCORES (already calculated, do not recalculate):
{
  "completenessScore": {completenessScore},
  "descriptionQualityScore": {descriptionQualityScore},
  "missingFields": {missingFields},
  "warnings": {warnings},
  "tags": {tags},
  "seoTitle": {seoTitle}
}

ANALYSIS REQUIREMENTS:
1. Content Moderation: Check for inappropriate content, spam, policy violations
2. Fact Verification: Verify consistency between description and structured data
3. Quality Assessment: Evaluate description clarity, title effectiveness
4. SEO Enhancement: Provide specific, actionable SEO improvement suggestions
5. Risk Assessment: Identify potential fraud indicators or suspicious patterns
6. Missing Information: Identify critical information gaps beyond deterministic scores

IMPORTANT REMINDERS:
- Return ONLY valid JSON, no markdown or explanations
- Never invent property features not explicitly stated
- Base all analysis on provided data only
- Reference specific fields when making observations
- All messages must be in Turkish
- If data is invalid, return error status immediately

Begin analysis now.
```

### 2.3 Prompt Variable Substitution

#### Required Variables
- `{listingId}`: UUID v4
- `{title}`: String (escaped for JSON)
- `{description}`: String (escaped for JSON)
- `{priceAmount}`: Number
- `{currency}`: "TRY" | "USD" | "EUR"
- `{isNegotiable}`: Boolean
- `{category}`: "RENT" | "SALE"
- `{propertyType}`: Property type enum
- `{squareMeters}`: Number | null
- `{roomCount}`: Integer | null
- `{bathroomCount}`: Integer | null
- `{floorNumber}`: Integer | null
- `{totalFloors}`: Integer | null
- `{buildYear}`: Integer | null
- `{furnished}`: Boolean | null
- `{balcony}`: Boolean | null
- `{parking}`: Boolean | null
- `{elevator}`: Boolean | null
- `{pool}`: Boolean | null
- `{seaView}`: Boolean | null
- `{city}`: String (should be "Antalya")
- `{district}`: String
- `{neighborhood}`: String
- `{address}`: String | null
- `{latitude}`: Number
- `{longitude}`: Number
- `{imageCount}`: Integer
- `{hasPrimaryImage}`: Boolean
- `{phone}`: String | null
- `{email}`: String | null
- `{whatsapp}`: String | null
- `{completenessScore}`: Integer (0-100)
- `{descriptionQualityScore}`: Integer (0-100)
- `{missingFields}`: JSON array string
- `{warnings}`: JSON array string
- `{tags}`: JSON array string
- `{seoTitle}`: String

#### JSON Escaping Rules
- Escape all double quotes: `"` → `\"`
- Escape all backslashes: `\` → `\\`
- Escape newlines: `\n` → `\\n`
- Escape carriage returns: `\r` → `\\r`
- Escape tabs: `\t` → `\\t`

---

## 3. Output JSON Schema

### 3.1 Complete Schema

```json
{
  "status": "SUCCESS | ERROR | PARTIAL",
  "listingId": "string (UUID v4)",
  "analyzedAt": "ISO 8601 datetime (UTC)",
  "contentModeration": {
    "status": "PASS | FAIL | WARNING",
    "issues": [
      {
        "type": "INAPPROPRIATE_LANGUAGE | SPAM_DETECTED | CONTACT_IN_DESCRIPTION | PRICE_MANIPULATION | SUSPICIOUS_PATTERNS | POLICY_VIOLATION",
        "severity": "LOW | MEDIUM | HIGH | CRITICAL",
        "message": "string (Turkish)",
        "field": "title | description | price | location | null",
        "evidence": "string (exact text or data that triggered the issue)",
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
        "message": "string (Turkish)",
        "descriptionClaim": "string | null (what description says)",
        "structuredDataValue": "string | null (what structured data says)",
        "field": "string",
        "recommendation": "string (Turkish)"
      }
    ],
    "consistencyScore": "number (0-100)"
  },
  "qualityAssessment": {
    "descriptionAnalysis": {
      "clarityScore": "number (0-100)",
      "completenessScore": "number (0-100)",
      "engagementScore": "number (0-100)",
      "strengths": ["string (Turkish)"],
      "weaknesses": ["string (Turkish)"],
      "specificIssues": [
        {
          "issue": "string (Turkish)",
          "location": "string (character range or field name)",
          "severity": "LOW | MEDIUM | HIGH",
          "suggestion": "string (Turkish)"
        }
      ]
    },
    "titleAnalysis": {
      "effectivenessScore": "number (0-100)",
      "searchOptimizationScore": "number (0-100)",
      "strengths": ["string (Turkish)"],
      "weaknesses": ["string (Turkish)"],
      "specificIssues": [
        {
          "issue": "string (Turkish)",
          "severity": "LOW | MEDIUM | HIGH",
          "suggestion": "string (Turkish)"
        }
      ]
    }
  },
  "seoEnhancement": {
    "titleSuggestions": [
      {
        "suggestedTitle": "string",
        "reason": "string (Turkish, explains SEO benefit)",
        "improvements": ["string (Turkish, specific improvements)"],
        "expectedImpact": "LOW | MEDIUM | HIGH"
      }
    ],
    "descriptionSuggestions": [
      {
        "section": "string (which part of description)",
        "currentText": "string (exact current text)",
        "suggestedText": "string (improved version)",
        "reason": "string (Turkish, explains SEO benefit)",
        "keywordAdditions": ["string (keywords to add)"],
        "keywordRemovals": ["string (keywords to remove)"],
        "expectedImpact": "LOW | MEDIUM | HIGH"
      }
    ],
    "keywordRecommendations": {
      "missingKeywords": [
        {
          "keyword": "string",
          "category": "LOCATION | PROPERTY_TYPE | FEATURE | AMENITY | QUALITY",
          "reason": "string (Turkish)",
          "priority": "LOW | MEDIUM | HIGH",
          "suggestedPlacement": "title | description_start | description_middle | description_end"
        }
      ],
      "overusedKeywords": [
        {
          "keyword": "string",
          "count": "integer",
          "reason": "string (Turkish)",
          "recommendation": "string (Turkish)"
        }
      ]
    },
    "metaDescriptionSuggestion": {
      "suggestedMetaDescription": "string (150-160 characters)",
      "reason": "string (Turkish)",
      "includesKeywords": ["string"],
      "callToAction": "string | null"
    }
  },
  "riskAssessment": {
    "fraudIndicators": [
      {
        "indicator": "SUSPICIOUS_PRICE | UNREALISTIC_CLAIMS | CONTACT_EVASION | LOCATION_MISMATCH | IMAGE_ISSUES",
        "severity": "LOW | MEDIUM | HIGH | CRITICAL",
        "message": "string (Turkish)",
        "evidence": "string",
        "recommendation": "string (Turkish)"
      }
    ],
    "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL",
    "requiresManualReview": "boolean"
  },
  "missingInformation": {
    "criticalGaps": [
      {
        "field": "string",
        "impact": "HIGH | MEDIUM | LOW",
        "message": "string (Turkish)",
        "suggestion": "string (Turkish)"
      }
    ],
    "recommendedAdditions": [
      {
        "field": "string",
        "reason": "string (Turkish)",
        "priority": "HIGH | MEDIUM | LOW",
        "example": "string | null"
      }
    ]
  },
  "comparisonWithDeterministicScores": {
    "agreementLevel": "HIGH | MEDIUM | LOW",
    "disagreements": [
      {
        "scoreType": "completenessScore | descriptionQualityScore",
        "deterministicValue": "number",
        "aiAssessment": "number | null",
        "reason": "string (Turkish)",
        "recommendation": "string (Turkish)"
      }
    ],
    "additionalInsights": ["string (Turkish)"]
  },
  "adminRecommendations": [
    {
      "priority": "HIGH | MEDIUM | LOW",
      "category": "CONTENT | DATA | SEO | MODERATION | OTHER",
      "action": "string (Turkish, specific action to take)",
      "reason": "string (Turkish)",
      "expectedOutcome": "string (Turkish)"
    }
  ],
  "error": {
    "code": "string | null",
    "message": "string (Turkish) | null",
    "details": "string | null"
  }
}
```

### 3.2 Schema Validation Rules

#### Required Fields (Always Present)
- `status`
- `listingId`
- `analyzedAt`

#### Conditional Fields
- If `status === "ERROR"`: `error` object MUST be present
- If `status === "SUCCESS"` or `status === "PARTIAL"`: All analysis objects MUST be present (can be empty arrays/objects)

#### Type Constraints
- All scores: Integer 0-100
- All confidence values: Float 0.0-1.0
- All severity/enum fields: Must match exact values (case-sensitive)
- All timestamps: ISO 8601 format, UTC timezone
- All strings: Must be valid UTF-8, properly escaped

#### Array Constraints
- Empty arrays MUST be `[]`, not `null`
- Arrays MUST contain objects matching their item schema
- Maximum array sizes:
  - `contentModeration.issues`: 20 items
  - `factVerification.inconsistencies`: 15 items
  - `seoEnhancement.titleSuggestions`: 3 items
  - `seoEnhancement.descriptionSuggestions`: 10 items
  - `adminRecommendations`: 10 items

---

## 4. Validation Constraints

### 4.1 JSON Structure Validation

```javascript
// Pseudo-code for validation
function validateAIOutput(jsonString) {
  // 1. Parse JSON
  try {
    const data = JSON.parse(jsonString)
  } catch (e) {
    return { valid: false, error: "INVALID_JSON", message: e.message }
  }
  
  // 2. Required fields
  if (!data.status || !data.listingId || !data.analyzedAt) {
    return { valid: false, error: "MISSING_REQUIRED_FIELDS" }
  }
  
  // 3. Status validation
  const validStatuses = ["SUCCESS", "ERROR", "PARTIAL"]
  if (!validStatuses.includes(data.status)) {
    return { valid: false, error: "INVALID_STATUS" }
  }
  
  // 4. Error handling
  if (data.status === "ERROR" && !data.error) {
    return { valid: false, error: "MISSING_ERROR_OBJECT" }
  }
  
  // 5. Score ranges
  const scoreFields = [
    "factVerification.consistencyScore",
    "qualityAssessment.descriptionAnalysis.clarityScore",
    "qualityAssessment.descriptionAnalysis.completenessScore",
    "qualityAssessment.descriptionAnalysis.engagementScore",
    "qualityAssessment.titleAnalysis.effectivenessScore",
    "qualityAssessment.titleAnalysis.searchOptimizationScore"
  ]
  
  for (const field of scoreFields) {
    const value = getNestedValue(data, field)
    if (value !== null && value !== undefined) {
      if (!Number.isInteger(value) || value < 0 || value > 100) {
        return { valid: false, error: "INVALID_SCORE_RANGE", field }
      }
    }
  }
  
  // 6. Enum validation
  const enumFields = [
    { path: "contentModeration.status", values: ["PASS", "FAIL", "WARNING"] },
    { path: "factVerification.status", values: ["CONSISTENT", "INCONSISTENT", "INSUFFICIENT_DATA"] },
    { path: "riskAssessment.riskLevel", values: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] }
  ]
  
  for (const { path, values } of enumFields) {
    const value = getNestedValue(data, path)
    if (value && !values.includes(value)) {
      return { valid: false, error: "INVALID_ENUM_VALUE", field: path }
    }
  }
  
  // 7. Array size limits
  if (data.contentModeration?.issues?.length > 20) {
    return { valid: false, error: "ARRAY_SIZE_EXCEEDED", field: "contentModeration.issues" }
  }
  
  // 8. String encoding
  if (!isValidUTF8(JSON.stringify(data))) {
    return { valid: false, error: "INVALID_ENCODING" }
  }
  
  return { valid: true }
}
```

### 4.2 Content Validation Rules

#### Anti-Hallucination Checks
1. **Feature Verification**: Every feature mentioned in analysis must exist in input data
2. **No Assumptions**: If field is null, analysis must state "not_provided", never infer value
3. **Source References**: Every observation must reference specific input field
4. **Consistency Checks**: Only flag inconsistencies between provided data, never add new data

#### Fact Verification Rules
```javascript
// Example validation logic
function validateFactVerification(data, input) {
  const inconsistencies = data.factVerification?.inconsistencies || []
  
  for (const inconsistency of inconsistencies) {
    // Must reference actual input fields
    if (!inconsistency.field || !inconsistency.descriptionClaim || !inconsistency.structuredDataValue) {
      return { valid: false, error: "INCOMPLETE_INCONSISTENCY_DATA" }
    }
    
    // Description claim must be extractable from input.description
    if (!input.description.includes(inconsistency.descriptionClaim.substring(0, 20))) {
      return { valid: false, error: "HALLUCINATED_DESCRIPTION_CLAIM" }
    }
    
    // Structured data value must match input
    const inputValue = getNestedValue(input, inconsistency.field)
    if (String(inputValue) !== String(inconsistency.structuredDataValue)) {
      return { valid: false, error: "MISMATCHED_STRUCTURED_DATA" }
    }
  }
  
  return { valid: true }
}
```

---

## 5. Anti-Hallucination Safeguards

### 5.1 Prompt-Level Safeguards

#### Explicit Prohibitions
```
NEVER DO THE FOLLOWING:
- Add amenities not listed in specifications (pool, parking, elevator, etc.)
- Assume property condition (new, renovated, needs repair)
- Infer location features (sea view, city center, etc.) unless explicitly stated
- Calculate or estimate missing values (price per m² if price missing, etc.)
- Add room counts, square meters, or other specifications
- Assume build year, floor number, or other structured data
- Infer neighborhood characteristics beyond what is provided
- Add contact information or suggest contact methods
- Create property history or background information
```

#### Required Evidence Statements
```
FOR EVERY ANALYSIS POINT:
- State the exact input field that provides the information
- Quote the exact text or value from input data
- If information is missing, explicitly state "not_provided"
- Never use phrases like "likely", "probably", "appears to be" without evidence
```

### 5.2 Output Schema Safeguards

#### Evidence Fields
Every analysis point MUST include:
- `evidence`: Exact text or data from input
- `field`: Specific input field referenced
- `descriptionClaim`: What description says (if applicable)
- `structuredDataValue`: What structured data says (if applicable)

#### Null Handling
- Missing data MUST be represented as `null`, never as inferred values
- Arrays with no items MUST be `[]`, never `null`
- Optional objects can be omitted entirely if empty

### 5.3 Post-Processing Validation

#### Hallucination Detection Rules
```javascript
function detectHallucinations(aiOutput, inputData) {
  const hallucinations = []
  
  // Check 1: Features mentioned but not in input
  const mentionedFeatures = extractFeatures(aiOutput)
  const inputFeatures = extractInputFeatures(inputData)
  for (const feature of mentionedFeatures) {
    if (!inputFeatures.includes(feature)) {
      hallucinations.push({
        type: "INVENTED_FEATURE",
        feature,
        location: findLocationInOutput(aiOutput, feature)
      })
    }
  }
  
  // Check 2: Values inferred when null
  const inferredValues = findInferredValues(aiOutput)
  for (const inferred of inferredValues) {
    const inputValue = getNestedValue(inputData, inferred.field)
    if (inputValue === null || inputValue === undefined) {
      hallucinations.push({
        type: "INFERRED_NULL_VALUE",
        field: inferred.field,
        inferredValue: inferred.value
      })
    }
  }
  
  // Check 3: Description claims not in actual description
  const descriptionClaims = extractDescriptionClaims(aiOutput)
  const actualDescription = inputData.description || ""
  for (const claim of descriptionClaims) {
    if (!actualDescription.includes(claim.substring(0, 20))) {
      hallucinations.push({
        type: "HALLUCINATED_DESCRIPTION_CLAIM",
        claim
      })
    }
  }
  
  return hallucinations
}
```

### 5.4 Confidence Scoring

Every AI assessment MUST include confidence scores:
- `confidence`: 0.0-1.0, where:
  - 1.0 = Directly stated in input data
  - 0.8-0.9 = Strongly implied by input data
  - 0.5-0.7 = Weakly implied, requires interpretation
  - <0.5 = Should not be included (too uncertain)

---

## 6. Rules Forbidding Feature Invention

### 6.1 Explicit Feature List

#### Allowed Analysis (Based on Input Only)
- Analyze text quality, clarity, structure
- Identify inconsistencies between description and structured data
- Suggest SEO improvements to existing content
- Flag policy violations or inappropriate content
- Assess completeness based on provided fields

#### Forbidden Inventions
```
NEVER ADD:
- Property features (pool, garden, terrace, etc.) not in specifications
- Location amenities (near beach, city center, etc.) not explicitly stated
- Property condition (renovated, new, needs repair)
- Interior features (furniture, appliances, decor)
- Building amenities (gym, concierge, etc.) not in input
- Neighborhood characteristics beyond district/neighborhood names
- Transportation access (metro, bus stops) not mentioned
- Nearby facilities (schools, hospitals, shops) not mentioned
- Property history or background
- Seller motivations or urgency
- Price justifications or market comparisons
```

### 6.2 Feature Verification Matrix

| Feature Category | Input Source | Can AI Analyze? | Can AI Add? |
|-----------------|--------------|-----------------|-------------|
| Basic Specs (rooms, m²) | `specifications` | Yes (verify consistency) | No |
| Amenities (pool, parking) | `specifications` | Yes (verify consistency) | No |
| Location Details | `location` | Yes (verify consistency) | No |
| Price Information | `price` | Yes (analyze patterns) | No |
| Description Content | `description` | Yes (analyze quality) | No |
| SEO Keywords | Derived from input | Yes (suggest additions) | Yes (suggestions only) |
| Missing Information | Not in input | Yes (identify gaps) | No (cannot fill gaps) |

### 6.3 Example: Correct vs. Incorrect

#### ❌ INCORRECT (Hallucination)
```json
{
  "factVerification": {
    "inconsistencies": [{
      "type": "DESCRIPTION_DATA_MISMATCH",
      "message": "Açıklamada havuz bahsediliyor ancak özelliklerde yok",
      "descriptionClaim": "havuzlu villa",
      "structuredDataValue": "false",
      "field": "specifications.pool"
    }]
  }
}
```
**Problem**: If `specifications.pool` is `null` (not provided), this is hallucination. AI cannot assume it's `false`.

#### ✅ CORRECT (Fact-Based)
```json
{
  "factVerification": {
    "inconsistencies": [{
      "type": "DESCRIPTION_DATA_MISMATCH",
      "message": "Açıklamada havuz bahsediliyor ancak özelliklerde havuz bilgisi verilmemiş",
      "descriptionClaim": "havuzlu villa",
      "structuredDataValue": "not_provided",
      "field": "specifications.pool"
    }]
  }
}
```

---

## 7. SEO Enhancement Logic

### 7.1 SEO Enhancement Principles

#### Allowed Actions
1. **Keyword Optimization**: Suggest adding relevant keywords that are factually accurate
2. **Content Restructuring**: Suggest reordering existing content for better flow
3. **Clarity Improvements**: Suggest rewording for better understanding
4. **Meta Description**: Create meta description from existing content
5. **Title Optimization**: Suggest improvements to existing title

#### Forbidden Actions
1. **False Claims**: Never suggest adding keywords that imply false features
2. **Keyword Stuffing**: Never suggest excessive keyword repetition
3. **Content Addition**: Never suggest adding new factual claims
4. **Feature Promotion**: Never suggest emphasizing features not in input

### 7.2 SEO Suggestion Schema

```json
{
  "seoEnhancement": {
    "titleSuggestions": [
      {
        "suggestedTitle": "3+1 Lüks Daire Lara'da Deniz Manzaralı",
        "reason": "Oda sayısı ve konum bilgisi başta yer alıyor, arama motorları için optimize edilmiş",
        "improvements": [
          "Oda sayısı başlığın başına taşındı (arama sıklığı yüksek)",
          "Lokasyon bilgisi eklendi (yerel aramalar için önemli)",
          "Anahtar kelime yoğunluğu optimize edildi"
        ],
        "expectedImpact": "MEDIUM"
      }
    ],
    "descriptionSuggestions": [
      {
        "section": "description_start",
        "currentText": "Güzel bir daire",
        "suggestedText": "Lara bölgesinde, denize yakın konumda yer alan 3+1 lüks daire",
        "reason": "Açıklamanın başında lokasyon ve temel özellikler belirtilerek SEO değeri artırılıyor",
        "keywordAdditions": ["Lara", "denize yakın", "3+1", "lüks"],
        "keywordRemovals": [],
        "expectedImpact": "HIGH"
      }
    ],
    "keywordRecommendations": {
      "missingKeywords": [
        {
          "keyword": "Antalya",
          "category": "LOCATION",
          "reason": "Şehir adı açıklamada geçmiyor, yerel aramalar için önemli",
          "priority": "HIGH",
          "suggestedPlacement": "description_start"
        }
      ],
      "overusedKeywords": [
        {
          "keyword": "güzel",
          "count": 8,
          "reason": "Aynı kelime çok fazla tekrarlanıyor, SEO değeri düşüyor",
          "recommendation": "Eş anlamlı kelimeler kullanılabilir (şık, modern, bakımlı)"
        }
      ]
    },
    "metaDescriptionSuggestion": {
      "suggestedMetaDescription": "Lara'da deniz manzaralı 3+1 lüks daire. 120 m², eşyalı, güvenlikli site. Okul ve market yakın. Detaylı bilgi için iletişime geçin.",
      "reason": "150 karakter sınırı içinde temel özellikler ve lokasyon bilgisi yer alıyor",
      "includesKeywords": ["Lara", "3+1", "deniz manzaralı", "lüks", "eşyalı"],
      "callToAction": "Detaylı bilgi için iletişime geçin"
    }
  }
}
```

### 7.3 SEO Enhancement Rules

#### Keyword Addition Rules
1. **Factual Only**: Keywords must reflect actual property features
2. **Location Keywords**: Can suggest adding district/neighborhood if missing
3. **Property Type**: Can suggest standardizing property type terminology
4. **Feature Keywords**: Can only suggest if feature exists in structured data

#### Content Improvement Rules
1. **Preserve Facts**: Never change factual information
2. **Enhance Clarity**: Improve wording while maintaining accuracy
3. **Structure Optimization**: Suggest better organization of existing content
4. **Length Optimization**: Suggest additions only if content is too short

#### Example: Valid SEO Suggestion
```json
{
  "descriptionSuggestions": [{
    "section": "description_middle",
    "currentText": "Daire güzel bir yerde",
    "suggestedText": "Daire Muratpaşa ilçesinin Lara mahallesinde, denize yakın konumda yer almaktadır",
    "reason": "Belirsiz lokasyon ifadesi yerine spesifik ilçe ve mahalle bilgisi eklendi",
    "keywordAdditions": ["Muratpaşa", "Lara", "denize yakın"],
    "keywordRemovals": ["güzel bir yerde"],
    "expectedImpact": "HIGH"
  }]
}
```
**Valid because**: Uses actual location data from input, doesn't invent features.

#### Example: Invalid SEO Suggestion
```json
{
  "descriptionSuggestions": [{
    "suggestedText": "Havuzlu, bahçeli, deniz manzaralı villa",
    "keywordAdditions": ["havuzlu", "bahçeli"]
  }]
}
```
**Invalid because**: Adds features (pool, garden) not in input data.

---

## 8. Integration with Deterministic Scores

### 8.1 Score Comparison Logic

The AI MUST:
1. **Acknowledge Deterministic Scores**: Reference them in analysis
2. **Not Recalculate**: Use provided scores as-is
3. **Provide Additional Context**: Explain scores from content perspective
4. **Flag Disagreements**: If AI assessment differs significantly, explain why

### 8.2 Comparison Schema

```json
{
  "comparisonWithDeterministicScores": {
    "agreementLevel": "HIGH",
    "disagreements": [
      {
        "scoreType": "descriptionQualityScore",
        "deterministicValue": 65,
        "aiAssessment": 72,
        "reason": "Deterministik skor açıklama uzunluğuna göre düşük, ancak içerik kalitesi ve yapı açısından daha yüksek değerlendirilebilir",
        "recommendation": "Açıklama uzunluğu artırılabilir ancak mevcut içerik kaliteli"
      }
    ],
    "additionalInsights": [
      "Deterministik skorlar teknik eksiklikleri tespit ediyor, AI analizi içerik kalitesi ve kullanıcı deneyimi açısından ek değerlendirme sunuyor"
    ]
  }
}
```

### 8.3 Score Usage Rules

#### AI Must Use Deterministic Scores For:
- Completeness assessment (reference, don't recalculate)
- Missing fields identification (acknowledge deterministic findings)
- Warning prioritization (consider deterministic warnings)

#### AI Can Add:
- Content quality insights not captured by deterministic rules
- SEO-specific recommendations
- User engagement perspectives
- Risk assessments based on content patterns

---

## 9. Error Handling

### 9.1 Error Scenarios

#### Invalid Input Data
```json
{
  "status": "ERROR",
  "listingId": "uuid",
  "analyzedAt": "2026-02-18T10:00:00Z",
  "error": {
    "code": "INVALID_INPUT_DATA",
    "message": "Giriş verisi geçersiz: title alanı boş",
    "details": "Title field is required but was null or empty"
  }
}
```

#### Processing Failure
```json
{
  "status": "ERROR",
  "listingId": "uuid",
  "analyzedAt": "2026-02-18T10:00:00Z",
  "error": {
    "code": "PROCESSING_FAILED",
    "message": "İçerik analizi sırasında hata oluştu",
    "details": "Description parsing failed due to encoding issues"
  }
}
```

#### Partial Success
```json
{
  "status": "PARTIAL",
  "listingId": "uuid",
  "analyzedAt": "2026-02-18T10:00:00Z",
  "contentModeration": { "status": "PASS", "issues": [] },
  "factVerification": {
    "status": "INSUFFICIENT_DATA",
    "inconsistencies": [],
    "consistencyScore": null
  },
  "error": {
    "code": "INSUFFICIENT_DATA",
    "message": "Yetersiz veri nedeniyle bazı analizler tamamlanamadı",
    "details": "Description field is too short for quality assessment"
  }
}
```

### 9.2 Error Recovery

#### Retry Logic
- If JSON parsing fails: Return error, do not retry
- If validation fails: Return error with specific field issues
- If partial analysis possible: Return `PARTIAL` status with available results

---

## 10. Testing and Validation

### 10.1 Test Cases

#### Test Case 1: Complete Listing
**Input**: Full listing with all fields populated  
**Expected**: `status: "SUCCESS"`, all analysis sections populated  
**Validation**: No hallucinations, all evidence fields populated

#### Test Case 2: Minimal Listing
**Input**: Listing with only required fields  
**Expected**: `status: "SUCCESS"`, analysis with many `not_provided` values  
**Validation**: No invented features, missing info explicitly stated

#### Test Case 3: Inconsistent Data
**Input**: Description says "3+1" but roomCount is 2  
**Expected**: `factVerification.status: "INCONSISTENT"`, inconsistency flagged  
**Validation**: Evidence fields reference actual input values

#### Test Case 4: Invalid JSON
**Input**: Malformed prompt or invalid data  
**Expected**: `status: "ERROR"`, error object with details  
**Validation**: Error message in Turkish, no partial JSON

### 10.2 Hallucination Detection Tests

#### Test: Feature Invention
**Input**: Listing with `specifications.pool: null`  
**Expected**: No mention of pool in analysis  
**Validation**: Search output for "havuz" or "pool", must not appear unless in input description

#### Test: Value Inference
**Input**: Listing with `buildYear: null`  
**Expected**: Analysis states "buildYear not_provided"  
**Validation**: No estimated or inferred build year values

#### Test: Location Assumptions
**Input**: Listing with only district, no neighborhood details  
**Expected**: No assumptions about neighborhood characteristics  
**Validation**: No invented location features (sea view, city center, etc.)

---

## 11. Implementation Guidelines

### 11.1 Prompt Construction

```javascript
function constructPrompt(listingData, deterministicScores) {
  const systemPrompt = getSystemPrompt() // Fixed system prompt
  const userPrompt = getUserPromptTemplate()
    .replace(/{listingId}/g, listingData.listingId)
    .replace(/{title}/g, escapeJSON(listingData.title))
    .replace(/{description}/g, escapeJSON(listingData.description))
    // ... all other replacements
    .replace(/{completenessScore}/g, deterministicScores.completenessScore)
    // ... all score replacements
  
  return {
    system: systemPrompt,
    user: userPrompt
  }
}
```

### 11.2 Response Parsing

```javascript
function parseAIResponse(responseText) {
  // 1. Remove any markdown formatting
  let jsonText = responseText.trim()
  jsonText = jsonText.replace(/^```json\s*/i, '')
  jsonText = jsonText.replace(/^```\s*/i, '')
  jsonText = jsonText.replace(/\s*```$/i, '')
  jsonText = jsonText.trim()
  
  // 2. Parse JSON
  try {
    const data = JSON.parse(jsonText)
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e.message, rawResponse: responseText }
  }
}
```

### 11.3 Validation Pipeline

```javascript
async function processAIResponse(rawResponse, inputData) {
  // 1. Parse
  const parseResult = parseAIResponse(rawResponse)
  if (!parseResult.success) {
    return { status: "ERROR", error: { code: "PARSE_FAILED", message: parseResult.error } }
  }
  
  // 2. Schema validation
  const schemaValidation = validateSchema(parseResult.data)
  if (!schemaValidation.valid) {
    return { status: "ERROR", error: { code: "SCHEMA_INVALID", ...schemaValidation } }
  }
  
  // 3. Hallucination detection
  const hallucinations = detectHallucinations(parseResult.data, inputData)
  if (hallucinations.length > 0) {
    return { 
      status: "ERROR", 
      error: { 
        code: "HALLUCINATION_DETECTED", 
        hallucinations 
      } 
    }
  }
  
  // 4. Content validation
  const contentValidation = validateContent(parseResult.data, inputData)
  if (!contentValidation.valid) {
    return { status: "PARTIAL", ...parseResult.data, warnings: contentValidation.warnings }
  }
  
  return { status: "SUCCESS", ...parseResult.data }
}
```

---

## 12. Human-in-the-Loop Integration

### 12.1 Admin Review Interface

The AI output is presented to administrators with:
1. **Deterministic Scores**: Displayed prominently (already calculated)
2. **AI Analysis**: Presented as additional insights
3. **Recommendations**: Prioritized action items
4. **Evidence**: Clickable references to source data
5. **Risk Flags**: Highlighted for immediate attention

### 12.2 Decision Workflow

```
Admin Reviews:
├── Deterministic Scores (automated, trusted)
├── AI Content Analysis (assisted, reviewed)
├── Risk Assessment (flagged for attention)
└── SEO Suggestions (optional improvements)

Admin Actions:
├── Approve (publish listing)
├── Request Changes (send back with AI + admin feedback)
└── Reject (archive listing)
```

### 12.3 AI Output Usage

- **Primary**: Deterministic scores drive automated decisions
- **Secondary**: AI analysis informs human judgment
- **Tertiary**: SEO suggestions are optional enhancements

---

**Document Status:** Complete v1.0.0  
**Implementation Ready:** Yes  
**Testing Required:** Hallucination detection, JSON parsing, validation pipeline
