# Deterministic Moderation Scoring System Specification
## Antalya Real Estate Platform (AREP)

**Version:** 1.0.0  
**Type:** Rule-Based, Deterministic, Explainable  
**Last Updated:** 2026-02-18  
**Status:** Canonical Reference

---

## 1. System Overview

### 1.1 Principles
- **Deterministic**: Same input always produces same output
- **Rule-Based**: No machine learning, pure algorithmic logic
- **Explainable**: Every score can be traced to specific rules
- **Transparent**: All scoring logic is documented and auditable
- **Measurable**: All criteria are quantifiable and objective

### 1.2 Input Schema
```json
{
  "title": "string",
  "description": "string",
  "price": "number (TRY)",
  "squareMeters": "number",
  "roomCount": "integer",
  "bathroomCount": "integer",
  "balconyCount": "integer",
  "furnished": "boolean | null",
  "naturalGas": "boolean | null",
  "elevator": "boolean | null",
  "parking": "boolean | null",
  "siteSecurity": "boolean | null",
  "district": "string",
  "neighborhood": "string",
  "coordinates": {
    "latitude": "number",
    "longitude": "number"
  },
  "imageCount": "integer"
}
```

### 1.3 Output Schema
```json
{
  "completenessScore": "integer (0-100)",
  "descriptionQualityScore": "integer (0-100)",
  "missingFields": {
    "required": ["string"],
    "recommended": ["string"]
  },
  "warnings": [
    {
      "code": "string",
      "severity": "LOW | MEDIUM | HIGH",
      "message": "string (Turkish)",
      "field": "string | null",
      "threshold": "any | null",
      "value": "any | null"
    }
  ],
  "tags": ["string"],
  "scoreBreakdown": {
    "completeness": {
      "basicInfo": "integer (0-100)",
      "location": "integer (0-100)",
      "specifications": "integer (0-100)",
      "media": "integer (0-100)"
    },
    "descriptionQuality": {
      "length": "integer (0-100)",
      "structure": "integer (0-100)",
      "keywords": "integer (0-100)",
      "readability": "integer (0-100)"
    }
  },
  "publishGate": {
    "canPublish": "boolean",
    "blockingReasons": ["string"],
    "thresholds": {
      "completenessScore": {
        "value": "integer",
        "publishThreshold": "integer",
        "requestChangesThreshold": "integer",
        "met": "boolean"
      },
      "descriptionQualityScore": {
        "value": "integer",
        "publishThreshold": "integer",
        "requestChangesThreshold": "integer",
        "met": "boolean"
      }
    }
  }
}
```

---

## 2. Completeness Score (0-100)

### 2.1 Scoring Formula
```
completenessScore = (
  basicInfoScore * 0.30 +
  locationScore * 0.25 +
  specificationsScore * 0.25 +
  mediaScore * 0.20
)
```

**Weight Distribution:**
- Basic Info: 30%
- Location: 25%
- Specifications: 25%
- Media: 20%

---

### 2.2 Basic Info Score (0-100)
**Weight:** 30% of completeness score

#### Required Fields (Critical - 60 points)
- `title`: Present and non-empty → 20 points
- `description`: Present and non-empty → 20 points
- `price`: Present and > 0 → 20 points

#### Quality Bonuses (40 points max)
- Title length 20-100 characters → +10 points
- Description length >= 100 characters → +10 points
- Price in realistic range (10,000 - 50,000,000 TRY) → +10 points
- Furnished field provided (not null) → +10 points

#### Scoring Breakdown
| Condition | Points |
|-----------|--------|
| Title present | 20 |
| Description present | 20 |
| Price present and > 0 | 20 |
| Title length 20-100 chars | 10 |
| Description length >= 100 chars | 10 |
| Price 10K-50M TRY | 10 |
| Furnished field provided | 10 |
| **Maximum** | **100** |

---

### 2.3 Location Score (0-100)
**Weight:** 25% of completeness score

#### Required Fields (Critical - 60 points)
- `district`: Present, non-empty, valid Antalya district → 30 points
- `neighborhood`: Present, non-empty → 20 points
- `coordinates`: Present, valid lat/lon, within Antalya bounds → 10 points

#### Valid Antalya Districts
```
["Muratpaşa", "Kepez", "Konyaaltı", "Aksu", "Döşemealtı", "Korkuteli", 
 "Kumluca", "Manavgat", "Serik", "Alanya", "Gazipaşa", "Gündoğmuş", 
 "İbradı", "Kaş", "Kemer", "Finike", "Demre", "Elmalı"]
```

#### Antalya Bounding Box
```
Latitude: 36.0 to 37.0
Longitude: 30.0 to 32.0
```

#### Quality Bonuses (40 points max)
- Neighborhood length >= 3 characters → +10 points
- Coordinates have high precision (>= 6 decimal places) → +10 points
- Both district and neighborhood provided → +10 points
- Premium location match → +10 points

