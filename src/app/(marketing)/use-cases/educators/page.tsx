import type { Metadata } from "next";
import { UseCaseTemplate } from "@/components/seo/UseCaseTemplate";

export const metadata: Metadata = {
  title: "Live Streaming for Educators and Online Teachers",
  description:
    "Run live lessons, workshops, and Q&As from any browser. Multistream classes to YouTube, Twitch, and custom destinations while an AI moderates student questions.",
  alternates: { canonical: "/use-cases/educators" },
};

export default function EducatorsPage() {
  return (
    <UseCaseTemplate
      kicker="For Educators"
      headline={<>Teach live.<br /><span className="text-ink-faint">Without a producer.</span></>}
      intro="Whether you're running a Friday Q&A, a paid cohort workshop, or a free YouTube tutorial — Zerocast lets you screen-share, host up to 5 students on stage, and broadcast everywhere at once. The AI Co-Host moderates chat so you can focus on teaching."
      painPoints={[
        { title: "Zoom is a black box", body: "Zoom does interviews, not broadcasts. You can't multistream to YouTube and Twitch without a clunky workaround." },
        { title: "Chat overwhelm in big classes", body: "200+ students typing questions while you're mid-demo is impossible to moderate alone." },
        { title: "Recordings lose engagement", body: "Half of what makes a live class valuable is real-time response — and that disappears in a replay." },
      ]}
      features={[
        { label: "Screen share with one click", desc: "Code demos, slide decks, drawing pads — share any window or full screen. Auto-layout switches to screen-priority when you do." },
        { label: "Up to 5 students on stage", desc: "Bring students up for live questions, then send them back to the audience with one click." },
        { label: "AI answers FAQs in your voice", desc: "Train the AI on your past chat logs and lesson FAQs. It handles repeat questions ('what software are you using?', 'will this be recorded?') so you don't have to." },
        { label: "Broadcast to YouTube Live + custom RTMP", desc: "Reach your YouTube subscribers while simultaneously pushing to your LMS, school Wowza server, or other custom destination." },
        { label: "Cloud recording for replay", desc: "Every session is recorded automatically. Share the replay link or upload to your course platform." },
      ]}
      faqs={[
        { q: "Can students join from a school-managed Chromebook?", a: "Yes. Zerocast runs in any modern browser — no extensions, no installs, no admin approvals. Tested on managed Chrome OS deployments." },
        { q: "Is this FERPA / GDPR compliant?", a: "Sessions are encrypted in transit (WebRTC + TLS). For formal compliance certifications, contact us — we work with several universities on this." },
        { q: "Can I gate the broadcast to paid students?", a: "Yes, via custom RTMP. Push from Zerocast to a private streaming endpoint on your LMS instead of (or in addition to) public platforms." },
        { q: "Does the AI grade or evaluate?", a: "No. The AI's role is moderation and chat replies during live sessions only. It does not handle assessments or grading." },
      ]}
    />
  );
}
