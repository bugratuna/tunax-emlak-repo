import { NextResponse } from "next/server";
import { internalApiFetch, ApiRequestError } from "@/lib/api/client";
import type { ModerationReport } from "@/lib/types";

/**
 * PATCH /api/proxy/report-llm/[listingId]
 *
 * Server-side proxy for PATCH /api/admin/moderation/:id/report/llm.
 * Adds x-internal-api-key from INTERNAL_API_KEY env var (server-side only).
 * Forwards the request body from the browser as-is to the backend.
 * The browser never sees the key.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  try {
    const data = await internalApiFetch<ModerationReport>(
      `/api/admin/moderation/${listingId}/report/llm`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    );
    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ApiRequestError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Proxy error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
