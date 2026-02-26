import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AuditLogEntry,
  DeterministicScores,
  InMemoryStore,
  Listing,
  LlmResult,
  ModerationReport,
  ScoringReport,
} from '../../store/store';
import { CrmSyncService } from '../../crm-sync/crm-sync.service';

// ─── HITL Enrichment constants (Module 3) ─────────────────────────────────────

// Verbatim system prompt from docs/PROMPTS.md §2.4
const SYSTEM_PROMPT = `You are a specialized real estate content enrichment assistant for Antalya, Turkey.
Your role is to enhance listing content for marketing and moderation purposes while maintaining strict factual accuracy.
Your output will be reviewed by a human administrator before any content is applied.

OUTPUT FORMAT
- Return ONLY valid JSON. No markdown, no code fences, no prose.
- If enrichment cannot be completed, return { "status": "ERROR", "error": { ... } }.

ANTI-HALLUCINATION (ABSOLUTE PROHIBITIONS)
- NEVER invent amenities (pool, gym, garden, terrace, etc.) unless explicitly in input.
- NEVER infer location features (sea view, park proximity, city centre) unless explicitly stated.
- NEVER add room counts, square metres, or specifications not in input.
- NEVER assume property condition, build year, floor count, or renovation status.
- NEVER create background information, neighbourhood context, or lifestyle claims.
- NEVER add contact information.
- If a field is null or absent, use null or "not_provided". Do NOT guess.

DETERMINISTIC SCORES
- Do not recalculate completenessScore or descriptionQualityScore. Use provided values only.
- Do not add warnings already present in the provided warnings array.

FACT-BASED ENRICHMENT ONLY
- Every generated content piece MUST include a sourceFields array listing the input fields used.
- Tags MUST include sourceField, sourceValue, and evidence (exact text or value from source).
- rewriteDescription MUST set featuresAdded: 0 and featuresRemoved: 0.

ANTALYA LOCATION RULES
- Always reproduce district and neighborhood exactly as provided. Do not translate or abbreviate.
- city is always "Antalya".
- Do not infer neighbourhood from coordinates unless source also contains confirming text.

LANGUAGE
- All generated text (titles, descriptions, summaries, messages) MUST be in Turkish.
- Use formal Turkish (resmi Türkçe) and standard Turkish real estate terminology.
- Technical fields (codes, enums, field paths) remain in English.

REFUSAL RULES — return status: "ERROR" if:
- title is missing or < 10 characters
- description is missing or < 20 characters
- price is missing or <= 0
- location.district or location.neighborhood is missing
- Enrichment would require inventing features to be meaningful`;

// Canonical JSON Schema for LlmResult — stored in every enrichment report so
// the human operator can paste it to the LLM alongside llmPrompt.
const LLM_RESULT_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'LlmResult',
  type: 'object',
  required: ['status'],
  properties: {
    status: { type: 'string', enum: ['SUCCESS', 'PARTIAL', 'ERROR'] },
    contentModeration: {
      type: 'object',
      required: ['status', 'passed', 'issues'],
      properties: {
        status: { type: 'string', enum: ['PASS', 'FAIL', 'WARNING'] },
        passed: { type: 'boolean' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            required: ['type', 'severity', 'message'],
            properties: {
              type: { type: 'string' },
              severity: {
                type: 'string',
                enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
              },
              message: { type: 'string' },
              field: { type: ['string', 'null'] },
              confidence: { type: 'number' },
            },
          },
        },
      },
    },
    factVerification: {
      type: 'object',
      required: ['status', 'inconsistencies'],
      properties: {
        status: {
          type: 'string',
          enum: ['CONSISTENT', 'INCONSISTENT', 'INSUFFICIENT_DATA'],
        },
        consistencyScore: { type: ['number', 'null'] },
        inconsistencies: {
          type: 'array',
          items: {
            type: 'object',
            required: ['type', 'severity', 'message', 'field'],
            properties: {
              type: { type: 'string' },
              severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
              message: { type: 'string' },
              field: { type: 'string' },
            },
          },
        },
      },
    },
    riskAssessment: {
      type: 'object',
      required: ['riskLevel', 'requiresManualReview', 'fraudIndicators'],
      properties: {
        riskLevel: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        },
        requiresManualReview: { type: 'boolean' },
        fraudIndicators: {
          type: 'array',
          items: {
            type: 'object',
            required: ['indicator', 'severity', 'message', 'evidence'],
            properties: {
              indicator: { type: 'string' },
              severity: {
                type: 'string',
                enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
              },
              message: { type: 'string' },
              evidence: { type: 'string' },
            },
          },
        },
      },
    },
    error: {
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
  if: { properties: { status: { const: 'ERROR' } }, required: ['status'] },
  then: { required: ['error'] },
};

