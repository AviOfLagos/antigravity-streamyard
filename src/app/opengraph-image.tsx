import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Zerocast — AI-Powered Live Streaming Studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.35), transparent), #080808",
          color: "white",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "20px",
            color: "#a5b4fc",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "9999px",
              background: "#a5b4fc",
            }}
          />
          ZEROCAST
        </div>
        <div
          style={{
            fontSize: "96px",
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: "-0.04em",
            marginBottom: "32px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Don&apos;t just stream.</span>
          <span
            style={{
              background: "linear-gradient(90deg, #a5b4fc, #c4b5fd)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Co-host with AI.
          </span>
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "#a3a3a3",
            maxWidth: "880px",
            lineHeight: 1.4,
          }}
        >
          Browser-based live streaming studio. Multistream to YouTube, Twitch, Kick, and TikTok with an AI Co-Host that runs your chat.
        </div>
      </div>
    ),
    { ...size },
  );
}
