// Shared types sourced from docs/API_CONTRACT.md §1
// Keep in sync with backend DTOs.

export type ListingStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "NEEDS_CHANGES"
  | "PUBLISHED"
  | "ARCHIVED";

export type ListingCategory = "RENT" | "SALE";

export type PropertyType =
  | "APARTMENT"
  | "VILLA"
  | "HOUSE"
  | "LAND"
  | "COMMERCIAL"
  | "OTHER";

export type Currency = "TRY" | "USD" | "EUR";

export type LeadChannel = "WHATSAPP" | "CALL" | "FORM";

export type LeadTier = "HOT" | "WARM" | "COLD";

export type ModerationDecision = "APPROVE" | "REQUEST_CHANGES" | "REJECT";

// -- Core entities --

export interface Listing {
  id: string;
  title: string;
  consultantId: string;
  status: ListingStatus;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationReport {
  reportId: string;
  listingId: string;
  adminId: string;
  decision: ModerationDecision;
  appliedRules: string[];
  previousStatus: ListingStatus;
  newStatus: ListingStatus;
  decidedAt: string;
  reason: string;
  feedback?: string;
  notes?: string;
  scoringReportId?: string;
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

// -- API error shape (NestJS default) --
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}
