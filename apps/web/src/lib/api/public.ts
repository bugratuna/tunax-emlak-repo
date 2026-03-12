import { apiFetch } from "./client";
import type { PublicStats } from "@/lib/types";

/**
 * Fetches public platform statistics from GET /api/public/stats.
 * No auth required. Used for the homepage stats bar.
 */
export async function getPublicStats(): Promise<PublicStats> {
  return apiFetch<PublicStats>("/api/public/stats");
}
