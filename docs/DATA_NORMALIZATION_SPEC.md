# Data Normalization Specification
## Antalya Real Estate Platform (AREP)

**Version:** 1.0.0  
**Last Updated:** 2026-02-18  
**Status:** Canonical Reference

---

## 1. Overview

This document defines data normalization and validation rules for real estate listing data in the Antalya Real Estate Platform. All input data MUST be normalized and validated before storage.

### 1.1 Normalization Principles
- **Consistency**: Same input always produces same normalized output
- **Preservation**: Normalization preserves semantic meaning
- **Reversibility**: Normalized data can be traced back to original input
- **Turkish-Aware**: Proper handling of Turkish characters and conventions

### 1.2 Input Schema
```json
{
  "title": "string",
  "description": "string",
  "price": "number",
  "category": "string",
  "squareMeters": "number",
  "roomCount": "string | integer",
  "bathroomCount": "integer",
  "balconyCount": "integer",
  "furnished": "boolean | string",
  "district": "string",
  "neighborhood": "string",
  "latitude": "number",
  "longitude": "number"
}
```

### 1.3 Output Schema (Normalized)
```json
{
  "title": "string (normalized)",
  "description": "string (normalized)",
  "price": "number (normalized)",
  "category": "RENT | SALE",
  "squareMeters": "number (normalized)",
  "roomCount": "integer (normalized)",
  "bathroomCount": "integer (normalized)",
  "balconyCount": "integer (normalized)",
  "furnished": "boolean (normalized)",
  "district": "string (normalized)",
  "neighborhood": "string (normalized)",
  "latitude": "number (normalized)",
  "longitude": "number (normalized)",
  "validationResult": {
    "valid": "boolean",
    "hardFailures": ["string"],
    "warnings": ["string"]
  }
}
```

---

## 2. Normalization Rules

### 2.1 Text Normalization (Title, Description)

#### Rule NORM-TEXT-1: Unicode Normalization
**Rule:** All text fields MUST be normalized to NFC (Canonical Decomposition, followed by Canonical Composition).

**Process:**
1. Normalize to NFC form
2. Remove zero-width characters (U+200B-U+200D, U+FEFF)
3. Remove bidirectional override characters (U+202A-U+202E)
4. Replace multiple whitespace with single space
5. Trim leading and trailing whitespace

**Examples:**
- Input: `"Lüks   Daire"` → Output: `"Lüks Daire"`
- Input: `"Daire\u200B"` → Output: `"Daire"`
- Input: `"Lüks\u0301 Daire"` → Output: `"Lüks Daire"` (NFC normalization)

#### Rule NORM-TEXT-2: Case Normalization
**Rule:** Title case normalization for Turkish language.

**Process:**
1. First character: Uppercase (Turkish-aware)
2. Remaining characters: Lowercase (Turkish-aware)
3. Special handling for Turkish İ/i and I/ı

**Examples:**
- Input: `"lüks daire"` → Output: `"Lüks Daire"`
- Input: `"İSTANBUL"` → Output: `"İstanbul"`
- Input: `"istanbul"` → Output: `"İstanbul"`
- Input: `"LARA'DA"` → Output: `"Lara'da"`

**Turkish Case Mapping:**
- `i` → `İ` (uppercase)
- `ı` → `I` (uppercase)
- `İ` → `i` (lowercase)
- `I` → `ı` (lowercase)

#### Rule NORM-TEXT-3: Diacritics Preservation
**Rule:** Turkish diacritics MUST be preserved and normalized.

**Allowed Turkish Characters:**
- `İ`, `ı`, `Ş`, `ş`, `Ğ`, `ğ`, `Ü`, `ü`, `Ö`, `ö`, `Ç`, `ç`

**Process:**
1. Preserve all Turkish diacritics
2. Normalize composed forms (e.g., `ü` not `u\u0308`)
3. Reject invalid diacritic combinations

**Examples:**
- Input: `"Muratpasa"` → Output: `"Muratpaşa"` (if district lookup suggests)
- Input: `"Konyaalti"` → Output: `"Konyaaltı"` (if district lookup suggests)
- Input: `"Lara"` → Output: `"Lara"` (no change, no diacritics)

#### Rule NORM-TEXT-4: Special Character Handling
**Rule:** Special characters MUST be normalized or removed.

**Allowed Special Characters:**
- Apostrophe: `'` (U+0027)
- Hyphen: `-` (U+002D)
- Period: `.` (U+002E)
- Comma: `,` (U+002C)
- Parentheses: `()` (U+0028, U+0029)

**Process:**
1. Replace curly quotes with straight quotes: `"` `"` `'` `'` → `"` `'`
2. Replace em/en dashes with hyphen: `—` `–` → `-`
3. Remove other special characters unless in allowed list
4. Preserve apostrophes in contractions (e.g., `Lara'da`)

