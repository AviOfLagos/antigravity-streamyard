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

export async function removeParticipant(roomName: string, identity: string): Promise<void> {
  const svc = getRoomService()
  await svc.removeParticipant(roomName, identity)
}

export async function muteParticipantTrack(
  roomName: string,
  identity: string,
  trackSid: string,
  muted: boolean,
): Promise<void> {
  const svc = getRoomService()
  await svc.mutePublishedTrack(roomName, identity, trackSid, muted)
}

export async function listParticipants(roomName: string) {
  const svc = getRoomService()
  return svc.listParticipants(roomName)
}

// livekit-server-sdk v2.x: toJwt() is async — must be awaited.
// Previously cast as `string` with `as unknown as string` which silently
// passed an unresolved Promise to the LiveKit client, causing immediate disconnect.

export async function generateHostToken(
  roomCode: string,
  userId: string,
  userName: string,
): Promise<string> {
  const at = new AccessToken(apiKey, apiSecret, {
    identity: `host-${userId}`,
    name: userName,
    ttl: "10h",
  })
  at.addGrant({
    roomCreate: true,
    roomJoin: true,
    room: roomCode,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: true,
  })
  return at.toJwt()
}

export async function generateParticipantToken(
  roomCode: string,
  guestId: string,
  displayName: string,
): Promise<string> {
  const at = new AccessToken(apiKey, apiSecret, {
    identity: `guest-${guestId}`,
    name: displayName,
    ttl: "4h",
  })
  at.addGrant({
    roomJoin: true,
    room: roomCode,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })
  return at.toJwt()
}
