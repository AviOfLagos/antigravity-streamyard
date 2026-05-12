import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zerocast.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/settings",
          "/settings/",
          "/studio",
          "/studio/",
          "/demo",
          "/demo/",
          "/join",
          "/join/",
          "/session-summary",
          "/session-summary/",
          "/studio-ended",
          "/qa",
          "/feedback",
          "/login",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
