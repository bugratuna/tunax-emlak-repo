import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

// ─── Listing ──────────────────────────────────────────────────────────────────

export type ListingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'NEEDS_CHANGES'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type ModerationDecision = 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';

export interface Listing {
  id: string;
  title: string;
  consultantId: string;
  status: ListingStatus;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
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
  specifications?: {
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
  } | null;
  imageCount?: number;
}

// ─── Moderation (admin decision) ─────────────────────────────────────────────

export interface ModerationReport {
  reportId: string;
  listingId: string;
  // Decision fields are optional until an admin action is taken.
  // A pre-decision enrichment scaffold only populates llmPrompt/llmJsonSchema.
  adminId?: string;
  decision?: ModerationDecision;
  feedback?: string;
  reason?: string;
  appliedRules?: string[];
  previousStatus?: ListingStatus;
  newStatus?: ListingStatus;
  decidedAt?: string;
  scoringReportId?: string;
  // HITL enrichment fields (Module 3)
  llmPrompt?: string;
  llmJsonSchema?: object;
  llmResult?: LlmResult;
}

// ─── Scoring / AI analysis ────────────────────────────────────────────────────

export interface ScoringWarning {
  code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  field?: string | null;
}

export interface DeterministicScores {
  completenessScore: number;
  descriptionQualityScore: number;
  missingFields: string[];
  warnings: ScoringWarning[];
  detectedTags: string[];
}

export interface LlmContentIssue {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  field?: string | null;
  confidence?: number;
}

export interface LlmInconsistency {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  field: string;
}

export interface LlmFraudIndicator {
  indicator: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  evidence: string;
}

export interface LlmResult {
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  contentModeration?: {
    status: 'PASS' | 'FAIL' | 'WARNING';
    passed: boolean;
    issues: LlmContentIssue[];
  };
  factVerification?: {
    status: 'CONSISTENT' | 'INCONSISTENT' | 'INSUFFICIENT_DATA';
    consistencyScore?: number | null;
    inconsistencies: LlmInconsistency[];
  };
  riskAssessment?: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    requiresManualReview: boolean;
    fraudIndicators: LlmFraudIndicator[];
  };
  error?: { code: string; message: string };
}

export interface ScoringReport {
  reportId: string;
  listingId: string;
  generatedAt: string;
  deterministicScores: DeterministicScores;
  llmResult?: LlmResult;
}

// ─── Marketing Asset Pack ─────────────────────────────────────────────────────

export interface MarketingAssetPack {
  packId: string;
  listingId: string;
  generatedAt: string;
  seoTitle: { tr: string; en: string };
  metaDescription: { tr: string; en: string };
  socialCaptions: string[];
  whatsappBroadcast: string;
  hashtags: string[];
}

export type PackStatus = 'PENDING_OPERATOR' | 'COMPLETED';

export interface MarketingAssetPackRequest {
  requestId: string;
  listingId: string;
  listingTitle: string;
  status: PackStatus;
  hitlPrompt: string;
  result?: MarketingAssetPack;
  createdAt: string;
  completedAt?: string;
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export type LeadChannel = 'WHATSAPP' | 'CALL' | 'FORM';
export type LeadTier = 'HOT' | 'WARM' | 'COLD';

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

// ─── CRM Sync ─────────────────────────────────────────────────────────────────

export type CRMSyncStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED_DUPLICATE';
export type CRMSyncTrigger = 'LEAD_CREATED' | 'LISTING_PUBLISHED';

export interface CRMSyncResult {
  syncId: string;
  trigger: CRMSyncTrigger;
  entityId: string;
  idempotencyKey: string;
  status: CRMSyncStatus;
  attempt: number;
  externalRef?: string;
  error?: string;
  syncedAt: string;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  auditId: string;
  timestamp: string;
  listingId: string;
  reportId: string;
  reportVersion: string;
  decision: 'approved' | 'rejected' | 'needs_changes';
  decisionReason: string;
  warnings: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  decidedBy: { actorType: 'admin' | 'system'; actorId: string };
  policyVersion: string;
  previousDecisionId: string | null;
  overrideFlag: boolean;
  overrideReason: string | null;
}

// ─── CreateListingInput ───────────────────────────────────────────────────────

export interface CreateListingInput {
  title: string;
  consultantId?: string;
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
  specifications?: {
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
  } | null;
  imageCount?: number;
}

// ─── Store ────────────────────────────────────────────────────────────────────

@Injectable()
export class InMemoryStore {
  private readonly listings = new Map<string, Listing>();
  private readonly moderationReports = new Map<string, ModerationReport>();
  private readonly scoringReports = new Map<string, ScoringReport>();
  private readonly packRequests = new Map<string, MarketingAssetPackRequest>();
  private readonly leads = new Map<string, Lead>();
  private readonly leadsByIdempotencyKey = new Map<string, string>();
  private readonly leadScoreReports = new Map<string, LeadScoreReport>();
  private readonly crmSyncResults = new Map<string, CRMSyncResult[]>();
  private readonly syncedKeys = new Set<string>();
  private readonly auditLogs = new Map<string, AuditLogEntry[]>();

