/**
 * Creates a demo room bypassing web auth.
 * Provisions: LiveKit room + Neon DB row + Redis keys
 * Usage: node scripts/create-demo-room.mjs
 */

import { Redis } from '@upstash/redis'
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'
import pg from 'pg'

// ── Credentials (read from .env.local) ──────────────────────────────────────
const LIVEKIT_API_KEY    = 'APIuyNKDue62joa'
const LIVEKIT_API_SECRET = 'DXlk97GmfSfY1ffmnUdSURp5HN7nj7rjaCbo5VkNOzrC'
const LIVEKIT_URL        = 'https://stream-1e8morub.livekit.cloud'
const DB_URL             = 'postgresql://neondb_owner:npg_WXsajGm2JE7f@ep-summer-lab-amu5f58l-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require'
const REDIS_URL          = 'https://enabled-hare-101224.upstash.io'
const REDIS_TOKEN        = 'gQAAAAAAAYtoAAIocDIxNTU4OWZhZmFkMDM0MWRiYmYyODFlOTg2YjAyYzE4NHAyMTAxMjI0'
const BASE_URL           = 'https://zerocast.vercel.app'

// ── Room code ────────────────────────────────────────────────────────────────
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const roomCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
const DEMO_HOST_ID = 'demo-host-001'

// ── LiveKit ──────────────────────────────────────────────────────────────────
const roomSvc = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
await roomSvc.createRoom({ name: roomCode, maxParticipants: 6, emptyTimeout: 300 })

const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
  identity: DEMO_HOST_ID,
  name: 'Host',
  ttl: '4h',
})
at.addGrant({ room: roomCode, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true, roomAdmin: true })
const hostToken = await at.toJwt()

// ── Neon DB ──────────────────────────────────────────────────────────────────
const db = new pg.Client({ connectionString: DB_URL })
await db.connect()

// Upsert demo user
await db.query(`
  INSERT INTO "User" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
  VALUES ($1, $2, $3, NOW(), NULL, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING
`, [DEMO_HOST_ID, 'Demo Host', 'demo@zerocast.vercel.app'])

// Insert room
const roomId = `demo-room-${Date.now()}`
await db.query(`
  INSERT INTO "Room" (id, code, "hostId", status, "createdAt")
  VALUES ($1, $2, $3, 'active', NOW())
  ON CONFLICT (code) DO UPDATE SET status = 'active'
`, [roomId, roomCode, DEMO_HOST_ID])

await db.end()

// ── Redis ────────────────────────────────────────────────────────────────────
const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN })
const TTL = 60 * 60 * 4 // 4 hours
await redis.set(`room:${roomCode}:info`, JSON.stringify({ code: roomCode, hostId: DEMO_HOST_ID }), { ex: TTL })

// ── Output ───────────────────────────────────────────────────────────────────
const studioUrl = `${BASE_URL}/demo/${roomCode}?token=${hostToken}`
const joinUrl   = `${BASE_URL}/join/${roomCode}`

console.log('\n✅ Demo room created!\n')
console.log(`  Room code : ${roomCode}`)
console.log(`\n  🎙  Host studio (open in your browser):`)
console.log(`  ${studioUrl}\n`)
console.log(`  🔗 Guest join link (share this):`)
console.log(`  ${joinUrl}\n`)