#### Premium Location Mapping
```
Muratpaşa: ["Konyaaltı", "Lara", "Kundu", "Beach Park"]
Konyaaltı: ["Beach", "Sahil", "Liman"]
Alanya: ["Keykubat", "Mahmutlar", "Oba", "Tosmur"]
```

#### Scoring Breakdown
| Condition | Points |
|-----------|--------|
| District valid | 30 |
| Neighborhood present | 20 |
| Coordinates valid and in bounds | 10 |
| Neighborhood length >= 3 | 10 |
| Coordinates high precision | 10 |
| District + neighborhood both present | 10 |
| Premium location | 10 |
| **Maximum** | **100** |

---

### 2.4 Specifications Score (0-100)
**Weight:** 25% of completeness score

#### Required Fields (Critical - 50 points)
- `squareMeters`: Present and > 0 → 25 points
- `roomCount`: Present and >= 0 → 25 points

#### Quality Bonuses (50 points max)
- Square meters in realistic range (50-500 m²) → +10 points
- Room count in realistic range (1-10) → +10 points
- Balcony count provided → +10 points
- Balcony count > 0 → +5 points
- Furnished field provided → +10 points
- Realistic m² per room ratio (15-50 m²/room) → +5 points

#### Realistic Ratio Calculation
```
sqmPerRoom = squareMeters / roomCount
Valid if: sqmPerRoom >= 15 AND sqmPerRoom <= 50
```

#### Scoring Breakdown
| Condition | Points |
|-----------|--------|
| Square meters present and > 0 | 25 |
| Room count present and >= 0 | 25 |
| Square meters 50-500 | 10 |
| Room count 1-10 | 10 |
| Balcony count provided | 10 |
| Balcony count > 0 | 5 |
| Furnished provided | 10 |
| Realistic m²/room ratio | 5 |
| **Maximum** | **100** |

---

### 2.5 Media Score (0-100)
**Weight:** 20% of completeness score

#### Scoring Rules
| Image Count | Score |
|-------------|-------|
| 0 | 0 |
| 1 | 30 |
| 2-4 | 50 |
| 5-9 | 75 |
| 10-20 | 95 |
| 21-50 | 100 |

#### Scoring Breakdown
- **No images**: 0 points (blocking)
- **1 image**: 30 points (minimum acceptable)
- **2-4 images**: 50 points (basic coverage)
- **5-9 images**: 75 points (good coverage)
- **10-20 images**: 95 points (excellent coverage)
- **21+ images**: 100 points (comprehensive)

---

## 3. Description Quality Score (0-100)

### 3.1 Scoring Formula
```
descriptionQualityScore = (
  lengthScore * 0.30 +
  structureScore * 0.25 +
  keywordsScore * 0.25 +
  readabilityScore * 0.20
)
```

**Weight Distribution:**
- Length: 30%
- Structure: 25%
- Keywords: 25%
- Readability: 20%

---

### 3.2 Length Score (0-100)
**Weight:** 30% of description quality score

#### Character Length Scoring (50 points)
| Length Range | Score |
|--------------|-------|
| < 50 chars | 0 |
| 50-99 chars | 20 |
| 100-199 chars | 35 |
| 200-499 chars | 50 |
| 500-999 chars | 45 |
| 1000-1999 chars | 30 |
| >= 2000 chars | 10 |

#### Word Count Scoring (50 points)
| Word Count | Score |
|------------|-------|
| < 10 words | 0 |
| 10-19 words | 15 |
| 20-49 words | 30 |
| 50-149 words | 50 |
| 150-299 words | 40 |
| >= 300 words | 20 |

#### Combined Length Score
```
lengthScore = (characterLengthScore + wordCountScore) / 2
```

---

### 3.3 Structure Score (0-100)
**Weight:** 25% of description quality score

#### Sentence Count Scoring (30 points)
| Sentence Count | Score |
|----------------|-------|
| 1 sentence | 10 |
| 2 sentences | 20 |
| 3-15 sentences | 30 |
| > 15 sentences | 20 |

#### Paragraph Structure Scoring (30 points)
| Paragraph Count | Score |
|-----------------|-------|
| 1 paragraph (if length > 200) | 15 |
| 2-5 paragraphs | 30 |
| > 5 paragraphs | 20 |

#### Punctuation Usage Scoring (20 points)
- Has periods AND commas: 20 points
- Has periods only: 10 points
- No punctuation: 0 points

#### Capitalization Scoring (20 points)
- First character uppercase: 10 points
- >= 80% sentences start with uppercase: 10 points

#### Combined Structure Score
```
structureScore = sentenceScore + paragraphScore + punctuationScore + capitalizationScore
```

---

### 3.4 Keywords Score (0-100)
**Weight:** 25% of description quality score

#### Real Estate Keyword Categories

**Location Keywords:**
```
["konum", "lokasyon", "mahalle", "semt", "bölge", "yakın", "yakınında", 
 "merkez", "sahil", "deniz", "plaj", "lara", "konyaaltı", "muratpaşa"]
```

