import type { NextConfig } from "next";

// ── Build-time env validation ──────────────────────────────────────────────
// WHAT belongs here: only NEXT_PUBLIC_* variables that Next.js inlines into
// the browser bundle at compile time. If these are absent the bundle will
// contain literal "undefined" — catch that early.
//
// WHAT does NOT belong here: server-only vars (API_BASE_URL_SERVER,
// INTERNAL_API_KEY, etc.). Those are never baked into the bundle and are only
// read at request time. Validating them here forces CI to supply runtime
// secrets during `next build`, which is both unnecessary and insecure.
// They are already validated at their call sites in lib/api/client.ts.
if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  throw new Error(
    "[Tunax Web] Missing required environment variable: NEXT_PUBLIC_API_BASE_URL\n\n" +
    "  • Local dev:  add it to apps/web/.env.local\n" +
    "  • CI:         set NEXT_PUBLIC_API_BASE_URL=http://localhost:3001 in the build step env\n" +
    "  • Production: set it in your hosting panel (Vercel / Railway / etc.)\n",
  );
}

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
