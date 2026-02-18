# Media Integrity & Standards Specification
## Antalya Real Estate Platform (AREP)

**Version:** 1.0.0  
**Last Updated:** 2026-02-18  
**Status:** Canonical Policy Reference

---

## 1. Overview

This document defines strict media integrity and quality standards for real estate listing images. All images MUST comply with these standards before a listing can be published.

### 1.1 Scope
- Image upload requirements
- Image quality standards
- Content moderation policies
- Duplicate detection rules
- Ordering and presentation rules

### 1.2 Compliance Levels
- **BLOCKING ERROR**: Prevents listing publication
- **WARNING**: Flags issue but allows publication (requires admin review)
- **INFO**: Informational note, no action required

---

## 2. Minimum Required Images for Publish

### 2.1 Rule MEDIA-MIN-1: Absolute Minimum
**Rule:** Listing MUST have at least 1 image to be submitted for review.

**Compliance:** BLOCKING ERROR

**Validation:**
- `imageCount >= 1`
- At least one image with valid metadata
- At least one image passes all quality checks

**Error Code:** `NO_IMAGES`

**Error Message (Turkish):** "En az 1 görsel gereklidir"

---

### 2.2 Rule MEDIA-MIN-2: Recommended Minimum
**Rule:** Listing SHOULD have at least 3 images for publication.

**Compliance:** WARNING

**Validation:**
- `imageCount >= 3` (recommended)
- `imageCount < 3` generates warning but allows submission

**Warning Code:** `INSUFFICIENT_IMAGES`

**Warning Message (Turkish):** "En az 3-5 görsel önerilir. Mevcut: {imageCount}"

---

### 2.3 Rule MEDIA-MIN-3: Optimal Count
**Rule:** Listing SHOULD have 5-10 images for optimal presentation.

**Compliance:** INFO

**Validation:**
- `imageCount >= 5 && imageCount <= 10` (optimal range)
- `imageCount > 10` is acceptable but may impact performance

**Info Code:** `OPTIMAL_IMAGE_COUNT`

**Info Message (Turkish):** "Görsel sayısı optimal aralıkta: {imageCount}"

---

### 2.4 Rule MEDIA-MIN-4: Maximum Limit
**Rule:** Listing MUST NOT exceed 50 images.

**Compliance:** BLOCKING ERROR

**Validation:**
- `imageCount <= 50`
- Reject upload if attempting to exceed limit

**Error Code:** `IMAGE_COUNT_EXCEEDED`

**Error Message (Turkish):** "Maksimum 50 görsel yüklenebilir. Mevcut: {imageCount}"

---

## 3. Image Ordering Rules

### 3.1 Rule MEDIA-ORD-1: Primary Image Requirement
**Rule:** Listing MUST have exactly one primary image.

**Compliance:** BLOCKING ERROR

**Validation:**
- Exactly one image with `isPrimary: true` or `order: 0`
- Primary image MUST pass all quality checks
- Primary image MUST NOT be prohibited content

**Error Code:** `NO_PRIMARY_IMAGE`

**Error Message (Turkish):** "Bir ana görsel belirlenmelidir"

**Error Code:** `MULTIPLE_PRIMARY_IMAGES`

**Error Message (Turkish):** "Sadece bir ana görsel olabilir. Mevcut: {count}"

---

### 3.2 Rule MEDIA-ORD-2: Order Sequence
**Rule:** Image order MUST be sequential starting from 0.

**Compliance:** BLOCKING ERROR

**Validation:**
- Order values: `0, 1, 2, 3, ...` (no gaps)
- Order values: No duplicates
- Order values: Start from 0

**Error Code:** `INVALID_ORDER_SEQUENCE`

**Error Message (Turkish):** "Görsel sırası geçersiz. Sıralama 0'dan başlamalı ve kesintisiz olmalıdır"