**Property Type Keywords:**
```
["daire", "ev", "villa", "apartman", "rezidans", "müstakil", "penthouse", 
 "stüdyo", "triplex", "duplex"]
```

**Feature Keywords:**
```
["balkon", "teras", "bahçe", "havuz", "deniz manzarası", "manzara", 
 "güvenlik", "otopark", "asansör", "eşyalı", "eşyasız", "doğalgaz", 
 "site", "güvenlikli"]
```

**Quality Keywords:**
```
["kaliteli", "lüks", "modern", "yeni", "bakımlı", "ferah", "geniş", 
 "aydınlık", "güneş"]
```

**Amenity Keywords:**
```
["okul", "hastane", "market", "alışveriş", "plaj", "restoran", "ulaşım", 
 "metro", "otobüs", "üniversite", "üniversite yakın"]
```

#### Scoring Rules
- Check each category for keyword matches
- 20 points per category found (max 100 points)
- Bonus: +10 points if 3+ categories found
- Penalty: -20 points if keyword stuffing detected (> 20 total matches)

#### Keyword Stuffing Detection
```
totalKeywordMatches = sum of all keyword occurrences
If totalKeywordMatches > 20: Apply penalty
```

---

### 3.5 Readability Score (0-100)
**Weight:** 20% of description quality score

#### Average Sentence Length Scoring (30 points)
| Words per Sentence | Score |
|-------------------|-------|
| 10-25 words | 30 |
| 8-30 words | 20 |
| 5-35 words | 10 |
| < 5 or > 35 words | 0 |

#### Repetition Check Scoring (25 points)
- Max repetition <= 3 AND unique words >= 20: 25 points
- Max repetition <= 5 AND unique words >= 15: 15 points
- Max repetition > 8: 0 points
- Otherwise: 10 points

#### Special Characters Scoring (20 points)
- Has numbers AND no excessive special chars: 20 points
- Has numbers only: 15 points
- No numbers: 10 points

#### Spam Pattern Detection (25 points)
- Excessive capitalization (> 30%): -15 points
- Repeated characters (5+ same char): -10 points
- Base score: 25 points

#### Combined Readability Score
```
readabilityScore = sentenceLengthScore + repetitionScore + specialCharsScore + spamPenaltyScore
Minimum: 0, Maximum: 100
```

---

## 4. Missing Fields Rules

### 4.1 Required Fields
**Definition:** Fields that MUST be present for listing submission.

**Required Fields List:**
- `title`
- `description`
- `price`
- `squareMeters`
- `roomCount`
- `district`
- `neighborhood`
- `coordinates.latitude`
- `coordinates.longitude`
- `imageCount` (minimum: 1)

**Validation:**
- If any required field is missing: Add to `missingFields.required` array
- Listing cannot be submitted if required fields missing

---

### 4.2 Recommended Fields
**Definition:** Fields that SHOULD be present for optimal listing quality.

**Recommended Fields List:**
- `bathroomCount`
- `balconyCount`
- `furnished`
- `naturalGas`
- `elevator`
- `parking`
- `siteSecurity`

**Validation:**
- If recommended field is missing: Add to `missingFields.recommended` array
- Listing can be submitted but generates warnings

---

### 4.3 Missing Fields Detection Rules

#### Rule MISS-1: Null or Undefined Check
**Rule:** Field is missing if value is `null` or `undefined`.

**Validation:**
- Check: `value === null || value === undefined`
- If true: Field is missing

#### Rule MISS-2: Empty String Check
**Rule:** String fields are missing if empty or whitespace-only.

**Validation:**
- Check: `value.trim().length === 0`
- If true: Field is missing

#### Rule MISS-3: Zero or Negative Check
**Rule:** Numeric fields are missing if zero or negative (for required fields).

**Validation:**
- Check: `value <= 0` (for price, squareMeters)
- If true: Field is missing

#### Rule MISS-4: Array Empty Check
**Rule:** Array fields are missing if empty.

**Validation:**
- Check: `array.length === 0`
- If true: Field is missing

---

## 5. Warnings List and Triggers

### 5.1 Warning Severity Levels
- **LOW**: Minor issue, informational
- **MEDIUM**: Moderate issue, should be addressed
- **HIGH**: Significant issue, strongly recommended to fix

---

### 5.2 Price Warnings

#### Warning PRICE-1: Price Too Low
**Code:** `PRICE_TOO_LOW`
**Severity:** HIGH
**Trigger:** `pricePerSqm < 500 TRY/m²`
**Message (Turkish):** "Fiyat metrekare başına çok düşük görünüyor. Lütfen kontrol edin."
**Field:** `price`

#### Warning PRICE-2: Price Too High
**Code:** `PRICE_TOO_HIGH`
**Severity:** MEDIUM
**Trigger:** `pricePerSqm > 50000 TRY/m²`
**Message (Turkish):** "Fiyat metrekare başına çok yüksek görünüyor. Lütfen kontrol edin."
**Field:** `price`

