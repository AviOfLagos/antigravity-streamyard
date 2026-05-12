"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "success" | "duplicate" | "error";

function BetaModalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (searchParams.get("beta") === "true") {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [searchParams]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("beta");
      router.push(newUrl.pathname + newUrl.search, { scroll: false });
      // Reset after close animation
      setTimeout(() => setStatus("idle"), 300);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      platform: formData.get("platform"),
      painPoint: formData.get("painPoint"),
    };

    try {
      const res = await fetch("/api/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 409) {
        setStatus("duplicate");
      } else if (res.ok) {
        setStatus("success");
      } else {
        const json = await res.json();
        setErrorMsg(json.error || "Something went wrong.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-neutral-950 border border-white/10 text-white p-0 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-8">
          {status === "success" ? (
            <div className="py-4 text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-3">You&apos;re on the list.</h2>
              <p className="text-neutral-400 text-sm leading-relaxed">
                We&apos;ll reach out soon with your exclusive invite link. Stay close.
              </p>
            </div>
          ) : status === "duplicate" ? (
            <div className="py-4 text-center">
              <div className="mx-auto w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-3">Already signed up!</h2>
              <p className="text-neutral-400 text-sm leading-relaxed">
                You&apos;re already on the list. We&apos;ll be in touch soon.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black tracking-tight">Join the Private Beta</DialogTitle>
                <DialogDescription className="text-neutral-500 text-sm">
                  Shape the future of AI-automated streaming.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">Name</label>
                    <input
                      name="name"
                      required
                      type="text"
                      placeholder="Jane Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">Email</label>
                    <input
                      name="email"
                      required
                      type="email"
                      placeholder="jane@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">Primary Platform</label>
                  <select
                    name="platform"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-all appearance-none"
                  >
                    <option value="YouTube Live">YouTube Live</option>
                    <option value="Twitch">Twitch</option>
                    <option value="Kick">Kick</option>
                    <option value="TikTok Live">TikTok Live</option>
                    <option value="Multiple / Other">Multiple / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                    Biggest streaming pain point? <span className="text-neutral-700 normal-case tracking-normal">(optional)</span>
                  </label>
                  <textarea
                    name="painPoint"
                    rows={2}
                    placeholder="e.g. Managing chat while interviewing guests is impossible..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-all resize-none"
                  />
                </div>

                {status === "error" && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertCircle size={14} />
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white text-neutral-950 px-4 py-3 text-sm font-bold hover:bg-indigo-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
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

                <p className="text-center text-xs text-neutral-600">
                  No spam, ever. Read our{" "}
                  <a href="/privacy" className="text-neutral-500 hover:text-white transition-colors underline underline-offset-2">
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
