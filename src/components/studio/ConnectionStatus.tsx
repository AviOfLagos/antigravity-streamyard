"use client"

import { useConnectionState } from "@livekit/components-react"
import { ConnectionState } from "livekit-client"

/**
 * F-12: Connection quality indicator for the studio header.
 * Green dot = connected, Yellow dot + "Reconnecting..." = reconnecting,
 * Red dot + "Disconnected" = disconnected.
 * Must be rendered inside a LiveKitRoom context.
 */
export default function ConnectionStatus() {
  const state = useConnectionState()

  if (state === ConnectionState.Connected) {
    return (
      <div className="absolute top-1 right-1 z-30 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_theme(colors.emerald.400)]" />
        <span className="text-[10px] text-emerald-300 font-medium">Connected</span>
      </div>
    )
  }

  if (state === ConnectionState.Reconnecting) {
    return (
      <div className="absolute top-1 right-1 z-30 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_4px_theme(colors.yellow.400)]" />
        <span className="text-[10px] text-yellow-300 font-medium">Reconnecting...</span>
      </div>
    )
  }

  if (state === ConnectionState.Disconnected) {
    return (
      <div className="absolute top-1 right-1 z-30 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_4px_theme(colors.red.400)]" />
        <span className="text-[10px] text-red-300 font-medium">Disconnected</span>
      </div>
    )
  }

  // Connecting state — show subtle indicator
  if (state === ConnectionState.Connecting) {
    return (
      <div className="absolute top-1 right-1 z-30 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_4px_theme(colors.violet.400)]" />
        <span className="text-[10px] text-violet-300 font-medium">Connecting...</span>
      </div>
    )
  }

  return null
}