---

### 5.3 Size Warnings

#### Warning SIZE-1: Size Too Small
**Code:** `SIZE_TOO_SMALL`
**Severity:** MEDIUM
**Trigger:** `squareMeters < 20`
**Message (Turkish):** "Metrekare çok küçük görünüyor. Lütfen kontrol edin."
**Field:** `squareMeters`

#### Warning SIZE-2: Size-Room Mismatch
**Code:** `SIZE_ROOM_MISMATCH`
**Severity:** LOW
**Trigger:** `squareMeters > 1000 AND roomCount < 5`
**Message (Turkish):** "Metrekare ve oda sayısı arasında uyumsuzluk olabilir."
**Field:** `squareMeters`

---

### 5.4 Room Count Warnings

#### Warning ROOM-1: No Rooms
**Code:** `NO_ROOMS`
**Severity:** MEDIUM
**Trigger:** `roomCount === 0 AND squareMeters > 30`
**Message (Turkish):** "Stüdyo daireler için oda sayısı 0 olabilir, ancak metrekare kontrol edilmeli."
**Field:** `roomCount`

#### Warning ROOM-2: Too Many Rooms
**Code:** `TOO_MANY_ROOMS`
**Severity:** LOW
**Trigger:** `roomCount > 10`
**Message (Turkish):** "Oda sayısı alışılmadık derecede yüksek."
**Field:** `roomCount`

---

### 5.5 Location Warnings

#### Warning LOC-1: Coordinates Out of Bounds
**Code:** `COORDINATES_OUT_OF_BOUNDS`
**Severity:** HIGH
**Trigger:** `latitude < 36.0 OR latitude > 37.0 OR longitude < 30.0 OR longitude > 32.0`
**Message (Turkish):** "Koordinatlar Antalya sınırları dışında görünüyor."
**Field:** `coordinates`

#### Warning LOC-2: Invalid District
**Code:** `INVALID_DISTRICT`
**Severity:** HIGH
**Trigger:** `district NOT IN validDistrictsList`
**Message (Turkish):** "{district} geçerli bir Antalya ilçesi değil."
**Field:** `district`

---

### 5.6 Description Warnings

#### Warning DESC-1: Description Too Short
**Code:** `DESCRIPTION_TOO_SHORT`
**Severity:** MEDIUM
**Trigger:** `description.length < 50`
**Message (Turkish):** "Açıklama çok kısa. Daha detaylı bilgi ekleyin."
**Field:** `description`

#### Warning DESC-2: Description Too Long
**Code:** `DESCRIPTION_TOO_LONG`
**Severity:** LOW
**Trigger:** `description.length > 2000`
**Message (Turkish):** "Açıklama çok uzun. Daha kısa ve öz olabilir."
**Field:** `description`

#### Warning DESC-3: Spam Pattern Detected
**Code:** `SPAM_PATTERN_DETECTED`
**Severity:** HIGH
**Trigger:** `repeatedCharPattern.test(description)` (same char 5+ times)
**Message (Turkish):** "Açıklamada spam benzeri kalıplar tespit edildi."
**Field:** `description`

#### Warning DESC-4: Contact in Description
**Code:** `CONTACT_IN_DESCRIPTION`
**Severity:** MEDIUM
**Trigger:** `phonePattern.test(description) OR emailPattern.test(description)`
**Message (Turkish):** "İletişim bilgileri açıklamada olmamalı. Lütfen ilgili alanları kullanın."
**Field:** `description`

---

### 5.7 Title Warnings

#### Warning TITLE-1: Title Too Short
**Code:** `TITLE_TOO_SHORT`
**Severity:** HIGH
**Trigger:** `title.length < 10`
**Message (Turkish):** "Başlık çok kısa. En az 10 karakter olmalı."
**Field:** `title`

#### Warning TITLE-2: Title Too Long
**Code:** `TITLE_TOO_LONG`
**Severity:** MEDIUM
**Trigger:** `title.length > 100`
**Message (Turkish):** "Başlık çok uzun. 100 karakterden kısa olmalı."
**Field:** `title`

#### Warning TITLE-3: Title All Caps
**Code:** `TITLE_ALL_CAPS`
**Severity:** LOW
**Trigger:** `capsRatio > 0.5 AND title.length > 15`
**Message (Turkish):** "Başlık tamamen büyük harflerle yazılmış. Normal yazım tercih edilir."
**Field:** `title`

---

### 5.8 Media Warnings

#### Warning MEDIA-1: No Images
**Code:** `NO_IMAGES`
**Severity:** HIGH
**Trigger:** `imageCount === 0`
**Message (Turkish):** "En az 1 görsel eklenmelidir."
**Field:** `imageCount`

