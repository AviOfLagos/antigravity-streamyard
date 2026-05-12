"use client";

import { useEffect } from "react";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[marketing/error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-4">
        Something went wrong
      </p>
      <h1 className="font-black text-white text-3xl mb-6">
        We hit a snag rendering this page.
      </h1>
      <button
        onClick={reset}
        className="bg-white text-black font-bold px-6 py-3 rounded-full hover:bg-ink-emphasis transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
