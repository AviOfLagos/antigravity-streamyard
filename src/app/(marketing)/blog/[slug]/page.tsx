import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function titleFromSlug(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = titleFromSlug(slug);
  return {
    title,
    description: `${title} — insights from the Zerocast team on browser-based live streaming, multistreaming, and AI-assisted broadcasting.`,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title,
      description: `${title} — insights from the Zerocast team.`,
      url: `/blog/${slug}`,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = titleFromSlug(slug);

  return (
    <div className="text-white selection:bg-indigo-500/30">
      <section className="px-6 pt-24 pb-16 max-w-3xl mx-auto">
        <Link href="/blog" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-12 text-sm font-bold">
          <ArrowLeft size={16} /> Back to Blog
        </Link>
        
        <div className="mb-12">
          <p className="text-indigo-400 font-bold tracking-widest uppercase text-xs mb-4">Product Updates • May 10, 2026</p>
          <h1 className="font-black text-white tracking-tight leading-[1] mb-8" style={{ fontSize: "clamp(40px, 6vw, 64px)" }}>
            {title}
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30" />
            <div>
              <p className="font-bold text-sm">Avi</p>
              <p className="text-xs text-neutral-500">Founder, NexProve</p>
            </div>
          </div>
        </div>

        <div className="prose prose-invert prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline">
          <p>
            Welcome to the detailed breakdown of our latest features. At Zerocast, we are constantly pushing the boundaries of what is possible with browser-based live streaming and AI automation.
          </p>
          
          <h2>The Journey So Far</h2>
          <p>
            When we first launched, the goal was simple: make multistreaming accessible without downloading heavy software. But we quickly realized that managing a stream across 4 platforms simultaneously is a nightmare for solo creators. You have to monitor multiple chats, trigger scene transitions, and somehow remain entertaining.
          </p>
          
          <blockquote>
            &quot;Running a live stream is a three-person job you&apos;re doing alone.&quot;
          </blockquote>
          
          <h2>What&apos;s New in This Update</h2>
          <p>
            We&apos;ve introduced tone matching for our AI Co-Host. Instead of sounding like a generic bot, the AI now learns your specific vocabulary, pacing, and catchphrases. It interacts with your community organically, acknowledging subscriptions, welcoming new viewers, and answering FAQs in a way that feels incredibly authentic to your brand.
          </p>
          
          <p>
            We&apos;re rolling out this update to all users in the Private Beta immediately. If you haven&apos;t requested access yet, be sure to hit the button in the footer to get on the waitlist!
          </p>
        </div>
      </section>
    </div>
  );
}
