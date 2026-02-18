# Deterministic Moderation Scoring System
## Antalya Real Estate Platform

**Version:** 1.0.0  
**Type:** Rule-Based, Deterministic, Explainable  
**Last Updated:** 2026-02-18

---

## 1. System Overview

### 1.1 Principles
- **Deterministic**: Same input always produces same output
- **Rule-Based**: No machine learning, pure algorithmic logic
- **Explainable**: Every score can be traced to specific rules
- **Transparent**: All scoring logic is documented and auditable

### 1.2 Input Schema
```json
{
  "title": "string",
  "description": "string",
  "price": "number (TRY)",
  "squareMeters": "number",
  "roomCount": "integer",
  "balconyCount": "integer",
  "furnished": "boolean",
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
  "missingFields": ["string"],
  "warnings": [
    {
      "code": "string",
      "severity": "LOW | MEDIUM | HIGH",
      "message": "string",
      "field": "string | null"
    }
  ],
  "tags": ["string"],
  "seoTitle": "string",
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
  "recommendations": ["string"]
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

### 2.2 Basic Info Score (0-100)
**Weight:** 30% of completeness score

#### Required Fields (Critical - 60 points)
- `title`: Present and non-empty → 20 points
- `description`: Present and non-empty → 20 points
- `price`: Present and > 0 → 20 points

#### Scoring Logic
```javascript
basicInfoScore = 0
if (title && title.trim().length > 0) basicInfoScore += 20
if (description && description.trim().length > 0) basicInfoScore += 20
if (price && price > 0) basicInfoScore += 20

// Quality bonuses (40 points max)
if (title && title.length >= 20 && title.length <= 100) basicInfoScore += 10
if (description && description.length >= 100) basicInfoScore += 10
if (price && price >= 10000 && price <= 50000000) basicInfoScore += 10
if (furnished !== null && furnished !== undefined) basicInfoScore += 10
```

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

#### Scoring Logic
```javascript
locationScore = 0

// District validation (30 points)
if (district && district.trim().length > 0) {
  const normalizedDistrict = district.trim()
  if (VALID_DISTRICTS.includes(normalizedDistrict)) {
    locationScore += 30
  } else {
    // Fuzzy match: case-insensitive, Turkish character normalization
    const matches = VALID_DISTRICTS.filter(d => 
      normalizeTurkish(d) === normalizeTurkish(normalizedDistrict)
    )
    if (matches.length > 0) locationScore += 25  // Partial credit for fuzzy match
  }
}

// Neighborhood (20 points)
if (neighborhood && neighborhood.trim().length > 0) {
  locationScore += 20
}

// Coordinates (10 points)
if (coordinates && coordinates.latitude && coordinates.longitude) {
  const lat = coordinates.latitude
  const lon = coordinates.longitude
  if (lat >= 36.0 && lat <= 37.0 && lon >= 30.0 && lon <= 32.0) {
    locationScore += 10
  }
}

// Quality bonuses (40 points max)
if (neighborhood && neighborhood.length >= 3) locationScore += 10
if (coordinates && isPreciseCoordinates(coordinates)) locationScore += 10
if (district && neighborhood) {
  // Bonus for having both district and neighborhood
  locationScore += 10
}
if (isPremiumLocation(district, neighborhood)) locationScore += 10
```

#### Premium Location Bonus
```javascript
const PREMIUM_LOCATIONS = {
  "Muratpaşa": ["Konyaaltı", "Lara", "Kundu", "Beach Park"],
  "Konyaaltı": ["Beach", "Sahil", "Liman"],
  "Alanya": ["Keykubat", "Mahmutlar", "Oba", "Tosmur"]
}

function isPremiumLocation(district, neighborhood) {
  const premiumNeighborhoods = PREMIUM_LOCATIONS[district] || []
  return premiumNeighborhoods.some(p => 
    normalizeTurkish(neighborhood).includes(normalizeTurkish(p))
  )
}
```

### 2.4 Specifications Score (0-100)
**Weight:** 25% of completeness score

#### Required Fields (Critical - 50 points)
- `squareMeters`: Present and > 0 → 25 points
- `roomCount`: Present and >= 0 → 25 points

#### Scoring Logic
```javascript
specificationsScore = 0

// Required fields (50 points)
if (squareMeters && squareMeters > 0) specificationsScore += 25
if (roomCount !== null && roomCount !== undefined && roomCount >= 0) {
  specificationsScore += 25
}