**Examples:**
- Input: `"Daire – Lüks"` → Output: `"Daire - Lüks"`
- Input: `"Lara'da"` → Output: `"Lara'da"` (preserved)
- Input: `"Daire @ Villa"` → Output: `"Daire Villa"` (@ removed)

---

### 2.2 Category Normalization

#### Rule NORM-CAT-1: Category Standardization
**Rule:** Category MUST be normalized to `RENT` or `SALE`.

**Allowed Input Values:**
- `RENT`: `"rent"`, `"rental"`, `"kiralık"`, `"kira"`, `"RENT"`, `"KIRALIK"`
- `SALE`: `"sale"`, `"sell"`, `"satılık"`, `"satış"`, `"SALE"`, `"SATILIK"`

**Normalization Process:**
1. Convert to uppercase
2. Map Turkish terms to English
3. Map synonyms to standard values

**Mapping Table:**
```json
{
  "RENT": ["RENT", "RENTAL", "KIRALIK", "KIRA", "KIRALAMA"],
  "SALE": ["SALE", "SELL", "SATILIK", "SATIŞ", "SATIS"]
}
```

**Examples:**
- Input: `"kiralık"` → Output: `"RENT"`
- Input: `"satılık"` → Output: `"SALE"`
- Input: `"rental"` → Output: `"RENT"`
- Input: `"sell"` → Output: `"SALE"`

**Validation:**
- Hard Failure: If input cannot be mapped to RENT or SALE
- Warning: If input is ambiguous (e.g., `"lease"`)

---

### 2.3 Price Normalization

#### Rule NORM-PRICE-1: Currency Standardization
**Rule:** Price MUST be normalized to TRY (Turkish Lira).

**Input Formats:**
- Number: `2500000`
- String with currency: `"2.500.000 TL"`, `"2,500,000 TRY"`
- String with symbol: `"₺2.500.000"`, `"2.500.000 ₺"`

**Normalization Process:**
1. Extract numeric value
2. Remove thousand separators (`.` or `,`)
3. Convert to number
4. If currency specified and not TRY, convert using exchange rate (if provided)
5. Round to 2 decimal places

**Examples:**
- Input: `"2.500.000 TL"` → Output: `2500000`
- Input: `"2,500,000"` → Output: `2500000`
- Input: `2500000` → Output: `2500000`
- Input: `"₺2.500.000"` → Output: `2500000`

**Validation:**
- Hard Failure: If price is negative or zero
- Hard Failure: If price cannot be parsed as number
- Warning: If price is below 10,000 TRY (suspiciously low)
- Warning: If price is above 50,000,000 TRY (suspiciously high)

---

### 2.4 Room Count Normalization

#### Rule NORM-ROOM-1: Room Count Format Standardization
**Rule:** Room count MUST be normalized to integer representing total rooms (excluding bathroom).

**Input Formats:**
- Integer: `3`
- String format: `"3+1"`, `"3+1+1"`, `"3+1+0"`, `"3+1+1+1"`
- Turkish format: `"3 artı 1"`, `"üç artı bir"`
- Studio: `"stüdyo"`, `"studio"`, `"0+1"`, `"0"`

**Format Definition:**
- `X+Y` where:
  - `X` = Living rooms/bedrooms
  - `Y` = Additional rooms (usually 1 for bathroom, but bathroom is separate field)
- Standard Turkish format: `"3+1"` means 3 rooms + 1 bathroom
- However, bathroomCount is separate field, so roomCount = X only

**Normalization Process:**
1. Parse format: `X+Y` or `X+Y+Z`
2. Extract X (living rooms/bedrooms)
3. If studio format detected: return `0`
4. Convert to integer

**Examples:**
- Input: `"3+1"` → Output: `3`
- Input: `"2+1"` → Output: `2`
- Input: `"4+2"` → Output: `4`
- Input: `"stüdyo"` → Output: `0`
- Input: `"0+1"` → Output: `0`
- Input: `3` → Output: `3`

**Validation:**
- Hard Failure: If roomCount < 0
- Hard Failure: If roomCount > 20
- Warning: If roomCount = 0 and squareMeters > 30 (should be studio)
- Warning: If roomCount > 10 (unusually high)

**Special Cases:**
- Studio: `roomCount = 0`, `bathroomCount >= 1`
- Penthouse: May have `roomCount >= 5`
- Commercial: May have `roomCount = 0` or high count

---

### 2.5 Address Hierarchy Normalization

#### Rule NORM-ADDR-1: District Normalization
**Rule:** District MUST be normalized to exact match from valid Antalya districts list.