**Example:**
- Valid: `[0, 1, 2, 3]`
- Invalid: `[0, 1, 3, 4]` (gap at 2)
- Invalid: `[1, 2, 3, 4]` (doesn't start at 0)
- Invalid: `[0, 1, 1, 2]` (duplicate)

---

### 3.3 Rule MEDIA-ORD-3: Primary Image Position
**Rule:** Primary image SHOULD be first in sequence (order: 0).

**Compliance:** WARNING

**Validation:**
- Primary image `order === 0` (recommended)
- Primary image `order !== 0` generates warning

**Warning Code:** `PRIMARY_IMAGE_NOT_FIRST`

**Warning Message (Turkish):** "Ana görsel ilk sırada olmalıdır. Mevcut sıra: {order}"

---

### 3.4 Rule MEDIA-ORD-4: Order Stability
**Rule:** Image order MUST remain stable after upload.

**Compliance:** BLOCKING ERROR

**Validation:**
- Order values MUST NOT change after initial assignment
- Reordering requires explicit update operation
- Order values MUST be persisted in database

**Error Code:** `ORDER_INSTABILITY`

**Error Message (Turkish):** "Görsel sırası değiştirilemez (teknik hata)"

---

## 4. Minimum Dimensions & Compression Rules

### 4.1 Rule MEDIA-DIM-1: Minimum Dimensions
**Rule:** Images MUST meet minimum dimension requirements.

**Requirements:**
- Minimum width: 800 pixels
- Minimum height: 600 pixels
- Aspect ratio: Between 1:2 and 2:1 (width:height)

**Compliance:** BLOCKING ERROR

**Validation:**
- `width >= 800 && height >= 600`
- `aspectRatio >= 0.5 && aspectRatio <= 2.0`

**Error Code:** `DIMENSIONS_TOO_SMALL`

**Error Message (Turkish):** "Görsel boyutu çok küçük. Minimum: 800x600 piksel. Mevcut: {width}x{height}"

**Error Code:** `INVALID_ASPECT_RATIO`

**Error Message (Turkish):** "Görsel en-boy oranı geçersiz. Oran 1:2 ile 2:1 arasında olmalıdır"

---

### 4.2 Rule MEDIA-DIM-2: Recommended Dimensions
**Rule:** Images SHOULD meet recommended dimensions for optimal quality.

**Recommendations:**
- Recommended width: 1920 pixels
- Recommended height: 1080 pixels (16:9 aspect ratio)
- Alternative: 1200x800 pixels (3:2 aspect ratio)

**Compliance:** WARNING

**Validation:**
- `width >= 1920 && height >= 1080` (optimal)
- `width < 1920 || height < 1080` generates warning

**Warning Code:** `SUBOPTIMAL_DIMENSIONS`

**Warning Message (Turkish):** "Görsel boyutu optimal değil. Önerilen: 1920x1080 piksel. Mevcut: {width}x{height}"

---

### 4.3 Rule MEDIA-DIM-3: Maximum Dimensions
**Rule:** Images MUST NOT exceed maximum dimensions.

**Limits:**
- Maximum width: 4000 pixels
- Maximum height: 4000 pixels
- Maximum file size: 10 MB (before compression)

**Compliance:** BLOCKING ERROR

**Validation:**
- `width <= 4000 && height <= 4000`
- `sizeBytes <= 10485760` (10 MB)

**Error Code:** `DIMENSIONS_TOO_LARGE`

**Error Message (Turkish):** "Görsel boyutu çok büyük. Maksimum: 4000x4000 piksel. Mevcut: {width}x{height}"

**Error Code:** `FILE_SIZE_TOO_LARGE`

**Error Message (Turkish):** "Görsel dosya boyutu çok büyük. Maksimum: 10 MB. Mevcut: {sizeMB} MB"

---

### 4.4 Rule MEDIA-COMP-1: Compression Requirements
**Rule:** Images MUST be compressed to acceptable file size.

**Requirements:**
- Target file size: < 2 MB (after compression)
- Compression quality: 85-95% (JPEG)
- Format: JPEG or WebP

**Compliance:** BLOCKING ERROR

**Validation:**
- Compressed `sizeBytes < 2097152` (2 MB)
- Compression applied if original > 2 MB
- Quality preserved (no visible degradation)

**Error Code:** `COMPRESSION_FAILED`

**Error Message (Turkish):** "Görsel sıkıştırılamadı. Dosya boyutu çok büyük"

**Error Code:** `COMPRESSION_QUALITY_LOW`

**Error Message (Turkish):** "Görsel sıkıştırma kalitesi düşük. Yeniden yükleyin"

---

### 4.5 Rule MEDIA-COMP-2: Format Requirements
**Rule:** Images MUST be in supported formats.

**Supported Formats:**
- JPEG (`.jpg`, `.jpeg`)
- WebP (`.webp`)
- PNG (`.png`) - converted to JPEG for storage

**Compliance:** BLOCKING ERROR

**Validation:**
- `mimeType IN ["image/jpeg", "image/jpg", "image/webp", "image/png"]`
- PNG files converted to JPEG automatically

**Error Code:** `UNSUPPORTED_FORMAT`

**Error Message (Turkish):** "Desteklenmeyen görsel formatı. Desteklenen: JPEG, WebP, PNG"

---

### 4.6 Rule MEDIA-COMP-3: Color Space
**Rule:** Images MUST use sRGB color space.

**Compliance:** WARNING

**Validation:**
- Color space: sRGB (recommended)
- Other color spaces converted to sRGB
- Conversion generates warning

**Warning Code:** `NON_SRGB_COLORSPACE`

**Warning Message (Turkish):** "Görsel sRGB renk alanında değil. Otomatik dönüştürüldü"

---

## 5. Duplicate Detection Requirements

### 5.1 Rule MEDIA-DUP-1: Perceptual Hash Calculation
**Rule:** Each image MUST have perceptual hash calculated for duplicate detection.

**Hash Algorithm:** Perceptual Hash (pHash) + SHA-256

**Process:**
1. Calculate perceptual hash (pHash) for visual similarity
2. Calculate SHA-256 hash for exact duplicate detection
3. Store both hashes in image metadata

**Hash Storage:**
```json
{
  "imageId": "UUID v4",
  "metadata": {
    "perceptualHash": "string (hex)",
    "sha256Hash": "string (SHA-256 hex)",
    "hashAlgorithm": "pHash_v1 + SHA-256"
  }
}
```

**Compliance:** BLOCKING ERROR

**Error Code:** `HASH_CALCULATION_FAILED`

**Error Message (Turkish):** "Görsel hash hesaplanamadı"

---

### 5.2 Rule MEDIA-DUP-2: Exact Duplicate Detection
**Rule:** Exact duplicate images MUST be rejected.

**Detection Method:** SHA-256 hash comparison

**Validation:**
- Compare SHA-256 hash against all existing images
- If exact match found: Reject upload
- Exception: Same listing (allow re-upload of same image)

**Compliance:** BLOCKING ERROR

**Error Code:** `EXACT_DUPLICATE_DETECTED`

**Error Message (Turkish):** "Bu görsel daha önce yüklenmiş. Aynı görseli tekrar yükleyemezsiniz"

**Exception:**
- Same `listingId`: Allow (may be reordering or update)
- Different `listingId`: Block (duplicate across listings)

---

### 5.3 Rule MEDIA-DUP-3: Near-Duplicate Detection
**Rule:** Near-duplicate images (high similarity) MUST be flagged.

**Detection Method:** Perceptual hash (pHash) comparison

**Similarity Threshold:**
- High similarity: Hamming distance < 5 (pHash)
- Medium similarity: Hamming distance 5-10
- Low similarity: Hamming distance > 10

**Compliance:** WARNING (high similarity), INFO (medium similarity)

**Validation:**
- Compare perceptual hash against existing images
- Calculate Hamming distance
- Flag if distance < 5

**Warning Code:** `NEAR_DUPLICATE_DETECTED`

**Warning Message (Turkish):** "Bu görsel mevcut bir görsele çok benziyor. Farklı bir görsel kullanın"

**Info Code:** `SIMILAR_IMAGE_DETECTED`

**Info Message (Turkish):** "Bu görsel mevcut bir görsele benziyor (bilgilendirme)"

---

### 5.4 Rule MEDIA-DUP-4: Cross-Listing Duplicate Detection
**Rule:** Images from other listings MUST be detected and flagged.

**Detection Scope:**
- Compare against all published listings
- Compare against all pending listings from other consultants
- Exception: Same consultant's listings (may reuse images)

**Compliance:** BLOCKING ERROR (if different consultant), WARNING (if same consultant)

**Validation:**
- Check SHA-256 hash against all listings
- If match found in different consultant's listing: Block
- If match found in same consultant's listing: Warning

**Error Code:** `CROSS_LISTING_DUPLICATE`

**Error Message (Turkish):** "Bu görsel başka bir ilanda kullanılmış. Kendi görsellerinizi kullanın"

**Warning Code:** `SAME_CONSULTANT_DUPLICATE`

**Warning Message (Turkish):** "Bu görsel sizin başka bir ilanınızda kullanılmış"

---

### 5.5 Rule MEDIA-DUP-5: Stock Photo Detection
**Rule:** Stock photos MUST be detected and rejected.

**Detection Method:**
- Hash comparison against known stock photo databases
- Watermark detection
- Metadata analysis (EXIF data)

**Compliance:** BLOCKING ERROR

**Validation:**
- Check hash against stock photo database
- Detect watermarks (Shutterstock, Getty, etc.)
- Analyze EXIF data for stock photo indicators

**Error Code:** `STOCK_PHOTO_DETECTED`

**Error Message (Turkish):** "Stok fotoğraf tespit edildi. Sadece gerçek mülk fotoğrafları kullanılabilir"

**Stock Photo Indicators:**
- Watermark text: "Shutterstock", "Getty Images", "iStock", etc.
- EXIF copyright: Stock photo agencies
- Hash match: Known stock photo database

---

## 6. Prohibited Content Categories

### 6.1 Rule MEDIA-PROH-1: Inappropriate Content
**Rule:** Images containing inappropriate content MUST be rejected.

**Prohibited Categories:**
- Nudity or sexual content
- Violence or graphic content
- Hate speech or discriminatory content
- Illegal activities
- Weapons or dangerous items

**Compliance:** BLOCKING ERROR

**Error Code:** `INAPPROPRIATE_CONTENT`

**Error Message (Turkish):** "Görsel uygunsuz içerik içeriyor"

**Detection Method:**
- Automated content moderation (AI/ML)
- Manual review flagging
- User reporting

---

### 6.2 Rule MEDIA-PROH-2: Non-Property Images
**Rule:** Images MUST show the actual property or related features.

**Prohibited Content:**
- Personal photos (people, family)
- Unrelated scenery or landscapes
- Text-only images (flyers, documents)
- Screenshots or digital graphics
- Memes or internet images

**Compliance:** BLOCKING ERROR

**Error Code:** `NON_PROPERTY_IMAGE`

**Error Message (Turkish):** "Görsel mülk ile ilgili değil. Sadece mülk fotoğrafları kullanılabilir"

**Allowed Exceptions:**
- Property exterior/interior
- Property features (pool, garden, balcony)
- Property views (sea view, city view)
- Building amenities (lobby, gym, pool area)
- Location context (neighborhood, nearby landmarks)

---

### 6.3 Rule MEDIA-PROH-3: Contact Information in Images
**Rule:** Images MUST NOT contain contact information or watermarks.

**Prohibited Content:**
- Phone numbers
- Email addresses
- Website URLs
- Social media handles
- Consultant contact information
- Company logos (unless property developer logo)

**Compliance:** BLOCKING ERROR

**Error Code:** `CONTACT_INFO_IN_IMAGE`

**Error Message (Turkish):** "Görselde iletişim bilgisi bulunuyor. İletişim bilgileri görselde olmamalıdır"

**Detection Method:**
- OCR (Optical Character Recognition)
- Pattern matching (phone, email formats)
- Watermark detection

**Exception:**
- Property developer logo (if part of building)
- Building name/number (if part of property)

---

### 6.4 Rule MEDIA-PROH-4: Competitor Branding
**Rule:** Images MUST NOT contain competitor branding or logos.

**Prohibited Content:**
- Competitor real estate agency logos
- Competitor platform watermarks
- Competitor website URLs
- "For Sale" signs from competitors

**Compliance:** BLOCKING ERROR

**Error Code:** `COMPETITOR_BRANDING`

**Error Message (Turkish):"Görselde rakip firma logosu veya markası bulunuyor"

**Exception:**
- Generic "For Sale" signs (no branding)
- Property developer branding (allowed)

---

### 6.5 Rule MEDIA-PROH-5: Low Quality Images
**Rule:** Images MUST meet minimum quality standards.

**Prohibited Characteristics:**
- Blurry or out-of-focus
- Extremely dark or overexposed
- Heavily compressed (visible artifacts)
- Distorted or stretched
- Upscaled low-resolution images

**Compliance:** BLOCKING ERROR

**Error Code:** `LOW_QUALITY_IMAGE`

**Error Message (Turkish):** "Görsel kalitesi yetersiz. Net, iyi aydınlatılmış görseller kullanın"

**Quality Checks:**
- Sharpness detection (blur detection)
- Exposure analysis (too dark/bright)
- Compression artifact detection
- Resolution validation (not upscaled)

---

### 6.6 Rule MEDIA-PROH-6: Wrong Orientation
**Rule:** Images MUST be correctly oriented (not rotated).

**Requirements:**
- Correct EXIF orientation
- No 90/180/270 degree rotation needed
- Landscape or portrait orientation acceptable

**Compliance:** WARNING (auto-corrected), BLOCKING ERROR (if correction fails)

**Warning Code:** `WRONG_ORIENTATION`

**Warning Message (Turkish):** "Görsel yanlış yönde. Otomatik düzeltildi"

**Error Code:** `ORIENTATION_CORRECTION_FAILED`

**Error Message (Turkish):** "Görsel yönü düzeltilemedi. Yeniden yükleyin"

---

### 6.7 Rule MEDIA-PROH-7: Text Overlays
**Rule:** Images SHOULD NOT contain text overlays (except property details).

**Prohibited Content:**
- Marketing text overlays
- Price information in image
- Contact information overlays
- Promotional banners

**Compliance:** WARNING

**Warning Code:** `TEXT_OVERLAY_DETECTED`

**Warning Message (Turkish):** "Görselde metin katmanı bulunuyor. Temiz görseller tercih edilir"

**Allowed:**
- Property address (if part of building)
- Room labels (e.g., "Salon", "Yatak Odası")
- Property features labels (if part of property)

---

## 7. Blocking Error vs Warning Classification

### 7.1 Blocking Errors (Prevent Publication)

**Category: MEDIA-ERROR**
All blocking errors prevent listing submission or publication.

**Blocking Error Conditions:**

1. **No Images**
   - `imageCount === 0`
   - Code: `NO_IMAGES`

2. **Image Count Exceeded**
   - `imageCount > 50`
   - Code: `IMAGE_COUNT_EXCEEDED`

3. **No Primary Image**
   - No image with `isPrimary: true` or `order: 0`
   - Code: `NO_PRIMARY_IMAGE`

4. **Invalid Order Sequence**
   - Order gaps, duplicates, or doesn't start at 0
   - Code: `INVALID_ORDER_SEQUENCE`

5. **Dimensions Too Small**
   - `width < 800 || height < 600`
   - Code: `DIMENSIONS_TOO_SMALL`

6. **Invalid Aspect Ratio**
   - Aspect ratio < 0.5 or > 2.0
   - Code: `INVALID_ASPECT_RATIO`

7. **Dimensions Too Large**
   - `width > 4000 || height > 4000`
   - Code: `DIMENSIONS_TOO_LARGE`

8. **File Size Too Large**
   - `sizeBytes > 10485760` (10 MB)
   - Code: `FILE_SIZE_TOO_LARGE`

9. **Compression Failed**
   - Cannot compress to < 2 MB
   - Code: `COMPRESSION_FAILED`

10. **Unsupported Format**
    - `mimeType` not in supported list
    - Code: `UNSUPPORTED_FORMAT`

11. **Hash Calculation Failed**
    - Cannot calculate perceptual hash or SHA-256
    - Code: `HASH_CALCULATION_FAILED`

12. **Exact Duplicate (Cross-Listing)**
    - SHA-256 match in different consultant's listing
    - Code: `EXACT_DUPLICATE_DETECTED` or `CROSS_LISTING_DUPLICATE`

13. **Stock Photo Detected**
    - Watermark or hash match with stock photo database
    - Code: `STOCK_PHOTO_DETECTED`

14. **Inappropriate Content**
    - Nudity, violence, illegal content
    - Code: `INAPPROPRIATE_CONTENT`

15. **Non-Property Image**
    - Image doesn't show property or related features
    - Code: `NON_PROPERTY_IMAGE`

16. **Contact Information in Image**
    - Phone, email, URL detected in image
    - Code: `CONTACT_INFO_IN_IMAGE`

17. **Competitor Branding**
    - Competitor logo or branding detected
    - Code: `COMPETITOR_BRANDING`

18. **Low Quality Image**
    - Blurry, dark, compressed, distorted
    - Code: `LOW_QUALITY_IMAGE`

19. **Orientation Correction Failed**
    - Cannot auto-correct image orientation
    - Code: `ORIENTATION_CORRECTION_FAILED`

---

### 7.2 Warnings (Allow Publication with Flag)

**Category: MEDIA-WARNING**
Warnings flag issues but allow listing submission/publication.

**Warning Conditions:**

1. **Insufficient Images**
   - `imageCount < 3`
   - Code: `INSUFFICIENT_IMAGES`
   - Severity: MEDIUM

2. **Primary Image Not First**
   - Primary image `order !== 0`
   - Code: `PRIMARY_IMAGE_NOT_FIRST`
   - Severity: LOW

3. **Suboptimal Dimensions**
   - `width < 1920 || height < 1080`
   - Code: `SUBOPTIMAL_DIMENSIONS`
   - Severity: LOW

4. **Non-sRGB Color Space**
   - Color space converted from non-sRGB
   - Code: `NON_SRGB_COLORSPACE`
   - Severity: LOW

5. **Near-Duplicate Detected**
   - Perceptual hash similarity (Hamming distance < 5)
   - Code: `NEAR_DUPLICATE_DETECTED`
   - Severity: MEDIUM

6. **Same Consultant Duplicate**
   - Image reused from consultant's other listing
   - Code: `SAME_CONSULTANT_DUPLICATE`
   - Severity: LOW

7. **Wrong Orientation (Auto-Corrected)**
   - Image rotated, auto-corrected successfully
   - Code: `WRONG_ORIENTATION`
   - Severity: LOW

8. **Text Overlay Detected**
   - Marketing text or overlays detected
   - Code: `TEXT_OVERLAY_DETECTED`
   - Severity: LOW

---

### 7.3 Info Messages (No Action Required)

**Category: MEDIA-INFO**
Informational messages, no blocking or warning.

**Info Conditions:**

1. **Optimal Image Count**
   - `imageCount >= 5 && imageCount <= 10`
   - Code: `OPTIMAL_IMAGE_COUNT`

2. **Similar Image Detected**
   - Perceptual hash similarity (Hamming distance 5-10)
   - Code: `SIMILAR_IMAGE_DETECTED`

---

## 8. Media Validation Checklist

### 8.1 Pre-Upload Validation

**Checklist:**
- [ ] Image format is JPEG, WebP, or PNG
- [ ] Image dimensions >= 800x600 pixels
- [ ] Image dimensions <= 4000x4000 pixels
- [ ] File size <= 10 MB (before compression)
- [ ] Image is not corrupted or invalid

**Failure:** Block upload, return error

---

### 8.2 Post-Upload Validation

**Checklist:**
- [ ] Image successfully uploaded to storage
- [ ] SHA-256 hash calculated
- [ ] Perceptual hash calculated
- [ ] Metadata extracted (width, height, size, mimeType)
- [ ] Compression applied (if needed)
- [ ] Compressed size < 2 MB
- [ ] Image passes quality checks (sharpness, exposure)

**Failure:** Block upload, return error

---

### 8.3 Duplicate Detection Checklist

**Checklist:**
- [ ] SHA-256 hash compared against all existing images
- [ ] Perceptual hash compared against existing images
- [ ] No exact duplicate found (different consultant)
- [ ] No stock photo match found
- [ ] Watermark detection performed

**Failure:** Block upload, return error

**Warning:** Flag near-duplicate or same-consultant duplicate

---

### 8.4 Content Moderation Checklist

**Checklist:**
- [ ] Inappropriate content check (nudity, violence)
- [ ] Non-property image check
- [ ] Contact information detection (OCR)
- [ ] Competitor branding detection
- [ ] Low quality check (blur, exposure)
- [ ] Orientation check

**Failure:** Block upload, return error

**Warning:** Flag text overlay or orientation issue

---

### 8.5 Listing Submission Checklist

**Checklist:**
- [ ] At least 1 image present
- [ ] Exactly 1 primary image
- [ ] Image order is sequential (0, 1, 2, ...)
- [ ] All images pass quality checks
- [ ] No blocking errors present
- [ ] All images meet dimension requirements

**Failure:** Block submission, return errors

**Warning:** Flag warnings but allow submission

---

## 9. Image Metadata Schema

### 9.1 Required Metadata

```json
{
  "imageId": "string (UUID v4, required)",
  "listingId": "string (UUID v4, required)",
  "order": "integer (min: 0, required)",
  "isPrimary": "boolean (required)",
  "url": "string (URL, required)",
  "storageKey": "string (required)",
  "uploadedAt": "ISO 8601 datetime (UTC, required)",
  "metadata": {
    "width": "integer (required)",
    "height": "integer (required)",
    "sizeBytes": "integer (required)",
    "mimeType": "string (required)",
    "sha256Hash": "string (SHA-256 hex, required)",
    "perceptualHash": "string (hex, required)",
    "aspectRatio": "number (required)",
    "colorSpace": "string (required)",
    "exifData": "object | null (optional)"
  },
  "validation": {
    "status": "PASS | FAIL | WARNING (required)",
    "errors": ["string"] | [],
    "warnings": ["string"] | [],
    "validatedAt": "ISO 8601 datetime (UTC, required)"
  }
}
```

### 9.2 Metadata Validation Rules

**Required Fields:**
- `imageId`, `listingId`, `order`, `isPrimary`, `url`, `storageKey`, `uploadedAt`
- `metadata.width`, `metadata.height`, `metadata.sizeBytes`, `metadata.mimeType`
- `metadata.sha256Hash`, `metadata.perceptualHash`
- `validation.status`, `validation.validatedAt`

**Type Constraints:**
- All integers: Must be positive
- All strings: Must be non-empty
- All timestamps: ISO 8601 UTC format
- Hashes: Must be valid hex strings

---

## 10. Error and Warning Response Schema

### 10.1 Validation Response Schema

```json
{
  "valid": "boolean (required)",
  "imageId": "string (UUID v4, required)",
  "errors": [
    {
      "code": "string (required)",
      "field": "string (required)",
      "message": "string (Turkish, required)",
      "severity": "BLOCKING",
      "details": "object | null (optional)"
    }
  ] | [],
  "warnings": [
    {
      "code": "string (required)",
      "field": "string (required)",
      "message": "string (Turkish, required)",
      "severity": "LOW | MEDIUM | HIGH",
      "details": "object | null (optional)"
    }
  ] | [],
  "info": [
    {
      "code": "string (required)",
      "message": "string (Turkish, required)"
    }
  ] | []
}
```

---

## 11. Policy Summary Table

| Rule | Category | Compliance | Error Code |
|------|----------|------------|------------|
| Minimum 1 image | Count | BLOCKING | `NO_IMAGES` |
| Maximum 50 images | Count | BLOCKING | `IMAGE_COUNT_EXCEEDED` |
| Recommended 3+ images | Count | WARNING | `INSUFFICIENT_IMAGES` |
| Exactly 1 primary image | Ordering | BLOCKING | `NO_PRIMARY_IMAGE` |
| Sequential order (0,1,2...) | Ordering | BLOCKING | `INVALID_ORDER_SEQUENCE` |
| Primary image first | Ordering | WARNING | `PRIMARY_IMAGE_NOT_FIRST` |
| Min dimensions 800x600 | Dimensions | BLOCKING | `DIMENSIONS_TOO_SMALL` |
| Max dimensions 4000x4000 | Dimensions | BLOCKING | `DIMENSIONS_TOO_LARGE` |
| Aspect ratio 0.5-2.0 | Dimensions | BLOCKING | `INVALID_ASPECT_RATIO` |
| Recommended 1920x1080 | Dimensions | WARNING | `SUBOPTIMAL_DIMENSIONS` |
| Max file size 10 MB | Compression | BLOCKING | `FILE_SIZE_TOO_LARGE` |
| Compressed < 2 MB | Compression | BLOCKING | `COMPRESSION_FAILED` |
| Supported formats only | Format | BLOCKING | `UNSUPPORTED_FORMAT` |
| SHA-256 hash required | Duplicate | BLOCKING | `HASH_CALCULATION_FAILED` |
| No exact duplicates | Duplicate | BLOCKING | `EXACT_DUPLICATE_DETECTED` |
| No cross-listing duplicates | Duplicate | BLOCKING | `CROSS_LISTING_DUPLICATE` |
| No stock photos | Duplicate | BLOCKING | `STOCK_PHOTO_DETECTED` |
| No inappropriate content | Content | BLOCKING | `INAPPROPRIATE_CONTENT` |
| Property images only | Content | BLOCKING | `NON_PROPERTY_IMAGE` |
| No contact info in image | Content | BLOCKING | `CONTACT_INFO_IN_IMAGE` |
| No competitor branding | Content | BLOCKING | `COMPETITOR_BRANDING` |
| Minimum quality standards | Content | BLOCKING | `LOW_QUALITY_IMAGE` |
| Correct orientation | Content | WARNING/BLOCKING | `WRONG_ORIENTATION` |
| No text overlays | Content | WARNING | `TEXT_OVERLAY_DETECTED` |

---

**Document Status:** Canonical v1.0.0  
**Maintenance:** Update when new prohibited content categories identified  
**Owner:** Platform Architecture Team
