import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

/* ────────────────────────────────────────────────────────────────────
   Dynamic marketing asset generator.
   Renders PNG cards via @vercel/og (satori). Used for social posts,
   OG cards, and in-app hero illustrations.

   Usage:
     /og/marketing?variant=square&scene=hero
     /og/marketing?variant=og&scene=multistream
     /og/marketing?variant=story&scene=ai-cohost
     /og/marketing?variant=banner&scene=beta

   Optional overrides: ?title=&kicker=&sub=

   Design philosophy: docs/design/philosophy.md (Signal Static).
   Token reference: docs/styleguide.md.

   NOTE on color: satori does not fully support oklch() yet, so we
   mirror the design tokens here as hex equivalents. Keep these in
   sync with globals.css `@theme inline` block manually until satori
   ships native oklch support.
   ──────────────────────────────────────────────────────────────────── */

const COLOR = {
  surface: "#080808",
  surface1: "#262626",
  brand: "#6366f1",
  brandSoft: "#818cf8",
  brandSofter: "#a5b4fc",
  brandOnLight: "#e0e7ff",
  accentPurple: "#c084fc",
  inkStrong: "#ffffff",
  inkEmphasis: "#d4d4d4",
  inkMuted: "#a3a3a3",
  inkSubtle: "#737373",
  inkFaint: "#525252",
  danger: "#ef4444",
} as const;

type VariantId = "square" | "og" | "story" | "banner" | "portrait";

const VARIANTS: Record<VariantId, { w: number; h: number }> = {
  square: { w: 1080, h: 1080 },
  og: { w: 1200, h: 630 },
  story: { w: 1080, h: 1920 },
  banner: { w: 1500, h: 500 },
  portrait: { w: 1080, h: 1350 },
};

type SceneId =
  | "hero"
  | "multistream"
  | "ai-cohost"
  | "browser"
  | "beta"
  | "quote";

const SCENES: Record<
  SceneId,
  { kicker: string; title: string; titleAccent: string; sub: string }
> = {
  hero: {
    kicker: "Private Beta",
    title: "Don't just stream.",
    titleAccent: "Co-host with AI.",
    sub: "Browser-native multistream studio. AI Co-Host runs your chat in your voice.",
  },
  multistream: {
    kicker: "Multistream",
    title: "One tab.",
    titleAccent: "Four platforms.",
    sub: "YouTube, Twitch, Kick, TikTok — plus custom RTMP. Zero downloads.",
  },
  "ai-cohost": {
    kicker: "AI Co-Host",
    title: "Your voice.",
    titleAccent: "On autopilot.",
    sub: "Replies to viewers, answers FAQs, acknowledges subs — while you stay on content.",
  },
  browser: {
    kicker: "Browser-Native",
    title: "No OBS.",
    titleAccent: "No hardware.",
    sub: "The whole production runs in a single browser tab.",
  },
  beta: {
    kicker: "Now Open",
    title: "Private Beta.",
    titleAccent: "",
    sub: "Early access to the browser-native streaming studio.",
  },
  quote: {
    kicker: "For creators",
    title: "“A three-person job",
    titleAccent: "you’re doing alone.”",
    sub: "Zerocast — run a live show end-to-end, solo.",
  },
};

function isVariant(v: string | null): v is VariantId {
  return v !== null && v in VARIANTS;
}
function isScene(s: string | null): s is SceneId {
  return s !== null && s in SCENES;
}

/* ── shared visual atoms ──────────────────────────────────────────── */