**Valid Antalya Districts:**
```json
[
  "Muratpaşa",
  "Kepez",
  "Konyaaltı",
  "Aksu",
  "Döşemealtı",
  "Korkuteli",
  "Kumluca",
  "Manavgat",
  "Serik",
  "Alanya",
  "Gazipaşa",
  "Gündoğmuş",
  "İbradı",
  "Kaş",
  "Kemer",
  "Finike",
  "Demre",
  "Elmalı"
]
```

**Normalization Process:**
1. Trim whitespace
2. Normalize Turkish characters (case-insensitive)
3. Fuzzy match against valid districts
4. Return exact match from valid list

**Fuzzy Matching Rules:**
- Case-insensitive comparison
- Turkish character normalization (İ/i, Ş/ş, etc.)
- Remove common suffixes: `" İlçesi"`, `" ilçe"`

**Examples:**
- Input: `"muratpasa"` → Output: `"Muratpaşa"`
- Input: `"MURATPAŞA"` → Output: `"Muratpaşa"`
- Input: `"Konyaalti"` → Output: `"Konyaaltı"`
- Input: `"Muratpaşa İlçesi"` → Output: `"Muratpaşa"`

**Validation:**
- Hard Failure: If district cannot be matched to valid list
- Warning: If fuzzy match confidence < 0.8

#### Rule NORM-ADDR-2: Neighborhood Normalization
**Rule:** Neighborhood MUST be normalized with proper case and Turkish characters.

**Normalization Process:**
1. Trim whitespace
2. Normalize to title case (Turkish-aware)
3. Preserve Turkish diacritics
4. Remove common prefixes: `"Mah."`, `"Mahallesi"`, `"Mahalle"`

**Examples:**
- Input: `"lara mahallesi"` → Output: `"Lara"`
- Input: `"LARA"` → Output: `"Lara"`
- Input: `"konyaalti"` → Output: `"Konyaaltı"`
- Input: `"Mah. Lara"` → Output: `"Lara"`

**Validation:**
- Hard Failure: If neighborhood is empty after normalization
- Warning: If neighborhood length < 2 characters
- Warning: If neighborhood contains only numbers

**District-Neighborhood Consistency:**
- Warning: If neighborhood is known to belong to different district
- Example: Neighborhood "Lara" should be in "Muratpaşa" district

---

### 2.6 Boolean Normalization (Furnished)

#### Rule NORM-BOOL-1: Furnished Field Normalization
**Rule:** Furnished field MUST be normalized to boolean `true` or `false`.

**Input Formats:**
- Boolean: `true`, `false`
- String: `"true"`, `"false"`, `"yes"`, `"no"`, `"evet"`, `"hayır"`, `"eşyalı"`, `"eşyasız"`
- Null: `null`, `undefined`

**Normalization Process:**
1. If boolean: return as-is
2. If string: normalize to lowercase, map to boolean
3. If null/undefined: return `null` (not provided)

**Mapping Table:**
```json
{
  "true": ["true", "yes", "evet", "eşyalı", "furnished", "mobilyalı"],
  "false": ["false", "no", "hayır", "eşyasız", "unfurnished", "mobilyasız"]
}
```

**Examples:**
- Input: `"eşyalı"` → Output: `true`
- Input: `"eşyasız"` → Output: `false`
- Input: `true` → Output: `true`
- Input: `null` → Output: `null` (not provided)

**Validation:**
- Warning: If furnished is null (recommended but not required)
- No hard failure for null (optional field)

---

### 2.7 Numeric Field Normalization

#### Rule NORM-NUM-1: Square Meters Normalization
**Rule:** Square meters MUST be normalized to number with 2 decimal precision.

**Input Formats:**
- Number: `120`, `120.5`
- String: `"120"`, `"120.5"`, `"120 m²"`, `"120m2"`, `"120 sqm"`

**Normalization Process:**
1. Extract numeric value
2. Remove unit indicators: `"m²"`, `"m2"`, `"sqm"`, `"square meters"`
3. Convert to number
4. Round to 2 decimal places

**Examples:**
- Input: `"120 m²"` → Output: `120.00`
- Input: `"120.5"` → Output: `120.50`
- Input: `120` → Output: `120.00`
- Input: `"120m2"` → Output: `120.00`

**Validation:**
- Hard Failure: If squareMeters <= 0
- Hard Failure: If squareMeters > 100000
- Warning: If squareMeters < 20 (suspiciously small)
- Warning: If squareMeters > 1000 (suspiciously large for residential)

#### Rule NORM-NUM-2: Bathroom Count Normalization
**Rule:** Bathroom count MUST be normalized to integer.

**Input Formats:**
- Integer: `2`
- String: `"2"`, `"2 adet"`, `"iki"`

**Normalization Process:**
1. Extract numeric value
2. Convert to integer
3. If Turkish word detected, convert to number

**Examples:**
- Input: `"2"` → Output: `2`
- Input: `2` → Output: `2`
- Input: `"2 adet"` → Output: `2`

