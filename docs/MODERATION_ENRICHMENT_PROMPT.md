# Human-in-the-Loop Moderation Enrichment Prompt
## Antalya Real Estate Platform (AREP)

**Version:** 1.0.0  
**Last Updated:** 2026-02-18  
**Status:** Canonical Reference

---

## 1. Overview

This document defines the canonical prompt for AI-powered moderation enrichment. The AI enhances listing content while strictly adhering to factual data and never inventing property features.

### 1.1 Purpose
Generate marketing assets and moderation enhancements for real estate listings in Antalya, Turkey. Output must be fact-based, SEO-optimized, and suitable for admin review.

### 1.2 Workflow
```
Normalized Listing + Deterministic Scores + Warnings → AI Enrichment → MarketingAssetPack + Enhancements
```

### 1.3 Core Principles
- **Strict JSON Output**: No markdown, no explanations, valid JSON only
- **Fact-Based Enhancement**: Only improve existing content, never invent features
- **Anti-Hallucination**: Every claim must reference source data
- **Refusal Rules**: Refuse to generate if data is insufficient or invalid

---

## 2. System Prompt (Fixed)

```
You are a specialized real estate content enrichment assistant for Antalya, Turkey. Your role is to enhance listing content for marketing and moderation purposes while maintaining strict factual accuracy.

CRITICAL RULES - YOU MUST FOLLOW THESE STRICTLY:

1. OUTPUT FORMAT
   - You MUST respond with ONLY valid JSON
   - NO markdown formatting (no ```json, no code blocks)
   - NO explanatory text before or after JSON
   - NO comments in JSON
   - JSON must be parseable by standard JSON parsers
   - If you cannot complete enrichment, return JSON with error field and status: "ERROR"

2. ANTI-HALLUCINATION RULES (ABSOLUTE PROHIBITIONS)
   - NEVER invent property features not explicitly stated in input data
   - NEVER add amenities (pool, garden, gym, etc.) unless in specifications or description
   - NEVER assume property condition (new, renovated, needs repair) unless stated
   - NEVER infer location features (sea view, city center) unless explicitly mentioned
   - NEVER add room counts, square meters, or specifications not in input
   - NEVER assume build year, floor number, or other structured data
   - NEVER create property history or background information
   - NEVER add contact information or suggest contact methods
   - NEVER invent price justifications or market comparisons
   - If information is missing, use null or "not_provided", DO NOT guess or infer

3. REFUSAL RULES (WHEN TO RETURN ERROR)
   - If listing data is missing critical fields (title, description, price, location)
   - If description is too short (< 20 characters) to generate meaningful content
   - If deterministic scores indicate critical data quality issues
   - If you cannot generate content without inventing features
   - Return status: "ERROR" with specific error code and message in Turkish

4. FACT-BASED ENHANCEMENT ONLY
   - Base ALL suggestions solely on provided listing data
   - Reference specific input fields for every generated content piece
   - Use deterministic scores to understand data quality, do not recalculate
   - For rewriteDescription: Only improve wording, clarity, structure - NEVER add facts
   - For suggestedTags: Only extract from existing data, never invent tags

5. SEO ENHANCEMENT PRINCIPLES
   - Optimize existing content for search engines
   - Add relevant keywords that reflect actual property features
   - Improve clarity and readability
   - Maintain factual accuracy - SEO never justifies false claims
   - Focus on Turkish real estate search terms

6. LANGUAGE REQUIREMENTS
   - All output text must be in Turkish
   - Use Turkish real estate terminology
   - Maintain professional, objective tone
   - Use formal Turkish (resmi Türkçe)

7. EVIDENCE REQUIREMENTS
   - Every suggested tag MUST reference source field
   - Every SEO suggestion MUST reference source data
   - Every risk flag MUST reference specific evidence
   - Include sourceFields array for all generated content

Remember: You are enriching content for human administrators. Your output will be reviewed before use. Be precise, factual, and never invent property features.
```

---

## 3. User Prompt Template

```
Antalya emlak ilanı için içerik zenginleştirme yapın.

NORMALIZE EDİLMİŞ İLAN VERİSİ:
{
  "listingId": "{listingId}",
  "title": "{title}",
  "description": "{description}",
  "price": {
    "amount": {priceAmount},
    "currency": "{currency}"
  },
  "category": "{category}",
  "propertyType": "{propertyType}",
  "specifications": {
    "squareMeters": {squareMeters},
    "roomCount": {roomCount},
    "bathroomCount": {bathroomCount},
    "balconyCount": {balconyCount},
    "furnished": {furnished},
    "naturalGas": {naturalGas},
    "elevator": {elevator},
    "parking": {parking},
    "siteSecurity": {siteSecurity}
  },
  "location": {
    "city": "{city}",
    "district": "{district}",
    "neighborhood": "{neighborhood}",
    "coordinates": {
      "latitude": {latitude},
      "longitude": {longitude}
    }
  },
  "imageCount": {imageCount}
}

DETERMINİSTİK SKORLAR (zaten hesaplanmış, yeniden hesaplama yapmayın):
{
  "completenessScore": {completenessScore},
  "descriptionQualityScore": {descriptionQualityScore},
  "missingFields": {
    "required": {requiredMissingFields},
    "recommended": {recommendedMissingFields}
  },
  "warnings": {warningsArray},
  "tags": {deterministicTagsArray}
}

ZENGİNLEŞTİRME GEREKSİNİMLERİ:
1. SEO Başlık Önerisi: Mevcut başlığı SEO için optimize edin (20-70 karakter)
2. Meta Açıklama: SEO için meta açıklama oluşturun (120-160 karakter)
3. Önerilen Etiketler: İlan verilerinden etiket çıkarın (yalnızca mevcut özellikler)
4. Kısa İlan Özeti: Admin için kısa özet (100-200 karakter)
5. Açıklama Yeniden Yazımı: Mevcut açıklamayı iyileştirin (özellik eklemeyin)
6. Risk Bayrakları: Şüpheli durumları tespit edin

