-- CreateEnum
CREATE TYPE "StreamStatus" AS ENUM ('STARTING', 'LIVE', 'STOPPING', 'ENDED', 'FAILED');

-- AlterTable PlatformConnection: add streamKey and ingestUrl
ALTER TABLE "PlatformConnection" ADD COLUMN "streamKey" TEXT;
ALTER TABLE "PlatformConnection" ADD COLUMN "ingestUrl" TEXT;

-- CreateTable StreamSession
CREATE TABLE "StreamSession" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "egressId" TEXT,
    "platforms" "PlatformType"[] NOT NULL DEFAULT ARRAY[]::"PlatformType"[],
    "status" "StreamStatus" NOT NULL DEFAULT 'STARTING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "StreamSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StreamSession_egressId_key" ON "StreamSession"("egressId");
CREATE INDEX "StreamSession_roomId_idx" ON "StreamSession"("roomId");

-- AddForeignKey
ALTER TABLE "StreamSession" ADD CONSTRAINT "StreamSession_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