#### Warning MEDIA-2: Insufficient Images
**Code:** `INSUFFICIENT_IMAGES`
**Severity:** MEDIUM
**Trigger:** `imageCount === 1`
**Message (Turkish):** "Daha fazla görsel eklemek önerilir (en az 3-5 görsel)."
**Field:** `imageCount`

---

### 5.9 Balcony Warnings

#### Warning BALC-1: Balcony Count High
**Code:** `BALCONY_COUNT_HIGH`
**Severity:** LOW
**Trigger:** `balconyCount > roomCount AND roomCount > 0`
**Message (Turkish):** "Balkon sayısı oda sayısından fazla görünüyor."
**Field:** `balconyCount`

---

## 6. Deterministic Tag Extraction Rules

### 6.1 Tag Extraction Principles
- **Rule-Based**: Tags extracted from structured data and text analysis
- **No Inference**: Tags only extracted if explicitly stated or derivable from data
- **Turkish-Aware**: Handles Turkish keywords and variations
- **Case-Insensitive**: Matching is case-insensitive with Turkish character normalization

---

### 6.2 Tag Categories

#### Category: FURNISHED_STATUS
**Tags:** `"eşyalı"`, `"eşyasız"`

**Extraction Rules:**

**Rule TAG-FURN-1: From Structured Data**
- If `furnished === true`: Extract `"eşyalı"`
- If `furnished === false`: Extract `"eşyasız"`
- If `furnished === null`: No tag extracted

**Rule TAG-FURN-2: From Description Text**
- Search description for keywords: `["eşyalı", "mobilyalı", "furnished"]`
- If found: Extract `"eşyalı"`
- Search description for keywords: `["eşyasız", "mobilyasız", "unfurnished"]`
- If found: Extract `"eşyasız"`

**Priority:** Structured data takes precedence over text extraction

---

#### Category: BALCONY
**Tags:** `"balkon"`, `"çoklu balkon"`

**Extraction Rules:**

**Rule TAG-BALC-1: From Structured Data**
- If `balconyCount > 0`: Extract `"balkon"`
- If `balconyCount > 1`: Also extract `"çoklu balkon"`

**Rule TAG-BALC-2: From Description Text**
- Search description for keywords: `["balkon", "balkonlu", "teras", "teraslı"]`
- If found: Extract `"balkon"`
- Search for multiple mentions: If keyword appears 2+ times, extract `"çoklu balkon"`

**Priority:** Structured data takes precedence

---

#### Category: NATURAL_GAS
**Tags:** `"doğalgaz"`

**Extraction Rules:**

**Rule TAG-GAS-1: From Structured Data**
- If `naturalGas === true`: Extract `"doğalgaz"`
- If `naturalGas === false`: No tag extracted
- If `naturalGas === null`: Check text extraction

**Rule TAG-GAS-2: From Description Text**
- Search description for keywords: `["doğalgaz", "doğal gaz", "natural gas", "doğalgazlı"]`
- If found: Extract `"doğalgaz"`

**Priority:** Structured data takes precedence

---

#### Category: ELEVATOR
**Tags:** `"asansör"`

**Extraction Rules:**

**Rule TAG-ELEV-1: From Structured Data**
- If `elevator === true`: Extract `"asansör"`
- If `elevator === false`: No tag extracted
- If `elevator === null`: Check text extraction

**Rule TAG-ELEV-2: From Description Text**
- Search description for keywords: `["asansör", "asansörlü", "elevator", "lift"]`
- If found: Extract `"asansör"`

**Priority:** Structured data takes precedence

---

#### Category: PARKING
**Tags:** `"otopark"`, `"kapalı otopark"`

**Extraction Rules:**

**Rule TAG-PARK-1: From Structured Data**
- If `parking === true`: Extract `"otopark"`
- If `parking === false`: No tag extracted
- If `parking === null`: Check text extraction

**Rule TAG-PARK-2: From Description Text**
- Search description for keywords: `["otopark", "parking", "garaj", "garage"]`
- If found: Extract `"otopark"`
- Search for: `["kapalı otopark", "covered parking", "kapalı garaj"]`
- If found: Extract `"kapalı otopark"` (instead of `"otopark"`)

**Priority:** Structured data takes precedence

---

#### Category: SITE_SECURITY
**Tags:** `"site"`, `"güvenlikli site"`

**Extraction Rules:**

**Rule TAG-SITE-1: From Structured Data**
- If `siteSecurity === true`: Extract `"güvenlikli site"`
- If `siteSecurity === false`: No tag extracted
- If `siteSecurity === null`: Check text extraction

**Rule TAG-SITE-2: From Description Text**
- Search description for keywords: `["site", "güvenlikli site", "güvenlik", "security", "güvenlikli"]`
- If found: Extract `"güvenlikli site"`
- Search for: `["site içinde", "site içi", "site içerisinde"]`
- If found: Extract `"site"` (if security not mentioned)

**Priority:** Structured data takes precedence

---

