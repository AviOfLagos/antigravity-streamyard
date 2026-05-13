/**
 * Sitemap lastModified strategy:
 *   1. Try `git log -1 --format=%aI -- <file>` (author date, ISO 8601) via execSync.
 *   2. If git unavailable or returns empty (shallow clones, non-git build envs),
 *      fall back to `fs.statSync(file).mtime`.
 *   3. If the source file itself can't be stat'd, fall back to `new Date()`.
 *
 * Resolution happens ONCE at module init and is memoized in a Map so the exported
 * sync function stays cheap at request time. Paths are resolved against
 * `process.cwd()` so `git log` works regardless of where Next invokes us from.
 */
import type { MetadataRoute } from "next";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zerocast.vercel.app";

const STATIC_PATHS: { path: string; source: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "",                                  source: "src/app/(marketing)/page.tsx",                                 changeFrequency: "weekly",  priority: 1.0 },
  { path: "/pricing",                          source: "src/app/(marketing)/pricing/page.tsx",                         changeFrequency: "weekly",  priority: 0.9 },
  { path: "/features",                         source: "src/app/(marketing)/features/page.tsx",                        changeFrequency: "weekly",  priority: 0.9 },
  { path: "/features/ai-cohost",               source: "src/app/(marketing)/features/ai-cohost/page.tsx",              changeFrequency: "weekly",  priority: 0.9 },
  { path: "/integrations",                     source: "src/app/(marketing)/integrations/page.tsx",                    changeFrequency: "weekly",  priority: 0.8 },
  { path: "/compare/streamyard-alternative",   source: "src/app/(marketing)/compare/streamyard-alternative/page.tsx",  changeFrequency: "weekly",  priority: 0.8 },
  { path: "/compare/restream-alternative",     source: "src/app/(marketing)/compare/restream-alternative/page.tsx",    changeFrequency: "weekly",  priority: 0.8 },
  { path: "/compare/riverside-alternative",    source: "src/app/(marketing)/compare/riverside-alternative/page.tsx",   changeFrequency: "weekly",  priority: 0.8 },
  { path: "/compare/streamlabs-alternative",   source: "src/app/(marketing)/compare/streamlabs-alternative/page.tsx",  changeFrequency: "weekly",  priority: 0.8 },
  { path: "/use-cases/podcasters",             source: "src/app/(marketing)/use-cases/podcasters/page.tsx",            changeFrequency: "monthly", priority: 0.7 },
  { path: "/use-cases/educators",              source: "src/app/(marketing)/use-cases/educators/page.tsx",             changeFrequency: "monthly", priority: 0.7 },
  { path: "/use-cases/churches",               source: "src/app/(marketing)/use-cases/churches/page.tsx",              changeFrequency: "monthly", priority: 0.7 },
  { path: "/use-cases/gamers",                 source: "src/app/(marketing)/use-cases/gamers/page.tsx",                changeFrequency: "monthly", priority: 0.7 },
  { path: "/glossary/multistreaming",          source: "src/app/(marketing)/glossary/multistreaming/page.tsx",         changeFrequency: "monthly", priority: 0.6 },
  { path: "/glossary/rtmp",                    source: "src/app/(marketing)/glossary/rtmp/page.tsx",                   changeFrequency: "monthly", priority: 0.6 },
  { path: "/tools/bitrate-calculator",         source: "src/app/(marketing)/tools/bitrate-calculator/page.tsx",        changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog",                             source: "src/app/(marketing)/blog/page.tsx",                            changeFrequency: "daily",   priority: 0.7 },
  { path: "/changelog",                        source: "src/app/(marketing)/changelog/page.tsx",                       changeFrequency: "weekly",  priority: 0.6 },
  { path: "/about",                            source: "src/app/(marketing)/about/page.tsx",                           changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact",                          source: "src/app/(marketing)/contact/page.tsx",                         changeFrequency: "monthly", priority: 0.5 },
  { path: "/contribute",                       source: "src/app/(marketing)/contribute/page.tsx",                      changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy",                          source: "src/app/(marketing)/privacy/page.tsx",                         changeFrequency: "yearly",  priority: 0.3 },
  { path: "/terms",                            source: "src/app/(marketing)/terms/page.tsx",                           changeFrequency: "yearly",  priority: 0.3 },
];

function resolveLastModified(sourceRelPath: string): Date {
  const absPath = path.resolve(process.cwd(), sourceRelPath);

  // 1. git log
  try {
    const out = execSync(`git log -1 --format=%aI -- "${absPath}"`, {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
    if (out) {
      const d = new Date(out);
      if (!isNaN(d.getTime())) return d;
    }
  } catch {
    // fall through
  }

  // 2. fs stat
  try {
    return fs.statSync(absPath).mtime;
  } catch {
    // fall through
  }

  // 3. now
  return new Date();
}

// Memoize at module init so request-time calls are O(1) Map lookups.
const LAST_MODIFIED_CACHE: Map<string, Date> = new Map(
  STATIC_PATHS.map(({ path: p, source }) => [p, resolveLastModified(source)])
);

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_PATHS.map(({ path: p, changeFrequency, priority }) => ({
    url: `${SITE_URL}${p}`,
    lastModified: LAST_MODIFIED_CACHE.get(p) ?? new Date(),
    changeFrequency,
    priority,
  }));
}
