import { apiFetch, ApiRequestError } from "./client";
import type {
  AuditLogEntry,
  ModerationQueue,
  ModerationReport,
  ScoringReport,
} from "@/lib/types";

// Helper — build _token init option only when a token is provided.
// Server components pass their cookie-sourced token explicitly;
// client components rely on the module-level store inside apiFetch.
function withToken(token?: string) {
  return token ? { _token: token } : undefined;
}

// ADMIN-only endpoints — accept an optional token for server component usage.

export async function getModerationQueue(
  token?: string,
): Promise<ModerationQueue> {
  return apiFetch<ModerationQueue>(
    "/api/admin/moderation/queue",
    withToken(token),
  );
}

export async function getModerationReport(
  listingId: string,
  token?: string,
): Promise<ModerationReport> {
  return apiFetch<ModerationReport>(
    `/api/admin/moderation/${listingId}/report`,
    withToken(token),
  );
}

export async function getScoringReport(
  listingId: string,
  token?: string,
): Promise<ScoringReport> {
  return apiFetch<ScoringReport>(
    `/api/admin/moderation/${listingId}/score`,
    withToken(token),
  );
}

export async function getAuditLog(
  listingId: string,
  token?: string,
): Promise<AuditLogEntry[]> {
  return apiFetch<AuditLogEntry[]>(
    `/api/admin/moderation/${listingId}/audit-log`,
    withToken(token),
  );
}

// Decision actions — called from client components only.
// Token auto-attached by apiFetch via module-level store (AuthProvider).
// adminId is NOT sent in the body: the backend derives it from JWT sub.

export async function approveListing(
  listingId: string,
  notes?: string,
): Promise<{ listing: unknown; report: ModerationReport }> {
  return apiFetch(`/api/admin/moderation/${listingId}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });
}

export async function requestChanges(
  listingId: string,
  feedback: string,
): Promise<{ listing: unknown; report: ModerationReport }> {
  return apiFetch(`/api/admin/moderation/${listingId}/request-changes`, {
    method: "PATCH",
    body: JSON.stringify({ feedback }),
  });
}

export async function rejectListing(
  listingId: string,
  reason?: string,
): Promise<{ listing: unknown; report: ModerationReport }> {
  return apiFetch(`/api/admin/moderation/${listingId}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
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