function BrandGlow({ size }: { size: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: -size * 0.35,
        right: -size * 0.25,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${COLOR.brand}38 0%, transparent 65%)`,
      }}
    />
  );
}

function PulseRing({ size, stroke = 2 }: { size: number; stroke?: number }) {
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: "50%",
          border: `${stroke * 0.5}px solid ${COLOR.brandSoft}40`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: size * 0.7,
          height: size * 0.7,
          borderRadius: "50%",
          border: `${stroke}px solid ${COLOR.brandSoft}`,
        }}
      />
      <div
        style={{
          width: size * 0.18,
          height: size * 0.18,
          borderRadius: "50%",
          background: COLOR.brandSoft,
          boxShadow: `0 0 ${size * 0.2}px ${COLOR.brand}`,
        }}
      />
    </div>
  );
}

function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.4,
      }}
    >
      <div
        style={{
          width: size * 1.15,
          height: size * 1.15,
          borderRadius: size * 0.28,
          background: COLOR.brand,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLOR.inkStrong,
          fontSize: size * 0.65,
          fontWeight: 900,
          letterSpacing: -1,
        }}
      >
        Z
      </div>
      <div
        style={{
          color: COLOR.inkStrong,
          fontSize: size,
          fontWeight: 800,
          letterSpacing: -0.5,
        }}
      >
        zerocast
      </div>
    </div>
  );
}

function StatusPill({
  text,
  size = 14,
}: {
  text: string;
  size?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.7,
        padding: `${size * 0.5}px ${size * 1.1}px`,
        border: `1px solid ${COLOR.brand}40`,
        borderRadius: 999,
        color: COLOR.brandSoft,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: size * 0.18,
        textTransform: "uppercase",
      }}
    >
      <div
        style={{
          width: size * 0.45,
          height: size * 0.45,
          borderRadius: "50%",
          background: COLOR.brandSoft,
        }}
      />
      {text}
    </div>
  );
}

/* ── layouts ──────────────────────────────────────────────────────── */

function SquareLayout(props: {
  scene: SceneId;
  kicker: string;
  title: string;
  titleAccent: string;
  sub: string;
  w: number;
  h: number;
}) {
  const { kicker, title, titleAccent, sub, w, h } = props;
  const margin = Math.round(Math.min(w, h) * 0.065);
  const headingPx = Math.round(w * 0.082);
  return (
    <div
      style={{
        width: w,
        height: h,
        background: COLOR.surface,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: margin,
        position: "relative",
        color: COLOR.inkStrong,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <BrandGlow size={w * 0.85} />

      <div style={{ display: "flex", flexDirection: "column", gap: 40, zIndex: 1 }}>
        <Wordmark size={Math.round(w * 0.028)} />
        <StatusPill text={kicker} size={Math.round(w * 0.013)} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28, zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: headingPx,
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: -headingPx * 0.04,
          }}
        >
          <span>{title}</span>
          {titleAccent ? (
            <span
              style={{
                background: `linear-gradient(90deg, ${COLOR.brandSoft} 0%, ${COLOR.accentPurple} 100%)`,
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {titleAccent}
            </span>
          ) : null}
        </div>
        <div
          style={{
            color: COLOR.inkMuted,
            fontSize: Math.round(w * 0.022),
            lineHeight: 1.4,
            maxWidth: w * 0.78,
          }}
        >
          {sub}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          zIndex: 1,
        }}
      >
        <div
          style={{
            color: COLOR.inkFaint,
            fontSize: Math.round(w * 0.014),
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          zerocast.live
        </div>
        <PulseRing size={Math.round(w * 0.13)} stroke={2.5} />
      </div>
    </div>
  );
}

function OgLayout(props: {
  scene: SceneId;
  kicker: string;
  title: string;
  titleAccent: string;
  sub: string;
  w: number;
  h: number;
}) {
  const { kicker, title, titleAccent, sub, w, h } = props;
  const margin = Math.round(h * 0.1);
  const headingPx = Math.round(h * 0.13);
  return (
    <div
      style={{
        width: w,
        height: h,
        background: COLOR.surface,
        display: "flex",
        padding: margin,
        position: "relative",
        color: COLOR.inkStrong,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <BrandGlow size={h * 1.8} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          zIndex: 1,
          paddingRight: margin,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Wordmark size={Math.round(h * 0.05)} />
          <StatusPill text={kicker} size={Math.round(h * 0.022)} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: headingPx,
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: -headingPx * 0.04,
            }}
          >
            <span>{title}</span>
            {titleAccent ? (
              <span
                style={{
                  background: `linear-gradient(90deg, ${COLOR.brandSoft} 0%, ${COLOR.accentPurple} 100%)`,
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {titleAccent}
              </span>
            ) : null}
          </div>
          <div
            style={{
              color: COLOR.inkMuted,
              fontSize: Math.round(h * 0.034),
              lineHeight: 1.35,
              maxWidth: w * 0.55,
            }}
          >
            {sub}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 32,
          minWidth: w * 0.28,
          zIndex: 1,
        }}
      >
        <PulseRing size={Math.round(h * 0.5)} stroke={3} />
        <div
          style={{
            color: COLOR.inkFaint,
            fontSize: Math.round(h * 0.022),
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          zerocast.live
        </div>
      </div>
    </div>
  );
}

function StoryLayout(props: {
  scene: SceneId;
  kicker: string;
  title: string;
  titleAccent: string;
  sub: string;
  w: number;
  h: number;
}) {
  const { kicker, title, titleAccent, sub, w, h } = props;
  const margin = Math.round(w * 0.085);
  const headingPx = Math.round(w * 0.115);
  return (
    <div
      style={{
        width: w,
        height: h,
        background: COLOR.surface,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: margin,
        position: "relative",
        color: COLOR.inkStrong,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <BrandGlow size={w * 1.4} />

      <div style={{ display: "flex", flexDirection: "column", gap: 56, zIndex: 1 }}>
        <Wordmark size={Math.round(w * 0.038)} />
        <StatusPill text={kicker} size={Math.round(w * 0.018)} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 48, zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: headingPx,
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: -headingPx * 0.04,
          }}
        >
          <span>{title}</span>
          {titleAccent ? (
            <span
              style={{
                background: `linear-gradient(90deg, ${COLOR.brandSoft} 0%, ${COLOR.accentPurple} 100%)`,
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {titleAccent}
            </span>
          ) : null}
        </div>
        <div
          style={{
            color: COLOR.inkMuted,
            fontSize: Math.round(w * 0.032),
            lineHeight: 1.4,
            maxWidth: w * 0.86,
          }}
        >
          {sub}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            color: COLOR.inkFaint,
            fontSize: Math.round(w * 0.018),
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          <span>zerocast.live</span>
          <span style={{ color: COLOR.inkSubtle, letterSpacing: 1.5 }}>
            Browser-native multistream
          </span>
        </div>
        <PulseRing size={Math.round(w * 0.2)} stroke={3} />
      </div>
    </div>
  );
}

function BannerLayout(props: {
  scene: SceneId;
  kicker: string;
  title: string;
  titleAccent: string;
  sub: string;
  w: number;
  h: number;
}) {
  const { kicker, title, titleAccent, sub, w, h } = props;
  const margin = Math.round(h * 0.16);
  const headingPx = Math.round(h * 0.24);
  return (
    <div
      style={{
        width: w,
        height: h,
        background: COLOR.surface,
        display: "flex",
        alignItems: "center",
        padding: margin,
        position: "relative",
        color: COLOR.inkStrong,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <BrandGlow size={h * 3.2} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          zIndex: 1,
          minWidth: w * 0.22,
        }}
      >
        <Wordmark size={Math.round(h * 0.1)} />
        <StatusPill text={kicker} size={Math.round(h * 0.04)} />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 12,
          zIndex: 1,
          paddingLeft: margin,
          paddingRight: margin,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: headingPx,
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: -headingPx * 0.04,
          }}
        >
          <span>{title}</span>
          {titleAccent ? (
            <span
              style={{
                background: `linear-gradient(90deg, ${COLOR.brandSoft} 0%, ${COLOR.accentPurple} 100%)`,
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {titleAccent}
            </span>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            color: COLOR.inkFaint,
            fontSize: Math.round(h * 0.05),
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          zIndex: 1,
          minWidth: w * 0.18,
        }}
      >
        <PulseRing size={Math.round(h * 0.62)} stroke={3} />
      </div>
    </div>
  );
}

function PortraitLayout(props: {
  scene: SceneId;
  kicker: string;
  title: string;
  titleAccent: string;
  sub: string;
  w: number;
  h: number;
}) {
  // portrait = vertical-tall square, slightly more breath. Reuse SquareLayout proportions.
  return <SquareLayout {...props} />;
}

/* ── handler ──────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const variantParam = searchParams.get("variant");
  const sceneParam = searchParams.get("scene");

  const variant: VariantId = isVariant(variantParam) ? variantParam : "og";
  const scene: SceneId = isScene(sceneParam) ? sceneParam : "hero";

  const sceneData = SCENES[scene];
  const kicker = searchParams.get("kicker") ?? sceneData.kicker;
  const title = searchParams.get("title") ?? sceneData.title;
  const titleAccent =
    searchParams.get("accent") ?? sceneData.titleAccent;
  const sub = searchParams.get("sub") ?? sceneData.sub;

  const { w, h } = VARIANTS[variant];

  const layoutProps = { scene, kicker, title, titleAccent, sub, w, h };

  let element: React.ReactElement;
  switch (variant) {
    case "square":
      element = <SquareLayout {...layoutProps} />;
      break;
    case "og":
      element = <OgLayout {...layoutProps} />;
      break;
    case "story":
      element = <StoryLayout {...layoutProps} />;
      break;
    case "banner":
      element = <BannerLayout {...layoutProps} />;
      break;
    case "portrait":
      element = <PortraitLayout {...layoutProps} />;
      break;
  }

  return new ImageResponse(element, {
    width: w,
    height: h,
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
