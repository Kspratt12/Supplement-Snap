import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { inlineCss: true },
  async redirects() {
    return [
      { source: "/blog/overhead-and-profit-roofing-insurance-claim", destination: "/blog/roofing-overhead-and-profit-claims", permanent: true },
      { source: "/blog/roof-tear-off-costs-by-size-material-pitch", destination: "/blog/roof-tear-off-cost", permanent: true },
      { source: "/blog/xactimate-codes-roofing-supplements", destination: "/blog/xactimate-codes-for-roofing-supplements", permanent: true },
      { source: "/blog/xactimate-line-item-cheat-sheet", destination: "/blog/xactimate-codes-for-roofing-supplements", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
