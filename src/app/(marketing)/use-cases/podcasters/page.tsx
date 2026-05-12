import type { Metadata } from "next";
import { UseCaseTemplate } from "@/components/seo/UseCaseTemplate";

export const metadata: Metadata = {
  title: "Live Streaming Studio for Podcasters",
  description:
    "Record and live-stream your podcast in the same session. Zerocast multistreams interviews to YouTube, Twitch, and TikTok while an AI Co-Host runs chat.",
  alternates: { canonical: "/use-cases/podcasters" },
};

export default function PodcastersPage() {
  return (
    <UseCaseTemplate
      kicker="For Podcasters"
      headline={<>One session.<br /><span className="text-ink-faint">Recorded and live everywhere.</span></>}
      intro="Stop choosing between a clean podcast recording and a live stream. Zerocast captures broadcast-quality video to the cloud while simultaneously fanning your show out to YouTube Live, Twitch, Kick, and TikTok — with an AI Co-Host fielding chat in your voice."
      painPoints={[
        { title: "Recording vs streaming", body: "Riverside-class recording quality is great — but it doesn't reach live audiences. Streaming tools record poorly. You're forced to pick." },
        { title: "Chat divides your attention", body: "Live audiences expect interaction. You can't read four chats and interview your guest at the same time." },
        { title: "Repurposing takes a full day", body: "Episodes live on YouTube but the live moment only happens once. Most podcasters skip live entirely because the workflow is painful." },
      ]}
      features={[
        { label: "Up to 5 guests on stage", desc: "Browser join links with device preview. Guests are ready in 30 seconds — no Zoom-style download dance." },
        { label: "Cloud recording at 1080p", desc: "Each session is captured to the cloud automatically. Download the broadcast immediately after the show ends." },
        { label: "Multistream to 4 platforms", desc: "YouTube Live + Twitch + Kick + TikTok Live simultaneously, plus unlimited custom RTMP destinations (Facebook Live, LinkedIn Live, etc.)." },
        { label: "AI Co-Host on chat duty", desc: "Aggregates all platform chats, answers FAQs in your voice, welcomes new subs — so you stay focused on the conversation." },
        { label: "Built-in highlights surface", desc: "The AI surfaces super-chats, big tips, and high-engagement moments to you in real time without breaking the flow." },
      ]}
      faqs={[
        { q: "Can I record locally per-guest like Riverside?", a: "Not yet. Cloud recording at 1080p is currently the only recording mode. Local per-track recording is on the roadmap." },
        { q: "Does the AI sound like me on audio?", a: "No. The AI replies in text via chat — never via audio. We call it Tone Matching, not voice cloning. It learns your written style from past chat logs." },
        { q: "How many platforms can I stream a single episode to?", a: "All four native platforms (YouTube, Twitch, Kick, TikTok) plus any number of custom RTMP destinations — Facebook Live, LinkedIn Live, X / Twitter, Trovo, Rumble." },
        { q: "What's the typical setup time?", a: "About 90 seconds. Connect platforms via OAuth or stream keys, share a join link with your guest, and click 'Go Live'." },
      ]}
    />
  );
}