#### Category: NEAR_UNIVERSITY
**Tags:** `"üniversite yakın"`

**Extraction Rules:**

**Rule TAG-UNIV-1: From Description Text Only**
- Search description for keywords: `["üniversite yakın", "üniversiteye yakın", "near university", "üniversite yanında", "üniversite civarında"]`
- If found: Extract `"üniversite yakın"`

**Note:** No structured data field for this, text extraction only

---

#### Category: SEA_VIEW
**Tags:** `"deniz manzarası"`, `"denize yakın"`

**Extraction Rules:**

**Rule TAG-SEA-1: From Description Text**
- Search description for keywords: `["deniz manzarası", "sea view", "deniz görünümü", "deniz manzaralı"]`
- If found: Extract `"deniz manzarası"`
- Search for keywords: `["denize yakın", "near sea", "sahile yakın", "plaja yakın"]`
- If found: Extract `"denize yakın"`

**Rule TAG-SEA-2: From Coordinates (Inference)**
- If coordinates latitude >= 36.7 AND latitude <= 37.0 (coastal area)
- AND description contains `["deniz", "sea", "sahil", "beach"]`
- Then extract `"denize yakın"` (not `"deniz manzarası"` - requires explicit mention)

**Priority:** Explicit text mention takes precedence over coordinate inference

---

### 6.3 Tag Extraction Process

#### Step 1: Structured Data Extraction
1. Check all boolean fields (`furnished`, `naturalGas`, `elevator`, `parking`, `siteSecurity`)
2. Extract tags based on `true` values
3. Store source: `"STRUCTURED_DATA"`

#### Step 2: Text Analysis Extraction
1. Normalize description text (Turkish-aware, case-insensitive)
2. Search for keyword patterns in each category
3. Extract tags if keywords found
4. Store source: `"DESCRIPTION_TEXT"`

#### Step 3: Coordinate-Based Extraction
1. Check coordinates for sea view inference
2. Extract tags only if description also mentions sea/beach
3. Store source: `"COORDINATE_INFERENCE"`

#### Step 4: Deduplication
1. Remove duplicate tags
2. Prefer structured data tags over text tags
3. Prefer explicit text tags over inferred tags

---

### 6.4 Tag Extraction Examples

**Example 1:**
```
Input:
{
  "furnished": true,
  "balconyCount": 2,
  "elevator": true,
  "description": "Lüks daire, doğalgazlı, otoparklı"
}

Extracted Tags:
["eşyalı", "balkon", "çoklu balkon", "asansör", "otopark", "doğalgaz"]
```

**Example 2:**
```
Input:
{
  "furnished": null,
  "description": "Eşyasız daire, üniversiteye yakın, deniz manzarası"
}

Extracted Tags:
["eşyasız", "üniversite yakın", "deniz manzarası"]
```

**Example 3:**
```
Input:
{
  "siteSecurity": true,
  "parking": true,
  "description": "Güvenlikli site içinde, kapalı otoparklı"
}

Extracted Tags:
["güvenlikli site", "kapalı otopark"]
```

---

## 7. Publish Gating Thresholds vs Request-Changes Thresholds

### 7.1 Threshold Definitions

#### Publish Gate Thresholds
**Definition:** Minimum scores required for automatic approval (publish without admin review).

**Thresholds:**
- `completenessScore >= 80`
- `descriptionQualityScore >= 70`
- No HIGH severity warnings
- All required fields present
- At least 3 images

#### Request Changes Thresholds
**Definition:** Minimum scores required for submission (but requires admin review/changes).

**Thresholds:**
- `completenessScore >= 60`
- `descriptionQualityScore >= 50`
- No CRITICAL blocking errors
- All required fields present
- At least 1 image

---

### 7.2 Completeness Score Thresholds

#### Publish Gate: Completeness Score
**Threshold:** `completenessScore >= 80`

**Breakdown Requirements:**
- `basicInfoScore >= 80` (recommended)
- `locationScore >= 80` (recommended)
- `specificationsScore >= 70` (minimum)
- `mediaScore >= 75` (5+ images recommended)

**Blocking Conditions:**
- `completenessScore < 60`: Cannot submit (hard failure)
- `completenessScore >= 60 AND < 80`: Can submit, requires changes
- `completenessScore >= 80`: Can publish (if other thresholds met)

---

#### Request Changes: Completeness Score
**Threshold:** `completenessScore >= 60`

**Breakdown Requirements:**
- `basicInfoScore >= 60` (minimum)
- `locationScore >= 60` (minimum)
- `specificationsScore >= 50` (minimum)
- `mediaScore >= 30` (1+ images minimum)

**Conditions:**
- `completenessScore < 60`: Hard failure, cannot submit
- `completenessScore >= 60`: Can submit for review

---

### 7.3 Description Quality Score Thresholds

#### Publish Gate: Description Quality Score
**Threshold:** `descriptionQualityScore >= 70`

