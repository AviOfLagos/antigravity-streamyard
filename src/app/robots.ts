import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zerocast.vercel.app";

const DISALLOW_PATHS = [
  "/api/",
  "/api/admin",
  "/admin",
  "/adminos",
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
];

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",
  "cohere-ai",
  "Applebot-Extended",
  "Bytespider",
  "meta-externalagent",
  "Diffbot",
  "FacebookBot",
];

// SEO strategy: explicitly allow AI crawlers (OpenAI, Anthropic, Perplexity,
// Google-Extended, Apple, Meta, ByteDance, Diffbot, Cohere) so Zerocast is
// eligible for AI Overviews and chatbot citations. Each bot mirrors the
// master disallow list to keep sensitive surfaces (studio, dashboard, admin,
// api, auth) out of training and retrieval indexes.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW_PATHS,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW_PATHS,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