  // --- Listing ---

  createListing(input: CreateListingInput): Listing {
    const now = new Date().toISOString();
    const listing: Listing = {
      id: randomUUID(),
      title: input.title,
      consultantId: input.consultantId ?? 'anonymous',
      status: 'PENDING_REVIEW',
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
      description: input.description,
      price: input.price,
      propertyType: input.propertyType,
      category: input.category,
      location: input.location,
      specifications: input.specifications,
      imageCount: input.imageCount,
    };
    this.listings.set(listing.id, listing);
    return listing;
  }

  getListing(id: string): Listing | undefined {
    return this.listings.get(id);
  }

  updateListingStatus(id: string, status: ListingStatus): Listing {
    const listing = this.listings.get(id);
    if (!listing) throw new Error(`Listing ${id} not found`);
    listing.status = status;
    listing.updatedAt = new Date().toISOString();
    return listing;
  }

  resubmitListing(id: string): Listing {
    const listing = this.listings.get(id);
    if (!listing) throw new Error(`Listing ${id} not found`);
    listing.status = 'PENDING_REVIEW';
    listing.submittedAt = new Date().toISOString();
    listing.updatedAt = new Date().toISOString();
    return listing;
  }

  getPendingQueue(): Listing[] {
    return Array.from(this.listings.values()).filter(
      (l) => l.status === 'PENDING_REVIEW',
    );
  }

  // --- ModerationReport ---

  saveReport(report: ModerationReport): ModerationReport {
    // Preserve any HITL enrichment fields written by initModerationEnrichment()
    // before the admin decision is recorded.
    const existing = this.moderationReports.get(report.listingId);
    const merged: ModerationReport = {
      ...report,
      llmPrompt: report.llmPrompt ?? existing?.llmPrompt,
      llmJsonSchema: report.llmJsonSchema ?? existing?.llmJsonSchema,
      llmResult: report.llmResult ?? existing?.llmResult,
    };
    this.moderationReports.set(merged.listingId, merged);
    return merged;
  }

  getReport(listingId: string): ModerationReport | undefined {
    return this.moderationReports.get(listingId);
  }

  // Creates (or updates) the pre-decision enrichment scaffold on ModerationReport.
  // Called by the worker after POST /score to embed llmPrompt + llmJsonSchema.
  initModerationEnrichment(
    listingId: string,
    llmPrompt: string,
    llmJsonSchema: object,
  ): ModerationReport {
    const existing = this.moderationReports.get(listingId);
    const scaffold: ModerationReport = {
      ...(existing ?? {}),
      reportId: existing?.reportId ?? randomUUID(),
      listingId,
      llmPrompt,
      llmJsonSchema,
    };
    this.moderationReports.set(listingId, scaffold);
    return scaffold;
  }

  // Attaches a validated llmResult to an existing ModerationReport.
  attachLlmToModerationReport(
    listingId: string,
    llmResult: LlmResult,
  ): ModerationReport {
    const report = this.moderationReports.get(listingId);
    if (!report)
      throw new Error(`ModerationReport for listing ${listingId} not found`);
    report.llmResult = llmResult;
    return report;
  }

  // --- ScoringReport ---

  createScoringReport(
    listingId: string,
    deterministicScores: DeterministicScores,
  ): ScoringReport {
    const report: ScoringReport = {
      reportId: randomUUID(),
      listingId,
      generatedAt: new Date().toISOString(),
      deterministicScores,
    };
    this.scoringReports.set(listingId, report);
    return report;
  }

