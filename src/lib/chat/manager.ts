import { PlatformType } from "@prisma/client"

import { startTwitchConnector, stopTwitchConnector } from "./twitch"
import { startYouTubeConnector, stopYouTubeConnector } from "./youtube"
import { startKickConnector, stopKickConnector } from "./kick"
import { startTikTokConnector, stopTikTokConnector } from "./tiktok"

export interface PlatformConnectionData {
  platform: string | PlatformType
  channelName: string
  accessToken?: string | null
}

export async function startConnectors(roomCode: string, platforms: PlatformConnectionData[]) {
  const promises = platforms.map(async (p) => {
    // Normalize platform to uppercase for enum comparison
    const plat = (typeof p.platform === "string" ? p.platform.toUpperCase() : p.platform) as string
    try {
      if (plat === PlatformType.TWITCH) {
        await startTwitchConnector(roomCode, p.channelName)
      } else if (plat === PlatformType.YOUTUBE && p.accessToken) {
        await startYouTubeConnector(roomCode, p.accessToken)
      } else if (plat === PlatformType.KICK) {
        await startKickConnector(roomCode, p.channelName)
      } else if (plat === PlatformType.TIKTOK) {
        await startTikTokConnector(roomCode, p.channelName)
      }
    } catch (err) {
      console.error(`[ChatManager] Failed to start ${p.platform} connector:`, err)
    }
  })
  await Promise.allSettled(promises)
}

export async function stopConnectors(roomCode: string) {
  await Promise.allSettled([
    stopTwitchConnector(roomCode),
    stopYouTubeConnector(roomCode),
    stopKickConnector(roomCode),
    stopTikTokConnector(roomCode),
  ])
}
