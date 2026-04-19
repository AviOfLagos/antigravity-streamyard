-- AlterTable
ALTER TABLE "Room" ADD COLUMN "title" TEXT;
ALTER TABLE "Room" ADD COLUMN "selectedPlatforms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
