import type { NextConfig } from "next";

// ── Build-time env validation ──────────────────────────────────────────────
// WHAT belongs here: only NEXT_PUBLIC_* variables that Next.js inlines into
// the browser bundle at compile time. If these are absent the bundle will
// contain literal "undefined" — catch that early.
//
// WHAT does NOT belong here: server-only vars (INTERNAL_API_BASE_URL,
// API_BASE_URL_SERVER, INTERNAL_API_KEY, etc.). Those are never baked into
// the bundle and are only read at request time. Validating them here forces
// CI to supply runtime secrets during `next build`, which is both unnecessary
// and insecure. They are already validated at their call sites in lib/api/client.ts.
if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  throw new Error(
    "[Tunax Web] Missing required environment variable: NEXT_PUBLIC_API_BASE_URL\n\n" +
    "  • Local dev:  add it to apps/web/.env.local\n" +
    "  • CI:         set NEXT_PUBLIC_API_BASE_URL=http://localhost:3001 in the build step env\n" +
    "  • Production: set it in your hosting panel (Vercel / Railway / etc.)\n",
  );
}

// ── Content-Security-Policy ────────────────────────────────────────────────
// 'unsafe-inline' in script-src is required by Next.js App Router (inline
// scripts for hydration). Once the app adopts nonces this can be tightened.
// The remaining directives block object embeds, base-tag injection, and
// cross-origin form submissions regardless of inline script needs.
// img-src includes blob: for Leaflet canvas and OSM tile hostnames.
//
// connect-src: must include the API origin explicitly when it differs from
// the web app origin (e.g. localhost:3000 vs localhost:3001 in dev, or a
// separate API domain in production). Without this, the browser CSP will
// silently block all fetch() calls to the API, surfacing as a generic
// "network unreachable" error even though the server is healthy.
//
// NEXT_PUBLIC_API_BASE_URL is baked into the bundle at build time, so it is
// available here in next.config.ts. We extract only the origin
// (protocol + host + port) to keep the CSP directive precise.
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
let apiOrigin = "";
try {
  if (apiBaseUrl) apiOrigin = new URL(apiBaseUrl).origin;
} catch {
  // Malformed URL — fall back to raw value so CSP is still emitted
  apiOrigin = apiBaseUrl;
}

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.amazonaws.com https://*.cloudfront.net https://*.tile.openstreetmap.org",
  "font-src 'self' data:",
  // Include the API origin so browser fetch() to the API host is not blocked.
  // When the API is on the same origin as the web app, the extra entry is
  // harmless (browsers deduplicate). When they differ (different port/domain),
  // this is required or every API call will throw a TypeError in the browser.
  `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

// ── Security headers applied to all routes ────────────────────────────────
const securityHeaders = [
  // Prevents MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Blocks clickjacking — page cannot be framed by other origins
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stops legacy XSS filter interference (modern browsers ignore this; harmless)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Restricts referrer info sent to external origins
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Controls what browser features this page can use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  },
  // Blocks object embeds, base-tag injection, cross-origin forms
  { key: "Content-Security-Policy", value: CSP },
];

// HSTS: only add in production (localhost doesn't support HTTPS)
if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      // AWS S3 (path-style and virtual-hosted-style)
      { protocol: "https", hostname: "**.amazonaws.com" },
      // CloudFront CDN (if configured via S3_PUBLIC_BASE_URL)
      { protocol: "https", hostname: "**.cloudfront.net" },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