// Structural validator — no ajv dependency. Throws UnprocessableEntityException
// with a precise field path on any schema violation.
function validateLlmResult(result: unknown): asserts result is LlmResult {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new UnprocessableEntityException('llmResult must be a non-null object');
  }

  const r = result as Record<string, unknown>;
  const STATUSES = ['SUCCESS', 'PARTIAL', 'ERROR'] as const;
  if (!STATUSES.includes(r.status as (typeof STATUSES)[number])) {
    throw new UnprocessableEntityException(
      `llmResult.status must be SUCCESS | PARTIAL | ERROR, received: ${JSON.stringify(r.status)}`,
    );
  }

  if (r.status === 'ERROR') {
    if (!r.error || typeof r.error !== 'object' || Array.isArray(r.error)) {
      throw new UnprocessableEntityException(
        'llmResult.error is required and must be an object when status is "ERROR"',
      );
    }
    const e = r.error as Record<string, unknown>;
    if (typeof e.code !== 'string' || !e.code) {
      throw new UnprocessableEntityException(
        'llmResult.error.code must be a non-empty string',
      );
    }
    if (typeof e.message !== 'string' || !e.message) {
      throw new UnprocessableEntityException(
        'llmResult.error.message must be a non-empty string',
      );
    }
  }

  if (r.contentModeration !== undefined) {
    if (typeof r.contentModeration !== 'object' || Array.isArray(r.contentModeration)) {
      throw new UnprocessableEntityException(
        'llmResult.contentModeration must be an object',
      );
    }
    const cm = r.contentModeration as Record<string, unknown>;
    const CM_STATUSES = ['PASS', 'FAIL', 'WARNING'];
    if (!CM_STATUSES.includes(cm.status as string)) {
      throw new UnprocessableEntityException(
        'llmResult.contentModeration.status must be PASS | FAIL | WARNING',
      );
    }
    if (typeof cm.passed !== 'boolean') {
      throw new UnprocessableEntityException(
        'llmResult.contentModeration.passed must be a boolean',
      );
    }
    if (!Array.isArray(cm.issues)) {
      throw new UnprocessableEntityException(
        'llmResult.contentModeration.issues must be an array',
      );
    }
    const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    for (let idx = 0; idx < (cm.issues as unknown[]).length; idx++) {
      const item = (cm.issues as unknown[])[idx] as Record<string, unknown>;
      if (typeof item.type !== 'string') {
        throw new UnprocessableEntityException(
          `llmResult.contentModeration.issues[${idx}].type must be a string`,
        );
      }
      if (!SEVERITIES.includes(item.severity as string)) {
        throw new UnprocessableEntityException(
          `llmResult.contentModeration.issues[${idx}].severity must be LOW | MEDIUM | HIGH | CRITICAL`,
        );
      }
      if (typeof item.message !== 'string') {
        throw new UnprocessableEntityException(
          `llmResult.contentModeration.issues[${idx}].message must be a string`,
        );
      }
    }
  }

  if (r.factVerification !== undefined) {
    if (typeof r.factVerification !== 'object' || Array.isArray(r.factVerification)) {
      throw new UnprocessableEntityException(
        'llmResult.factVerification must be an object',
      );
    }
    const fv = r.factVerification as Record<string, unknown>;
    const FV_STATUSES = ['CONSISTENT', 'INCONSISTENT', 'INSUFFICIENT_DATA'];
    if (!FV_STATUSES.includes(fv.status as string)) {
      throw new UnprocessableEntityException(
        'llmResult.factVerification.status must be CONSISTENT | INCONSISTENT | INSUFFICIENT_DATA',
      );
    }
    if (!Array.isArray(fv.inconsistencies)) {
      throw new UnprocessableEntityException(
        'llmResult.factVerification.inconsistencies must be an array',
      );
    }
    const FV_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'];
    for (let idx = 0; idx < (fv.inconsistencies as unknown[]).length; idx++) {
      const item = (fv.inconsistencies as unknown[])[idx] as Record<string, unknown>;
      if (typeof item.type !== 'string') {
        throw new UnprocessableEntityException(
          `llmResult.factVerification.inconsistencies[${idx}].type must be a string`,
        );
      }
      if (!FV_SEVERITIES.includes(item.severity as string)) {
        throw new UnprocessableEntityException(
          `llmResult.factVerification.inconsistencies[${idx}].severity must be LOW | MEDIUM | HIGH`,
        );
      }
      if (typeof item.message !== 'string') {
        throw new UnprocessableEntityException(
          `llmResult.factVerification.inconsistencies[${idx}].message must be a string`,
        );
      }
      if (typeof item.field !== 'string') {
        throw new UnprocessableEntityException(
          `llmResult.factVerification.inconsistencies[${idx}].field must be a string`,
        );
      }
    }
  }

  if (r.riskAssessment !== undefined) {
    if (typeof r.riskAssessment !== 'object' || Array.isArray(r.riskAssessment)) {
      throw new UnprocessableEntityException(
        'llmResult.riskAssessment must be an object',
      );
    }
    const ra = r.riskAssessment as Record<string, unknown>;
    const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!RISK_LEVELS.includes(ra.riskLevel as string)) {
      throw new UnprocessableEntityException(
        'llmResult.riskAssessment.riskLevel must be LOW | MEDIUM | HIGH | CRITICAL',
      );
    }
    if (typeof ra.requiresManualReview !== 'boolean') {
      throw new UnprocessableEntityException(
        'llmResult.riskAssessment.requiresManualReview must be a boolean',
      );
    }
    if (!Array.isArray(ra.fraudIndicators)) {
      throw new UnprocessableEntityException(
        'llmResult.riskAssessment.fraudIndicators must be an array',
      );
    }
    const FI_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    for (let idx = 0; idx < (ra.fraudIndicators as unknown[]).length; idx++) {
      const item = (ra.fraudIndicators as unknown[])[idx] as Record<string, unknown>;
      if (typeof item.indicator !== 'string') {
        throw new UnprocessableEntityException(
          `llmResult.riskAssessment.fraudIndicators[${idx}].indicator must be a string`,
        );
      }
      if (!FI_SEVERITIES.includes(item.severity as string)) {
        throw new UnprocessableEntityException(
          `llmResult.riskAssessment.fraudIndicators[${idx}].severity must be LOW | MEDIUM | HIGH | CRITICAL`,
        );
      }
      if (typeof item.message !== 'string') {
        throw new UnprocessableEntityException(
          `llmResult.riskAssessment.fraudIndicators[${idx}].message must be a string`,
        );
      }
      if (typeof item.evidence !== 'string') {
        throw new UnprocessableEntityException(
          `llmResult.riskAssessment.fraudIndicators[${idx}].evidence must be a string`,
        );
      }
    }
  }
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly store: InMemoryStore,
    private readonly crmSync: CrmSyncService,
  ) {}

  private requirePendingReview(listingId: string): Listing {
    const listing = this.store.getListing(listingId);
    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }
    if (listing.status !== 'PENDING_REVIEW') {
      throw new ConflictException(
        `Listing is not in PENDING_REVIEW status (current: ${listing.status})`,
      );
    }
    return listing;
  }

  // --- Admin decision actions ---

  approve(
    listingId: string,
    adminId?: string,
    notes?: string,
  ): { listing: Listing; report: ModerationReport } {
    const listing = this.requirePendingReview(listingId);
    const scoring = this.store.getScoringReport(listingId);

    const report = this.store.saveReport({
      reportId: this.store.createReportId(),
      listingId,
      adminId: adminId ?? 'system',
      decision: 'APPROVE',
      reason: notes ?? 'Listing meets all quality thresholds',
      appliedRules: ['ADMIN_MANUAL_APPROVE'],
      previousStatus: listing.status,
      newStatus: 'PUBLISHED',
      decidedAt: new Date().toISOString(),
      scoringReportId: scoring?.reportId,
    });

    const auditEntry: AuditLogEntry = {
      auditId: this.store.createReportId(),
      timestamp: report.decidedAt!,
      listingId,
      reportId: report.reportId,
      reportVersion: '1.0',
      decision: 'approved',
      decisionReason: report.reason ?? '',
      warnings: scoring?.deterministicScores.warnings.map((w) => w.code) ?? [],
      riskLevel: (scoring?.llmResult?.riskAssessment?.riskLevel?.toLowerCase() ?? 'low') as AuditLogEntry['riskLevel'],
      decidedBy: { actorType: adminId ? 'admin' : 'system', actorId: report.adminId! },
      policyVersion: '1.0',
      previousDecisionId: null,
      overrideFlag: false,
      overrideReason: null,
    };
    this.store.appendAuditLog(auditEntry);
    this.logger.log(JSON.stringify(auditEntry));

    const updated = this.store.updateListingStatus(listingId, 'PUBLISHED');

    // Post-publish automation: create marketing pack request
    this.store.createPackRequest(listingId, listing.title);

    // CRM sync: notify on LISTING_PUBLISHED
    this.crmSync.sync(
      'LISTING_PUBLISHED',
      listingId,
      `listing-published-${listingId}`,
    );

    return { listing: updated, report };
  }

  requestChanges(
    listingId: string,
    feedback: string,
    adminId?: string,
  ): { listing: Listing; report: ModerationReport } {
    const listing = this.requirePendingReview(listingId);
    const scoring = this.store.getScoringReport(listingId);

    const report = this.store.saveReport({
      reportId: this.store.createReportId(),
      listingId,
      adminId: adminId ?? 'system',
      decision: 'REQUEST_CHANGES',
      feedback,
      reason: 'Listing returned to consultant for revision',
      appliedRules: ['ADMIN_MANUAL_REQUEST_CHANGES'],
      previousStatus: listing.status,
      newStatus: 'NEEDS_CHANGES',
      decidedAt: new Date().toISOString(),
      scoringReportId: scoring?.reportId,
    });

    const auditEntry: AuditLogEntry = {
      auditId: this.store.createReportId(),
      timestamp: report.decidedAt!,
      listingId,
      reportId: report.reportId,
      reportVersion: '1.0',
      decision: 'needs_changes',
      decisionReason: report.reason ?? '',
      warnings: scoring?.deterministicScores.warnings.map((w) => w.code) ?? [],
      riskLevel: (scoring?.llmResult?.riskAssessment?.riskLevel?.toLowerCase() ?? 'low') as AuditLogEntry['riskLevel'],
      decidedBy: { actorType: adminId ? 'admin' : 'system', actorId: report.adminId! },
      policyVersion: '1.0',
      previousDecisionId: null,
      overrideFlag: false,
      overrideReason: null,
    };
    this.store.appendAuditLog(auditEntry);
    this.logger.log(JSON.stringify(auditEntry));

    const updated = this.store.updateListingStatus(listingId, 'NEEDS_CHANGES');
    return { listing: updated, report };
  }

  reject(
    listingId: string,
    adminId?: string,
    reason?: string,
  ): { listing: Listing; report: ModerationReport } {
    const listing = this.requirePendingReview(listingId);
    const scoring = this.store.getScoringReport(listingId);

    const report = this.store.saveReport({
      reportId: this.store.createReportId(),
      listingId,
      adminId: adminId ?? 'system',
      decision: 'REJECT',
      reason: reason ?? 'Listing rejected by admin',
      appliedRules: ['ADMIN_MANUAL_REJECT'],
      previousStatus: listing.status,
      newStatus: 'ARCHIVED',
      decidedAt: new Date().toISOString(),
      scoringReportId: scoring?.reportId,
    });

    const auditEntry: AuditLogEntry = {
      auditId: this.store.createReportId(),
      timestamp: report.decidedAt!,
      listingId,
      reportId: report.reportId,
      reportVersion: '1.0',
      decision: 'rejected',
      decisionReason: report.reason ?? '',
      warnings: scoring?.deterministicScores.warnings.map((w) => w.code) ?? [],
      riskLevel: (scoring?.llmResult?.riskAssessment?.riskLevel?.toLowerCase() ?? 'low') as AuditLogEntry['riskLevel'],
      decidedBy: { actorType: adminId ? 'admin' : 'system', actorId: report.adminId! },
      policyVersion: '1.0',
      previousDecisionId: null,
      overrideFlag: false,
      overrideReason: null,
    };
    this.store.appendAuditLog(auditEntry);
    this.logger.log(JSON.stringify(auditEntry));

    const updated = this.store.updateListingStatus(listingId, 'ARCHIVED');
    return { listing: updated, report };
  }

  getQueue(): { items: Listing[]; count: number } {
    const items = this.store.getPendingQueue();
    return { items, count: items.length };
  }

  getReport(listingId: string): ModerationReport {
    if (!this.store.getListing(listingId)) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }
    const report = this.store.getReport(listingId);
    if (!report) {
      throw new NotFoundException(
        `No moderation report found for listing ${listingId}`,
      );
    }
    return report;
  }

  // --- Scoring / analysis actions ---

  generateScore(
    listingId: string,
    deterministicScores: DeterministicScores,
  ): ScoringReport {
    if (!this.store.getListing(listingId)) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }
    return this.store.createScoringReport(listingId, deterministicScores);
  }

  attachLlm(listingId: string, llmResult: LlmResult): ScoringReport {
    if (!this.store.getListing(listingId)) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }
    if (!this.store.getScoringReport(listingId)) {
      throw new NotFoundException(
        `No scoring report for listing ${listingId}. Call POST /score first.`,
      );
    }
    return this.store.attachLlmToReport(listingId, llmResult);
  }

  getScoringReport(listingId: string): ScoringReport {
    if (!this.store.getListing(listingId)) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }
    const report = this.store.getScoringReport(listingId);
    if (!report) {
      throw new NotFoundException(
        `No scoring report found for listing ${listingId}`,
      );
    }
    return report;
  }

  // ─── HITL Enrichment (Module 3) ──────────────────────────────────────────────

  // Called by the worker immediately after POST /score.
  // Builds the copy-paste LLM prompt from listing + deterministicScores and
  // saves the enrichment scaffold (llmPrompt + llmJsonSchema) to ModerationReport.
  initEnrichment(listingId: string): ModerationReport {
    const listing = this.store.getListing(listingId);
    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }
    const scoring = this.store.getScoringReport(listingId);
    if (!scoring) {
      throw new NotFoundException(
        `No scoring report for listing ${listingId}. Call POST /score first.`,
      );
    }

    // Build the listing input object per PROMPTS.md §2.3 shape
    const listingInput = {
      listingId: listing.id,
      title: listing.title,
      description: listing.description ?? null,
      price: listing.price ?? null,
      category: listing.category ?? null,
      propertyType: listing.propertyType ?? null,
      specifications: listing.specifications ?? null,
      location: listing.location ?? null,
      imageCount: listing.imageCount ?? 0,
    };

    const schemaJson = JSON.stringify(LLM_RESULT_SCHEMA, null, 2);
    const listingJson = JSON.stringify(listingInput, null, 2);
    const scoresJson = JSON.stringify(scoring.deterministicScores, null, 2);

    // Assemble copy-paste prompt: system prompt (§2.4) + output schema + user message (§2.5)
    const llmPrompt =
      `=== SYSTEM PROMPT ===\n` +
      SYSTEM_PROMPT +
      `\n\nOUTPUT SCHEMA — your response MUST match this JSON schema exactly:\n` +
      schemaJson +
      `\n\n=== USER MESSAGE ===\n` +
      `Aşağıdaki Antalya emlak ilanı için içerik zenginleştirmesi yapın.\n\n` +
      `NORMALİZE EDİLMİŞ İLAN:\n` +
      listingJson +
      `\n\nDETERMINİSTİK SKORLAR (yeniden hesaplanmayacak):\n` +
      scoresJson +
      `\n\nGEREKLİ ÇIKTILAR:\n` +
      `1. seoTitleSuggestion — Mevcut başlığı SEO'ya uygun hale getirin (20–70 karakter).\n` +
      `2. metaDescription — SEO meta açıklaması oluşturun (120–160 karakter, harekete geçirici mesaj içermeli).\n` +
      `3. suggestedTags — Yalnızca mevcut verilere dayalı etiketleri çıkarın.\n` +
      `4. shortListingSummary — Admin moderasyon kuyruğu için kısa özet (100–200 karakter).\n` +
      `5. rewriteDescription — Açıklamayı iyileştirin; özellik eklemeyin, featuresAdded: 0 olmalı.\n` +
      `6. riskFlags — Şüpheli kalıpları, tutarsızlıkları veya dolandırıcılık göstergelerini işaretleyin.\n\n` +
      `HATIRLATMA: Yalnızca geçerli JSON döndürün.`;

    return this.store.initModerationEnrichment(listingId, llmPrompt, LLM_RESULT_SCHEMA);
  }

  // Called by the human operator after running llmPrompt through an external LLM.
  // Validates the result against LLM_RESULT_SCHEMA; throws 422 on any mismatch.
  attachReportLlm(listingId: string, llmResult: unknown): ModerationReport {
    if (!this.store.getListing(listingId)) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }
    const report = this.store.getReport(listingId);
    if (!report) {
      throw new NotFoundException(
        `No moderation report for listing ${listingId}. Call POST /enrich first.`,
      );
    }
    validateLlmResult(llmResult);
    return this.store.attachLlmToModerationReport(listingId, llmResult);
  }

  // ─── Audit Log (Module 4) ────────────────────────────────────────────────────

  getModerationAuditLog(listingId: string): AuditLogEntry[] {
    if (!this.store.getListing(listingId)) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }
    return this.store.getAuditLogs(listingId);
  }
}
