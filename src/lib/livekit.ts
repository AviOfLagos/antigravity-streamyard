import { AccessToken, RoomServiceClient } from "livekit-server-sdk"

const apiKey = process.env.LIVEKIT_API_KEY!
const apiSecret = process.env.LIVEKIT_API_SECRET!
const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!

function getRoomService() {
  // LiveKit URL is wss:// for client, https:// for server SDK
  const httpUrl = livekitUrl.replace("wss://", "https://").replace("ws://", "http://")
  return new RoomServiceClient(httpUrl, apiKey, apiSecret)
}

export async function createLivekitRoom(roomName: string) {
  const svc = getRoomService()
  return svc.createRoom({ name: roomName, emptyTimeout: 300, maxParticipants: 6 })
}

export async function closeLivekitRoom(roomName: string) {
  try {
    const svc = getRoomService()
    await svc.deleteRoom(roomName)
  } catch {
    // Room may already be closed
  }
}

export async function getParticipantCount(roomName: string): Promise<number> {
  try {
    const svc = getRoomService()
    const participants = await svc.listParticipants(roomName)
    return participants.length
  } catch {
    return 0
  }
}

export function generateHostToken(roomCode: string, userId: string, userName: string): string {
  const at = new AccessToken(apiKey, apiSecret, {
    identity: `host-${userId}`,
    name: userName,
  })
  at.addGrant({
    roomCreate: true,
    roomJoin: true,
    room: roomCode,
    canPublish: true,
    canSubscribe: true,
  })
  return at.toJwt() as unknown as string
}

export function generateParticipantToken(roomCode: string, guestId: string, displayName: string): string {
  const at = new AccessToken(apiKey, apiSecret, {
    identity: `guest-${guestId}`,
    name: displayName,
  })
  at.addGrant({
    roomJoin: true,
    room: roomCode,
    canPublish: true,
    canSubscribe: true,
  })
  return at.toJwt() as unknown as string
}