**Validation:**
- Hard Failure: If bathroomCount < 0
- Hard Failure: If bathroomCount > 20
- Warning: If bathroomCount = 0 and roomCount > 0 (should have at least 1)

#### Rule NORM-NUM-3: Balcony Count Normalization
**Rule:** Balcony count MUST be normalized to integer.

**Input Formats:**
- Integer: `2`
- String: `"2"`, `"2 adet"`, `"var"`, `"yok"`

**Normalization Process:**
1. If boolean-like: `"var"` → `1`, `"yok"` → `0`
2. Extract numeric value
3. Convert to integer

**Examples:**
- Input: `"var"` → Output: `1`
- Input: `"yok"` → Output: `0`
- Input: `2` → Output: `2`
- Input: `null` → Output: `null` (not provided)

**Validation:**
- Hard Failure: If balconyCount < 0
- Warning: If balconyCount > roomCount (unusual but possible)
- Warning: If balconyCount is null (recommended but not required)

---

## 3. Validation Rules

### 3.1 Hard Failures (Blocking)

#### Rule VAL-HARD-1: Required Fields
**Rule:** Required fields MUST be present and non-empty.

**Required Fields:**
- `title`: Must be non-empty string after normalization
- `description`: Must be non-empty string after normalization
- `price`: Must be positive number
- `category`: Must be `RENT` or `SALE`
- `squareMeters`: Must be positive number
- `roomCount`: Must be integer >= 0
- `district`: Must match valid Antalya district
- `neighborhood`: Must be non-empty string after normalization
- `latitude`: Must be number between -90 and 90
- `longitude`: Must be number between -180 and 180

**Failure Response:**
```json
{
  "valid": false,
  "hardFailures": [
    {
      "field": "district",
      "code": "REQUIRED_FIELD_MISSING",
      "message": "District field is required and cannot be empty"
    }
  ],
  "warnings": []
}
```

#### Rule VAL-HARD-2: Category Validation
**Rule:** Category MUST be exactly `RENT` or `SALE`.

**Failure Conditions:**
- Category is null or undefined
- Category cannot be normalized to RENT or SALE
- Category is ambiguous

**Failure Response:**
```json
{
  "valid": false,
  "hardFailures": [
    {
      "field": "category",
      "code": "INVALID_CATEGORY",
      "message": "Category must be RENT or SALE",
      "received": "lease"
    }
  ]
}
```

#### Rule VAL-HARD-3: Price Validation
**Rule:** Price MUST be positive number.

**Failure Conditions:**
- Price is null or undefined
- Price is <= 0
- Price cannot be parsed as number

**Failure Response:**
```json
{
  "valid": false,
  "hardFailures": [
    {
      "field": "price",
      "code": "INVALID_PRICE",
      "message": "Price must be a positive number",
      "received": -1000
    }
  ]
}
```

#### Rule VAL-HARD-4: District Validation
**Rule:** District MUST match valid Antalya district exactly.

**Failure Conditions:**
- District is null or empty
- District cannot be matched to valid list (even with fuzzy matching)
- District fuzzy match confidence < 0.7

**Failure Response:**
```json
{
  "valid": false,
  "hardFailures": [
    {
      "field": "district",
      "code": "INVALID_DISTRICT",
      "message": "District must be a valid Antalya district",
      "received": "Istanbul",
      "validDistricts": ["Muratpaşa", "Kepez", "Konyaaltı", ...]
    }
  ]
}
```

#### Rule VAL-HARD-5: Geographic Bounds Validation
**Rule:** Coordinates MUST be within Antalya bounding box.

**Antalya Bounding Box:**
- Latitude: 36.0 to 37.0
- Longitude: 30.0 to 32.0

**Failure Conditions:**
- Latitude < 36.0 or > 37.0
- Longitude < 30.0 or > 32.0
- Coordinates are null or undefined

**Failure Response:**
```json
{
  "valid": false,
  "hardFailures": [
    {
      "field": "coordinates",
      "code": "COORDINATES_OUT_OF_BOUNDS",
      "message": "Coordinates must be within Antalya bounds (lat: 36.0-37.0, lon: 30.0-32.0)",
      "received": {
        "latitude": 41.0,
        "longitude": 28.9
      },
      "bounds": {
        "latitude": {"min": 36.0, "max": 37.0},
        "longitude": {"min": 30.0, "max": 32.0}
      }
    }
  ]
}
```

#### Rule VAL-HARD-6: Numeric Range Validation
**Rule:** Numeric fields MUST be within valid ranges.

**Range Constraints:**
- `squareMeters`: 1 to 100000
- `roomCount`: 0 to 20
- `bathroomCount`: 0 to 20
- `balconyCount`: 0 to 20

**Failure Conditions:**
- Value outside valid range
- Value is null for required fields

