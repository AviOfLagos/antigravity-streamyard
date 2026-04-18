import { startTwitchConnector, stopTwitchConnector } from "./twitch"
import { startYouTubeConnector, stopYouTubeConnector } from "./youtube"
import { startKickConnector, stopKickConnector } from "./kick"
import { startTikTokConnector, stopTikTokConnector } from "./tiktok"

export interface PlatformConnectionData {
  platform: string
  channelName: string
  accessToken?: string | null
}

export async function startConnectors(roomCode: string, platforms: PlatformConnectionData[]) {
  const promises = platforms.map(async (p) => {
    try {
      if (p.platform === "twitch") {
        await startTwitchConnector(roomCode, p.channelName)
      } else if (p.platform === "youtube" && p.accessToken) {
        await startYouTubeConnector(roomCode, p.accessToken)
      } else if (p.platform === "kick") {
        await startKickConnector(roomCode, p.channelName)
      } else if (p.platform === "tiktok") {
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
