/**
 * Deterministic scorer for LISTING_SUBMITTED jobs (Module 2).
 *
 * Implements all validation gates from AI_AUTOMATION.md §5.
 * Pure function — no side effects, no I/O, no LLM calls.
 */

export interface ScoringWarning {
  code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  field: string | null;
}

export interface DeterministicScores {
  completenessScore: number;
  descriptionQualityScore: number;
  missingFields: string[];
  warnings: ScoringWarning[];
  detectedTags: string[];
}

export interface ListingSpecifications {
  roomCount?: number;
  bathroomCount?: number;
  floorNumber?: number;
  totalFloors?: number;
  grossArea?: number;
  netArea?: number;
  buildingAge?: number;
  hasParking?: boolean;
  hasBalcony?: boolean;
  heatingType?: string;
}

// Antalya province bounding box (AI_AUTOMATION.md §5, PROMPTS.md §2.7)
const ANTALYA_BOUNDS = {
  latMin: 36.0,
  latMax: 37.6,
  lonMin: 29.5,
  lonMax: 32.5,
};

// 19-district whitelist (AI_AUTOMATION.md §5.3)
const ANTALYA_DISTRICTS = new Set([
  'muratpaşa',
  'kepez',
  'konyaaltı',
  'döşemealtı',
  'aksu',
  'alanya',
  'manavgat',
  'serik',
  'kemer',
  'kumluca',
  'finike',
  'kaş',
  'demre',
  'elmalı',
  'korkuteli',
  'akseki',
  'gündoğmuş',
  'ibradı',
  'gazipaşa',
]);

// Turkish real-estate keywords used for description quality scoring (factor 3)
const REALESTATE_KEYWORDS = [
  'daire', 'villa', 'arsa', 'satılık', 'kiralık', 'oda', 'm²', 'm2',
  'balkon', 'otopark', 'asansör', 'havuz', 'konut', 'bahçe', 'site',
  'kat', 'eşyalı', 'merkezi', 'yatırım', 'deniz', 'manzara',
];

// Field weights — must sum to 100
const WEIGHTS = {
  title: 8,
  description: 20,
  price: 15,
  propertyType: 10,
  category: 10,
  locationCity: 2,
  locationDistrict: 6,
  locationNeighborhood: 4,
  locationCoordinates: 3,
  specifications: 12,
  images: 10,
} as const;

export interface ListingJobData {
  listingId: string;
  consultantId: string;
  title?: string;
  description?: string;
  price?: { amount?: number; currency?: string; isNegotiable?: boolean } | null;
  propertyType?: string | null;
  category?: string | null;
  location?: {
    city?: string;
    district?: string;
    neighborhood?: string;
    coordinates?: { latitude?: number; longitude?: number } | null;
  } | null;
  specifications?: ListingSpecifications | null;
  imageCount?: number;
  submittedAt?: string;
  status?: string;
  // Resubmission fields (AI_AUTOMATION.md §2.1 / §2.2)
  isResubmission?: boolean;
  previousState?: 'DRAFT' | 'NEEDS_CHANGES';
  previousModerationReportId?: string | null;
  correlationId?: string;
}

