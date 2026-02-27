import { apiFetch } from "./client";
import type {
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
