import type { Metadata } from "next";
import { UseCaseTemplate } from "@/components/seo/UseCaseTemplate";

export const metadata: Metadata = {
  title: "Multistream for Gamers — Twitch, YouTube, Kick, TikTok",
  description:
    "Gaming streamer? Multistream to Twitch, YouTube, Kick, and TikTok at once while the AI Co-Host runs your chat. No OBS, no installer — push from your existing setup if you want.",
  alternates: { canonical: "/use-cases/gamers" },
};

export default function GamersPage() {
  return (
    <UseCaseTemplate
      kicker="For Gamers"
      headline={<>Game.<br /><span className="text-neutral-600">Let the AI run chat.</span></>}
      intro="You're locked into the game. Chat is rolling. Subs are coming in. Without help, you miss 80% of it. Zerocast's AI Co-Host reads every message across Twitch, YouTube, Kick, and TikTok — and replies in your voice while you focus on not dying."
      painPoints={[
        { title: "Chat moves faster than you can read", body: "Fast scrolls drown out your top supporters. Sub events vanish. You forget to thank people." },
        { title: "Multistreaming kills your bitrate", body: "Running multiple RTMPs locally taxes your upload and your encoder. Cloud multistream solves both — most setups can't do it cleanly." },
        { title: "Mods cost money or social favors", body: "Hiring a chat moderator or begging a friend isn't scalable. You need the help to be always-on." },
      ]}
      features={[
        { label: "AI Co-Host built for chat speed", desc: "Reads YouTube, Twitch, Kick, and TikTok chat in real time. Replies in your tone — sarcastic, hype, deadpan, whatever — based on a persona brief or your past chat logs." },
        { label: "Bring your own encoder", desc: "Already running OBS or Streamlabs Desktop? Use the External Encoder integration. Send one RTMP feed to Zerocast and we fan it out to every destination." },
        { label: "Twitch + YouTube reply support", desc: "AI replies post to Twitch and YouTube chat natively. Kick and TikTok responses appear in the unified Zerocast chat panel." },
        { label: "Sub / donation / raid alerts surfaced", desc: "AI highlights big moments — sub trains, super chats, raids — so you can react. No alert overlay required." },
        { label: "Sub-second WebRTC for guests", desc: "Co-stream with another creator? Pull them in as a guest with sub-second latency for natural conversation. No more 2-second Skype-call delay." },
      ]}
      faqs={[
        { q: "Is multistreaming against Twitch ToS?", a: "Twitch removed its exclusivity clause for non-Partners in 2022, and most Partners can now multistream. YouTube and Kick have always allowed it. TikTok is fine as long as you have a single TikTok account broadcasting. See our FAQ for the full breakdown." },
        { q: "Can I keep my OBS overlays?", a: "Yes. Use OBS as your encoder and push one RTMP feed to Zerocast — overlays, alerts, and scene transitions all happen in OBS like normal. Zerocast handles the fan-out and AI chat layer." },
        { q: "What's the upload bandwidth requirement?", a: "10 Mbps minimum for 1080p single-source streaming. With cloud fan-out, you only upload one feed regardless of how many platforms you publish to — far less than local multi-RTMP." },
        { q: "Does the AI bot get me banned?", a: "No. The AI replies as you (via OAuth on YouTube/Twitch) — it's not a separate bot account. It respects all platform rate limits automatically." },
      ]}
    />
  );
}
