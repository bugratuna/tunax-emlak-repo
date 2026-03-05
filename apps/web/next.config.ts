import type { NextConfig } from "next";

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
};

export default nextConfig;
