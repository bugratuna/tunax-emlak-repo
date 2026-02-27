import { apiFetch } from "./client";
import type { Lead, LeadScoreReport, LeadChannel } from "@/lib/types";

export interface CreateLeadInput {
  idempotencyKey: string;
  listingId: string;
  channel: LeadChannel;
  name: string;
  phone: string;
  consentGiven: true;
  message?: string;
  preferredTime?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export async function createLead(
  input: CreateLeadInput,
): Promise<{ lead: Lead; score: LeadScoreReport }> {
  return apiFetch("/api/leads", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getLead(leadId: string): Promise<Lead> {
  return apiFetch<Lead>(`/api/leads/${leadId}`);
}

export async function getLeadScore(leadId: string): Promise<LeadScoreReport> {
  return apiFetch<LeadScoreReport>(`/api/leads/${leadId}/score`);
}
