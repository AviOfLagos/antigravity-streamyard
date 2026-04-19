"use client"

/**
 * F-12: Next.js app-level error boundary for the studio route.
 * Catches errors that escape the StudioErrorBoundary (e.g., error in
 * error boundary itself, or server component errors).
 */
export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center h-dvh bg-[#0d0d0d]">
      <div className="text-center px-6 max-w-md">
        <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-white font-semibold text-lg mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          The studio encountered an unexpected error. You can try again or return to the dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-white/6 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
        {error?.message && (
          <p className="mt-6 text-[10px] text-gray-700 font-mono break-all">
            {error.message}
          </p>
        )}
      </div>
    </div>
  )
}
