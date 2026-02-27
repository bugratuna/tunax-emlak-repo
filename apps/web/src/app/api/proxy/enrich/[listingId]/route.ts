import { NextResponse } from "next/server";
import { internalApiFetch, ApiRequestError } from "@/lib/api/client";
import type { ModerationReport } from "@/lib/types";

/**
 * POST /api/proxy/enrich/[listingId]
 *
 * Server-side proxy for POST /api/admin/moderation/:id/enrich.
 * Adds x-internal-api-key from INTERNAL_API_KEY env var (server-side only).
 * The browser never sees the key.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;
  try {
    const data = await internalApiFetch<ModerationReport>(
      `/api/admin/moderation/${listingId}/enrich`,
      { method: "POST" },
    );
    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof ApiRequestError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Proxy error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