**Breakdown Requirements:**
- `lengthScore >= 60` (recommended)
- `structureScore >= 60` (recommended)
- `keywordsScore >= 70` (recommended)
- `readabilityScore >= 60` (recommended)

**Blocking Conditions:**
- `descriptionQualityScore < 50`: Cannot submit (hard failure)
- `descriptionQualityScore >= 50 AND < 70`: Can submit, requires changes
- `descriptionQualityScore >= 70`: Can publish (if other thresholds met)

---

#### Request Changes: Description Quality Score
**Threshold:** `descriptionQualityScore >= 50`

**Breakdown Requirements:**
- `lengthScore >= 40` (minimum)
- `structureScore >= 40` (minimum)
- `keywordsScore >= 50` (minimum)
- `readabilityScore >= 40` (minimum)

**Conditions:**
- `descriptionQualityScore < 50`: Hard failure, cannot submit
- `descriptionQualityScore >= 50`: Can submit for review

---

### 7.4 Warning-Based Thresholds

#### Publish Gate: Warning Restrictions
**Rule:** No HIGH severity warnings allowed for publish gate.

**Allowed:**
- LOW severity warnings: Up to 5 warnings
- MEDIUM severity warnings: Up to 3 warnings
- HIGH severity warnings: 0 warnings (blocking)

**Blocking Conditions:**
- Any HIGH severity warning: Blocks publish gate
- > 5 LOW severity warnings: Blocks publish gate
- > 3 MEDIUM severity warnings: Blocks publish gate

---

#### Request Changes: Warning Restrictions
**Rule:** No CRITICAL blocking errors allowed.

**Allowed:**
- LOW severity warnings: Unlimited (but flagged)
- MEDIUM severity warnings: Unlimited (but flagged)
- HIGH severity warnings: Up to 2 warnings
- CRITICAL errors: 0 (blocking)

**Blocking Conditions:**
- Any CRITICAL error: Blocks submission
- > 2 HIGH severity warnings: Blocks submission

---

### 7.5 Missing Fields Thresholds

#### Publish Gate: Missing Fields
**Rule:** No required fields missing, maximum 2 recommended fields missing.

**Requirements:**
- Required fields: 0 missing (hard requirement)
- Recommended fields: Maximum 2 missing

**Blocking Conditions:**
- Any required field missing: Blocks publish gate
- > 2 recommended fields missing: Blocks publish gate

---

#### Request Changes: Missing Fields
**Rule:** No required fields missing, recommended fields missing allowed.

**Requirements:**
- Required fields: 0 missing (hard requirement)
- Recommended fields: Missing allowed (but generates warnings)

**Blocking Conditions:**
- Any required field missing: Blocks submission

---

### 7.6 Media Thresholds

#### Publish Gate: Media Requirements
**Threshold:** `imageCount >= 3`

**Requirements:**
- Minimum 3 images
- At least 1 primary image
- All images pass quality checks

**Blocking Conditions:**
- `imageCount < 3`: Blocks publish gate (warning)
- `imageCount === 0`: Blocks submission (hard failure)

---

#### Request Changes: Media Requirements
**Threshold:** `imageCount >= 1`

**Requirements:**
- Minimum 1 image
- At least 1 primary image
- All images pass quality checks

**Blocking Conditions:**
- `imageCount === 0`: Blocks submission (hard failure)

---

### 7.7 Combined Threshold Matrix

| Score | Completeness | Description Quality | Warnings | Missing Fields | Images | Result |
|-------|--------------|---------------------|----------|----------------|--------|--------|
| >= 80 | >= 80 | >= 70 | 0 HIGH, <= 5 LOW, <= 3 MED | 0 required, <= 2 recommended | >= 3 | **PUBLISH GATE** |
| >= 60 | >= 60 | >= 50 | 0 CRITICAL, <= 2 HIGH | 0 required | >= 1 | **REQUEST CHANGES** |
| < 60 | < 60 | < 50 | Any CRITICAL | Any required missing | 0 | **BLOCKED** |

---

### 7.8 Publish Gate Decision Logic

#### Rule PUB-GATE-1: All Thresholds Met
**Condition:** All publish gate thresholds met
**Result:** `canPublish: true`
**Action:** Listing can be published without admin review

**Checklist:**
- [ ] `completenessScore >= 80`
- [ ] `descriptionQualityScore >= 70`
- [ ] No HIGH severity warnings
- [ ] <= 5 LOW severity warnings
- [ ] <= 3 MEDIUM severity warnings
- [ ] 0 required fields missing
- [ ] <= 2 recommended fields missing
- [ ] `imageCount >= 3`

---

#### Rule PUB-GATE-2: Request Changes Threshold Met
**Condition:** Request changes thresholds met but publish gate not met
**Result:** `canPublish: false`, `canSubmit: true`
**Action:** Listing can be submitted but requires admin review/changes

