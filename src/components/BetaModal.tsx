"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { LAUNCH_OPEN } from "@/lib/launch";
import { captureAttribution, getAttribution, clearAttribution } from "@/lib/attribution";

type Status = "idle" | "loading" | "success" | "duplicate" | "error";

// Map a path to a stable, low-cardinality source label for analytics.
// Keeps the property values within the doc taxonomy enum surface.
function pathnameToSource(pathname: string): string {
  if (pathname === "/" || pathname === "") return "homepage";
  const slug = pathname.replace(/^\/+/, "").replace(/\/+$/, "").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  return slug.slice(0, 60) || "homepage";
}

function BetaModalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const prevOpenRef = useRef(false);
  const focusedFieldsRef = useRef<Set<string>>(new Set());
  const hadInputRef = useRef(false);
  const dismissMethodRef = useRef<string | null>(null);

  useEffect(() => {
    const shouldOpen = searchParams.get("beta") === "true";

    // Launch-open mode: every ?beta=true link short-circuits to /login
    // instead of capturing a wait-list row. Existing CTAs keep working
    // without per-call-site changes. See src/lib/launch.ts.
    if (shouldOpen && LAUNCH_OPEN) {
      posthog.capture("launch_signup_redirect", {
        source: pathnameToSource(window.location.pathname),
      });
      router.replace("/login");
      return;
    }

    if (shouldOpen && !prevOpenRef.current) {
      // open transition: false -> true
      focusedFieldsRef.current = new Set();
      hadInputRef.current = false;
      dismissMethodRef.current = null;
      // Refresh attribution from the current URL right before we read it at
      // submit time. Idempotent + SSR-safe per @/lib/attribution contract.
      captureAttribution();
      posthog.capture("beta_modal_opened", {
        source: pathnameToSource(window.location.pathname),
      });
    }
    prevOpenRef.current = shouldOpen;
    setOpen(shouldOpen);
  }, [searchParams, router]);

  // Capture Escape-key dismissal so dismiss_method can distinguish it from
  // overlay-click / X-button (Radix doesn't surface those discretely).
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissMethodRef.current = "escape_key";
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // dismiss_method precedence:
      //   "completed"   — auto-close after successful submit
      //   "escape_key"  — set by keydown listener above
      //   "overlay_or_x"— Radix-driven close path we can't distinguish without
      //                   patching the DialogContent primitive; documented as deviation.
      let dismissMethod = dismissMethodRef.current;
      if (!dismissMethod) {
        dismissMethod = status === "success" || status === "duplicate" ? "completed" : "overlay_or_x";
      }
      posthog.capture("beta_modal_closed", {
        dismiss_method: dismissMethod,
        had_input: hadInputRef.current,
      });
    }
    setOpen(newOpen);
    if (!newOpen) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("beta");
      router.push(newUrl.pathname + newUrl.search, { scroll: false });
      // Reset after close animation
      setTimeout(() => setStatus("idle"), 300);
    }
  };

  const handleFieldFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const field = e.currentTarget.name;
    if (!field || focusedFieldsRef.current.has(field)) return;
    focusedFieldsRef.current.add(field);
    posthog.capture("beta_modal_field_focused", { field_name: field });
  };

  const handleFieldInput = () => {
    hadInputRef.current = true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string | null) ?? "";
    const email = (formData.get("email") as string | null) ?? "";
    const platform = (formData.get("platform") as string | null) ?? "";
    const painPoint = (formData.get("painPoint") as string | null) ?? "";

    const attribution = getAttribution();
    const posthogDistinctId = posthog.get_distinct_id();

    const data = {
      name,
      email,
      platform,
      painPoint,
      ...attribution,
      posthogDistinctId,
    };

    posthog.capture("beta_modal_submitted", {
      has_email: email.length > 0,
      has_name: name.length > 0,
      use_case_length: painPoint.length,
    });

    try {
      const res = await fetch("/api/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 409) {
        posthog.capture("beta_modal_duplicate");
        setStatus("duplicate");
      } else if (res.ok) {
        const json: { id?: string } = await res.json().catch(() => ({}));
        posthog.capture("beta_modal_success", {
          lead_id: json.id,
        });
        // Wipe attribution so future submissions from the same browser (e.g.
        // a second email) don't echo stale UTMs. Only on true success — NOT
        // on 409 duplicate (already captured) or any error (preserve for retry).
        clearAttribution();
        setStatus("success");
      } else {
        const json: { error?: string } = await res.json().catch(() => ({}));
        setErrorMsg(json.error || "Something went wrong.");
        posthog.capture("beta_modal_error", {
          status_code: res.status,
          error_code: res.status >= 500 ? "server" : "validation",
        });
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      posthog.capture("beta_modal_error", {
        status_code: 0,
        error_code: "network",
      });
      setStatus("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-surface-1 border border-white/10 text-white p-0 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-40 bg-brand/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-8">
          {status === "success" ? (
            <div className="py-4 text-center">
              <div className="mx-auto w-16 h-16 bg-success/10 text-success-text rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-3">You&apos;re on the list.</h2>
              <p className="text-ink-muted text-sm leading-relaxed">
                We&apos;ll reach out soon with your exclusive invite link. Stay close.
              </p>
            </div>
          ) : status === "duplicate" ? (
            <div className="py-4 text-center">
              <div className="mx-auto w-16 h-16 bg-brand/10 text-brand-soft rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-3">Already signed up!</h2>
              <p className="text-ink-muted text-sm leading-relaxed">
                You&apos;re already on the list. We&apos;ll be in touch soon.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black tracking-tight">Join the Private Beta</DialogTitle>
                <DialogDescription className="text-ink-subtle text-sm">
                  Shape the future of AI-automated streaming.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">Name</label>
                    <input
                      name="name"
                      required
                      type="text"
                      placeholder="Jane Doe"
                      onFocus={handleFieldFocus}
                      onChange={handleFieldInput}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-ink-faint focus:outline-none focus:border-brand/60 focus:bg-white/8 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">Email</label>
                    <input
                      name="email"
                      required
                      type="email"
                      placeholder="jane@example.com"
                      onFocus={handleFieldFocus}
                      onChange={handleFieldInput}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-ink-faint focus:outline-none focus:border-brand/60 focus:bg-white/8 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">Primary Platform</label>
                  <select
                    name="platform"
                    onFocus={handleFieldFocus}
                    onChange={handleFieldInput}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand/60 transition-all appearance-none"
                  >
                    <option value="YouTube Live">YouTube Live</option>
                    <option value="Twitch">Twitch</option>
                    <option value="Kick">Kick</option>
                    <option value="TikTok Live">TikTok Live</option>
                    <option value="Multiple / Other">Multiple / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider">
                    Biggest streaming pain point? <span className="text-ink-fainter normal-case tracking-normal">(optional)</span>
                  </label>
                  <textarea
                    name="painPoint"
                    rows={2}
                    placeholder="e.g. Managing chat while interviewing guests is impossible..."
                    onFocus={handleFieldFocus}
                    onChange={handleFieldInput}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-ink-faint focus:outline-none focus:border-brand/60 focus:bg-white/8 transition-all resize-none"
                  />
                </div>

                {status === "error" && (
                  <div className="flex items-center gap-2 text-danger-text text-xs bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                    <AlertCircle size={14} />
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white text-ink-inverse px-4 py-3 text-sm font-bold hover:bg-brand-on-light transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Request Access
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-ink-faint">
                  No spam, ever. Read our{" "}
                  <a href="/privacy" className="text-ink-subtle hover:text-white transition-colors underline underline-offset-2">
                    privacy policy
                  </a>
                  .
                </p>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BetaModal() {
  return (
    <Suspense fallback={null}>
      <BetaModalContent />
    </Suspense>
  );
}