**Failure Response:**
```json
{
  "valid": false,
  "hardFailures": [
    {
      "field": "squareMeters",
      "code": "VALUE_OUT_OF_RANGE",
      "message": "Square meters must be between 1 and 100000",
      "received": 150000,
      "range": {"min": 1, "max": 100000}
    }
  ]
}
```

---

### 3.2 Warnings (Non-Blocking)

#### Rule VAL-WARN-1: Price Anomaly Detection
**Rule:** Price anomalies generate warnings but don't block.

**Warning Conditions:**
- Price < 10,000 TRY (suspiciously low)
- Price > 50,000,000 TRY (suspiciously high)
- Price per square meter < 500 TRY/m² (unrealistic)
- Price per square meter > 50,000 TRY/m² (unrealistic)

**Warning Response:**
```json
{
  "warnings": [
    {
      "field": "price",
      "code": "PRICE_TOO_LOW",
      "severity": "MEDIUM",
      "message": "Price is suspiciously low. Please verify.",
      "value": 5000,
      "threshold": 10000
    }
  ]
}
```

#### Rule VAL-WARN-2: Size Anomaly Detection
**Rule:** Size anomalies generate warnings.

**Warning Conditions:**
- squareMeters < 20 (suspiciously small)
- squareMeters > 1000 for residential (suspiciously large)
- squareMeters / roomCount < 15 (unrealistic ratio)
- squareMeters / roomCount > 50 (unrealistic ratio)

**Warning Response:**
```json
{
  "warnings": [
    {
      "field": "squareMeters",
      "code": "SIZE_TOO_SMALL",
      "severity": "MEDIUM",
      "message": "Square meters is suspiciously small",
      "value": 15,
      "threshold": 20
    }
  ]
}
```

#### Rule VAL-WARN-3: Room Count Anomaly
**Rule:** Room count anomalies generate warnings.

**Warning Conditions:**
- roomCount = 0 and squareMeters > 30 (should be studio)
- roomCount > 10 (unusually high)
- roomCount > bathroomCount * 3 (unrealistic ratio)

**Warning Response:**
```json
{
  "warnings": [
    {
      "field": "roomCount",
      "code": "ROOM_COUNT_ANOMALY",
      "severity": "LOW",
      "message": "Room count is unusually high",
      "value": 15,
      "typicalMax": 10
    }
  ]
}
```

#### Rule VAL-WARN-4: Missing Optional Fields
**Rule:** Missing recommended fields generate warnings.

**Warning Conditions:**
- `furnished` is null (recommended)
- `balconyCount` is null (recommended)
- `bathroomCount` is null (recommended)

**Warning Response:**
```json
{
  "warnings": [
    {
      "field": "furnished",
      "code": "MISSING_RECOMMENDED_FIELD",
      "severity": "LOW",
      "message": "Furnished field is recommended but not provided"
    }
  ]
}
```

#### Rule VAL-WARN-5: Text Quality Warnings
**Rule:** Text quality issues generate warnings.

**Warning Conditions:**
- `title` length < 10 characters
- `title` length > 200 characters
- `description` length < 50 characters
- `description` length > 5000 characters
- `title` contains only numbers
- `description` contains excessive repetition (> 20% same word)

**Warning Response:**
```json
{
  "warnings": [
    {
      "field": "title",
      "code": "TITLE_TOO_SHORT",
      "severity": "MEDIUM",
      "message": "Title is too short (minimum 10 characters recommended)",
      "value": "Daire",
      "length": 5,
      "minLength": 10
    }
  ]
}
```

---

## 4. Standard Formats

### 4.1 Room Count Format

#### Format Definition
**Standard Format:** Integer representing number of rooms (excluding bathroom).

**Format Rules:**
- Studio: `0`
- 1+1: `1`
- 2+1: `2`
- 3+1: `3`
- 4+2: `4` (bathroom count stored separately)

**Storage Format:**
```json
{
  "roomCount": 3,
  "bathroomCount": 1
}
```

**Display Format:**
- If `roomCount = 0` and `bathroomCount >= 1`: Display as `"Stüdyo"`
- Otherwise: Display as `"{roomCount}+{bathroomCount}"`
- Example: `roomCount: 3, bathroomCount: 1` → Display: `"3+1"`

**Parsing Rules:**
1. Parse input format: `"X+Y"` or `"X+Y+Z"`
2. Extract X as `roomCount`
3. Extract Y as `bathroomCount` (if provided)
4. Handle studio formats: `"stüdyo"`, `"0+1"`, `"0"` → `roomCount: 0`

**Examples:**
| Input | Parsed roomCount | Parsed bathroomCount |
|-------|------------------|----------------------|
| `"3+1"` | `3` | `1` |
| `"2+1"` | `2` | `1` |
| `"4+2"` | `4` | `2` |
| `"stüdyo"` | `0` | `1` (default) |
| `"0+1"` | `0` | `1` |
| `3` | `3` | `null` (not provided) |

