import type { NextConfig } from "next";

// ── Build-time env validation ──────────────────────────────────────────────
// These checks run when `next build` or `next dev` starts.
// Missing required vars cause an immediate error — no silent failures.
const REQUIRED_SERVER_VARS = ["API_BASE_URL_SERVER", "INTERNAL_API_KEY"];
const REQUIRED_PUBLIC_VARS = ["NEXT_PUBLIC_API_BASE_URL"];

const missingVars: string[] = [];
for (const v of REQUIRED_SERVER_VARS) {
  if (!process.env[v]) missingVars.push(`  ${v}  (server-only, no NEXT_PUBLIC_ prefix)`);
}
for (const v of REQUIRED_PUBLIC_VARS) {
  if (!process.env[v]) missingVars.push(`  ${v}  (browser-safe public var)`);
}
if (missingVars.length > 0) {
  throw new Error(
    `[Tunax Web] Missing required environment variables:\n\n${missingVars.join("\n")}\n\n` +
    `Copy apps/web/.env.example to apps/web/.env.local and fill in the values.\n`,
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