// Quality bonuses (50 points max)
if (squareMeters && squareMeters >= 50 && squareMeters <= 500) {
  specificationsScore += 10  // Realistic range
}
if (roomCount && roomCount >= 1 && roomCount <= 10) {
  specificationsScore += 10  // Realistic range
}
if (balconyCount !== null && balconyCount !== undefined) {
  specificationsScore += 10
  if (balconyCount > 0) specificationsScore += 5  // Bonus for having balconies
}
if (furnished !== null && furnished !== undefined) {
  specificationsScore += 10
}
if (isRealisticRatio(squareMeters, roomCount)) {
  specificationsScore += 5  // Realistic m² per room ratio
}
```

#### Realistic Ratio Check
```javascript
function isRealisticRatio(squareMeters, roomCount) {
  if (!squareMeters || !roomMeters || roomCount === 0) return false
  const sqmPerRoom = squareMeters / roomCount
  // Typical range: 15-50 m² per room
  return sqmPerRoom >= 15 && sqmPerRoom <= 50
}
```

### 2.5 Media Score (0-100)
**Weight:** 20% of completeness score

#### Scoring Logic
```javascript
mediaScore = 0

if (!imageCount || imageCount === 0) {
  mediaScore = 0  // No images = 0 points
} else if (imageCount === 1) {
  mediaScore = 30  // Minimum acceptable
} else if (imageCount >= 2 && imageCount <= 4) {
  mediaScore = 50  // Basic coverage
} else if (imageCount >= 5 && imageCount <= 9) {
  mediaScore = 75  // Good coverage
} else if (imageCount >= 10 && imageCount <= 20) {
  mediaScore = 95  // Excellent coverage
} else if (imageCount > 20) {
  mediaScore = 100  // Comprehensive
}
```

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

### 3.2 Length Score (0-100)
**Weight:** 30% of description quality score

#### Scoring Logic
```javascript
function calculateLengthScore(description) {
  if (!description) return 0
  
  const length = description.trim().length
  const wordCount = description.trim().split(/\s+/).filter(w => w.length > 0).length
  
  let score = 0
  
  // Character length scoring (50 points)
  if (length < 50) {
    score = 0  // Too short
  } else if (length >= 50 && length < 100) {
    score = 20  // Minimum acceptable
  } else if (length >= 100 && length < 200) {
    score = 35  // Basic
  } else if (length >= 200 && length < 500) {
    score = 50  // Good
  } else if (length >= 500 && length < 1000) {
    score = 45  // Slightly too long
  } else if (length >= 1000 && length < 2000) {
    score = 30  // Too long
  } else {
    score = 10  // Excessive
  }
  
  // Word count scoring (50 points)
  if (wordCount < 10) {
    score += 0
  } else if (wordCount >= 10 && wordCount < 20) {
    score += 15
  } else if (wordCount >= 20 && wordCount < 50) {
    score += 30
  } else if (wordCount >= 50 && wordCount < 150) {
    score += 50
  } else if (wordCount >= 150 && wordCount < 300) {
    score += 40
  } else {
    score += 20  // Too verbose
  }
  
  return Math.min(100, score)
}
```

### 3.3 Structure Score (0-100)
**Weight:** 25% of description quality score

#### Scoring Logic
```javascript
function calculateStructureScore(description) {
  if (!description) return 0
  
  let score = 0
  
  // Sentence count (30 points)
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length >= 3 && sentences.length <= 15) {
    score += 30
  } else if (sentences.length >= 2) {
    score += 20
  } else if (sentences.length === 1) {
    score += 10
  }
  
  // Paragraph structure (30 points)
  const paragraphs = description.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  if (paragraphs.length >= 2 && paragraphs.length <= 5) {
    score += 30
  } else if (paragraphs.length === 1 && description.length > 200) {
    score += 15  // Single paragraph but long enough
  }
  
  // Punctuation usage (20 points)
  const hasPeriods = /\./.test(description)
  const hasCommas = /,/.test(description)
  if (hasPeriods && hasCommas) {
    score += 20
  } else if (hasPeriods) {
    score += 10
  }
  
  // Capitalization (20 points)
  const firstChar = description.trim().charAt(0)
  if (firstChar && firstChar === firstChar.toUpperCase()) {
    score += 10
  }
  // Check for proper sentence capitalization
  const properCapitalization = sentences.filter(s => {
    const first = s.trim().charAt(0)
    return first && first === first.toUpperCase()
  }).length
  if (properCapitalization >= sentences.length * 0.8) {
    score += 10
  }
  
  return Math.min(100, score)
}
```

### 3.4 Keywords Score (0-100)
**Weight:** 25% of description quality score

#### Real Estate Keywords (Turkish)
```javascript
const REAL_ESTATE_KEYWORDS = {
  "location": ["konum", "lokasyon", "mahalle", "semt", "bölge", "yakın", "yakınında", "merkez", "sahil", "deniz"],
  "property": ["daire", "ev", "villa", "apartman", "rezidans", "müstakil", "penthouse", "stüdyo"],
  "features": ["balkon", "teras", "bahçe", "havuz", "deniz manzarası", "manzara", "güvenlik", "otopark", "asansör", "eşyalı", "eşyasız"],
  "quality": ["kaliteli", "lüks", "modern", "yeni", "bakımlı", "ferah", "geniş", "aydınlık", "güneş"],
  "amenities": ["okul", "hastane", "market", "alışveriş", "plaj", "restoran", "ulaşım", "metro", "otobüs"]
}
```

#### Scoring Logic
```javascript
function calculateKeywordsScore(description) {
  if (!description) return 0
  
  const normalizedDesc = normalizeTurkish(description.toLowerCase())
  let score = 0
  let foundCategories = new Set()
  
  // Check each category (20 points per category, max 100)
  Object.keys(REAL_ESTATE_KEYWORDS).forEach((category, index) => {
    const keywords = REAL_ESTATE_KEYWORDS[category]
    const found = keywords.filter(kw => normalizedDesc.includes(normalizeTurkish(kw.toLowerCase())))
    
    if (found.length > 0) {
      foundCategories.add(category)
      // More keywords found = higher score
      const categoryScore = Math.min(20, found.length * 5)
      score += categoryScore
    }
  })
  
  // Bonus for diversity (finding multiple categories)
  if (foundCategories.size >= 3) {
    score += 10
  } else if (foundCategories.size === 2) {
    score += 5
  }
  
  // Penalty for keyword stuffing
  const totalKeywordMatches = Object.values(REAL_ESTATE_KEYWORDS)
    .flat()
    .filter(kw => {
      const regex = new RegExp(normalizeTurkish(kw.toLowerCase()), 'gi')
      return (normalizedDesc.match(regex) || []).length
    })
    .reduce((sum, kw) => {
      const regex = new RegExp(normalizeTurkish(kw.toLowerCase()), 'gi')
      return sum + (normalizedDesc.match(regex) || []).length
    }, 0)
  
  if (totalKeywordMatches > 20) {
    score = Math.max(0, score - 20)  // Penalty for keyword stuffing
  }
  
  return Math.min(100, score)
}
```

### 3.5 Readability Score (0-100)
**Weight:** 20% of description quality score

#### Scoring Logic
```javascript
function calculateReadabilityScore(description) {
  if (!description) return 0
  
  let score = 0
  
  // Average sentence length (30 points)
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length > 0) {
    const avgSentenceLength = description.length / sentences.length
    // Ideal: 15-25 words per sentence
    const words = description.split(/\s+/).filter(w => w.length > 0)
    const avgWordsPerSentence = words.length / sentences.length
    
    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) {
      score += 30
    } else if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 30) {
      score += 20
    } else if (avgWordsPerSentence >= 5 && avgWordsPerSentence <= 35) {
      score += 10
    }
  }
  
  // Repetition check (25 points)
  const words = description.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const wordFrequency = {}
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1
  })
  
  const maxRepetition = Math.max(...Object.values(wordFrequency))
  const uniqueWords = Object.keys(wordFrequency).length
  
  if (maxRepetition <= 3 && uniqueWords >= 20) {
    score += 25  // Good variety, low repetition
  } else if (maxRepetition <= 5 && uniqueWords >= 15) {
    score += 15
  } else if (maxRepetition > 8) {
    score += 0  // Too much repetition
  } else {
    score += 10
  }
  
  // Special characters and formatting (20 points)
  const hasNumbers = /\d/.test(description)
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(description)
  
  if (hasNumbers && !hasSpecialChars) {
    score += 20  // Numbers are good, excessive special chars are bad
  } else if (hasNumbers) {
    score += 15
  } else {
    score += 10
  }
  
  // Spam detection (25 points)
  // Check for excessive capitalization, repeated characters, etc.
  const excessiveCaps = (description.match(/[A-ZİŞĞÜÖÇ]/g) || []).length / description.length
  const repeatedChars = /(.)\1{4,}/.test(description)  // Same char 5+ times
  
  if (excessiveCaps > 0.3) {
    score -= 15  // Too many caps (shouting)
  }
  if (repeatedChars) {
    score -= 10  // Spam-like repetition
  }
  
  return Math.max(0, Math.min(100, score))
}
```

---

## 4. Missing Fields Detection

### 4.1 Required Fields
```javascript
const REQUIRED_FIELDS = [
  "title",
  "description",
  "price",
  "squareMeters",
  "roomCount",
  "district",
  "neighborhood",
  "coordinates",
  "imageCount"
]
```

### 4.2 Recommended Fields
```javascript
const RECOMMENDED_FIELDS = [
  "balconyCount",
  "furnished"
]
```

### 4.3 Detection Logic
```javascript
function detectMissingFields(input) {
  const missing = []
  
  // Required fields
  if (!input.title || input.title.trim().length === 0) {
    missing.push("title")
  }
  if (!input.description || input.description.trim().length === 0) {
    missing.push("description")
  }
  if (!input.price || input.price <= 0) {
    missing.push("price")
  }
  if (!input.squareMeters || input.squareMeters <= 0) {
    missing.push("squareMeters")
  }
  if (input.roomCount === null || input.roomCount === undefined) {
    missing.push("roomCount")
  }
  if (!input.district || input.district.trim().length === 0) {
    missing.push("district")
  }
  if (!input.neighborhood || input.neighborhood.trim().length === 0) {
    missing.push("neighborhood")
  }
  if (!input.coordinates || !input.coordinates.latitude || !input.coordinates.longitude) {
    missing.push("coordinates")
  }
  if (!input.imageCount || input.imageCount === 0) {
    missing.push("imageCount")
  }
  
  // Recommended fields (not added to missing, but tracked separately)
  const recommendedMissing = []
  if (input.balconyCount === null || input.balconyCount === undefined) {
    recommendedMissing.push("balconyCount")
  }
  if (input.furnished === null || input.furnished === undefined) {
    recommendedMissing.push("furnished")
  }
  
  return {
    required: missing,
    recommended: recommendedMissing
  }
}
```

---

## 5. Warning Flags

### 5.1 Warning Codes and Logic

```javascript
function generateWarnings(input) {
  const warnings = []
  
  // PRICE_WARNING: Suspiciously low or high price
  if (input.price) {
    const pricePerSqm = input.price / (input.squareMeters || 1)
    if (pricePerSqm < 500) {
      warnings.push({
        code: "PRICE_TOO_LOW",
        severity: "HIGH",
        message: "Fiyat metrekare başına çok düşük görünüyor. Lütfen kontrol edin.",
        field: "price"
      })
    } else if (pricePerSqm > 50000) {
      warnings.push({
        code: "PRICE_TOO_HIGH",
        severity: "MEDIUM",
        message: "Fiyat metrekare başına çok yüksek görünüyor. Lütfen kontrol edin.",
        field: "price"
      })
    }
  }
  
  // SIZE_WARNING: Unrealistic square meters
  if (input.squareMeters) {
    if (input.squareMeters < 20) {
      warnings.push({
        code: "SIZE_TOO_SMALL",
        severity: "MEDIUM",
        message: "Metrekare çok küçük görünüyor. Lütfen kontrol edin.",
        field: "squareMeters"
      })
    } else if (input.squareMeters > 1000 && input.roomCount && input.roomCount < 5) {
      warnings.push({
        code: "SIZE_ROOM_MISMATCH",
        severity: "LOW",
        message: "Metrekare ve oda sayısı arasında uyumsuzluk olabilir.",
        field: "squareMeters"
      })
    }
  }
  
  // ROOM_COUNT_WARNING: Unusual room count
  if (input.roomCount !== null && input.roomCount !== undefined) {
    if (input.roomCount === 0 && input.squareMeters && input.squareMeters > 30) {
      warnings.push({
        code: "NO_ROOMS",
        severity: "MEDIUM",
        message: "Stüdyo daireler için oda sayısı 0 olabilir, ancak metrekare kontrol edilmeli.",
        field: "roomCount"
      })
    } else if (input.roomCount > 10) {
      warnings.push({
        code: "TOO_MANY_ROOMS",
        severity: "LOW",
        message: "Oda sayısı alışılmadık derecede yüksek.",
        field: "roomCount"
      })
    }
  }
  
  // LOCATION_WARNING: Invalid or suspicious location
  if (input.coordinates) {
    const lat = input.coordinates.latitude
    const lon = input.coordinates.longitude
    if (lat < 36.0 || lat > 37.0 || lon < 30.0 || lon > 32.0) {
      warnings.push({
        code: "COORDINATES_OUT_OF_BOUNDS",
        severity: "HIGH",
        message: "Koordinatlar Antalya sınırları dışında görünüyor.",
        field: "coordinates"
      })
    }
  }
  
  if (input.district && !isValidDistrict(input.district)) {
    warnings.push({
      code: "INVALID_DISTRICT",
      severity: "HIGH",
      message: `"${input.district}" geçerli bir Antalya ilçesi değil.`,
      field: "district"
    })
  }
  
  // DESCRIPTION_WARNING: Quality issues
  if (input.description) {
    const descLength = input.description.trim().length
    if (descLength < 50) {
      warnings.push({
        code: "DESCRIPTION_TOO_SHORT",
        severity: "MEDIUM",
        message: "Açıklama çok kısa. Daha detaylı bilgi ekleyin.",
        field: "description"
      })
    } else if (descLength > 2000) {
      warnings.push({
        code: "DESCRIPTION_TOO_LONG",
        severity: "LOW",
        message: "Açıklama çok uzun. Daha kısa ve öz olabilir.",
        field: "description"
      })
    }
    
    // Check for spam patterns
    if (/(.)\1{5,}/.test(input.description)) {
      warnings.push({
        code: "SPAM_PATTERN_DETECTED",
        severity: "HIGH",
        message: "Açıklamada spam benzeri kalıplar tespit edildi.",
        field: "description"
      })
    }
    
    // Check for contact info in description
    const phonePattern = /(\+90|0)?\s?[5][0-9]{2}\s?[0-9]{3}\s?[0-9]{2}\s?[0-9]{2}/
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    if (phonePattern.test(input.description) || emailPattern.test(input.description)) {
      warnings.push({
        code: "CONTACT_IN_DESCRIPTION",
        severity: "MEDIUM",
        message: "İletişim bilgileri açıklamada olmamalı. Lütfen ilgili alanları kullanın.",
        field: "description"
      })
    }
  }
  
  // TITLE_WARNING: Quality issues
  if (input.title) {
    const titleLength = input.title.trim().length
    if (titleLength < 10) {
      warnings.push({
        code: "TITLE_TOO_SHORT",
        severity: "HIGH",
        message: "Başlık çok kısa. En az 10 karakter olmalı.",
        field: "title"
      })
    } else if (titleLength > 100) {
      warnings.push({
        code: "TITLE_TOO_LONG",
        severity: "MEDIUM",
        message: "Başlık çok uzun. 100 karakterden kısa olmalı.",
        field: "title"
      })
    }
    
    // Check for all caps
    const capsRatio = (input.title.match(/[A-ZİŞĞÜÖÇ]/g) || []).length / input.title.length
    if (capsRatio > 0.5 && input.title.length > 15) {
      warnings.push({
        code: "TITLE_ALL_CAPS",
        severity: "LOW",
        message: "Başlık tamamen büyük harflerle yazılmış. Normal yazım tercih edilir.",
        field: "title"
      })
    }
  }
  
  // MEDIA_WARNING: Image count issues
  if (!input.imageCount || input.imageCount === 0) {
    warnings.push({
      code: "NO_IMAGES",
      severity: "HIGH",
      message: "En az 1 görsel eklenmelidir.",
      field: "imageCount"
    })
  } else if (input.imageCount === 1) {
    warnings.push({
      code: "INSUFFICIENT_IMAGES",
      severity: "MEDIUM",
      message: "Daha fazla görsel eklemek önerilir (en az 3-5 görsel).",
      field: "imageCount"
    })
  }
  
  // BALCONY_WARNING: Unusual balcony count
  if (input.balconyCount !== null && input.balconyCount !== undefined) {
    if (input.balconyCount > input.roomCount && input.roomCount > 0) {
      warnings.push({
        code: "BALCONY_COUNT_HIGH",
        severity: "LOW",
        message: "Balkon sayısı oda sayısından fazla görünüyor.",
        field: "balconyCount"
      })
    }
  }
  
  return warnings
}
```

---

## 6. Tag Extraction Strategy

### 6.1 Tag Categories
```javascript
const TAG_CATEGORIES = {
  "property_type": ["daire", "ev", "villa", "apartman", "rezidans", "müstakil", "penthouse", "stüdyo", "triplex", "duplex"],
  "location_type": ["sahil", "deniz", "merkez", "şehir", "kırsal", "plaj", "lara", "konyaaltı", "muratpaşa"],
  "features": ["balkon", "teras", "bahçe", "havuz", "deniz manzarası", "güvenlik", "otopark", "asansör", "eşyalı", "eşyasız", "klima", "şömine"],
  "quality": ["lüks", "modern", "yeni", "bakımlı", "ferah", "geniş", "aydınlık"],
  "amenities": ["okul yakın", "hastane yakın", "market yakın", "plaj yakın", "ulaşım kolay"]
}
```

### 6.2 Extraction Logic
```javascript
function extractTags(input) {
  const tags = new Set()
  const normalizedTitle = normalizeTurkish((input.title || "").toLowerCase())
  const normalizedDescription = normalizeTurkish((input.description || "").toLowerCase())
  const combinedText = normalizedTitle + " " + normalizedDescription
  
  // Extract property type tags
  TAG_CATEGORIES.property_type.forEach(tag => {
    const normalizedTag = normalizeTurkish(tag.toLowerCase())
    if (combinedText.includes(normalizedTag)) {
      tags.add(tag)
    }
  })
  
  // Extract location-based tags
  TAG_CATEGORIES.location_type.forEach(tag => {
    const normalizedTag = normalizeTurkish(tag.toLowerCase())
    if (combinedText.includes(normalizedTag)) {
      tags.add(tag)
    }
  })
  
  // Extract feature tags
  TAG_CATEGORIES.features.forEach(tag => {
    const normalizedTag = normalizeTurkish(tag.toLowerCase())
    if (combinedText.includes(normalizedTag)) {
      tags.add(tag)
    }
  })
  
  // Extract quality tags
  TAG_CATEGORIES.quality.forEach(tag => {
    const normalizedTag = normalizeTurkish(tag.toLowerCase())
    if (combinedText.includes(normalizedTag)) {
      tags.add(tag)
    }
  })
  
  // Extract amenity tags (context-aware)
  TAG_CATEGORIES.amenities.forEach(tag => {
    const normalizedTag = normalizeTurkish(tag.toLowerCase())
    // Check for proximity keywords
    if (combinedText.includes(normalizedTag) || 
        combinedText.includes(normalizeTurkish("yakın")) ||
        combinedText.includes(normalizeTurkish("yakınında"))) {
      tags.add(tag)
    }
  })
  
  // Rule-based tag generation from data
  
  // Furnished status
  if (input.furnished === true) {
    tags.add("eşyalı")
  } else if (input.furnished === false) {
    tags.add("eşyasız")
  }
  
  // Balcony count
  if (input.balconyCount && input.balconyCount > 0) {
    tags.add("balkon")
    if (input.balconyCount > 1) {
      tags.add("çoklu balkon")
    }
  }
  
  // Room count based tags
  if (input.roomCount === 0) {
    tags.add("stüdyo")
  } else if (input.roomCount === 1) {
    tags.add("1+1")
  } else if (input.roomCount === 2) {
    tags.add("2+1")
  } else if (input.roomCount === 3) {
    tags.add("3+1")
  } else if (input.roomCount >= 4) {
    tags.add("geniş")
  }
  
  // Size-based tags
  if (input.squareMeters) {
    if (input.squareMeters < 50) {
      tags.add("kompakt")
    } else if (input.squareMeters >= 150) {
      tags.add("geniş")
    }
    if (input.squareMeters >= 200) {
      tags.add("ferah")
    }
  }
  
  // Price-based tags (if available)
  if (input.price && input.squareMeters) {
    const pricePerSqm = input.price / input.squareMeters
    if (pricePerSqm >= 20000) {
      tags.add("lüks")
    } else if (pricePerSqm <= 5000) {
      tags.add("uygun fiyat")
    }
  }
  
  // Location-based tags
  if (input.district) {
    const districtLower = normalizeTurkish(input.district.toLowerCase())
    if (districtLower.includes("lara") || districtLower.includes("kundu")) {
      tags.add("lara bölgesi")
    }
    if (districtLower.includes("konyaaltı")) {
      tags.add("konyaaltı bölgesi")
    }
    if (districtLower.includes("muratpaşa")) {
      tags.add("merkez")
    }
  }
  
  // Coordinate-based tags (sea view potential)
  if (input.coordinates && input.coordinates.latitude) {
    // Antalya coastline is roughly at latitude 36.8-36.9
    if (input.coordinates.latitude >= 36.7 && input.coordinates.latitude <= 37.0) {
      // Check if description mentions sea view
      if (normalizedDescription.includes("deniz") || normalizedDescription.includes("manzara")) {
        tags.add("deniz manzarası")
      }
    }
  }
  
  return Array.from(tags).slice(0, 15)  // Limit to 15 tags
}
```

---

## 7. SEO Title Construction Logic

### 7.1 Construction Rules
```javascript
function constructSEOTitle(input) {
  if (!input.title) return ""
  
  const parts = []
  
  // 1. Room count (if available)
  if (input.roomCount !== null && input.roomCount !== undefined) {
    if (input.roomCount === 0) {
      parts.push("Stüdyo")
    } else {
      parts.push(`${input.roomCount}+1`)
    }
  }
  
  // 2. Property type (extract from title/description or infer)
  const propertyType = extractPropertyType(input.title, input.description)
  if (propertyType) {
    parts.push(propertyType)
  }
  
  // 3. Square meters (if available)
  if (input.squareMeters) {
    parts.push(`${Math.round(input.squareMeters)} m²`)
  }
  
  // 4. Location (district + neighborhood)
  const locationParts = []
  if (input.neighborhood) {
    locationParts.push(input.neighborhood)
  }
  if (input.district && input.district !== input.neighborhood) {
    locationParts.push(input.district)
  }
  if (locationParts.length > 0) {
    parts.push(locationParts.join(", "))
  }
  
  // 5. Key features (from tags or data)
  const features = []
  if (input.furnished === true) {
    features.push("Eşyalı")
  }
  if (input.balconyCount && input.balconyCount > 0) {
    features.push("Balkonlu")
  }
  if (input.squareMeters && input.squareMeters >= 150) {
    features.push("Geniş")
  }
  
  // Add one key feature if available
  if (features.length > 0) {
    parts.push(features[0])
  }
  
  // Construct final title
  let seoTitle = parts.join(" ")
  
  // Fallback: use original title if construction fails
  if (seoTitle.length < 20) {
    seoTitle = input.title
  }
  
  // Ensure title is within limits (50-70 chars ideal for SEO)
  if (seoTitle.length > 70) {
    // Truncate intelligently
    seoTitle = truncateTitle(seoTitle, 70)
  }
  
  // Ensure minimum length
  if (seoTitle.length < 20) {
    seoTitle = input.title.substring(0, 70)
  }
  
  return seoTitle.trim()
}