---

### 4.2 Address Hierarchy Format

#### Format Definition
**Standard Format:** Three-level hierarchy: City → District → Neighborhood

**Storage Format:**
```json
{
  "address": {
    "city": "Antalya",
    "district": "Muratpaşa",
    "neighborhood": "Lara",
    "street": "string | null",
    "buildingNumber": "string | null",
    "postalCode": "string | null"
  }
}
```

#### City Level
**Standard Value:** `"Antalya"` (fixed, case-sensitive)

**Normalization:**
- Input: Any variation → Output: `"Antalya"`
- Hard Failure: If city is not "Antalya" (after normalization)

#### District Level
**Standard Values:** Exact match from valid districts list (see Rule NORM-ADDR-1)

**Format Rules:**
- Must match exactly (case-sensitive after normalization)
- Turkish characters preserved
- No abbreviations allowed

**Examples:**
- Valid: `"Muratpaşa"`, `"Konyaaltı"`, `"Kepez"`
- Invalid: `"Muratpasa"` (missing diacritic), `"MURATPAŞA"` (wrong case)

#### Neighborhood Level
**Standard Format:** Title case with Turkish characters preserved

**Format Rules:**
- Title case (first letter uppercase, rest lowercase)
- Turkish characters preserved
- No common prefixes: `"Mah."`, `"Mahallesi"` removed
- Minimum length: 2 characters

**Examples:**
- Input: `"lara"` → Output: `"Lara"`
- Input: `"LARA"` → Output: `"Lara"`
- Input: `"Lara Mahallesi"` → Output: `"Lara"`
- Input: `"konyaalti"` → Output: `"Konyaaltı"` (if valid)

**District-Neighborhood Consistency:**
- Known neighborhood-district mappings validated
- Warning if neighborhood doesn't match expected district
- Example: "Lara" should be in "Muratpaşa" district

---

## 5. Geo Consistency Checks

### 5.1 Coordinate Validation

#### Rule GEO-1: Antalya Bounding Box
**Rule:** Coordinates MUST be within Antalya administrative bounds.

**Antalya Bounding Box:**
```json
{
  "latitude": {
    "min": 36.0,
    "max": 37.0
  },
  "longitude": {
    "min": 30.0,
    "max": 32.0
  }
}
```

**Validation:**
- Hard Failure: If coordinates outside bounds
- Warning: If coordinates near boundary (< 0.1 degrees from edge)

**Examples:**
- Valid: `lat: 36.8, lon: 30.7` (Lara area)
- Valid: `lat: 36.9, lon: 31.0` (Konyaaltı area)
- Invalid: `lat: 41.0, lon: 28.9` (Istanbul)
- Invalid: `lat: 35.5, lon: 30.5` (outside Antalya)

#### Rule GEO-2: Coordinate Precision
**Rule:** Coordinates MUST have sufficient precision for real estate use.

**Precision Requirements:**
- Latitude: 8 decimal places (precision: ~1.1mm)
- Longitude: 8 decimal places (precision: ~1.1mm)
- Minimum precision: 6 decimal places (~0.11m)

**Validation:**
- Warning: If precision < 6 decimal places
- Warning: If coordinates are rounded to whole degrees

**Examples:**
- Valid: `36.85678901, 30.71234567` (high precision)
- Valid: `36.856789, 30.712345` (acceptable precision)
- Warning: `36.856, 30.712` (low precision)
- Warning: `37.0, 31.0` (rounded, suspicious)

#### Rule GEO-3: Coordinate-District Consistency
**Rule:** Coordinates MUST be consistent with district location.

**Process:**
1. Reverse geocode coordinates to get district
2. Compare with provided district
3. Flag inconsistency

**District Boundaries (Approximate):**
```json
{
  "Muratpaşa": {
    "latitude": {"min": 36.8, "max": 36.95},
    "longitude": {"min": 30.6, "max": 30.8}
  },
  "Konyaaltı": {
    "latitude": {"min": 36.85, "max": 37.0},
    "longitude": {"min": 30.5, "max": 30.7}
  },
  "Kepez": {
    "latitude": {"min": 36.9, "max": 37.0},
    "longitude": {"min": 30.7, "max": 30.9}
  }
}
```

**Validation:**
- Warning: If coordinates don't match district boundaries
- Warning: If reverse geocoding returns different district

**Examples:**
- Provided: `district: "Muratpaşa"`, `lat: 36.85, lon: 30.65` → Valid (within bounds)
- Provided: `district: "Muratpaşa"`, `lat: 36.95, lon: 30.55` → Warning (likely Konyaaltı)

