import type { Metadata } from "next";
import { UseCaseTemplate } from "@/components/seo/UseCaseTemplate";

export const metadata: Metadata = {
  title: "Live Streaming for Churches and Faith Communities",
  description:
    "Stream services to YouTube, Facebook Live, and your church website simultaneously. Zerocast handles the broadcast — volunteers don't need an AV degree.",
  alternates: { canonical: "/use-cases/churches" },
};

export default function ChurchesPage() {
  return (
    <UseCaseTemplate
      kicker="For Churches"
      headline={<>Sunday service.<br /><span className="text-neutral-600">On every screen.</span></>}
      intro="Stream worship to YouTube Live, Facebook Live, and your church website at the same time — without an AV booth or a degree in OBS. Zerocast handles the production. Your volunteers handle the message."
      painPoints={[
        { title: "AV volunteers are scarce", body: "Most churches rely on one or two volunteers who learned OBS the hard way. When they're out, the stream is at risk." },
        { title: "Multiple platforms, one service", body: "Your congregation is split across YouTube, Facebook, and the church website. Most tools force you to pick one." },
        { title: "Online attendees feel forgotten", body: "Hybrid services are common but online viewers rarely get acknowledged. Engagement stays low; donations follow." },
      ]}
      features={[
        { label: "One-tap go-live for volunteers", desc: "Plug in a camera, click a saved studio preset. No scene graphs, no encoder settings — Zerocast picks the right layout automatically." },
        { label: "Stream to YouTube + Facebook + website", desc: "Multistream to your YouTube channel and Facebook Page simultaneously. Embed the live player on your church website via the same broadcast." },
        { label: "AI Co-Host welcomes online viewers", desc: "The AI greets newcomers ('Welcome, first-timers — drop a hi 👋'), responds to prayer requests with a templated reply, and surfaces high-priority comments for a human moderator." },
        { label: "Multi-camera + lower-thirds", desc: "Switch between cameras with one click. Add scripture references or song titles as on-screen text overlays without restarting the stream." },
        { label: "Cloud recording for the website", desc: "Every service auto-records. Upload the recording to your sermon archive within minutes of the closing prayer." },
      ]}
      faqs={[
        { q: "Do volunteers need training?", a: "Less than 20 minutes. The interface is designed for non-technical operators. We've onboarded churches whose only AV person had previously only used an iPhone." },
        { q: "Can we stream from our existing camera/audio setup?", a: "Yes. Any USB or HDMI-via-capture-card camera works. For pro audio boards, use the audio interface as a standard input device." },
        { q: "Is there a discount for non-profits?", a: "Yes. 50% off all paid tiers for verified 501(c)(3) and equivalent. Contact us during beta to get this set up." },
        { q: "Can the AI mention donation links?", a: "Yes. Train it on your standard donation messaging and it'll prompt online viewers at natural moments (offering, end of service)." },
      ]}
    />
  );
}
