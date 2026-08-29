CREATE TABLE IF NOT EXISTS "PublicUserProfile" (
  "id" TEXT NOT NULL,
  "email" TEXT,
  "displayName" TEXT,
  "username" TEXT,
  "avatarUrl" TEXT,
  "favoriteTeamId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublicUserProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MatchPrediction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "weekKey" TEXT NOT NULL,
  "predictedHomeScore" INTEGER NOT NULL,
  "predictedAwayScore" INTEGER NOT NULL,
  "awardedPoints" INTEGER NOT NULL DEFAULT 0,
  "exactScore" BOOLEAN NOT NULL DEFAULT false,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "scoredAt" TIMESTAMP(3),
  CONSTRAINT "MatchPrediction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PublicUserProfile_email_key" ON "PublicUserProfile"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "PublicUserProfile_username_key" ON "PublicUserProfile"("username");
CREATE INDEX IF NOT EXISTS "PublicUserProfile_username_idx" ON "PublicUserProfile"("username");
CREATE INDEX IF NOT EXISTS "PublicUserProfile_favoriteTeamId_idx" ON "PublicUserProfile"("favoriteTeamId");

CREATE UNIQUE INDEX IF NOT EXISTS "MatchPrediction_userId_matchId_key" ON "MatchPrediction"("userId", "matchId");
CREATE INDEX IF NOT EXISTS "MatchPrediction_userId_weekKey_idx" ON "MatchPrediction"("userId", "weekKey");
CREATE INDEX IF NOT EXISTS "MatchPrediction_matchId_idx" ON "MatchPrediction"("matchId");
CREATE INDEX IF NOT EXISTS "MatchPrediction_weekKey_idx" ON "MatchPrediction"("weekKey");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'MatchPrediction_userId_fkey'
  ) THEN
    ALTER TABLE "MatchPrediction"
      ADD CONSTRAINT "MatchPrediction_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "PublicUserProfile"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'MatchPrediction_matchId_fkey'
  ) THEN
    ALTER TABLE "MatchPrediction"
      ADD CONSTRAINT "MatchPrediction_matchId_fkey"
      FOREIGN KEY ("matchId") REFERENCES "Match"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