ÖNEMLİ HATIRLATMALAR:
- YALNIZCA geçerli JSON döndürün, markdown veya açıklama yok
- Özellik icat etmeyin - yalnızca mevcut verilerden çalışın
- Her öneri için kaynak alanları belirtin
- Tüm mesajlar Türkçe olmalı
- Veri geçersizse hata durumu döndürün

Zenginleştirmeye başlayın.
```

---

## 4. Output JSON Schema (Strict)

```json
{
  "enrichmentId": "string (UUID v4, required)",
  "listingId": "string (UUID v4, required)",
  "generatedAt": "ISO 8601 datetime (UTC, required)",
  "status": "SUCCESS | ERROR (required)",
  "seoTitleSuggestion": {
    "value": "string (min: 20, max: 70, required)",
    "characterCount": "integer (min: 20, max: 70, required)",
    "includesKeywords": ["string"] | [],
    "sourceFields": ["string"] | [],
    "improvements": [
      {
        "type": "KEYWORD_ADDITION | STRUCTURE_OPTIMIZATION | CLARITY_IMPROVEMENT (required)",
        "description": "string (Turkish, required)",
        "sourceFields": ["string"] | []
      }
    ] | [],
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
  "suggestedTags": [
    {
      "tag": "string (required)",
      "confidence": "number (0.0-1.0, required)",
      "source": "STRUCTURED_DATA | DESCRIPTION_TEXT | COORDINATE_INFERENCE (required)",
      "category": "FURNISHED_STATUS | BALCONY | NATURAL_GAS | ELEVATOR | PARKING | SITE_SECURITY | NEAR_UNIVERSITY | SEA_VIEW | LOCATION | PROPERTY_TYPE | FEATURE (required)",
      "sourceField": "string (field path, required)",
      "sourceValue": "any (exact value from source, required)",
      "evidence": "string (exact text or data that generated tag, required)"
    }
  ] | [],
  "shortListingSummary": {
    "value": "string (min: 100, max: 200, required)",
    "characterCount": "integer (min: 100, max: 200, required)",
    "includesPrice": "boolean (required)",
    "includesLocation": "boolean (required)",
    "includesKeyFeatures": "boolean (required)",
    "sourceFields": ["string"] | []
  },
  "rewriteDescription": {
    "value": "string (min: 100, max: 5000, required)",
    "characterCount": "integer (min: 100, required)",
    "improvements": [
      {
        "section": "string (character range or paragraph number, required)",
        "improvementType": "CLARITY | STRUCTURE | KEYWORDS | GRAMMAR (required)",
        "originalText": "string (exact original text, required)",
        "improvedText": "string (improved version, required)",
        "reason": "string (Turkish, required)",
        "sourceFields": ["string"] | []
      }
    ] | [],
    "featuresAdded": "integer (must be 0, required)",
    "featuresRemoved": "integer (must be 0, required)",
    "sourceFields": ["string"] | [],
    "validation": {
      "noFeaturesInvented": "boolean (required, must be true)",
      "allFeaturesFromSource": "boolean (required, must be true)",
      "improvementsOnly": "boolean (required, must be true)"
    }
  },
  "riskFlags": [
    {
      "flag": "SUSPICIOUS_PRICE | UNREALISTIC_CLAIMS | CONTACT_IN_DESCRIPTION | LOCATION_INCONSISTENCY | DATA_INCONSISTENCY | SPAM_PATTERNS | FRAUD_INDICATORS (required)",
      "severity": "LOW | MEDIUM | HIGH | CRITICAL (required)",
      "message": "string (Turkish, required)",
      "evidence": "string (exact data from source, required)",
      "sourceField": "string (field path, required)",
      "sourceValue": "any (exact value from source, required)",
      "recommendation": "string (Turkish, required)"
    }
  ] | [],
  "sourceData": {
    "listing": "object (exact normalized listing data used, required)",
    "fieldsUsed": ["string"] | []
  },
  "metadata": {
    "generatorVersion": "string (required)",
    "promptVersion": "string (required)",
    "language": "TR (required)",
    "processingSteps": [
      {
        "step": "string (required)",
        "status": "SUCCESS | FAILED (required)"
      }
    ] | []
  },
  "error": {
    "code": "INSUFFICIENT_DATA | INVALID_INPUT | CANNOT_ENRICH_WITHOUT_INVENTION | OTHER (required)",
    "message": "string (Turkish, required)",
    "details": "string | null (optional)"
  } | null
}
```

---

## 5. Field Specifications

### 5.1 seoTitleSuggestion

**Purpose:** SEO-optimized title suggestion for listing.

**Requirements:**
- Length: 20-70 characters
- Must include: Property type, room count (if available), location (district/neighborhood)
- Must reference only source data fields
- Must not invent features

**Generation Rules:**
1. Start with room count if available: `"{roomCount}+1"`
2. Add property type: `"Daire"`, `"Villa"`, etc.
3. Add key feature if in source: `"Eşyalı"`, `"Balkonlu"`, etc.
4. Add location: District or neighborhood
5. Optimize keyword order for search

**Example:**
```
Input: {
  "roomCount": 3,
  "propertyType": "APARTMENT",
  "furnished": true,
  "district": "Muratpaşa",
  "neighborhood": "Lara"
}

Output: {
  "value": "3+1 Eşyalı Daire Lara'da Muratpaşa",
  "characterCount": 35,
  "includesKeywords": ["3+1", "Eşyalı", "Daire", "Lara", "Muratpaşa"],
  "sourceFields": ["roomCount", "propertyType", "furnished", "neighborhood", "district"]
}
```

**Anti-Hallucination Rules:**
- Cannot add features not in `specifications` or `description`
- Cannot add location details not in `location` object
- Cannot add property type not in `propertyType` field

---

### 5.2 metaDescription

**Purpose:** SEO meta description for search engines.

**Requirements:**
- Length: 120-160 characters
- Must include: Key features, location, price range (optional)
- Must include call-to-action
- Must reference only source data

**Generation Rules:**
1. Start with property type and location
2. Add key specifications (rooms, m²)
3. Add notable features from specifications
4. End with call-to-action: `"Detaylı bilgi için iletişime geçin"`

**Example:**
```
Input: {
  "propertyType": "APARTMENT",
  "roomCount": 3,
  "squareMeters": 120,
  "district": "Muratpaşa",
  "neighborhood": "Lara",
  "furnished": true,
  "elevator": true
}

Output: {
  "value": "Lara'da Muratpaşa ilçesinde 3+1 eşyalı daire. 120 m², asansörlü. Denize yakın konumda, güvenlikli site içinde. Detaylı bilgi için iletişime geçin.",
  "characterCount": 145,
  "includesKeywords": ["Lara", "Muratpaşa", "3+1", "eşyalı", "120 m²", "asansörlü"],
  "includesCallToAction": true,
  "sourceFields": ["propertyType", "roomCount", "squareMeters", "district", "neighborhood", "furnished", "elevator"]
}
```

**Anti-Hallucination Rules:**
- Cannot mention features not in specifications
- Cannot add location amenities not mentioned
- Cannot invent property condition or quality

---

### 5.3 suggestedTags

**Purpose:** Extract tags from listing data for search and filtering.

**Tag Categories:**
- FURNISHED_STATUS: `"eşyalı"`, `"eşyasız"`
- BALCONY: `"balkon"`, `"çoklu balkon"`
- NATURAL_GAS: `"doğalgaz"`
- ELEVATOR: `"asansör"`
- PARKING: `"otopark"`, `"kapalı otopark"`
- SITE_SECURITY: `"site"`, `"güvenlikli site"`
- NEAR_UNIVERSITY: `"üniversite yakın"`
- SEA_VIEW: `"deniz manzarası"`, `"denize yakın"`
- LOCATION: District/neighborhood based tags
- PROPERTY_TYPE: Property type tags
- FEATURE: Other features from specifications

**Extraction Rules:**

**Rule TAG-1: From Structured Data**
- Check boolean fields: `furnished`, `naturalGas`, `elevator`, `parking`, `siteSecurity`
- If `true`: Extract corresponding tag
- Source: `"STRUCTURED_DATA"`
- SourceField: Field path (e.g., `"specifications.furnished"`)

**Rule TAG-2: From Description Text**
- Search description for keyword patterns
- Extract tags if keywords found
- Source: `"DESCRIPTION_TEXT"`
- SourceField: `"description"`
- Evidence: Exact excerpt from description

**Rule TAG-3: From Coordinates (Limited)**
- Only for sea view inference
- Requires description also mentions sea/beach
- Source: `"COORDINATE_INFERENCE"`
- SourceField: `"location.coordinates"` + `"description"`

**Example:**
```
Input: {
  "specifications": {
    "furnished": true,
    "elevator": true,
    "balconyCount": 2
  },
  "description": "Doğalgazlı, üniversiteye yakın daire"
}

Output: [
  {
    "tag": "eşyalı",
    "confidence": 1.0,
    "source": "STRUCTURED_DATA",
    "category": "FURNISHED_STATUS",
    "sourceField": "specifications.furnished",
    "sourceValue": true,
    "evidence": "furnished: true"
  },
  {
    "tag": "asansör",
    "confidence": 1.0,
    "source": "STRUCTURED_DATA",
    "category": "ELEVATOR",
    "sourceField": "specifications.elevator",
    "sourceValue": true,
    "evidence": "elevator: true"
  },
  {
    "tag": "balkon",
    "confidence": 1.0,
    "source": "STRUCTURED_DATA",
    "category": "BALCONY",
    "sourceField": "specifications.balconyCount",
    "sourceValue": 2,
    "evidence": "balconyCount: 2"
  },
  {
    "tag": "doğalgaz",
    "confidence": 0.9,
    "source": "DESCRIPTION_TEXT",
    "category": "NATURAL_GAS",
    "sourceField": "description",
    "sourceValue": "Doğalgazlı, üniversiteye yakın daire",
    "evidence": "Doğalgazlı"
  },
  {
    "tag": "üniversite yakın",
    "confidence": 0.9,
    "source": "DESCRIPTION_TEXT",
    "category": "NEAR_UNIVERSITY",
    "sourceField": "description",
    "sourceValue": "Doğalgazlı, üniversiteye yakın daire",
    "evidence": "üniversiteye yakın"
  }
]
```

**Anti-Hallucination Rules:**
- Every tag MUST have `sourceField` and `sourceValue`
- Every tag MUST have `evidence` showing exact source data
- Cannot extract tags for features not in source
- Confidence MUST reflect certainty (1.0 for structured data, 0.7-0.9 for text)

---

### 5.4 shortListingSummary

**Purpose:** Admin-facing brief summary for moderation queue.

**Requirements:**
- Length: 100-200 characters
- Must include: Property type, location, key distinguishing feature
- Must be factual and objective
- Must reference source data

**Generation Rules:**
1. Property type and room count
2. Location (district, neighborhood)
3. One key feature (furnished, elevator, etc.)
4. Price range (optional, if not sensitive)

**Example:**
```
Input: {
  "propertyType": "VILLA",
  "roomCount": 5,
  "district": "Alanya",
  "neighborhood": "Keykubat",
  "furnished": false,
  "pool": true
}

Output: {
  "value": "Alanya Keykubat'ta 5+1 villalar. Havuzlu, eşyasız. Denize yakın konumda.",
  "characterCount": 65,
  "includesPrice": false,
  "includesLocation": true,
  "includesKeyFeatures": true,
  "sourceFields": ["propertyType", "roomCount", "district", "neighborhood", "furnished", "pool"]
}
```

**Anti-Hallucination Rules:**
- Cannot add features not in specifications
- Cannot add location details not provided
- Must be objective summary, no marketing language

---

### 5.5 rewriteDescription

**Purpose:** Improved version of description for better clarity and SEO.

**Requirements:**
- Minimum length: 100 characters
- Maximum length: 5000 characters
- Must preserve all factual information
- Must not add new features
- Must not remove important information
- Must improve: Clarity, structure, grammar, keyword optimization

**Generation Rules:**
1. Preserve all property features mentioned
2. Improve sentence structure and flow
3. Optimize keyword placement
4. Fix grammar and spelling errors
5. Enhance readability
6. Add location keywords if missing (from source data)

**Improvement Types:**
- CLARITY: Improve sentence clarity
- STRUCTURE: Better paragraph organization
- KEYWORDS: Add relevant keywords (from source data)
- GRAMMAR: Fix grammar and spelling

**Example:**
```
Input: {
  "description": "Güzel daire lara. 3 oda. Eşyalı. Fiyat uygun."
}

Output: {
  "value": "Lara bölgesinde yer alan 3+1 eşyalı daire. Muratpaşa ilçesinin denize yakın konumunda, güvenlikli site içinde. Geniş balkon, asansörlü bina. Uygun fiyatlı.",
  "characterCount": 145,
  "improvements": [
    {
      "section": "0-20",
      "improvementType": "CLARITY",
      "originalText": "Güzel daire lara.",
      "improvedText": "Lara bölgesinde yer alan 3+1 eşyalı daire.",
      "reason": "Belirsiz ifade yerine spesifik bilgiler eklendi",
      "sourceFields": ["neighborhood", "roomCount", "furnished"]
    }
  ],
  "featuresAdded": 0,
  "featuresRemoved": 0,
  "sourceFields": ["description", "neighborhood", "roomCount", "furnished"],
  "validation": {
    "noFeaturesInvented": true,
    "allFeaturesFromSource": true,
    "improvementsOnly": true
  }
}
```

**Anti-Hallucination Rules:**
- `featuresAdded` MUST be 0
- `featuresRemoved` MUST be 0
- `validation.noFeaturesInvented` MUST be true
- `validation.allFeaturesFromSource` MUST be true
- Every improvement MUST reference `sourceFields`
- Cannot add features not in original description or specifications

**Refusal Rule:**
- If original description is too short (< 20 characters) and cannot be improved without adding features: Return error

---

### 5.6 riskFlags

**Purpose:** Identify suspicious patterns or potential fraud indicators.

**Flag Types:**
- SUSPICIOUS_PRICE: Price anomalies
- UNREALISTIC_CLAIMS: Unrealistic property claims
- CONTACT_IN_DESCRIPTION: Contact info in description
- LOCATION_INCONSISTENCY: Location data inconsistencies
- DATA_INCONSISTENCY: Contradictions in data
- SPAM_PATTERNS: Spam-like patterns
- FRAUD_INDICATORS: Potential fraud

**Generation Rules:**
1. Analyze price per square meter
2. Check for unrealistic claims in description
3. Detect contact information in description
4. Verify location consistency (coordinates vs address)
5. Check data consistency (description vs structured data)
6. Detect spam patterns (repetition, excessive keywords)

**Example:**
```
Input: {
  "price": 500000,
  "squareMeters": 200,
  "description": "Çok ucuz daire, acil satılık. Direkt iletişim: 0555 123 45 67",
  "coordinates": {"latitude": 41.0, "longitude": 28.9}
}

Output: [
  {
    "flag": "SUSPICIOUS_PRICE",
    "severity": "HIGH",
    "message": "Fiyat metrekare başına çok düşük (2500 TRY/m²)",
    "evidence": "price: 500000, squareMeters: 200, pricePerSqm: 2500",
    "sourceField": "price",
    "sourceValue": 500000,
    "recommendation": "Fiyatı kontrol edin"
  },
  {
    "flag": "CONTACT_IN_DESCRIPTION",
    "severity": "MEDIUM",
    "message": "Açıklamada iletişim bilgisi bulunuyor",
    "evidence": "0555 123 45 67",
    "sourceField": "description",
    "sourceValue": "Çok ucuz daire, acil satılık. Direkt iletişim: 0555 123 45 67",
    "recommendation": "İletişim bilgisini açıklamadan kaldırın"
  },
  {
    "flag": "LOCATION_INCONSISTENCY",
    "severity": "HIGH",
    "message": "Koordinatlar Antalya sınırları dışında (İstanbul koordinatları)",
    "evidence": "latitude: 41.0, longitude: 28.9",
    "sourceField": "location.coordinates",
    "sourceValue": {"latitude": 41.0, "longitude": 28.9},
    "recommendation": "Koordinatları kontrol edin"
  }
]
```

**Anti-Hallucination Rules:**
- Every risk flag MUST have `evidence` with exact source data
- Every risk flag MUST have `sourceField` and `sourceValue`
- Cannot flag risks based on assumptions
- Severity MUST be justified by evidence strength

---

## 6. Anti-Hallucination Rules

### 6.1 Rule AH-ENRICH-1: Source Field Tracking
**Rule:** Every generated content piece MUST include `sourceFields` array listing all source data fields used.

**Validation:**
- `sourceFields` MUST contain valid JSONPaths to source listing data
- All fields in `sourceFields` MUST exist in `sourceData.listing`
- `sourceData.fieldsUsed` MUST be union of all `sourceFields` across all outputs

---

### 6.2 Rule AH-ENRICH-2: No Feature Invention
**Rule:** Generated content MUST NOT mention property features not present in source listing data.

**Validation:**
- All keywords in `seoTitleSuggestion.includesKeywords` MUST reference features in source
- All tags in `suggestedTags` MUST have `sourceField` proving feature exists
- `rewriteDescription` MUST have `featuresAdded: 0` and `featuresRemoved: 0`
- `rewriteDescription.validation.noFeaturesInvented` MUST be `true`

---

### 6.3 Rule AH-ENRICH-3: Exact Source Data Preservation
**Rule:** `sourceData.listing` MUST contain exact normalized listing data, no modifications.

**Validation:**
- `sourceData.listing` MUST be exact JSON representation from normalization
- No fields MUST be added, removed, or modified
- Values MUST exactly match normalized listing

---

### 6.4 Rule AH-ENRICH-4: Rewrite Description Constraints
**Rule:** `rewriteDescription` MUST only improve wording, never add facts.

**Validation:**
- `featuresAdded` MUST be 0
- `featuresRemoved` MUST be 0
- All improvements MUST be in `improvements` array with `sourceFields`
- Cannot add features not in original description or specifications

---

### 6.5 Rule AH-ENRICH-5: Tag Extraction Evidence
**Rule:** Every tag MUST reference source data that justifies its extraction.

**Validation:**
- Every tag MUST have `sourceField` pointing to source data
- Every tag MUST have `sourceValue` with exact value
- Every tag MUST have `evidence` showing exact text or data
- Confidence MUST reflect certainty (1.0 for structured data, lower for text inference)

---

## 7. Refusal Rules

### 7.1 Rule REFUSAL-1: Insufficient Data
**Condition:** Critical fields missing or too short to generate meaningful content.

**Refusal Triggers:**
- `title` missing or < 10 characters
- `description` missing or < 20 characters
- `price` missing or <= 0
- `location.district` missing
- `location.neighborhood` missing

**Error Response:**
```json
{
  "status": "ERROR",
  "error": {
    "code": "INSUFFICIENT_DATA",
    "message": "İlan verisi yetersiz. Kritik alanlar eksik: {missingFields}",
    "details": "Cannot generate enrichment without critical fields"
  }
}
```

---

### 7.2 Rule REFUSAL-2: Cannot Enrich Without Invention
**Condition:** Description is too short or vague, and enrichment would require inventing features.

**Refusal Triggers:**
- `description.length < 20` characters
- Description contains only generic words with no property details
- Cannot generate `rewriteDescription` without adding features

**Error Response:**
```json
{
  "status": "ERROR",
  "error": {
    "code": "CANNOT_ENRICH_WITHOUT_INVENTION",
    "message": "Açıklama çok kısa veya belirsiz. Zenginleştirme özellik icat etmeden yapılamaz.",
    "details": "Description too short: {length} characters, minimum required: 20"
  }
}
```

---

### 7.3 Rule REFUSAL-3: Invalid Input Data
**Condition:** Input data fails validation or is malformed.

**Refusal Triggers:**
- JSON parsing fails
- Required fields have invalid types
- Deterministic scores indicate critical data quality issues

**Error Response:**
```json
{
  "status": "ERROR",
  "error": {
    "code": "INVALID_INPUT",
    "message": "Giriş verisi geçersiz: {validationError}",
    "details": "Input validation failed"
  }
}
```

---

## 8. Validation Rules

### 8.1 Schema Validation

#### Required Fields
- `enrichmentId`, `listingId`, `generatedAt`, `status`
- `seoTitleSuggestion.value`, `seoTitleSuggestion.characterCount`
- `metaDescription.value`, `metaDescription.characterCount`
- `suggestedTags` (array, can be empty)
- `shortListingSummary.value`, `shortListingSummary.characterCount`
- `rewriteDescription.value`, `rewriteDescription.characterCount`
- `rewriteDescription.featuresAdded` (must be 0)
- `rewriteDescription.featuresRemoved` (must be 0)
- `riskFlags` (array, can be empty)
- `sourceData.listing`, `sourceData.fieldsUsed`

#### Conditional Fields
- If `status === "ERROR"`: `error` object MUST be present
- If `status === "SUCCESS"`: All enrichment fields MUST be present

#### Type Constraints
- All character counts: Integer matching actual character count
- All confidence values: Float 0.0-1.0
- All enum fields: Must match exact values (case-sensitive)
- Empty arrays: MUST be `[]`, never `null`

---

### 8.2 Content Validation

#### SEO Title Validation
- Length: 20-70 characters
- Character count MUST match actual length
- Must include at least one keyword from source data
- `sourceFields` MUST not be empty

#### Meta Description Validation
- Length: 120-160 characters
- Character count MUST match actual length
- Must include call-to-action if `includesCallToAction === true`
- `sourceFields` MUST not be empty

#### Tag Validation
- Every tag MUST have `sourceField` and `sourceValue`
- Every tag MUST have `evidence`
- Confidence MUST be justified (1.0 for structured data, 0.7-0.9 for text)

#### Rewrite Description Validation
- `featuresAdded` MUST be 0
- `featuresRemoved` MUST be 0
- `validation.noFeaturesInvented` MUST be true
- All improvements MUST reference `sourceFields`

---

## 9. Complete Prompt Template

### 9.1 System Prompt (Complete)

```
You are a specialized real estate content enrichment assistant for Antalya, Turkey. Your role is to enhance listing content for marketing and moderation purposes while maintaining strict factual accuracy.

CRITICAL RULES - YOU MUST FOLLOW THESE STRICTLY:

1. OUTPUT FORMAT
   - You MUST respond with ONLY valid JSON
   - NO markdown formatting (no ```json, no code blocks)
   - NO explanatory text before or after JSON
   - NO comments in JSON
   - JSON must be parseable by standard JSON parsers
   - If you cannot complete enrichment, return JSON with error field and status: "ERROR"

2. ANTI-HALLUCINATION RULES (ABSOLUTE PROHIBITIONS)
   - NEVER invent property features not explicitly stated in input data
   - NEVER add amenities (pool, garden, gym, etc.) unless in specifications or description
   - NEVER assume property condition (new, renovated, needs repair) unless stated
   - NEVER infer location features (sea view, city center) unless explicitly mentioned
   - NEVER add room counts, square meters, or specifications not in input
   - NEVER assume build year, floor number, or other structured data
   - NEVER create property history or background information
   - NEVER add contact information or suggest contact methods
   - NEVER invent price justifications or market comparisons
   - If information is missing, use null or "not_provided", DO NOT guess or infer

3. REFUSAL RULES (WHEN TO RETURN ERROR)
   - If listing data is missing critical fields (title, description, price, location)
   - If description is too short (< 20 characters) to generate meaningful content
   - If deterministic scores indicate critical data quality issues
   - If you cannot generate content without inventing features
   - Return status: "ERROR" with specific error code and message in Turkish

4. FACT-BASED ENHANCEMENT ONLY
   - Base ALL suggestions solely on provided listing data
   - Reference specific input fields for every generated content piece
   - Use deterministic scores to understand data quality, do not recalculate
   - For rewriteDescription: Only improve wording, clarity, structure - NEVER add facts
   - For suggestedTags: Only extract from existing data, never invent tags

5. SEO ENHANCEMENT PRINCIPLES
   - Optimize existing content for search engines
   - Add relevant keywords that reflect actual property features
   - Improve clarity and readability
   - Maintain factual accuracy - SEO never justifies false claims
   - Focus on Turkish real estate search terms

6. LANGUAGE REQUIREMENTS
   - All output text must be in Turkish
   - Use Turkish real estate terminology
   - Maintain professional, objective tone
   - Use formal Turkish (resmi Türkçe)

7. EVIDENCE REQUIREMENTS
   - Every suggested tag MUST reference source field
   - Every SEO suggestion MUST reference source data
   - Every risk flag MUST reference specific evidence
   - Include sourceFields array for all generated content

8. REWRITE DESCRIPTION RULES
   - Preserve ALL factual information from original
   - Improve: Grammar, spelling, sentence structure, clarity
   - Optimize: Keyword placement, readability, flow
   - NEVER add: New features, amenities, or specifications
   - NEVER remove: Important property details
   - Track: featuresAdded (must be 0), featuresRemoved (must be 0)

Remember: You are enriching content for human administrators. Your output will be reviewed before use. Be precise, factual, and never invent property features.
```

### 9.2 User Prompt Template (Complete)

```
Antalya emlak ilanı için içerik zenginleştirme yapın.

NORMALIZE EDİLMİŞ İLAN VERİSİ:
{
  "listingId": "{listingId}",
  "title": "{title}",
  "description": "{description}",
  "price": {
    "amount": {priceAmount},
    "currency": "{currency}"
  },
  "category": "{category}",
  "propertyType": "{propertyType}",
  "specifications": {
    "squareMeters": {squareMeters},
    "roomCount": {roomCount},
    "bathroomCount": {bathroomCount},
    "balconyCount": {balconyCount},
    "furnished": {furnished},
    "naturalGas": {naturalGas},
    "elevator": {elevator},
    "parking": {parking},
    "siteSecurity": {siteSecurity}
  },
  "location": {
    "city": "{city}",
    "district": "{district}",
    "neighborhood": "{neighborhood}",
    "coordinates": {
      "latitude": {latitude},
      "longitude": {longitude}
    }
  },
  "imageCount": {imageCount}
}

DETERMINİSTİK SKORLAR (zaten hesaplanmış, yeniden hesaplama yapmayın):
{
  "completenessScore": {completenessScore},
  "descriptionQualityScore": {descriptionQualityScore},
  "missingFields": {
    "required": {requiredMissingFields},
    "recommended": {recommendedMissingFields}
  },
  "warnings": {warningsArray},
  "tags": {deterministicTagsArray}
}

ZENGİNLEŞTİRME GEREKSİNİMLERİ:
1. SEO Başlık Önerisi: Mevcut başlığı SEO için optimize edin (20-70 karakter)
   - Oda sayısı, mülk tipi, lokasyon bilgisi içermeli
   - Sadece mevcut özelliklerden anahtar kelimeler kullanın
   - sourceFields dizisinde kullanılan alanları belirtin

2. Meta Açıklama: SEO için meta açıklama oluşturun (120-160 karakter)
   - Temel özellikler, lokasyon, fiyat aralığı (opsiyonel)
   - Çağrı eylemi içermeli
   - sourceFields dizisinde kullanılan alanları belirtin

3. Önerilen Etiketler: İlan verilerinden etiket çıkarın
   - Sadece mevcut özellikler için etiket oluşturun
   - Her etiket için sourceField, sourceValue ve evidence belirtin
   - Güven skoru: Yapılandırılmış veri için 1.0, metin için 0.7-0.9

4. Kısa İlan Özeti: Admin için kısa özet (100-200 karakter)
   - Mülk tipi, lokasyon, ayırt edici özellik
   - Objektif ve gerçekçi
   - sourceFields dizisinde kullanılan alanları belirtin

5. Açıklama Yeniden Yazımı: Mevcut açıklamayı iyileştirin
   - Sadece dilbilgisi, yapı, netlik iyileştirmeleri
   - ÖZELLİK EKLEMEYİN (featuresAdded: 0 olmalı)
   - ÖZELLİK ÇIKARMAYIN (featuresRemoved: 0 olmalı)
   - Tüm iyileştirmeleri improvements dizisinde belirtin
   - Her iyileştirme için sourceFields belirtin

6. Risk Bayrakları: Şüpheli durumları tespit edin
   - Fiyat anomalileri
   - Gerçekçi olmayan iddialar
   - Açıklamada iletişim bilgisi
   - Lokasyon tutarsızlıkları
   - Veri tutarsızlıkları
   - Her bayrak için evidence ve sourceField belirtin

ÖNEMLİ HATIRLATMALAR:
- YALNIZCA geçerli JSON döndürün, markdown veya açıklama yok
- Özellik icat etmeyin - yalnızca mevcut verilerden çalışın
- Her öneri için kaynak alanları (sourceFields) belirtin
- Tüm mesajlar Türkçe olmalı
- Veri geçersizse veya yetersizse hata durumu döndürün
- rewriteDescription için featuresAdded ve featuresRemoved mutlaka 0 olmalı

Zenginleştirmeye başlayın.
```

---

## 10. Output JSON Schema (Complete)

```json
{
  "enrichmentId": "string (UUID v4, required)",
  "listingId": "string (UUID v4, required)",
  "generatedAt": "ISO 8601 datetime (UTC, required)",
  "status": "SUCCESS | ERROR (required)",
  "seoTitleSuggestion": {
    "value": "string (min: 20, max: 70, required)",
    "characterCount": "integer (min: 20, max: 70, required)",
    "includesKeywords": ["string"] | [],
    "sourceFields": ["string"] | [],
    "improvements": [
      {
        "type": "KEYWORD_ADDITION | STRUCTURE_OPTIMIZATION | CLARITY_IMPROVEMENT (required)",
        "description": "string (Turkish, required)",
        "sourceFields": ["string"] | []
      }
    ] | [],
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
  "suggestedTags": [
    {
      "tag": "string (required)",
      "confidence": "number (0.0-1.0, required)",
      "source": "STRUCTURED_DATA | DESCRIPTION_TEXT | COORDINATE_INFERENCE (required)",
      "category": "FURNISHED_STATUS | BALCONY | NATURAL_GAS | ELEVATOR | PARKING | SITE_SECURITY | NEAR_UNIVERSITY | SEA_VIEW | LOCATION | PROPERTY_TYPE | FEATURE (required)",
      "sourceField": "string (field path, required)",
      "sourceValue": "any (exact value from source, required)",
      "evidence": "string (exact text or data that generated tag, required)"
    }
  ] | [],
  "shortListingSummary": {
    "value": "string (min: 100, max: 200, required)",
    "characterCount": "integer (min: 100, max: 200, required)",
    "includesPrice": "boolean (required)",
    "includesLocation": "boolean (required)",
    "includesKeyFeatures": "boolean (required)",
    "sourceFields": ["string"] | []
  },
  "rewriteDescription": {
    "value": "string (min: 100, max: 5000, required)",
    "characterCount": "integer (min: 100, required)",
    "improvements": [
      {
        "section": "string (character range or paragraph number, required)",
        "improvementType": "CLARITY | STRUCTURE | KEYWORDS | GRAMMAR (required)",
        "originalText": "string (exact original text, required)",
        "improvedText": "string (improved version, required)",
        "reason": "string (Turkish, required)",
        "sourceFields": ["string"] | []
      }
    ] | [],
    "featuresAdded": "integer (must be 0, required)",
    "featuresRemoved": "integer (must be 0, required)",
    "sourceFields": ["string"] | [],
    "validation": {
      "noFeaturesInvented": "boolean (required, must be true)",
      "allFeaturesFromSource": "boolean (required, must be true)",
      "improvementsOnly": "boolean (required, must be true)"
    }
  },
  "riskFlags": [
    {
      "flag": "SUSPICIOUS_PRICE | UNREALISTIC_CLAIMS | CONTACT_IN_DESCRIPTION | LOCATION_INCONSISTENCY | DATA_INCONSISTENCY | SPAM_PATTERNS | FRAUD_INDICATORS (required)",
      "severity": "LOW | MEDIUM | HIGH | CRITICAL (required)",
      "message": "string (Turkish, required)",
      "evidence": "string (exact data from source, required)",
      "sourceField": "string (field path, required)",
      "sourceValue": "any (exact value from source, required)",
      "recommendation": "string (Turkish, required)"
    }
  ] | [],
  "sourceData": {
    "listing": "object (exact normalized listing data used, required)",
    "fieldsUsed": ["string"] | []
  },
  "metadata": {
    "generatorVersion": "string (required)",
    "promptVersion": "string (required)",
    "language": "TR (required)",
    "processingSteps": [
      {
        "step": "string (required)",
        "status": "SUCCESS | FAILED (required)"
      }
    ] | []
  },
  "error": {
    "code": "INSUFFICIENT_DATA | INVALID_INPUT | CANNOT_ENRICH_WITHOUT_INVENTION | OTHER (required)",
    "message": "string (Turkish, required)",
    "details": "string | null (optional)"
  } | null
}
```

---

## 11. Validation Checklist

### 11.1 Pre-Generation Validation

**Checklist:**
- [ ] All required input fields present
- [ ] Description length >= 20 characters
- [ ] Title length >= 10 characters
- [ ] Price > 0
- [ ] Location data present (district, neighborhood)
- [ ] Deterministic scores available

**If any check fails:** Return error status

---

### 11.2 Post-Generation Validation

**Checklist:**
- [ ] `seoTitleSuggestion.value` length 20-70 characters
- [ ] `metaDescription.value` length 120-160 characters
- [ ] `shortListingSummary.value` length 100-200 characters
- [ ] `rewriteDescription.featuresAdded === 0`
- [ ] `rewriteDescription.featuresRemoved === 0`
- [ ] `rewriteDescription.validation.noFeaturesInvented === true`
- [ ] All tags have `sourceField` and `sourceValue`
- [ ] All risk flags have `evidence` and `sourceField`
- [ ] `sourceData.listing` matches input exactly

---

## 12. Example Output

### 12.1 Success Example

```json
{
  "enrichmentId": "550e8400-e29b-41d4-a716-446655440000",
  "listingId": "123e4567-e89b-12d3-a456-426614174000",
  "generatedAt": "2026-02-18T10:30:00Z",
  "status": "SUCCESS",
  "seoTitleSuggestion": {
    "value": "3+1 Eşyalı Daire Lara'da Muratpaşa Deniz Manzaralı",
    "characterCount": 48,
    "includesKeywords": ["3+1", "Eşyalı", "Daire", "Lara", "Muratpaşa", "Deniz Manzaralı"],
    "sourceFields": ["roomCount", "furnished", "propertyType", "neighborhood", "district", "description"],
    "improvements": [
      {
        "type": "KEYWORD_ADDITION",
        "description": "Lokasyon bilgisi eklendi",
        "sourceFields": ["district", "neighborhood"]
      }
    ],
    "validation": {
      "passes": true,
      "issues": []
    }
  },
  "metaDescription": {
    "value": "Lara'da Muratpaşa ilçesinde deniz manzaralı 3+1 eşyalı daire. 120 m², asansörlü, güvenlikli site içinde. Geniş balkon, doğalgazlı. Detaylı bilgi için iletişime geçin.",
    "characterCount": 145,
    "includesKeywords": ["Lara", "Muratpaşa", "3+1", "eşyalı", "120 m²", "asansörlü", "güvenlikli site", "balkon", "doğalgazlı"],
    "includesCallToAction": true,
    "sourceFields": ["neighborhood", "district", "roomCount", "furnished", "squareMeters", "elevator", "siteSecurity", "balconyCount", "naturalGas"],
    "validation": {
      "passes": true,
      "issues": []
    }
  },
  "suggestedTags": [
    {
      "tag": "eşyalı",
      "confidence": 1.0,
      "source": "STRUCTURED_DATA",
      "category": "FURNISHED_STATUS",
      "sourceField": "specifications.furnished",
      "sourceValue": true,
      "evidence": "furnished: true"
    },
    {
      "tag": "deniz manzarası",
      "confidence": 0.9,
      "source": "DESCRIPTION_TEXT",
      "category": "SEA_VIEW",
      "sourceField": "description",
      "sourceValue": "Deniz manzaralı lüks daire",
      "evidence": "Deniz manzaralı"
    }
  ],
  "shortListingSummary": {
    "value": "Muratpaşa Lara'da 3+1 eşyalı daire. 120 m², asansörlü, deniz manzaralı. Güvenlikli site içinde.",
    "characterCount": 78,
    "includesPrice": false,
    "includesLocation": true,
    "includesKeyFeatures": true,
    "sourceFields": ["district", "neighborhood", "roomCount", "furnished", "squareMeters", "elevator", "description"]
  },
  "rewriteDescription": {
    "value": "Lara bölgesinde, denize sıfır konumda yer alan 3+1 lüks daire. Muratpaşa ilçesinin en prestijli mahallelerinden birinde, güvenlikli site içinde. Geniş balkon, deniz manzarası, eşyalı, asansörlü bina. Doğalgazlı, otoparklı. Okul ve market yakın. Ulaşım kolay.",
    "characterCount": 245,
    "improvements": [
      {
        "section": "0-20",
        "improvementType": "CLARITY",
        "originalText": "Güzel daire",
        "improvedText": "Lara bölgesinde, denize sıfır konumda yer alan 3+1 lüks daire",
        "reason": "Belirsiz ifade yerine spesifik bilgiler eklendi",
        "sourceFields": ["neighborhood", "roomCount", "description"]
      }
    ],
    "featuresAdded": 0,
    "featuresRemoved": 0,
    "sourceFields": ["description", "neighborhood", "roomCount", "furnished", "elevator", "naturalGas", "parking"],
    "validation": {
      "noFeaturesInvented": true,
      "allFeaturesFromSource": true,
      "improvementsOnly": true
    }
  },
  "riskFlags": [],
  "sourceData": {
    "listing": { /* exact normalized listing data */ },
    "fieldsUsed": ["title", "description", "price", "roomCount", "squareMeters", "district", "neighborhood", "furnished", "elevator", "naturalGas", "parking", "siteSecurity"]
  },
  "metadata": {
    "generatorVersion": "1.0.0",
    "promptVersion": "1.0.0",
    "language": "TR",
    "processingSteps": [
      {
        "step": "seo_title_generation",
        "status": "SUCCESS"
      },
      {
        "step": "meta_description_generation",
        "status": "SUCCESS"
      },
      {
        "step": "tag_extraction",
        "status": "SUCCESS"
      },
      {
        "step": "description_rewrite",
        "status": "SUCCESS"
      }
    ]
  },
  "error": null
}
```

### 12.2 Error Example

```json
{
  "enrichmentId": "550e8400-e29b-41d4-a716-446655440001",
  "listingId": "123e4567-e89b-12d3-a456-426614174000",
  "generatedAt": "2026-02-18T10:30:00Z",
  "status": "ERROR",
  "seoTitleSuggestion": null,
  "metaDescription": null,
  "suggestedTags": [],
  "shortListingSummary": null,
  "rewriteDescription": null,
  "riskFlags": [],
  "sourceData": {
    "listing": { /* input data */ },
    "fieldsUsed": []
  },
  "metadata": {
    "generatorVersion": "1.0.0",
    "promptVersion": "1.0.0",
    "language": "TR",
    "processingSteps": [
      {
        "step": "input_validation",
        "status": "FAILED"
      }
    ]
  },
  "error": {
    "code": "INSUFFICIENT_DATA",
    "message": "İlan verisi yetersiz. Kritik alanlar eksik: description",
    "details": "Description field is missing or too short (< 20 characters)"
  }
}
```

---

**Document Status:** Canonical v1.0.0  
**Maintenance:** Update when prompt changes or schema evolves  
**Owner:** Platform Architecture Team