**Checklist:**
- [ ] `completenessScore >= 60`
- [ ] `descriptionQualityScore >= 50`
- [ ] No CRITICAL errors
- [ ] <= 2 HIGH severity warnings
- [ ] 0 required fields missing
- [ ] `imageCount >= 1`

---

#### Rule PUB-GATE-3: Blocked
**Condition:** Below request changes thresholds
**Result:** `canPublish: false`, `canSubmit: false`
**Action:** Listing cannot be submitted, consultant must fix issues

**Blocking Conditions:**
- `completenessScore < 60`
- `descriptionQualityScore < 50`
- Any CRITICAL error
- Any required field missing
- `imageCount === 0`

---

## 8. Complete Scoring Algorithm

### 8.1 Processing Steps

**Step 1: Input Validation**
- Validate all input fields
- Check data types
- Normalize text fields

**Step 2: Completeness Score Calculation**
- Calculate `basicInfoScore` (30% weight)
- Calculate `locationScore` (25% weight)
- Calculate `specificationsScore` (25% weight)
- Calculate `mediaScore` (20% weight)
- Calculate weighted sum: `completenessScore`

**Step 3: Description Quality Score Calculation**
- Calculate `lengthScore` (30% weight)
- Calculate `structureScore` (25% weight)
- Calculate `keywordsScore` (25% weight)
- Calculate `readabilityScore` (20% weight)
- Calculate weighted sum: `descriptionQualityScore`

**Step 4: Missing Fields Detection**
- Check required fields
- Check recommended fields
- Generate `missingFields` object

**Step 5: Warning Generation**
- Check all warning triggers
- Generate warnings array with severity levels
- Categorize by field

**Step 6: Tag Extraction**
- Extract tags from structured data
- Extract tags from description text
- Extract tags from coordinates (if applicable)
- Deduplicate and prioritize

**Step 7: Publish Gate Evaluation**
- Check publish gate thresholds
- Check request changes thresholds
- Generate `publishGate` object

**Step 8: Output Generation**
- Combine all scores
- Include breakdowns
- Include warnings and tags
- Include publish gate decision

---

## 9. Output Schema (Complete)

```json
{
  "completenessScore": "integer (0-100)",
  "descriptionQualityScore": "integer (0-100)",
  "missingFields": {
    "required": ["string"],
    "recommended": ["string"]
  },
  "warnings": [
    {
      "code": "string",
      "severity": "LOW | MEDIUM | HIGH",
      "message": "string (Turkish)",
      "field": "string | null",
      "threshold": "any | null",
      "value": "any | null"
    }
  ],
  "tags": ["string"],
  "scoreBreakdown": {
    "completeness": {
      "basicInfo": "integer (0-100)",
      "location": "integer (0-100)",
      "specifications": "integer (0-100)",
      "media": "integer (0-100)"
    },
    "descriptionQuality": {
      "length": "integer (0-100)",
      "structure": "integer (0-100)",
      "keywords": "integer (0-100)",
      "readability": "integer (0-100)"
    }
  },
  "publishGate": {
    "canPublish": "boolean",
    "canSubmit": "boolean",
    "blockingReasons": ["string"],
    "thresholds": {
      "completenessScore": {
        "value": "integer",
        "publishThreshold": 80,
        "requestChangesThreshold": 60,
        "publishMet": "boolean",
        "requestChangesMet": "boolean"
      },
      "descriptionQualityScore": {
        "value": "integer",
        "publishThreshold": 70,
        "requestChangesThreshold": 50,
        "publishMet": "boolean",
        "requestChangesMet": "boolean"
      },
      "warnings": {
        "highCount": "integer",
        "mediumCount": "integer",
        "lowCount": "integer",
        "publishAllowed": "boolean",
        "requestChangesAllowed": "boolean"
      },
      "missingFields": {
        "requiredMissing": "integer",
        "recommendedMissing": "integer",
        "publishAllowed": "boolean",
        "requestChangesAllowed": "boolean"
      },
      "images": {
        "count": "integer",
        "publishThreshold": 3,
        "requestChangesThreshold": 1,
        "publishMet": "boolean",
        "requestChangesMet": "boolean"
      }
    }
  }
}
```

---

## 10. Threshold Summary Table

| Metric | Publish Gate | Request Changes | Blocked |
|--------|--------------|-----------------|---------|
| Completeness Score | >= 80 | >= 60 | < 60 |
| Description Quality | >= 70 | >= 50 | < 50 |
| HIGH Warnings | 0 | <= 2 | > 2 |
| MEDIUM Warnings | <= 3 | Unlimited | - |
| LOW Warnings | <= 5 | Unlimited | - |
| Required Fields Missing | 0 | 0 | > 0 |
| Recommended Fields Missing | <= 2 | Unlimited | - |
| Images | >= 3 | >= 1 | 0 |

---

**Document Status:** Canonical v1.0.0  
**Maintenance:** Update when thresholds change or new tags added  
**Owner:** Platform Architecture Team
