import { PlatformType } from "@prisma/client"
import { EgressClient } from "livekit-server-sdk"
import { EncodingOptionsPreset, StreamOutput, StreamProtocol } from "@livekit/protocol"
import type { EgressInfo } from "@livekit/protocol"

// ── LiveKit env vars (same as livekit.ts) ──────────────────────────────────

const apiKey = process.env.LIVEKIT_API_KEY!
const apiSecret = process.env.LIVEKIT_API_SECRET!
const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!

// ── EgressClient singleton ─────────────────────────────────────────────────

let _egressClient: EgressClient | null = null

export function getEgressClient(): EgressClient {
  if (!_egressClient) {
    // EgressClient requires https:// URL, not wss://
    const httpUrl = livekitUrl.replace("wss://", "https://").replace("ws://", "http://")
    _egressClient = new EgressClient(httpUrl, apiKey, apiSecret)
  }
  return _egressClient
}

// ── RTMP URL builders ──────────────────────────────────────────────────────

const RTMP_INGEST_URLS: Record<string, string> = {
  YOUTUBE: "rtmp://a.rtmp.youtube.com/live2",
  TWITCH: "rtmp://live.twitch.tv/app",
  KICK: "rtmp://live.kick.com/app",
}

/**
 * Build the full RTMP URL for a given platform and stream key.
 * TikTok requires a user-provided ingest URL.
 */
export function buildRtmpUrl(
  platform: PlatformType,
  streamKey: string,
  ingestUrl?: string | null,
): string {
  if (platform === PlatformType.TIKTOK) {
    if (!ingestUrl) {
      throw new Error("TikTok requires a custom ingest URL")
    }
    return `${ingestUrl}/${streamKey}`
  }

  const baseUrl = RTMP_INGEST_URLS[platform]
  if (!baseUrl) {
    throw new Error(`Unsupported platform for RTMP: ${platform}`)
  }
  return `${baseUrl}/${streamKey}`
}

// ── Egress operations ──────────────────────────────────────────────────────

export interface StreamDestination {
  platform: PlatformType
  streamKey: string
  ingestUrl?: string | null
}

/**
 * Start a room composite egress to one or more RTMP destinations.
 * Returns the LiveKit egress ID and status string.
 */
export async function startStream(
  roomCode: string,
  destinations: StreamDestination[],
): Promise<{ egressId: string; status: string }> {
  if (destinations.length === 0) {
    throw new Error("At least one destination is required")
  }

  const urls = destinations.map((d) => buildRtmpUrl(d.platform, d.streamKey, d.ingestUrl))

  const output = new StreamOutput({
    protocol: StreamProtocol.RTMP,
    urls,
  })

  const client = getEgressClient()
  const info: EgressInfo = await client.startRoomCompositeEgress(roomCode, output, {
    layout: "grid",
    encodingOptions: EncodingOptionsPreset.H264_720P_30,
  })

  return {
    egressId: info.egressId,
    status: String(info.status),
  }
}

/**
 * Stop an active egress by ID.
 */
export async function stopStream(egressId: string): Promise<void> {
  const client = getEgressClient()
  await client.stopEgress(egressId)
}

/**
 * Add an RTMP destination to a running egress.
 */
export async function addDestination(
  egressId: string,
  platform: PlatformType,
  streamKey: string,
  ingestUrl?: string | null,
): Promise<void> {
  const url = buildRtmpUrl(platform, streamKey, ingestUrl)
  const client = getEgressClient()
  await client.updateStream(egressId, [url])
}

/**
 * Remove an RTMP destination from a running egress.
 */
export async function removeDestination(
  egressId: string,
  platform: PlatformType,
  streamKey: string,
  ingestUrl?: string | null,
): Promise<void> {
  const url = buildRtmpUrl(platform, streamKey, ingestUrl)
  const client = getEgressClient()
  await client.updateStream(egressId, undefined, [url])
}

/**
 * List active egress sessions for a room.
 */
export async function listActiveEgress(roomName: string): Promise<EgressInfo[]> {
  const client = getEgressClient()
  return client.listEgress({ roomName })
}
