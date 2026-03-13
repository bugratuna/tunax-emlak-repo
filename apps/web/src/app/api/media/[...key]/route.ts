import type { NextRequest } from "next/server";

/**
 * GET /api/media/[...key]
 *
 * Same-origin image proxy for private S3 bucket delivery.
 *
 * WHY THIS EXISTS
 * ──────────────
 * The S3 bucket is private (no public-read policy). The server-side NestJS API
 * has IAM credentials and can fetch any object. The browser does not.
 *
 * Without this proxy, browser-rendered <img> tags receive a direct S3 URL
 * (https://bucket.s3.region.amazonaws.com/listings/...) which returns 403
 * when the bucket is private. This breaks images in every CSR component
 * ("use client") and in SSR-generated HTML that the browser loads.
 *
 * HOW IT WORKS
 * ────────────
 * 1. The web app emits image src="/api/media/listings/<uuid>/<file>" (same-origin).
 * 2. The browser loads this URL — no CORS check, no S3 credentials needed.
 * 3. This handler fetches from the NestJS API via INTERNAL_API_BASE_URL
 *    (server-side only, never reaches the browser). NestJS has IAM credentials
 *    and proxies from S3.
 * 4. We stream the response back with immutable cache headers so subsequent
 *    requests are served from the browser cache — the proxy hop only costs
 *    on the first load of each unique image.
 *
 * SECURITY NOTES
 * ──────────────
 * - Only keys starting with "listings/" are forwarded. Anything else → 404.
 * - ".." path segments → 404 (path traversal guard).
 * - The INTERNAL_API_BASE_URL is server-only (no NEXT_PUBLIC_ prefix) and
 *   never reaches the browser bundle.
 * - No authentication is added to the upstream request: the NestJS media
 *   endpoint is intentionally unauthenticated (images are public content).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;

  // Reconstruct the S3 key from the catch-all segments.
  // e.g., ['listings', 'abc-uuid', 'def.jpg'] → 'listings/abc-uuid/def.jpg'
  const s3Key = key.join("/");

  // Security guards — reject before hitting the upstream.
  if (
    !s3Key.startsWith("listings/") ||
    s3Key.includes("..") ||
    s3Key.includes("//")
  ) {
    return new Response("Not Found", { status: 404 });
  }

  // Resolve the internal API base URL (server-side only).
  const apiBase =
    process.env.INTERNAL_API_BASE_URL ??
    process.env.API_BASE_URL_SERVER ??
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBase) {
    return new Response(
      "Server misconfiguration: INTERNAL_API_BASE_URL is not set",
      { status: 500 },
    );
  }

  const upstreamUrl = `${apiBase.replace(/\/$/, "")}/api/media/${s3Key}`;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      // next: { revalidate: 0 } — no need; this is a pass-through proxy.
      // The browser's own Cache-Control response header handles caching.
    });
  } catch {
    return new Response("Upstream unavailable", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response("Not Found", { status: upstream.status });
  }

  // Forward the content-type and cache headers from the upstream response.
  // NestJS sets Cache-Control: public, max-age=31536000, immutable so the
  // browser caches aggressively after the first proxy hop.
  const contentType =
    upstream.headers.get("content-type") ?? "image/jpeg";
  const cacheControl =
    upstream.headers.get("cache-control") ??
    "public, max-age=31536000, immutable";

  return new Response(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    },
  });
}
