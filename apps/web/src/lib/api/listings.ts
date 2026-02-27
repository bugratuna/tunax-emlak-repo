import { apiFetch } from "./client";
import type { Listing } from "@/lib/types";

/**
 * TODO: No list endpoint exists yet.
 * Needs: GET /api/listings?status=PUBLISHED
 * Returns empty array until the endpoint is implemented.
 */
export async function listListings(): Promise<Listing[]> {
  return [];
}

export async function getListing(id: string): Promise<Listing> {
  return apiFetch<Listing>(`/api/listings/${id}`);
}

/**
 * Create a listing.
 * NOTE: Current API only accepts { title, consultantId }.
 * Full form fields will be wired once the endpoint is expanded.
 */
export async function createListing(
  title: string,
  consultantId?: string,
): Promise<Listing> {
  return apiFetch<Listing>("/api/listings", {
    method: "POST",
    body: JSON.stringify({ title, consultantId }),
  });
}

/**
 * Resubmit a listing from NEEDS_CHANGES → PENDING_REVIEW.
 */
export async function resubmitListing(id: string): Promise<Listing> {
  return apiFetch<Listing>(`/api/listings/${id}/resubmit`, {
    method: "PATCH",
  });
}