#### Rule GEO-4: Coordinate-Neighborhood Consistency
**Rule:** Coordinates MUST be consistent with neighborhood location.

**Process:**
1. Reverse geocode coordinates to get neighborhood
2. Compare with provided neighborhood
3. Flag inconsistency

**Known Neighborhood Coordinates (Examples):**
```json
{
  "Lara": {
    "latitude": {"min": 36.82, "max": 36.88},
    "longitude": {"min": 30.75, "max": 30.85}
  },
  "Konyaaltı Beach": {
    "latitude": {"min": 36.88, "max": 36.95},
    "longitude": {"min": 30.55, "max": 30.65}
  }
}
```

**Validation:**
- Warning: If coordinates don't match neighborhood location
- Warning: If distance > 2km from expected neighborhood center

**Examples:**
- Provided: `neighborhood: "Lara"`, `lat: 36.85, lon: 30.80` → Valid
- Provided: `neighborhood: "Lara"`, `lat: 36.90, lon: 30.60` → Warning (likely different neighborhood)

#### Rule GEO-5: Address-Coordinate Consistency
**Rule:** Address and coordinates MUST be consistent.

**Process:**
1. Geocode address (district + neighborhood) to coordinates
2. Calculate distance between geocoded and provided coordinates
3. Flag if distance > threshold

**Distance Thresholds:**
- Hard Failure: Distance > 10km (likely wrong address or coordinates)
- Warning: Distance > 2km (may be inaccurate)
- Warning: Distance > 500m (minor inconsistency)

**Validation:**
- Hard Failure: If geocoded address coordinates differ > 10km from provided coordinates
- Warning: If distance > 2km
- Warning: If geocoding fails

**Examples:**
- Address: `"Muratpaşa, Lara"`, Coordinates: `36.85, 30.80` → Valid (distance < 500m)
- Address: `"Muratpaşa, Lara"`, Coordinates: `36.90, 30.60` → Warning (distance ~3km)
- Address: `"Muratpaşa, Lara"`, Coordinates: `41.0, 28.9` → Hard Failure (distance > 500km)

---

## 6. Normalization Pipeline

### 6.1 Processing Order

**Step 1: Text Normalization**
1. Unicode normalization (NFC)
2. Whitespace normalization
3. Special character handling
4. Case normalization (Turkish-aware)

**Step 2: Field-Specific Normalization**
1. Category normalization
2. Price normalization
3. Room count normalization
4. Address normalization
5. Boolean normalization

**Step 3: Validation**
1. Hard failure checks (blocking)
2. Warning checks (non-blocking)
3. Geo consistency checks

**Step 4: Output Generation**
1. Generate normalized output
2. Include validation results
3. Preserve original values for audit

### 6.2 Normalization Result Schema

```json
{
  "normalized": {
    "title": "string",
    "description": "string",
    "price": "number",
    "category": "RENT | SALE",
    "squareMeters": "number",
    "roomCount": "integer",
    "bathroomCount": "integer",
    "balconyCount": "integer",
    "furnished": "boolean | null",
    "district": "string",
    "neighborhood": "string",
    "latitude": "number",
    "longitude": "number"
  },
  "original": {
    "title": "string",
    "description": "string",
    "price": "any",
    "category": "string",
    "squareMeters": "any",
    "roomCount": "any",
    "bathroomCount": "any",
    "balconyCount": "any",
    "furnished": "any",
    "district": "string",
    "neighborhood": "string",
    "latitude": "number",
    "longitude": "number"
  },
  "validationResult": {
    "valid": "boolean",
    "hardFailures": [
      {
        "field": "string",
        "code": "string",
        "message": "string (Turkish)",
        "received": "any",
        "expected": "any"
      }
    ],
    "warnings": [
      {
        "field": "string",
        "code": "string",
        "severity": "LOW | MEDIUM | HIGH",
        "message": "string (Turkish)",
        "value": "any",
        "threshold": "any"
      }
    ]
  },
  "normalizationMetadata": {
    "normalizedAt": "ISO 8601 datetime (UTC)",
    "normalizationVersion": "string",
    "transformationsApplied": [
      {
        "field": "string",
        "transformation": "string",
        "from": "any",
        "to": "any"
      }
    ]
  }
}
```

---

## 7. Turkish Character Normalization

### 7.1 Turkish Character Mapping

**Uppercase Mapping:**
- `i` → `İ`
- `ı` → `I`
- `ş` → `Ş`
- `ğ` → `Ğ`
- `ü` → `Ü`
- `ö` → `Ö`
- `ç` → `Ç`

**Lowercase Mapping:**
- `İ` → `i`
- `I` → `ı`
- `Ş` → `ş`
- `Ğ` → `ğ`
- `Ü` → `ü`
- `Ö` → `ö`
- `Ç` → `ç`

### 7.2 Normalization Function Specification

