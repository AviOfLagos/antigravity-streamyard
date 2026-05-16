-- AlterEnum
ALTER TYPE "PlatformType" ADD VALUE 'TWITTER';

-- AlterTable
ALTER TABLE "BetaRequest" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "landingPage" TEXT,
ADD COLUMN     "posthogDistinctId" TEXT,
ADD COLUMN     "referrer" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmContent" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT,
ADD COLUMN     "utmTerm" TEXT;

-- CreateTable
CREATE TABLE "RateLimitHit" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "limiterType" TEXT NOT NULL,
    "route" TEXT,
    "method" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitHit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimitHit_identifier_idx" ON "RateLimitHit"("identifier");

-- CreateIndex
CREATE INDEX "RateLimitHit_limiterType_idx" ON "RateLimitHit"("limiterType");

-- CreateIndex
CREATE INDEX "RateLimitHit_createdAt_idx" ON "RateLimitHit"("createdAt");

-- CreateIndex
CREATE INDEX "BetaRequest_utmSource_idx" ON "BetaRequest"("utmSource");

-- CreateIndex
CREATE INDEX "BetaRequest_utmCampaign_idx" ON "BetaRequest"("utmCampaign");

-- CreateIndex
CREATE INDEX "BetaRequest_country_idx" ON "BetaRequest"("country");