  attachLlmToReport(listingId: string, llmResult: LlmResult): ScoringReport {
    const report = this.scoringReports.get(listingId);
    if (!report)
      throw new Error(`ScoringReport for listing ${listingId} not found`);
    report.llmResult = llmResult;
    return report;
  }

  getScoringReport(listingId: string): ScoringReport | undefined {
    return this.scoringReports.get(listingId);
  }

  // --- MarketingAssetPackRequest ---

  createPackRequest(listingId: string, listingTitle: string): MarketingAssetPackRequest {
    const prompt =
      `You are a Turkish real estate copywriter for the Antalya market.\n` +
      `Generate a MarketingAssetPack JSON for listing: "${listingTitle}" (id: ${listingId}).\n\n` +
      `Required fields:\n` +
      `- seoTitle.tr  (30-65 chars, include district + category)\n` +
      `- seoTitle.en  (30-65 chars)\n` +
      `- metaDescription.tr  (120-165 chars, include price in ₺)\n` +
      `- metaDescription.en  (120-165 chars)\n` +
      `- socialCaptions  (array of 3 strings, each 50-280 chars, Turkish)\n` +
      `- whatsappBroadcast  (100-1000 chars, opening hook + details + CTA, Turkish)\n` +
      `- hashtags  (exactly 5, must include #Antalya)\n\n` +
      `Rules: Do not invent features. Every field must reference district and neighborhood.\n` +
      `Return ONLY valid JSON. No prose.`;

    const req: MarketingAssetPackRequest = {
      requestId: randomUUID(),
      listingId,
      listingTitle,
      status: 'PENDING_OPERATOR',
      hitlPrompt: prompt,
      createdAt: new Date().toISOString(),
    };
    this.packRequests.set(listingId, req);
    return req;
  }

  attachPackResult(
    listingId: string,
    pack: MarketingAssetPack,
  ): MarketingAssetPackRequest {
    const req = this.packRequests.get(listingId);
    if (!req)
      throw new Error(`PackRequest for listing ${listingId} not found`);
    req.result = pack;
    req.status = 'COMPLETED';
    req.completedAt = new Date().toISOString();
    return req;
  }

  getPackRequest(listingId: string): MarketingAssetPackRequest | undefined {
    return this.packRequests.get(listingId);
  }

  // --- Leads ---

  saveLead(lead: Lead): Lead {
    this.leads.set(lead.leadId, lead);
    this.leadsByIdempotencyKey.set(lead.idempotencyKey, lead.leadId);
    return lead;
  }

  getLead(leadId: string): Lead | undefined {
    return this.leads.get(leadId);
  }

  findLeadByIdempotencyKey(key: string): Lead | undefined {
    const leadId = this.leadsByIdempotencyKey.get(key);
    return leadId ? this.leads.get(leadId) : undefined;
  }

  saveLeadScoreReport(report: LeadScoreReport): LeadScoreReport {
    this.leadScoreReports.set(report.leadId, report);
    return report;
  }

  getLeadScoreReport(leadId: string): LeadScoreReport | undefined {
    return this.leadScoreReports.get(leadId);
  }

  // --- CRM Sync ---

  hasSyncedKey(idempotencyKey: string): boolean {
    return this.syncedKeys.has(idempotencyKey);
  }

  saveCRMSyncResult(result: CRMSyncResult): CRMSyncResult {
    if (!this.crmSyncResults.has(result.entityId)) {
      this.crmSyncResults.set(result.entityId, []);
    }
    this.crmSyncResults.get(result.entityId)!.push(result);
    if (result.status === 'SUCCESS') {
      this.syncedKeys.add(result.idempotencyKey);
    }
    return result;
  }

  getCRMSyncResults(entityId: string): CRMSyncResult[] {
    return this.crmSyncResults.get(entityId) ?? [];
  }

  // --- Audit Log ---

  appendAuditLog(entry: AuditLogEntry): AuditLogEntry {
    if (!this.auditLogs.has(entry.listingId)) {
      this.auditLogs.set(entry.listingId, []);
    }
    this.auditLogs.get(entry.listingId)!.push(entry);
    return entry;
  }

  getAuditLogs(listingId: string): AuditLogEntry[] {
    return this.auditLogs.get(listingId) ?? [];
  }

  // --- Util ---

  createReportId(): string {
    return randomUUID();
  }
}
