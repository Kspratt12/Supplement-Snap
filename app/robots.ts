import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/app", "/admin", "/api/"],
    },
    sitemap: "https://supplement-snap.vercel.app/sitemap.xml",
  }
}
