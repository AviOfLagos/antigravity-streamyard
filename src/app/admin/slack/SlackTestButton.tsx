"use client";

import { useState } from "react";
import {
  Send,
  CheckCircle2,
  XCircle,
  CircleSlash,
  Loader2,
} from "lucide-react";

type ChannelKey = "beta-signups" | "streams" | "alerts" | "digest";

type Status = "idle" | "pending" | "sent" | "failed" | "not-configured";

export function SlackTestButton({
  channel,
  configured,
}: {
  channel: ChannelKey;
  configured: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");

  async function fire() {
    if (status === "pending") return;
    setStatus("pending");
    try {
      const res = await fetch("/api/admin/slack-test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        reason?: string;
      };
      if (!res.ok) {
        setStatus("failed");
      } else if (data.reason === "webhook_unset") {
        setStatus("not-configured");
      } else if (data.ok) {
        setStatus("sent");
      } else {
        setStatus("failed");
      }
    } catch {
      setStatus("failed");
    }
    // Auto-reset after 4s so the button can be pressed again.
    setTimeout(() => setStatus("idle"), 4000);
  }

  const label = (() => {
    switch (status) {
      case "pending":
        return "Sending…";
      case "sent":
        return "Sent";
      case "failed":
        return "Failed";
      case "not-configured":
        return "Not configured";
      default:
        return "Send test";
    }
  })();

  const Icon = (() => {
    switch (status) {
      case "pending":
        return Loader2;
      case "sent":
        return CheckCircle2;
      case "failed":
        return XCircle;
      case "not-configured":
        return CircleSlash;
      default:
        return Send;
    }
  })();

  const toneClass = (() => {
    switch (status) {
      case "sent":
        return "text-brand-soft border-brand/30 bg-brand/10";
      case "failed":
        return "text-red-300 border-red-500/30 bg-red-500/10";
      case "not-configured":
        return "text-ink-faint border-white/8 bg-white/5";
      case "pending":
        return "text-ink-muted border-white/8 bg-white/5";
      default:
        return configured
          ? "text-white border-white/8 bg-white/5 hover:bg-white/8 hover:border-brand/30"
          : "text-ink-faint border-white/8 bg-white/5 cursor-not-allowed";
    }
  })();

  return (
    <button
      type="button"
      onClick={fire}
      disabled={!configured || status === "pending"}
      aria-label={`Send Slack test message to ${channel}`}
      className={[
        "inline-flex items-center gap-2 w-full justify-center px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border",
        toneClass,
      ].join(" ")}
    >
      <Icon
        size={12}
        className={status === "pending" ? "animate-spin" : undefined}
      />
      {label}
    </button>
  );
}
