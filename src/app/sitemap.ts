import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zerocast.vercel.app";

const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "",                                  changeFrequency: "weekly",  priority: 1.0 },
  { path: "/pricing",                          changeFrequency: "weekly",  priority: 0.9 },
  { path: "/features",                         changeFrequency: "weekly",  priority: 0.9 },
  { path: "/features/ai-cohost",               changeFrequency: "weekly",  priority: 0.9 },
  { path: "/integrations",                     changeFrequency: "weekly",  priority: 0.8 },
  { path: "/compare/streamyard-alternative",   changeFrequency: "weekly",  priority: 0.8 },
  { path: "/compare/restream-alternative",     changeFrequency: "weekly",  priority: 0.8 },
  { path: "/compare/riverside-alternative",    changeFrequency: "weekly",  priority: 0.8 },
  { path: "/compare/streamlabs-alternative",   changeFrequency: "weekly",  priority: 0.8 },
  { path: "/use-cases/podcasters",             changeFrequency: "monthly", priority: 0.7 },
  { path: "/use-cases/educators",              changeFrequency: "monthly", priority: 0.7 },
  { path: "/use-cases/churches",               changeFrequency: "monthly", priority: 0.7 },
  { path: "/use-cases/gamers",                 changeFrequency: "monthly", priority: 0.7 },
  { path: "/glossary/multistreaming",          changeFrequency: "monthly", priority: 0.6 },
  { path: "/glossary/rtmp",                    changeFrequency: "monthly", priority: 0.6 },
  { path: "/tools/bitrate-calculator",         changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog",                             changeFrequency: "daily",   priority: 0.7 },
  { path: "/changelog",                        changeFrequency: "weekly",  priority: 0.6 },
  { path: "/about",                            changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact",                          changeFrequency: "monthly", priority: 0.5 },
  { path: "/contribute",                       changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy",                          changeFrequency: "yearly",  priority: 0.3 },
  { path: "/terms",                            changeFrequency: "yearly",  priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return STATIC_PATHS.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
