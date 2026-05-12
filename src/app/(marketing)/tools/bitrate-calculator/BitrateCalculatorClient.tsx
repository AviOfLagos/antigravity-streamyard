"use client";

import { useMemo, useState } from "react";

const RESOLUTIONS = {
  "720p":  { w: 1280, h: 720 },
  "1080p": { w: 1920, h: 1080 },
  "1440p": { w: 2560, h: 1440 },
  "4K":    { w: 3840, h: 2160 },
} as const;

const FRAMERATES = [30, 60] as const;

const PLATFORM_LIMITS: Record<string, { name: string; max: number; recommended: string }> = {
  youtube:   { name: "YouTube Live",  max: 51_000, recommended: "1080p60 @ 9 Mbps" },
  twitch:    { name: "Twitch",        max:  6_000, recommended: "1080p60 @ 6 Mbps" },
  kick:      { name: "Kick",          max: 10_000, recommended: "1080p60 @ 8 Mbps" },
  tiktok:    { name: "TikTok Live",   max:  4_000, recommended: "720p30 @ 3 Mbps" },
  facebook:  { name: "Facebook Live", max:  4_000, recommended: "720p30 @ 4 Mbps" },
};

type ResKey = keyof typeof RESOLUTIONS;
type PlatformKey = keyof typeof PLATFORM_LIMITS;

function calcBitrate(res: ResKey, fps: number): number {
  const { w, h } = RESOLUTIONS[res];
  const pixels = w * h;
  const bpp = 0.10;
  const fpsMultiplier = fps === 60 ? 1.5 : 1.0;
  return Math.round((pixels * bpp * 30 * fpsMultiplier) / 1000);
}

export function BitrateCalculatorClient() {
  const [resolution, setResolution] = useState<ResKey>("1080p");
  const [framerate, setFramerate] = useState<number>(60);
  const [platform, setPlatform] = useState<PlatformKey>("youtube");

  const videoBitrate = useMemo(() => calcBitrate(resolution, framerate), [resolution, framerate]);
  const audioBitrate = 192;
  const overhead = Math.round((videoBitrate + audioBitrate) * 0.2);
  const totalUpload = videoBitrate + audioBitrate + overhead;

  const limit = PLATFORM_LIMITS[platform];
  const overLimit = videoBitrate > limit.max;

  return (
    <section className="px-6 pb-12 max-w-4xl mx-auto">
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">Resolution</label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value as ResKey)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500/60"
          >
            {(Object.keys(RESOLUTIONS) as ResKey[]).map((k) => (
              <option key={k} value={k}>{k} ({RESOLUTIONS[k].w}×{RESOLUTIONS[k].h})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">Framerate</label>
          <select
            value={framerate}
            onChange={(e) => setFramerate(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500/60"
          >
            {FRAMERATES.map((f) => (
              <option key={f} value={f}>{f} fps</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">Destination</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as PlatformKey)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500/60"
          >
            {(Object.keys(PLATFORM_LIMITS) as PlatformKey[]).map((k) => (
              <option key={k} value={k}>{PLATFORM_LIMITS[k].name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-500/40 bg-indigo-500/5 p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">Recommended Setup</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-neutral-500 mb-1">Video bitrate</p>
            <p className="font-black text-white text-3xl">{videoBitrate.toLocaleString()}<span className="text-neutral-600 text-base font-bold ml-1">kbps</span></p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Audio bitrate</p>
            <p className="font-black text-white text-3xl">{audioBitrate}<span className="text-neutral-600 text-base font-bold ml-1">kbps</span></p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Upload required</p>
            <p className="font-black text-white text-3xl">{(totalUpload / 1000).toFixed(1)}<span className="text-neutral-600 text-base font-bold ml-1">Mbps</span></p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Platform cap</p>
            <p className={`font-black text-3xl ${overLimit ? "text-red-400" : "text-white"}`}>
              {(limit.max / 1000).toFixed(1)}<span className="text-neutral-600 text-base font-bold ml-1">Mbps</span>
            </p>
          </div>
        </div>

        {overLimit && (
          <p className="mt-6 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            Warning: {videoBitrate.toLocaleString()} kbps exceeds {limit.name}&apos;s {(limit.max / 1000).toFixed(1)} Mbps cap. The platform will transcode or drop frames. Try lowering resolution or framerate.
          </p>
        )}

        <p className="mt-6 text-xs text-neutral-500">
          {limit.name} recommends: <span className="text-neutral-300">{limit.recommended}</span>
        </p>
      </div>
    </section>
  );
}
