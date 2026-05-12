import type { Metadata } from "next";
import { BitrateCalculatorClient } from "./BitrateCalculatorClient";

export const metadata: Metadata = {
  title: "Streaming Bitrate Calculator — YouTube, Twitch, Kick, TikTok",
  description:
    "Free streaming bitrate calculator. Pick your resolution, framerate, and platform — get the recommended video bitrate, total upload bandwidth, and platform-specific limits.",
  alternates: { canonical: "/tools/bitrate-calculator" },
};

export default function BitrateCalculatorPage() {
  return (
    <div className="text-white selection:bg-indigo-500/30">
      <section className="px-6 pt-24 pb-12 max-w-4xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Free Tool</p>
        <h1
          className="font-black text-white tracking-tight leading-[1.05] mb-6"
          style={{ fontSize: "clamp(40px, 6vw, 80px)" }}
        >
          Streaming bitrate calculator.
        </h1>
        <p className="text-neutral-400 text-lg leading-relaxed">
          Pick your resolution, framerate, and destination. Get the recommended video bitrate, the upload bandwidth required (with audio + overhead), and each platform&apos;s hard ceiling.
        </p>
      </section>

      <BitrateCalculatorClient />

      <section className="border-t border-white/5 px-6 py-16 max-w-4xl mx-auto">
        <h2 className="font-bold text-white text-2xl mb-6">How the calculation works</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">
          Video bitrate is derived from the standard <em>bits per pixel per second</em> ratio adjusted for the H.264 codec and the platform&apos;s preferences. We use a baseline of 0.10 bpp at 30fps and scale up for 60fps (×1.5).
        </p>
        <p className="text-neutral-400 leading-relaxed mb-4">
          Total upload bandwidth adds <strong className="text-white">192 kbps</strong> for stereo AAC audio plus a 20% overhead margin for network jitter and protocol packetization.
        </p>
        <p className="text-neutral-400 leading-relaxed">
          Each destination platform enforces hard caps — YouTube tolerates the highest bitrates, TikTok is most restrictive. Going over the cap risks transcoding artifacts or dropped frames.
        </p>
      </section>
    </div>
  );
}
