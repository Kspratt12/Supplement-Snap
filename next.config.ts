import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return ["/login", "/signup", "/forgot-password", "/reset-password", "/app", "/dashboard", "/admin", "/success"].map((source) => ({
      source,
      destination: "/waitlist",
      permanent: false,
    }));
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
