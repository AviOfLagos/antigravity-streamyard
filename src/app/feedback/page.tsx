"use client"

import Link from "next/link"
import { useState } from "react"
import { Bug, Lightbulb, MessageSquare, Send, Zap } from "lucide-react"

type FeedbackType = "bug" | "feature" | "other"

const feedbackTypes: { value: FeedbackType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "bug",
    label: "Bug Report",
    icon: <Bug className="w-5 h-5" />,
    description: "Something isn't working as expected",
  },
  {
    value: "feature",
    label: "Feature Request",
    icon: <Lightbulb className="w-5 h-5" />,
    description: "Suggest a new feature or improvement",
  },
  {
    value: "other",
    label: "General Feedback",
    icon: <MessageSquare className="w-5 h-5" />,
    description: "Any other feedback or questions",
  },
]

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>("bug")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    setSubmitting(true)

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title: title.trim(), description: description.trim(), email: email.trim() || undefined }),
      })

      if (res.ok) {
        setSubmitted(true)
      }
    } catch {
      // Silently fail — the form will stay visible so user can retry
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex flex-col">
        <Nav />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Send className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Thanks for your feedback!</h1>
            <p className="text-gray-400 mb-8">
              We&apos;ve received your {type === "bug" ? "bug report" : type === "feature" ? "feature request" : "feedback"} and will review it shortly.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-white border border-white/6 rounded-lg px-4 py-2 transition-colors hover:bg-white/[0.04]"
              >
                Back to home
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false)
                  setTitle("")
                  setDescription("")
                  setEmail("")
                }}
                className="text-sm text-violet-400 hover:text-violet-300 border border-violet-500/20 rounded-lg px-4 py-2 transition-colors hover:bg-violet-500/10"
              >
                Submit another
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col">
      <Nav />

      <main className="flex-1 px-6 py-16 max-w-2xl mx-auto w-full">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">Send Feedback</h1>
          <p className="text-gray-400">
            Found a bug? Have an idea? Let us know — we read every submission.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">What kind of feedback?</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {feedbackTypes.map((ft) => (
                <button
                  key={ft.value}
                  type="button"
                  onClick={() => setType(ft.value)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left ${
                    type === ft.value
                      ? "border-violet-500/40 bg-violet-500/10"
                      : "border-white/6 bg-[#111111] hover:border-white/10"
                  }`}
                >
                  <div className={`${type === ft.value ? "text-violet-400" : "text-gray-500"} transition-colors`}>
                    {ft.icon}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${type === ft.value ? "text-white" : "text-gray-300"}`}>
                      {ft.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{ft.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "bug" ? "e.g. Audio cuts out when switching layouts" : type === "feature" ? "e.g. Add screen share annotation tools" : "e.g. Suggestion about the dashboard"}
              required
              className="w-full bg-[#111111] border border-white/6 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === "bug" ? "Steps to reproduce:\n1. \n2. \n3. \n\nExpected behavior:\n\nActual behavior:" : type === "feature" ? "Describe the feature and why it would be useful..." : "Tell us what's on your mind..."}
              required
              rows={6}
              className="w-full bg-[#111111] border border-white/6 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-colors resize-y"
            />
          </div>

          {/* Email (optional) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email <span className="text-gray-600">(optional — if you want us to follow up)</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#111111] border border-white/6 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!title.trim() || !description.trim() || submitting}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
          >
            {submitting ? "Sending..." : "Submit Feedback"}
            {!submitting && <Send className="w-4 h-4" />}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <nav className="border-b border-white/6 px-6 py-4 flex items-center justify-between">
      <Link
        href="/"
        className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
      >
        <span aria-hidden>&larr;</span>
        Back to home
      </Link>
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-violet-400" />
        <span className="font-bold text-white text-lg">Zerocast</span>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/6 py-8 text-center text-gray-600 text-sm">
      &copy; 2026 Zerocast
    </footer>
  )
}
