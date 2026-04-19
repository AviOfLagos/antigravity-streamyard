"use client"

import React from "react"

interface StudioErrorBoundaryProps {
  roomCode: string
  children: React.ReactNode
}

interface StudioErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class StudioErrorBoundary extends React.Component<
  StudioErrorBoundaryProps,
  StudioErrorBoundaryState
> {
  constructor(props: StudioErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): StudioErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[StudioErrorBoundary] room=${this.props.roomCode}`,
      error,
      errorInfo.componentStack
    )
  }

  handleRejoin = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
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
              The studio encountered an error. You can try rejoining to restore
              your session.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleRejoin}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                Rejoin Studio
              </button>
              <a
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-white/6 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
              >
                Back to Dashboard
              </a>
            </div>
            {this.state.error && (
              <p className="mt-6 text-[10px] text-gray-700 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
