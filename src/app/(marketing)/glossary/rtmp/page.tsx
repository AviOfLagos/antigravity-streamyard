import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "What is RTMP? — Real-Time Messaging Protocol Explained for Streamers",
  description:
    "RTMP (Real-Time Messaging Protocol) is the standard for sending live video to streaming platforms. Here's what it is, how it works, RTMP vs WebRTC, and how to use it.",
  alternates: { canonical: "/glossary/rtmp" },
};

const defJsonLd = {
  "@context": "https://schema.org",
  "@type": "DefinedTerm",
  name: "RTMP",
  alternateName: "Real-Time Messaging Protocol",
  description:
    "A network protocol developed by Macromedia (now Adobe) for streaming audio, video, and data over the internet between an encoder and a streaming server.",
};

export default function RtmpGlossaryPage() {
  return (
    <div className="text-white selection:bg-indigo-500/30">
      <Script id="rtmp-jsonld" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(defJsonLd) }} />

      <section className="px-6 pt-24 pb-12 max-w-4xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Glossary</p>
        <h1 className="font-black text-white tracking-tight leading-[1.05] mb-8"
          style={{ fontSize: "clamp(40px, 6vw, 80px)" }}>
          What is RTMP?
        </h1>
        <p className="text-neutral-300 text-xl leading-relaxed mb-6">
          <strong>RTMP</strong> stands for <em>Real-Time Messaging Protocol</em>. It&apos;s the network protocol that has been the de-facto standard for sending live video from a streamer&apos;s computer to a streaming platform like YouTube Live, Twitch, or Kick since the mid-2000s.
        </p>
        <p className="text-neutral-500 text-base leading-relaxed">
          Originally developed by Macromedia (acquired by Adobe in 2005) for use with Flash Player, RTMP outlived Flash and remains the ingest protocol of choice for nearly every major live streaming destination.
        </p>
      </section>

      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="font-bold text-white text-3xl mb-6">How RTMP works</h2>
        <p className="text-neutral-400 leading-relaxed mb-6">
          When you go live with software like OBS, Streamlabs, or Zerocast, your encoder establishes a persistent TCP connection to the streaming platform&apos;s <strong className="text-white">RTMP ingest server</strong>. You authenticate with a <strong className="text-white">stream key</strong> (a long, secret token), then continuously push encoded H.264 video and AAC audio packets over that connection.
        </p>
        <p className="text-neutral-400 leading-relaxed mb-12">
          The platform receives the stream, transcodes it into multiple resolutions, and distributes it to viewers via HLS, DASH, or its own playback protocol.
        </p>

        <h2 className="font-bold text-white text-3xl mb-6">RTMP URL anatomy</h2>
        <pre className="bg-neutral-900 border border-white/5 rounded-lg p-4 text-sm text-neutral-300 mb-6 overflow-x-auto"><code>rtmp://a.rtmp.youtube.com/live2/abcd-1234-efgh-5678</code></pre>
        <ul className="text-neutral-400 leading-relaxed space-y-3 mb-12">
          <li><strong className="text-white">Protocol:</strong> <code className="bg-white/5 px-1.5 py-0.5 rounded text-xs">rtmp://</code> (or <code className="bg-white/5 px-1.5 py-0.5 rounded text-xs">rtmps://</code> for encrypted).</li>
          <li><strong className="text-white">Ingest server:</strong> <code className="bg-white/5 px-1.5 py-0.5 rounded text-xs">a.rtmp.youtube.com/live2</code> — the platform&apos;s endpoint.</li>
          <li><strong className="text-white">Stream key:</strong> <code className="bg-white/5 px-1.5 py-0.5 rounded text-xs">abcd-1234-efgh-5678</code> — your private credential. Treat this like a password.</li>
        </ul>

        <h2 className="font-bold text-white text-3xl mb-6">RTMP vs WebRTC</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">
          <strong className="text-white">RTMP</strong>: TCP-based, 2-10 second latency, universal platform support, simple authentication.
        </p>
        <p className="text-neutral-400 leading-relaxed mb-4">
          <strong className="text-white">WebRTC</strong>: UDP-based, sub-second latency, browser-native, complex peer/SFU topology.
        </p>
        <p className="text-neutral-400 leading-relaxed mb-12">
          Modern studios like Zerocast use <strong className="text-white">WebRTC</strong> for in-studio guest communication (where latency matters) and <strong className="text-white">RTMP</strong> for outbound delivery to YouTube, Twitch, Kick, and TikTok (where universal support matters).
        </p>

        <h2 className="font-bold text-white text-3xl mb-6">Is RTMP being replaced?</h2>
        <p className="text-neutral-400 leading-relaxed mb-12">
          Slowly. <strong className="text-white">SRT</strong> (Secure Reliable Transport) and <strong className="text-white">RIST</strong> are gaining traction for professional broadcast use. <strong className="text-white">WHIP</strong> (WebRTC-HTTP Ingestion Protocol) is the leading candidate for next-generation low-latency ingest. But RTMP&apos;s ubiquity means it will dominate consumer streaming through 2026 and beyond.
        </p>
      </section>

      <section className="border-t border-white/5 px-6 py-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <h2 className="font-black text-white text-4xl tracking-tight">Skip the RTMP setup.</h2>
        <Link href="?beta=true" scroll={false} className="shrink-0 inline-flex items-center gap-2 bg-white text-neutral-950 font-bold px-8 py-4 rounded-full text-sm hover:bg-indigo-100 transition-all">
          Use Zerocast Studio <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
