// Shared types sourced from docs/API_CONTRACT.md §1
// Keep in sync with backend DTOs.

export type ListingStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "NEEDS_CHANGES"
  | "PUBLISHED"
  | "ARCHIVED"
  | "UNPUBLISHED";

export type ListingCategory = "RENT" | "SALE";

// PropertyType is a free string matching the backend taxonomy
// (e.g. 'Konut', 'İşyeri', 'Arsa', 'Turistik Tesis', 'Devremülk', 'Arazi').
export type PropertyType = string;

export type Currency = "TRY" | "USD" | "EUR";

export type LeadChannel = "WHATSAPP" | "CALL" | "FORM";

export type LeadTier = "HOT" | "WARM" | "COLD";

export type ModerationDecision = "APPROVE" | "REQUEST_CHANGES" | "REJECT";

// -- Listing sub-types --

export interface ListingPrice {
  amount: number;
  currency?: string;
  isNegotiable?: boolean;
}

export interface ListingLocation {
  city?: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  /** Free-text: apartment/door number, floor, building/site name, postal code. User-owned, never auto-filled. */
  addressDetails?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
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
  kitchenState?: string;
  isFurnished?: boolean;
  hasElevator?: boolean;
  inComplex?: boolean;
  isLoanEligible?: boolean;
  isSwapAvailable?: boolean;
  duesAmount?: number;
}

// -- Core entities --

export interface MediaItem {
  id: string;
  url: string;
  s3Key: string;
  publicUrl: string;
  /**
   * URL of the branded public-delivery variant (watermarked).
   * Absent for legacy images or when generation failed.
   * Use `watermarkedUrl ?? url` on public-facing pages.
   */
  watermarkedUrl?: string;
  contentType?: string;
  width?: number;
  height?: number;
  sortOrder: number;
  isCover: boolean;
  uploadedAt: string;
}

export interface Listing {
  id: string;
  /** Assigned on admin approval — format: RT-000001. Null for draft/pending. */
  listingNumber?: string | null;
  title: string;
  consultantId: string;
  /** Full name of the consultant — populated by backend JOIN (avoids N+1). */
  consultantName?: string | null;
  status: ListingStatus;
  description?: string;
  price?: ListingPrice;
  propertyType?: PropertyType;
  /** Taxonomy level 2 — e.g. 'Daire', 'Villa', 'Dükkan'. */
  subtype?: string;
  category?: ListingCategory;
  location?: ListingLocation;
  specifications?: ListingSpecifications;
  /** Feature group selections keyed by group name. */
  detailInfos?: Record<string, string[]>;
  imageCount?: number;
  isFeatured?: boolean;
  featuredSortOrder?: number;
  isShowcase?: boolean;
  showcaseOrder?: number;
  /** Ordered photo list — present on GET /listings/:id */
  media?: MediaItem[];
  /** Whether this listing has been marked as sold/completed. */
  isSold?: boolean;
  /** ISO timestamp of when the sale was recorded. Null if not sold. */
  soldAt?: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ── Public consultant profile (for /team page) ─────────────────────────────────

export interface ConsultantPublicProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  email: string;
  phoneNumber: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  title: string | null;
  role: string;
  createdAt: string;
}

// ── Admin user management ──────────────────────────────────────────────────────

export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING_APPROVAL";
export type UserRole = "ADMIN" | "CONSULTANT";

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  status: UserStatus;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ContactInfo {
  consultantName: string;
  phone: string | null;
}

/** Paginated listing response from GET /api/listings. */
export interface ListAllResult {
  data: Listing[];
  total: number;
  page: number;
  limit: number;
}

export interface ModerationReport {
  reportId: string;
  listingId: string;
  // Decision fields are optional: a pre-decision enrichment scaffold only
  // populates llmPrompt / llmJsonSchema and leaves these absent.
  adminId?: string;
  decision?: ModerationDecision;
  appliedRules?: string[];
  previousStatus?: ListingStatus;
  newStatus?: ListingStatus;
  decidedAt?: string;
  reason?: string;
  feedback?: string;
  notes?: string;
  scoringReportId?: string;
  // Populated after POST /admin/moderation/:id/enrich
  llmPrompt?: string;
  llmJsonSchema?: unknown;
}

export interface ScoringWarning {
  code: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  message: string;
  field: string | null;
}

export interface ScoringReport {
  reportId: string;
  listingId: string;
  generatedAt: string;
  deterministicScores: {
    completenessScore: number;
    descriptionQualityScore: number;
    missingFields: string[];
    warnings: ScoringWarning[];
    detectedTags?: string[];
  };
  llmResult?: {
    status: "SUCCESS" | "PARTIAL" | "ERROR";
    contentModeration?: {
      status: "PASS" | "FAIL" | "WARNING";
      passed: boolean;
      issues: Array<{
        type: string;
        severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        message: string;
        field?: string | null;
        confidence?: number;
      }>;
    };
    factVerification?: {
      status: "CONSISTENT" | "INCONSISTENT" | "INSUFFICIENT_DATA";
      consistencyScore?: number | null;
      inconsistencies: Array<{
        type: string;
        severity: "LOW" | "MEDIUM" | "HIGH";
        message: string;
        field: string;
      }>;
    };
    riskAssessment?: {
      riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      requiresManualReview: boolean;
      fraudIndicators: Array<{
        indicator: string;
        severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        message: string;
        evidence: string;
      }>;
    };
    error?: { code: string; message: string };
  };
}

export interface AuditLogEntry {
  listingId: string;
  action: string;
  adminId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Lead {
  leadId: string;
  idempotencyKey: string;
  listingId: string;
  channel: LeadChannel;
  name: string;
  phone: string;
  message?: string;
  preferredTime?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  consentGiven: boolean;
  createdAt: string;
}

export interface LeadScoreReport {
  reportId: string;
  leadId: string;
  listingId: string;
  score: number;
  tier: LeadTier;
  reasonCodes: string[];
  scoredAt: string;
}

export interface ModerationQueue {
  items: Listing[];
  count: number;
}

// ── Homepage public stats ──────────────────────────────────────────────────────
export interface PublicStats {
  activeListings: number;
  completedSales: number;
  expertConsultants: number;
}

// ── Authenticated user profile (GET /api/users/me) ────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  status: UserStatus;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  createdAt: string;
}

// -- API error shape (NestJS default) --
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}
