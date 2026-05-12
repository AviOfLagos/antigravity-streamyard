import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog | Zerocast",
  description: "News, updates, and live streaming strategies from the Zerocast team.",
};

const posts = [
  {
    slug: "introducing-zerocast",
    category: "Announcement",
    title: "Introducing Zerocast: The AI-Powered Streaming Studio",
    excerpt: "Why we built a browser-based studio that acts as your production team, and what comes next.",
    date: "May 4, 2026",
    readTime: "5 min",
  },
  {
    slug: "multistream-without-killing-cpu",
    category: "Guide",
    title: "How to Multistream to 4 Platforms Without Killing Your CPU",
    excerpt: "A deep dive into cloud RTMP routing and why local encoding is the bottleneck holding most streamers back.",
    date: "April 28, 2026",
    readTime: "8 min",
  },
  {
    slug: "training-your-ai-cohost",
    category: "Tutorial",
    title: "Training Your AI Co-Host: Best Practices",
    excerpt: "How to feed your chat history into Zerocast so the AI sounds exactly like you — not like a bot.",
    date: "April 15, 2026",
    readTime: "4 min",
  },
];

export default function BlogPage() {
  return (
    <div className="text-white selection:bg-indigo-500/30">

      <section className="px-6 pt-24 pb-16 max-w-7xl mx-auto border-b border-white/5">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-600 mb-8">Blog</p>
        <h1 className="font-black text-white tracking-tight leading-[0.95]"
          style={{ fontSize: "clamp(48px, 7vw, 96px)" }}>
          Insights &<br />updates.
        </h1>
      </section>

      {/* Article list */}
      <section className="px-6 py-0 max-w-7xl mx-auto">
        {posts.map((post, i) => (
          <Link
            href={`/blog/${post.slug}`}
            key={post.slug}
            className="group flex flex-col md:flex-row items-start md:items-center justify-between gap-6 py-10 border-b border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-start gap-8">
              <span className="text-xs font-black text-neutral-700 tabular-nums mt-1 shrink-0 w-6">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">{post.category}</span>
                  <span className="text-xs text-neutral-600">{post.date} · {post.readTime} read</span>
                </div>
                <p className="font-bold text-white text-xl group-hover:text-indigo-300 transition-colors mb-2">{post.title}</p>
                <p className="text-neutral-500 text-sm leading-relaxed max-w-xl">{post.excerpt}</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-neutral-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>
        ))}
      </section>

    </div>
  );
}
