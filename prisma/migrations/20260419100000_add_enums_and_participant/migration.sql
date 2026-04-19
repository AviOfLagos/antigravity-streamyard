-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('LOBBY', 'LIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "PlatformType" AS ENUM ('YOUTUBE', 'TWITCH', 'KICK', 'TIKTOK');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('HOST', 'GUEST');

-- AlterTable Room: convert status TEXT -> RoomStatus enum
-- Map old 'active' -> 'LOBBY', 'ended' -> 'ENDED', anything else -> 'LOBBY'
ALTER TABLE "Room" ADD COLUMN "status_new" "RoomStatus";
UPDATE "Room" SET "status_new" = CASE
  WHEN "status" = 'ended' THEN 'ENDED'::"RoomStatus"
  WHEN "status" = 'ENDED' THEN 'ENDED'::"RoomStatus"
  WHEN "status" = 'LIVE'  THEN 'LIVE'::"RoomStatus"
  ELSE 'LOBBY'::"RoomStatus"
END;
ALTER TABLE "Room" DROP COLUMN "status";
ALTER TABLE "Room" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "Room" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Room" ALTER COLUMN "status" SET DEFAULT 'LOBBY'::"RoomStatus";

-- AlterTable Room: drop selectedPlatforms TEXT[] and recreate as PlatformType[]
-- (Column was added in previous migration; no existing data to preserve)
ALTER TABLE "Room" DROP COLUMN IF EXISTS "selectedPlatforms";
ALTER TABLE "Room" ADD COLUMN "selectedPlatforms" "PlatformType"[] NOT NULL DEFAULT ARRAY[]::"PlatformType"[];

-- AlterTable PlatformConnection: convert platform TEXT -> PlatformType enum
ALTER TABLE "PlatformConnection" ADD COLUMN "platform_new" "PlatformType";
UPDATE "PlatformConnection" SET "platform_new" = UPPER("platform")::"PlatformType";
ALTER TABLE "PlatformConnection" DROP CONSTRAINT IF EXISTS "PlatformConnection_userId_platform_key";
ALTER TABLE "PlatformConnection" DROP COLUMN "platform";
ALTER TABLE "PlatformConnection" RENAME COLUMN "platform_new" TO "platform";
ALTER TABLE "PlatformConnection" ALTER COLUMN "platform" SET NOT NULL;
ALTER TABLE "PlatformConnection" ADD CONSTRAINT "PlatformConnection_userId_platform_key" UNIQUE ("userId", "platform");

-- CreateTable Participant
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Participant_roomId_idx" ON "Participant"("roomId");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