**Function:** `normalizeTurkish(text: string): string`

**Process:**
1. Convert to lowercase using Turkish locale
2. Convert first character to uppercase using Turkish locale
3. Preserve all Turkish diacritics
4. Handle special cases (İ/i, I/ı)

**Examples:**
- Input: `"İSTANBUL"` → Output: `"İstanbul"`
- Input: `"istanbul"` → Output: `"İstanbul"`
- Input: `"MURATPAŞA"` → Output: `"Muratpaşa"`
- Input: `"muratpasa"` → Output: `"Muratpaşa"` (if diacritic restoration applied)

---

## 8. Validation Error Codes

### 8.1 Hard Failure Codes

| Code | Field | Message (Turkish) | Message (English) |
|------|-------|------------------|------------------|
| `REQUIRED_FIELD_MISSING` | Any | "{field} alanı zorunludur" | "{field} field is required" |
| `INVALID_CATEGORY` | category | "Kategori RENT veya SALE olmalıdır" | "Category must be RENT or SALE" |
| `INVALID_PRICE` | price | "Fiyat pozitif bir sayı olmalıdır" | "Price must be a positive number" |
| `INVALID_DISTRICT` | district | "Geçerli bir Antalya ilçesi olmalıdır" | "Must be a valid Antalya district" |
| `INVALID_NEIGHBORHOOD` | neighborhood | "Mahalle adı geçerli olmalıdır" | "Neighborhood name must be valid" |
| `COORDINATES_OUT_OF_BOUNDS` | coordinates | "Koordinatlar Antalya sınırları içinde olmalıdır" | "Coordinates must be within Antalya bounds" |
| `VALUE_OUT_OF_RANGE` | Any numeric | "{field} değeri geçerli aralıkta olmalıdır" | "{field} value must be in valid range" |
| `ADDRESS_COORDINATE_MISMATCH` | coordinates | "Adres ve koordinatlar uyumsuz" | "Address and coordinates mismatch" |

### 8.2 Warning Codes

| Code | Field | Severity | Message (Turkish) |
|------|-------|----------|-------------------|
| `PRICE_TOO_LOW` | price | MEDIUM | "Fiyat şüpheli derecede düşük" |
| `PRICE_TOO_HIGH` | price | MEDIUM | "Fiyat şüpheli derecede yüksek" |
| `SIZE_TOO_SMALL` | squareMeters | MEDIUM | "Metrekare şüpheli derecede küçük" |
| `SIZE_TOO_LARGE` | squareMeters | LOW | "Metrekare şüpheli derecede büyük" |
| `ROOM_COUNT_ANOMALY` | roomCount | LOW | "Oda sayısı alışılmadık" |
| `MISSING_RECOMMENDED_FIELD` | Any | LOW | "{field} alanı önerilir ancak sağlanmamış" |
| `TITLE_TOO_SHORT` | title | MEDIUM | "Başlık çok kısa (minimum 10 karakter)" |
| `TITLE_TOO_LONG` | title | LOW | "Başlık çok uzun (maksimum 200 karakter)" |
| `DESCRIPTION_TOO_SHORT` | description | MEDIUM | "Açıklama çok kısa (minimum 50 karakter)" |
| `COORDINATE_PRECISION_LOW` | coordinates | LOW | "Koordinat hassasiyeti düşük" |
| `DISTRICT_COORDINATE_MISMATCH` | coordinates | MEDIUM | "İlçe ve koordinatlar uyumsuz" |
| `NEIGHBORHOOD_COORDINATE_MISMATCH` | coordinates | MEDIUM | "Mahalle ve koordinatlar uyumsuz" |

---

## 9. Implementation Guidelines

### 9.1 Normalization Function Signature

```typescript
interface NormalizationResult {
  normalized: NormalizedListing;
  original: OriginalListing;
  validationResult: ValidationResult;
  normalizationMetadata: NormalizationMetadata;
}

function normalizeListing(
  input: ListingInput
): NormalizationResult {
  // Implementation follows rules in this specification
}
```

### 9.2 Validation Function Signature

```typescript
interface ValidationResult {
  valid: boolean;
  hardFailures: ValidationFailure[];
  warnings: ValidationWarning[];
}

function validateListing(
  normalized: NormalizedListing
): ValidationResult {
  // Implementation follows validation rules
}
```

### 9.3 Error Handling

**Hard Failures:**
- Return `valid: false`
- Include all hard failures in `hardFailures` array
- Do not proceed with normalization if hard failures exist

**Warnings:**
- Return `valid: true` (if no hard failures)
- Include all warnings in `warnings` array
- Proceed with normalization but flag warnings

---

**Document Status:** Canonical v1.0.0  
**Maintenance:** Update when new districts/neighborhoods added or rules change  
**Owner:** Platform Architecture Team
