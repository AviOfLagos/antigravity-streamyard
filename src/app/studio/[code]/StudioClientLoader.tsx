"use client"

import dynamic from "next/dynamic"

// F-04: Dynamic import keeps LiveKit (~400KB) out of the initial page bundle.
// ssr: false is required because LiveKit depends on browser APIs.
const StudioClient = dynamic(() => import("./StudioClient"), { ssr: false })

interface StudioClientLoaderProps {
  roomCode: string
  hostToken: string
  livekitUrl: string
  title?: string
  description?: string
  connectedPlatforms?: { platform: string; channelName: string }[]
}

export default function StudioClientLoader(props: StudioClientLoaderProps) {
  return <StudioClient {...props} />
}