export function score(data: ListingJobData): DeterministicScores {
  const warnings: ScoringWarning[] = [];
  const missingFields: string[] = [];
  const detectedTags: string[] = [];
  let weightedScore = 0;

  // ── Title (weight: 8) ──────────────────────────────────────────────────────
  if (data.title && data.title.trim().length >= 10) {
    weightedScore += WEIGHTS.title;
  } else {
    missingFields.push('title');
    warnings.push({
      code: 'TITLE_TOO_SHORT',
      severity: 'HIGH',
      message: 'Title must be at least 10 characters.',
      field: 'title',
    });
  }

  // ── Description (weight: 20) ───────────────────────────────────────────────
  const descLen = data.description?.trim().length ?? 0;
  if (!data.description || descLen === 0) {
    missingFields.push('description');
    warnings.push({
      code: 'DESCRIPTION_TOO_SHORT',
      severity: 'HIGH',
      message: 'Description is required and must be at least 50 characters.',
      field: 'description',
    });
  } else if (descLen < 50) {
    warnings.push({
      code: 'DESCRIPTION_TOO_SHORT',
      severity: 'HIGH',
      message: 'Description must be at least 50 characters.',
      field: 'description',
    });
  } else if (descLen < 200) {
    warnings.push({
      code: 'DESCRIPTION_SUBOPTIMAL',
      severity: 'MEDIUM',
      message: 'Description is recommended to be at least 200 characters for higher quality.',
      field: 'description',
    });
    weightedScore += WEIGHTS.description;
  } else if (descLen > 5000) {
    warnings.push({
      code: 'DESCRIPTION_TOO_LONG',
      severity: 'MEDIUM',
      message: 'Description must not exceed 5000 characters.',
      field: 'description',
    });
    weightedScore += WEIGHTS.description;
  } else {
    weightedScore += WEIGHTS.description;
  }

  // ── Price (weight: 15) ─────────────────────────────────────────────────────
  if (!data.price || data.price.amount == null) {
    missingFields.push('price');
    warnings.push({
      code: 'PRICE_MISSING',
      severity: 'HIGH',
      message: 'Price is required.',
      field: 'price',
    });
  } else {
    weightedScore += WEIGHTS.price;
  }

  // ── Property type (weight: 10) ─────────────────────────────────────────────
  if (!data.propertyType) {
    missingFields.push('propertyType');
    warnings.push({
      code: 'PROPERTY_TYPE_MISSING',
      severity: 'MEDIUM',
      message: 'Property type is required (e.g. DAIRE, VILLA, ARSA).',
      field: 'propertyType',
    });
  } else {
    weightedScore += WEIGHTS.propertyType;
  }

  // ── Category (weight: 10) ──────────────────────────────────────────────────
  if (!data.category) {
    missingFields.push('category');
    warnings.push({
      code: 'CATEGORY_MISSING',
      severity: 'MEDIUM',
      message: 'Category is required (SATILIK or KIRALIK).',
      field: 'category',
    });
  } else {
    weightedScore += WEIGHTS.category;
    if (data.category.toUpperCase() === 'SATILIK') detectedTags.push('for-sale');
    else if (data.category.toUpperCase() === 'KIRALIK') detectedTags.push('for-rent');
  }

  // ── Location ───────────────────────────────────────────────────────────────
  if (!data.location) {
    missingFields.push('location');
    warnings.push({
      code: 'LOCATION_MISSING',
      severity: 'HIGH',
      message: 'Location is required.',
      field: 'location',
    });
  } else {
    // City (weight: 2)
    if (data.location.city) {
      weightedScore += WEIGHTS.locationCity;
    }

    // District (weight: 6) — Antalya whitelist (AI_AUTOMATION.md §5.3)
    if (!data.location.district) {
      warnings.push({
        code: 'INVALID_DISTRICT',
        severity: 'HIGH',
        message: 'District is required and must be one of the 19 Antalya districts.',
        field: 'location.district',
      });
    } else if (!ANTALYA_DISTRICTS.has(data.location.district.toLowerCase())) {
      warnings.push({
        code: 'INVALID_DISTRICT',
        severity: 'HIGH',
        message: `District "${data.location.district}" is not in the Antalya district whitelist.`,
        field: 'location.district',
      });
    } else {
      weightedScore += WEIGHTS.locationDistrict;
    }

    // Neighborhood (weight: 4)
    if (!data.location.neighborhood) {
      warnings.push({
        code: 'NEIGHBORHOOD_MISSING',
        severity: 'MEDIUM',
        message: 'Neighborhood is recommended for better listing quality.',
        field: 'location.neighborhood',
      });
    } else {
      weightedScore += WEIGHTS.locationNeighborhood;
    }

    // Coordinates (weight: 3) — bounding box (AI_AUTOMATION.md §5)
    const coords = data.location.coordinates;
    if (coords && coords.latitude != null && coords.longitude != null) {
      if (
        coords.latitude < ANTALYA_BOUNDS.latMin ||
        coords.latitude > ANTALYA_BOUNDS.latMax ||
        coords.longitude < ANTALYA_BOUNDS.lonMin ||
        coords.longitude > ANTALYA_BOUNDS.lonMax
      ) {
        warnings.push({
          code: 'COORDINATES_OUT_OF_BOUNDS',
          severity: 'HIGH',
          message: `Coordinates (${coords.latitude}, ${coords.longitude}) are outside the Antalya province bounding box.`,
          field: 'location.coordinates',
        });
      } else {
        weightedScore += WEIGHTS.locationCoordinates;
      }
    }
  }

  // ── Specifications (weight: 12) ────────────────────────────────────────────
  if (!data.specifications) {
    missingFields.push('specifications');
    warnings.push({
      code: 'SPECIFICATIONS_MISSING',
      severity: 'LOW',
      message: 'Specifications (room count, area, etc.) improve listing quality.',
      field: 'specifications',
    });
  } else {
    weightedScore += WEIGHTS.specifications;
  }

  // ── Images (weight: 10) — AI_AUTOMATION.md §5.2 ───────────────────────────
  const imageCount = data.imageCount ?? 0;
  if (imageCount === 0) {
    missingFields.push('images');
    warnings.push({
      code: 'NO_IMAGES',
      severity: 'CRITICAL',
      message: 'At least one image is required. Listings with no images are automatically rejected.',
      field: 'images',
    });
  } else if (imageCount < 3) {
    warnings.push({
      code: 'INSUFFICIENT_IMAGES',
      severity: 'MEDIUM',
      message: `Only ${imageCount} image(s) provided. At least 3 images are recommended.`,
      field: 'images',
    });
    weightedScore += WEIGHTS.images;
  } else {
    weightedScore += WEIGHTS.images;
  }

  // ── Tag extraction (rule-based, no LLM) ───────────────────────────────────
  const specs = data.specifications;
  const descLower = data.description?.toLowerCase() ?? '';
  const titleLower = data.title?.toLowerCase() ?? '';

  if (specs?.hasParking === true) detectedTags.push('has-parking');
  if (specs?.hasBalcony === true) detectedTags.push('has-balcony');
  if (descLower.includes('havuz')) detectedTags.push('has-pool');
  if (descLower.includes('asansör')) detectedTags.push('has-elevator');
  if (descLower.includes('bahçe')) detectedTags.push('has-garden');
  if (descLower.includes('deniz manzara') || titleLower.includes('deniz manzara'))
    detectedTags.push('sea-view');
  if (descLower.includes('dağ manzara') || titleLower.includes('dağ manzara'))
    detectedTags.push('mountain-view');
  if (descLower.includes('lüks') || titleLower.includes('lüks'))
    detectedTags.push('luxury');
  if (specs?.buildingAge === 0) detectedTags.push('new-building');
  if (specs?.heatingType?.toLowerCase().includes('merkezi'))
    detectedTags.push('central-heating');
  if (descLower.includes('eşyalı')) detectedTags.push('furnished');
  if (descLower.includes('evcil hayvan')) detectedTags.push('pet-friendly');
  if (descLower.includes('yatırım') || titleLower.includes('yatırım'))
    detectedTags.push('investment');

  // ── Completeness score (weighted sum, 0–100) ───────────────────────────────
  const completenessScore = Math.min(100, Math.round(weightedScore));

  // ── Description quality score (0–100, 3 factors) ──────────────────────────
  // Factor 1 — Length adequacy:  50 pts base when ≥200 chars
  // Factor 2 — Length richness:  up to 30 pts (scales 200→2000 chars)
  // Factor 3 — Keyword density:  2 pts per unique RE keyword, max 20 pts
  let descriptionQualityScore = 0;
  if (descLen >= 200) {
    const lengthScore = 50;
    const richnessScore = Math.min(30, Math.round(((descLen - 200) / 1800) * 30));
    const foundKeywords = REALESTATE_KEYWORDS.filter((kw) => descLower.includes(kw));
    const keywordScore = Math.min(20, foundKeywords.length * 2);
    descriptionQualityScore = Math.min(100, lengthScore + richnessScore + keywordScore);
  } else if (descLen >= 50) {
    descriptionQualityScore = 30;
  }

  return {
    completenessScore,
    descriptionQualityScore,
    missingFields,
    warnings,
    detectedTags,
  };
}
