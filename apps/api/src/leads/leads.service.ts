import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CrmSyncService } from '../crm-sync/crm-sync.service';
import { InMemoryStore, Lead, LeadScoreReport, LeadTier } from '../store/store';
import { CreateLeadDto } from './dto/create-lead.dto';

const URGENCY_KEYWORDS = [
  'acil',
  'hemen',
  'bu hafta',
  'bu ay',
  'çabuk',
  'ivedi',
  'urgent',
  'asap',
  'immediately',
  'today',
];

const BUDGET_KEYWORDS = [
  'bütçe',
  'fiyat',
  'ücret',
  'tl',
  '₺',
  'kira',
  'peşinat',
  'budget',
  'price',
  'cost',
  'afford',
];

function scoreSignals(lead: Lead): { score: number; reasonCodes: string[] } {
  let score = 0;
  const codes: string[] = [];

  // 1. Message completeness (0-25 pts)
  const msg = (lead.message ?? '').trim();
  if (!msg) {
    codes.push('MSG_EMPTY');
  } else if (msg.length < 20) {
    score += 5;
    codes.push('MSG_SHORT');
  } else if (msg.length < 100) {
    score += 15;
    codes.push('MSG_MEDIUM');
  } else {
    score += 25;
    codes.push('MSG_DETAILED');
  }

  // 2. Urgency keywords (0-15 pts)
  const msgLower = msg.toLowerCase();
  if (URGENCY_KEYWORDS.some((k) => msgLower.includes(k))) {
    score += 15;
    codes.push('URGENCY_HIGH');
  }

  // 3. Budget mention (0-15 pts)
  if (BUDGET_KEYWORDS.some((k) => msgLower.includes(k))) {
    score += 15;
    codes.push('BUDGET_MENTION');
  }

  // 4. Channel (0-20 pts)
  if (lead.channel === 'FORM') {
    score += 20;
    codes.push('CHANNEL_FORM');
  } else if (lead.channel === 'WHATSAPP') {
    score += 15;
    codes.push('CHANNEL_WHATSAPP');
  } else {
    score += 10;
    codes.push('CHANNEL_CALL');
  }

  // 5. Preferred time (0-10 pts)
  if (lead.preferredTime) {
    score += 10;
    codes.push('TIME_SPECIFIED');
  }

  // 6. Consent (0-15 pts)
  if (lead.consentGiven) {
    score += 15;
    codes.push('CONSENT_EXPLICIT');
  }

  return { score: Math.min(score, 100), reasonCodes: codes };
}

function tier(score: number): LeadTier {
  if (score >= 70) return 'HOT';
  if (score >= 40) return 'WARM';
  return 'COLD';
}

@Injectable()
export class LeadsService {
  constructor(
    private readonly store: InMemoryStore,
    private readonly crmSync: CrmSyncService,
  ) {}

  create(dto: CreateLeadDto): { lead: Lead; score: LeadScoreReport } {
    // Idempotency check
    const existing = this.store.findLeadByIdempotencyKey(dto.idempotencyKey);
    if (existing) {
      const existingScore = this.store.getLeadScoreReport(existing.leadId);
      if (!existingScore)
        throw new ConflictException('Duplicate idempotency key');
      return { lead: existing, score: existingScore };
    }

    if (!dto.consentGiven) {
      throw new BadRequestException('consentGiven must be true');
    }

    const listing = this.store.getListing(dto.listingId);
    if (!listing) {
      throw new NotFoundException(`Listing ${dto.listingId} not found`);
    }

    const now = new Date().toISOString();
    const lead: Lead = {
      leadId: randomUUID(),
      idempotencyKey: dto.idempotencyKey,
      listingId: dto.listingId,
      channel: dto.channel,
      name: dto.name,
      phone: dto.phone,
      message: dto.message,
      preferredTime: dto.preferredTime,
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium,
      utmCampaign: dto.utmCampaign,
      consentGiven: dto.consentGiven,
      createdAt: now,
    };
    this.store.saveLead(lead);

    // Deterministic scoring
    const { score: scoreValue, reasonCodes } = scoreSignals(lead);
    const scoreReport: LeadScoreReport = {
      reportId: randomUUID(),
      leadId: lead.leadId,
      listingId: dto.listingId,
      score: scoreValue,
      tier: tier(scoreValue),
      reasonCodes,
      scoredAt: now,
    };
    this.store.saveLeadScoreReport(scoreReport);

    // CRM sync on LEAD_CREATED
    this.crmSync.sync(
      'LEAD_CREATED',
      lead.leadId,
      `lead-created-${dto.idempotencyKey}`,
    );

    return { lead, score: scoreReport };
  }

  findById(leadId: string): Lead {
    const lead = this.store.getLead(leadId);
    if (!lead) throw new NotFoundException(`Lead ${leadId} not found`);
    return lead;
  }

  getScore(leadId: string): LeadScoreReport {
    if (!this.store.getLead(leadId)) {
      throw new NotFoundException(`Lead ${leadId} not found`);
    }
    const report = this.store.getLeadScoreReport(leadId);
    if (!report)
      throw new NotFoundException(`No score report for lead ${leadId}`);
    return report;
  }
}