function extractPropertyType(title, description) {
  const text = (title + " " + (description || "")).toLowerCase()
  const normalized = normalizeTurkish(text)
  
  if (normalized.includes("villa")) return "Villa"
  if (normalized.includes("penthouse")) return "Penthouse"
  if (normalized.includes("triplex")) return "Triplex"
  if (normalized.includes("duplex")) return "Duplex"
  if (normalized.includes("müstakil")) return "Müstakil Ev"
  if (normalized.includes("rezidans")) return "Rezidans"
  if (normalized.includes("apartman")) return "Apartman Dairesi"
  if (normalized.includes("stüdyo")) return "Stüdyo"
  if (normalized.includes("daire")) return "Daire"
  if (normalized.includes("ev")) return "Ev"
  
  return null
}

function truncateTitle(title, maxLength) {
  if (title.length <= maxLength) return title
  
  // Try to truncate at word boundary
  const truncated = title.substring(0, maxLength - 3)
  const lastSpace = truncated.lastIndexOf(" ")
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + "..."
  }
  
  return truncated + "..."
}
```

### 7.2 SEO Title Examples

**Input:**
```json
{
  "title": "Lara'da Deniz Manzaralı Lüks Daire",
  "roomCount": 3,
  "squareMeters": 120,
  "district": "Muratpaşa",
  "neighborhood": "Lara",
  "furnished": true,
  "balconyCount": 2
}
```

**Output:** `"3+1 Daire 120 m² Lara, Muratpaşa Eşyalı"`

**Input:**
```json
{
  "title": "Konyaaltı Sahilinde Villa",
  "roomCount": 5,
  "squareMeters": 250,
  "district": "Konyaaltı",
  "neighborhood": "Sahil",
  "furnished": false,
  "balconyCount": 3
}
```

**Output:** `"5+1 Villa 250 m² Sahil, Konyaaltı Balkonlu"`

---

## 8. Turkish Character Normalization

### 8.1 Normalization Function
```javascript
function normalizeTurkish(text) {
  if (!text) return ""
  
  return text
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .replace(/Ş/g, "ş")
    .replace(/Ğ/g, "ğ")
    .replace(/Ü/g, "ü")
    .replace(/Ö/g, "ö")
    .replace(/Ç/g, "ç")
    .toLowerCase()
    .trim()
}
```

---

## 9. Complete Scoring Algorithm

### 9.1 Main Function
```javascript
function scoreListing(input) {
  // 1. Detect missing fields
  const missingFields = detectMissingFields(input)
  
  // 2. Calculate completeness score
  const completenessScore = calculateCompletenessScore(input)
  
  // 3. Calculate description quality score
  const descriptionQualityScore = calculateDescriptionQualityScore(input.description)
  
  // 4. Generate warnings
  const warnings = generateWarnings(input)
  
  // 5. Extract tags
  const tags = extractTags(input)
  
  // 6. Construct SEO title
  const seoTitle = constructSEOTitle(input)
  
  // 7. Calculate score breakdown
  const scoreBreakdown = {
    completeness: {
      basicInfo: calculateBasicInfoScore(input),
      location: calculateLocationScore(input),
      specifications: calculateSpecificationsScore(input),
      media: calculateMediaScore(input)
    },
    descriptionQuality: {
      length: calculateLengthScore(input.description),
      structure: calculateStructureScore(input.description),
      keywords: calculateKeywordsScore(input.description),
      readability: calculateReadabilityScore(input.description)
    }
  }
  
  // 8. Generate recommendations
  const recommendations = generateRecommendations(input, completenessScore, descriptionQualityScore, warnings)
  
  return {
    completenessScore: Math.round(completenessScore),
    descriptionQualityScore: Math.round(descriptionQualityScore),
    missingFields: missingFields.required,
    warnings: warnings,
    tags: tags,
    seoTitle: seoTitle,
    scoreBreakdown: scoreBreakdown,
    recommendations: recommendations
  }
}
```

### 9.2 Recommendations Generator
```javascript
function generateRecommendations(input, completenessScore, descriptionQualityScore, warnings) {
  const recommendations = []
  
  if (completenessScore < 70) {
    recommendations.push("Eksik alanları doldurarak tamamlama puanınızı artırabilirsiniz.")
  }
  
  if (descriptionQualityScore < 60) {
    recommendations.push("Açıklamayı daha detaylı ve yapılandırılmış hale getirin.")
  }
  
  if (!input.imageCount || input.imageCount < 3) {
    recommendations.push("En az 3-5 görsel eklemek önerilir.")
  }
  
  if (input.description && input.description.length < 200) {
    recommendations.push("Açıklamayı en az 200 karakter yaparak daha fazla bilgi verin.")
  }
  
  if (input.balconyCount === null || input.balconyCount === undefined) {
    recommendations.push("Balkon sayısı bilgisi ekleyerek tamamlama puanınızı artırabilirsiniz.")
  }
  
  if (warnings.some(w => w.severity === "HIGH")) {
    recommendations.push("Yüksek öncelikli uyarıları düzeltmeniz önerilir.")
  }
  
  return recommendations
}
```

---

## 10. Testing Examples

### 10.1 Example 1: Complete Listing
**Input:**
```json
{
  "title": "Lara'da Deniz Manzaralı 3+1 Lüks Daire",
  "description": "Lara bölgesinde, denize sıfır konumda, lüks rezidansta yer alan 3+1 daire. Geniş balkon, deniz manzarası, eşyalı, güvenlikli site. Okul ve market yakın. Ulaşım kolay.",
  "price": 2500000,
  "squareMeters": 120,
  "roomCount": 3,
  "balconyCount": 2,
  "furnished": true,
  "district": "Muratpaşa",
  "neighborhood": "Lara",
  "coordinates": { "latitude": 36.85, "longitude": 30.85 },
  "imageCount": 8
}
```

**Expected Output:**
- Completeness Score: ~95
- Description Quality Score: ~85
- Missing Fields: []
- Warnings: [] or low-severity only
- Tags: ["3+1", "daire", "lüks", "deniz manzarası", "balkon", "eşyalı", "lara bölgesi", "geniş"]
- SEO Title: "3+1 Daire 120 m² Lara, Muratpaşa Eşyalı"

### 10.2 Example 2: Incomplete Listing
**Input:**
```json
{
  "title": "Daire",
  "description": "Güzel daire",
  "price": 500000,
  "squareMeters": 80,
  "roomCount": 2,
  "balconyCount": null,
  "furnished": null,
  "district": "Muratpaşa",
  "neighborhood": "",
  "coordinates": null,
  "imageCount": 1
}
```

**Expected Output:**
- Completeness Score: ~45
- Description Quality Score: ~20
- Missing Fields: ["neighborhood", "coordinates"]
- Warnings: Multiple (description too short, insufficient images, etc.)
- Tags: ["2+1", "daire"]
- SEO Title: "2+1 Daire 80 m² Muratpaşa"

---

## 11. Performance Considerations

### 11.1 Optimization
- All string operations use normalized Turkish characters for consistency
- Tag extraction uses Set to avoid duplicates
- Scoring functions are pure (no side effects)
- Caching can be applied to district/neighborhood validation

### 11.2 Determinism Guarantees
- No random number generation
- No time-based logic
- No external API calls
- All calculations are deterministic mathematical operations

---

**Document Status:** Complete v1.0.0  
**Implementation Ready:** Yes  
**Testing Required:** Unit tests for all scoring functions
