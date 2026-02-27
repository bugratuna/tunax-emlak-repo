import { apiFetch, ApiRequestError } from "./client";
import type {
  AuditLogEntry,
  ModerationQueue,
  ModerationReport,
  ScoringReport,
} from "@/lib/types";

export async function getModerationQueue(): Promise<ModerationQueue> {
  return apiFetch<ModerationQueue>("/api/admin/moderation/queue");
}

export async function getModerationReport(
  listingId: string,
): Promise<ModerationReport> {
  return apiFetch<ModerationReport>(
    `/api/admin/moderation/${listingId}/report`,
  );
}

export async function getScoringReport(
  listingId: string,
): Promise<ScoringReport> {
  return apiFetch<ScoringReport>(`/api/admin/moderation/${listingId}/score`);
}

export async function getAuditLog(
  listingId: string,
): Promise<AuditLogEntry[]> {
  return apiFetch<AuditLogEntry[]>(
    `/api/admin/moderation/${listingId}/audit-log`,
  );
}

export async function approveListing(
  listingId: string,
  adminId?: string,
  notes?: string,
): Promise<{ listing: unknown; report: ModerationReport }> {
  return apiFetch(`/api/admin/moderation/${listingId}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ adminId: adminId ?? "admin-001", notes }),
  });
}

export async function requestChanges(
  listingId: string,
  feedback: string,
  adminId?: string,
): Promise<{ listing: unknown; report: ModerationReport }> {
  return apiFetch(`/api/admin/moderation/${listingId}/request-changes`, {
    method: "PATCH",
    body: JSON.stringify({ adminId: adminId ?? "admin-001", feedback }),
  });
}

export async function rejectListing(
  listingId: string,
  reason?: string,
  adminId?: string,
): Promise<{ listing: unknown; report: ModerationReport }> {
  return apiFetch(`/api/admin/moderation/${listingId}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ adminId: adminId ?? "admin-001", reason }),
  });
}

/**
 * Calls the Next.js proxy route /api/proxy/enrich/:id which adds x-internal-api-key.
 * Uses bare fetch with a relative URL — only works in the browser (client components).
 * Proxies to: POST /api/admin/moderation/:id/enrich
 */
export async function initEnrichment(
  listingId: string,
): Promise<ModerationReport> {
  const res = await fetch(`/api/proxy/enrich/${listingId}`, {
    method: "POST",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({
      statusCode: res.status,
      message: res.statusText,
      error: "ProxyError",
    }));
    throw new ApiRequestError(res.status, body);
  }
  return res.json() as Promise<ModerationReport>;
}

/**
 * Calls the Next.js proxy route /api/proxy/report-llm/:id which adds x-internal-api-key.
 * Uses bare fetch with a relative URL — only works in the browser (client components).
 * Proxies to: PATCH /api/admin/moderation/:id/report/llm
 */
export async function attachReportLlm(
  listingId: string,
  llmResult: unknown,
): Promise<ModerationReport> {
  const res = await fetch(`/api/proxy/report-llm/${listingId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ llmResult }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({
      statusCode: res.status,
      message: res.statusText,
      error: "ProxyError",
    }));
    throw new ApiRequestError(res.status, body);
  }
  return res.json() as Promise<ModerationReport>;
}
