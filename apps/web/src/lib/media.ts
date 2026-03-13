/**
 * Image URL utilities — centralised media delivery resolution.
 *
 * ARCHITECTURE
 * ────────────
 * Images are stored on a private S3 bucket. The server has IAM credentials
 * and can read any object. The browser does not.
 *
 * All image URLs in the browser must go through the same-origin Next.js proxy:
 *   GET /api/media/<s3Key>
 *
 * The proxy route handler (apps/web/src/app/api/media/[...key]/route.ts) calls
 * the NestJS API via INTERNAL_API_BASE_URL, which fetches from S3 with IAM
 * credentials and streams the response back with immutable cache headers.
 *
 * USAGE
 * ─────
 * Any component that renders a listing image must use one of these helpers
 * instead of using `photo.url` or `photo.publicUrl` directly:
 *
 *   import { getMediaUrl, getOriginalMediaUrl } from "@/lib/media";
 *
 *   // Public-facing: prefer watermarked variant (branded delivery)
 *   <Image src={getMediaUrl(photo)} ... />
 *
 *   // Consultant-only: always show the original (no watermark)
 *   <Image src={getOriginalMediaUrl(photo)} ... />
 */

/** Extract the S3 object key from any URL that contains a path segment. */
function s3UrlToKey(raw: string): string | null {
  // Already a proxy URL → extract the key from the path
  if (raw.startsWith("/api/media/")) {
    return raw.slice("/api/media/".length);
  }
  // Direct S3 URL: https://<bucket>.s3.<region>.amazonaws.com/<key>
  // Or CloudFront: https://<dist>.cloudfront.net/<key>
  // Both are absolute URLs; we extract the path component.
  try {
    const key = new URL(raw).pathname.slice(1); // strip leading '/'
    if (key.startsWith("listings/")) return key;
  } catch {
    // Not a valid absolute URL — leave for fallback handling
  }
  return null;
}

/**
 * Returns the browser-safe, same-origin proxy URL for an image.
 *
 * On public-facing pages use this helper — it prefers the watermarked
 * (branded) variant and falls back to the original.
 *
 * Transforms any S3 / CloudFront URL to `/api/media/<s3Key>`.
 */
export function getMediaUrl(photo: {
  url: string;
  s3Key: string;
  watermarkedUrl?: string;
}): string {
  // Prefer branded delivery variant
  const rawUrl = photo.watermarkedUrl ?? photo.url;

  // Try to extract key from the URL (works for S3, CloudFront, and already-proxied)
  const keyFromUrl = s3UrlToKey(rawUrl);
  if (keyFromUrl) return `/api/media/${keyFromUrl}`;

  // Fallback: use the stored s3Key directly (covers the original image)
  if (photo.s3Key?.startsWith("listings/")) {
    return `/api/media/${photo.s3Key}`;
  }

  // Last resort: return the raw URL unchanged
  // (e.g., local dev with placeholder images, or future CDN URLs)
  return rawUrl;
}

/**
 * Returns the browser-safe proxy URL for the *original* (non-watermarked) image.
 *
 * Use this in consultant-only edit/management UIs so they always see the
 * un-branded original regardless of whether watermarking has completed.
 */
export function getOriginalMediaUrl(photo: {
  url: string;
  s3Key: string;
}): string {
  if (photo.s3Key?.startsWith("listings/")) {
    return `/api/media/${photo.s3Key}`;
  }
  const keyFromUrl = s3UrlToKey(photo.url);
  if (keyFromUrl) return `/api/media/${keyFromUrl}`;
  return photo.url;
}
