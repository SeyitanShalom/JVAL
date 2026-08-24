-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CompetitionType" AS ENUM ('LGA', 'STATE', 'SUPER_CUP', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('UPCOMING', 'LIVE', 'HALFTIME', 'FULLTIME', 'POSTPONED');

-- CreateEnum
CREATE TYPE "MatchStage" AS ENUM ('GROUP', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL');

-- CreateEnum
CREATE TYPE "KnockoutRound" AS ENUM ('ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL');

-- CreateEnum
CREATE TYPE "RankingCriterion" AS ENUM ('POINTS', 'GOAL_DIFFERENCE', 'GOALS_SCORED', 'HEAD_TO_HEAD', 'FAIR_PLAY', 'DRAWING_OF_LOTS');

-- CreateEnum
CREATE TYPE "SortDirection" AS ENUM ('ASC', 'DESC');

-- CreateEnum
CREATE TYPE "PositionCategory" AS ENUM ('GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD');

-- CreateEnum
CREATE TYPE "MatchPeriod" AS ENUM ('FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'FULL_TIME', 'PENALTIES');

-- CreateEnum
CREATE TYPE "MatchEventType" AS ENUM ('GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'PENALTY_SCORED', 'PENALTY_MISSED', 'OWN_GOAL', 'INJURY_UPDATE', 'NOTE');

-- CreateEnum
CREATE TYPE "LineupRole" AS ENUM ('STARTER', 'SUBSTITUTE');

-- CreateEnum
CREATE TYPE "FixtureGenerationMode" AS ENUM ('MANUAL', 'AUTO');

-- CreateEnum
CREATE TYPE "GalleryScope" AS ENUM ('SEASON', 'COMPETITION', 'MATCH', 'TEAM', 'PLAYER', 'VENUE', 'GENERAL');

-- CreateEnum
CREATE TYPE "AwardRecordType" AS ENUM ('AWARD', 'RECORD');

-- CreateEnum
CREATE TYPE "ContactMethodType" AS ENUM ('PHONE', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'EMAIL');

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "SeasonStatus" NOT NULL DEFAULT 'UPCOMING',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CompetitionType" NOT NULL DEFAULT 'LGA',
    "status" "CompetitionStatus" NOT NULL DEFAULT 'UPCOMING',
    "plannedTeamCount" INTEGER NOT NULL,
    "potCount" INTEGER NOT NULL DEFAULT 4,
    "opponentsPerPot" INTEGER NOT NULL DEFAULT 1,
    "includeOwnPotOpponents" BOOLEAN NOT NULL DEFAULT true,
    "qualifiersCount" INTEGER NOT NULL,
    "knockoutStartRound" "KnockoutRound" NOT NULL DEFAULT 'QUARTER_FINAL',
    "hasThirdPlaceMatch" BOOLEAN NOT NULL DEFAULT true,
    "neutralVenues" BOOLEAN NOT NULL DEFAULT true,
    "avoidDuplicateOpponents" BOOLEAN NOT NULL DEFAULT true,
    "avoidVenueTimeClashes" BOOLEAN NOT NULL DEFAULT true,
    "avoidRepeatFixtures" BOOLEAN NOT NULL DEFAULT true,
    "avoidSameAreaEarly" BOOLEAN NOT NULL DEFAULT false,
    "winPoints" INTEGER NOT NULL DEFAULT 3,
    "drawPoints" INTEGER NOT NULL DEFAULT 1,
    "lossPoints" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionFeed" (
    "id" TEXT NOT NULL,
    "sourceCompetitionId" TEXT NOT NULL,
    "targetCompetitionId" TEXT NOT NULL,
    "qualifierCount" INTEGER NOT NULL,
    "sourceRankStart" INTEGER NOT NULL DEFAULT 1,
    "sourceRankEnd" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "CompetitionFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionGroup" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CompetitionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionPot" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "targetTeamCount" INTEGER,

    CONSTRAINT "CompetitionPot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingRule" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "criterion" "RankingCriterion" NOT NULL,
    "direction" "SortDirection" NOT NULL DEFAULT 'DESC',

    CONSTRAINT "RankingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "logoPublicId" TEXT,
    "community" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSeason" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "coachName" TEXT NOT NULL,
    "captainName" TEXT NOT NULL,
    "squadLimit" INTEGER NOT NULL DEFAULT 25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionTeam" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "teamSeasonId" TEXT NOT NULL,
    "groupId" TEXT,
    "potId" TEXT,
    "seed" INTEGER,
    "qualifiedFromCompetitionId" TEXT,
    "qualificationRank" INTEGER,
    "isQualifiedForKnockout" BOOLEAN NOT NULL DEFAULT false,
    "isQualifiedForNextCompetition" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "photoPublicId" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquadPlayer" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "teamSeasonId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "squadNumber" INTEGER NOT NULL,
    "positionCategory" "PositionCategory" NOT NULL,
    "detailedPosition" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SquadPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "groupId" TEXT,
    "slug" TEXT NOT NULL,
    "matchday" TEXT NOT NULL,
    "stage" "MatchStage" NOT NULL DEFAULT 'GROUP',
    "status" "MatchStatus" NOT NULL DEFAULT 'UPCOMING',
    "kickoffAt" TIMESTAMP(3) NOT NULL,
    "venueId" TEXT NOT NULL,
    "neutralVenue" BOOLEAN NOT NULL DEFAULT true,
    "homeCompetitionTeamId" TEXT,
    "awayCompetitionTeamId" TEXT,
    "homeSourceLabel" TEXT,
    "awaySourceLabel" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "homePenaltyScore" INTEGER,
    "awayPenaltyScore" INTEGER,
    "minuteLabel" TEXT,
    "referee" TEXT,
    "report" TEXT,
    "highlightsUrl" TEXT,
    "playerOfMatchId" TEXT,
    "generationRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchLineup" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "competitionTeamId" TEXT NOT NULL,
    "formation" TEXT,
    "captainId" TEXT,
    "goalkeeperId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchLineup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchLineupPlayer" (
    "id" TEXT NOT NULL,
    "lineupId" TEXT NOT NULL,
    "squadPlayerId" TEXT NOT NULL,
    "role" "LineupRole" NOT NULL,
    "position" TEXT,
    "shirtNumber" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "isGoalkeeper" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MatchLineupPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "competitionTeamId" TEXT,
    "type" "MatchEventType" NOT NULL,
    "period" "MatchPeriod",
    "minute" INTEGER,
    "stoppageMinute" INTEGER,
    "minuteLabel" TEXT NOT NULL,
    "playerId" TEXT,
    "assistPlayerId" TEXT,
    "playerInId" TEXT,
    "playerOutId" TEXT,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PenaltyAttempt" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "competitionTeamId" TEXT NOT NULL,
    "takerId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "scored" BOOLEAN NOT NULL,
    "minuteLabel" TEXT NOT NULL DEFAULT 'PEN',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PenaltyAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionStanding" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "groupId" TEXT,
    "competitionTeamId" TEXT NOT NULL,
    "rank" INTEGER,
    "played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "goalDifference" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "form" TEXT NOT NULL DEFAULT '',
    "headToHeadPoints" INTEGER NOT NULL DEFAULT 0,
    "qualifiedForKnockout" BOOLEAN NOT NULL DEFAULT false,
    "qualifiedForNextCompetition" BOOLEAN NOT NULL DEFAULT false,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionStanding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamStat" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "competitionTeamId" TEXT NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "goalDifference" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "cleanSheets" INTEGER NOT NULL DEFAULT 0,
    "penaltiesWon" INTEGER NOT NULL DEFAULT 0,
    "penaltiesLost" INTEGER NOT NULL DEFAULT 0,
    "knockoutProgress" "KnockoutRound",
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStat" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "squadPlayerId" TEXT NOT NULL,
    "appearances" INTEGER NOT NULL DEFAULT 0,
    "starts" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "cleanSheets" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "goalsConceded" INTEGER NOT NULL DEFAULT 0,
    "ownGoals" INTEGER NOT NULL DEFAULT 0,
    "penaltiesScored" INTEGER NOT NULL DEFAULT 0,
    "penaltiesMissed" INTEGER NOT NULL DEFAULT 0,
    "playerOfMatchAwards" INTEGER NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnockoutBracket" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startingRound" "KnockoutRound" NOT NULL,
    "hasThirdPlaceMatch" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnockoutBracket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BracketSlot" (
    "id" TEXT NOT NULL,
    "bracketId" TEXT NOT NULL,
    "round" "KnockoutRound" NOT NULL,
    "slotNumber" INTEGER NOT NULL,
    "matchId" TEXT,
    "homeSourceLabel" TEXT,
    "awaySourceLabel" TEXT,
    "winnerToSlotId" TEXT,
    "loserToSlotId" TEXT,

    CONSTRAINT "BracketSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixtureGenerationRun" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "mode" "FixtureGenerationMode" NOT NULL,
    "opponentsPerPot" INTEGER NOT NULL,
    "includeOwnPot" BOOLEAN NOT NULL DEFAULT true,
    "avoidSameAreaEarly" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixtureGenerationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsPost" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverImageUrl" TEXT NOT NULL,
    "coverPublicId" TEXT,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT,
    "competitionId" TEXT,
    "matchId" TEXT,
    "teamId" TEXT,
    "playerId" TEXT,
    "venueId" TEXT,
    "scope" "GalleryScope" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "publicId" TEXT,
    "altText" TEXT,
    "takenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AwardRecord" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "competitionId" TEXT,
    "type" "AwardRecordType" NOT NULL,
    "title" TEXT NOT NULL,
    "winnerText" TEXT NOT NULL,
    "detail" TEXT,
    "value" TEXT,
    "playerId" TEXT,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AwardRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContentBlock" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMethod" (
    "id" TEXT NOT NULL,
    "type" "ContactMethodType" NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "url" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Season_label_key" ON "Season"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Season_slug_key" ON "Season"("slug");

-- CreateIndex
CREATE INDEX "Competition_seasonId_status_idx" ON "Competition"("seasonId", "status");

-- CreateIndex
CREATE INDEX "Competition_type_status_idx" ON "Competition"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Competition_seasonId_slug_key" ON "Competition"("seasonId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionFeed_sourceCompetitionId_targetCompetitionId_key" ON "CompetitionFeed"("sourceCompetitionId", "targetCompetitionId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionGroup_competitionId_slug_key" ON "CompetitionGroup"("competitionId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionPot_competitionId_number_key" ON "CompetitionPot"("competitionId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "RankingRule_competitionId_order_key" ON "RankingRule"("competitionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE INDEX "TeamSeason_seasonId_idx" ON "TeamSeason"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeason_seasonId_teamId_key" ON "TeamSeason"("seasonId", "teamId");

-- CreateIndex
CREATE INDEX "CompetitionTeam_competitionId_groupId_idx" ON "CompetitionTeam"("competitionId", "groupId");

-- CreateIndex
CREATE INDEX "CompetitionTeam_competitionId_potId_idx" ON "CompetitionTeam"("competitionId", "potId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionTeam_competitionId_teamSeasonId_key" ON "CompetitionTeam"("competitionId", "teamSeasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_slug_key" ON "Player"("slug");

-- CreateIndex
CREATE INDEX "SquadPlayer_teamSeasonId_idx" ON "SquadPlayer"("teamSeasonId");

-- CreateIndex
CREATE UNIQUE INDEX "SquadPlayer_seasonId_playerId_key" ON "SquadPlayer"("seasonId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "SquadPlayer_teamSeasonId_squadNumber_key" ON "SquadPlayer"("teamSeasonId", "squadNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_slug_key" ON "Venue"("slug");

-- CreateIndex
CREATE INDEX "Match_seasonId_kickoffAt_idx" ON "Match"("seasonId", "kickoffAt");

-- CreateIndex
CREATE INDEX "Match_competitionId_status_kickoffAt_idx" ON "Match"("competitionId", "status", "kickoffAt");

-- CreateIndex
CREATE INDEX "Match_homeCompetitionTeamId_awayCompetitionTeamId_idx" ON "Match"("homeCompetitionTeamId", "awayCompetitionTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_competitionId_slug_key" ON "Match"("competitionId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Match_venueId_kickoffAt_key" ON "Match"("venueId", "kickoffAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatchLineup_matchId_competitionTeamId_key" ON "MatchLineup"("matchId", "competitionTeamId");

-- CreateIndex
CREATE INDEX "MatchLineupPlayer_squadPlayerId_idx" ON "MatchLineupPlayer"("squadPlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchLineupPlayer_lineupId_squadPlayerId_key" ON "MatchLineupPlayer"("lineupId", "squadPlayerId");

-- CreateIndex
CREATE INDEX "MatchEvent_matchId_sortOrder_idx" ON "MatchEvent"("matchId", "sortOrder");

-- CreateIndex
CREATE INDEX "MatchEvent_type_idx" ON "MatchEvent"("type");

-- CreateIndex
CREATE INDEX "PenaltyAttempt_matchId_round_idx" ON "PenaltyAttempt"("matchId", "round");

-- CreateIndex
CREATE UNIQUE INDEX "PenaltyAttempt_matchId_sequence_key" ON "PenaltyAttempt"("matchId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionStanding_competitionTeamId_key" ON "CompetitionStanding"("competitionTeamId");

-- CreateIndex
CREATE INDEX "CompetitionStanding_competitionId_rank_idx" ON "CompetitionStanding"("competitionId", "rank");

-- CreateIndex
CREATE INDEX "CompetitionStanding_seasonId_idx" ON "CompetitionStanding"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamStat_competitionTeamId_key" ON "TeamStat"("competitionTeamId");

-- CreateIndex
CREATE INDEX "TeamStat_competitionId_idx" ON "TeamStat"("competitionId");

-- CreateIndex
CREATE INDEX "TeamStat_seasonId_idx" ON "TeamStat"("seasonId");

-- CreateIndex
CREATE INDEX "PlayerStat_seasonId_idx" ON "PlayerStat"("seasonId");

-- CreateIndex
CREATE INDEX "PlayerStat_competitionId_goals_idx" ON "PlayerStat"("competitionId", "goals");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStat_competitionId_squadPlayerId_key" ON "PlayerStat"("competitionId", "squadPlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "KnockoutBracket_competitionId_name_key" ON "KnockoutBracket"("competitionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "BracketSlot_bracketId_round_slotNumber_key" ON "BracketSlot"("bracketId", "round", "slotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BracketSlot_matchId_key" ON "BracketSlot"("matchId");

-- CreateIndex
CREATE INDEX "FixtureGenerationRun_competitionId_createdAt_idx" ON "FixtureGenerationRun"("competitionId", "createdAt");

-- CreateIndex
CREATE INDEX "NewsPost_competitionId_publishDate_idx" ON "NewsPost"("competitionId", "publishDate");

-- CreateIndex
CREATE UNIQUE INDEX "NewsPost_seasonId_slug_key" ON "NewsPost"("seasonId", "slug");

-- CreateIndex
CREATE INDEX "GalleryImage_scope_idx" ON "GalleryImage"("scope");

-- CreateIndex
CREATE INDEX "GalleryImage_seasonId_idx" ON "GalleryImage"("seasonId");

-- CreateIndex
CREATE INDEX "GalleryImage_competitionId_idx" ON "GalleryImage"("competitionId");

-- CreateIndex
CREATE INDEX "AwardRecord_seasonId_type_idx" ON "AwardRecord"("seasonId", "type");

-- CreateIndex
CREATE INDEX "AwardRecord_competitionId_idx" ON "AwardRecord"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteContentBlock_seasonId_key_key" ON "SiteContentBlock"("seasonId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "ContactMethod_type_value_key" ON "ContactMethod"("type", "value");

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionFeed" ADD CONSTRAINT "CompetitionFeed_sourceCompetitionId_fkey" FOREIGN KEY ("sourceCompetitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionFeed" ADD CONSTRAINT "CompetitionFeed_targetCompetitionId_fkey" FOREIGN KEY ("targetCompetitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionGroup" ADD CONSTRAINT "CompetitionGroup_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionPot" ADD CONSTRAINT "CompetitionPot_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingRule" ADD CONSTRAINT "RankingRule_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeason" ADD CONSTRAINT "TeamSeason_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeason" ADD CONSTRAINT "TeamSeason_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionTeam" ADD CONSTRAINT "CompetitionTeam_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionTeam" ADD CONSTRAINT "CompetitionTeam_teamSeasonId_fkey" FOREIGN KEY ("teamSeasonId") REFERENCES "TeamSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionTeam" ADD CONSTRAINT "CompetitionTeam_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CompetitionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionTeam" ADD CONSTRAINT "CompetitionTeam_potId_fkey" FOREIGN KEY ("potId") REFERENCES "CompetitionPot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionTeam" ADD CONSTRAINT "CompetitionTeam_qualifiedFromCompetitionId_fkey" FOREIGN KEY ("qualifiedFromCompetitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadPlayer" ADD CONSTRAINT "SquadPlayer_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadPlayer" ADD CONSTRAINT "SquadPlayer_teamSeasonId_fkey" FOREIGN KEY ("teamSeasonId") REFERENCES "TeamSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadPlayer" ADD CONSTRAINT "SquadPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CompetitionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeCompetitionTeamId_fkey" FOREIGN KEY ("homeCompetitionTeamId") REFERENCES "CompetitionTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayCompetitionTeamId_fkey" FOREIGN KEY ("awayCompetitionTeamId") REFERENCES "CompetitionTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_playerOfMatchId_fkey" FOREIGN KEY ("playerOfMatchId") REFERENCES "SquadPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_generationRunId_fkey" FOREIGN KEY ("generationRunId") REFERENCES "FixtureGenerationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineup" ADD CONSTRAINT "MatchLineup_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineup" ADD CONSTRAINT "MatchLineup_competitionTeamId_fkey" FOREIGN KEY ("competitionTeamId") REFERENCES "CompetitionTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineup" ADD CONSTRAINT "MatchLineup_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "SquadPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineup" ADD CONSTRAINT "MatchLineup_goalkeeperId_fkey" FOREIGN KEY ("goalkeeperId") REFERENCES "SquadPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineupPlayer" ADD CONSTRAINT "MatchLineupPlayer_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "MatchLineup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineupPlayer" ADD CONSTRAINT "MatchLineupPlayer_squadPlayerId_fkey" FOREIGN KEY ("squadPlayerId") REFERENCES "SquadPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_competitionTeamId_fkey" FOREIGN KEY ("competitionTeamId") REFERENCES "CompetitionTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "SquadPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_assistPlayerId_fkey" FOREIGN KEY ("assistPlayerId") REFERENCES "SquadPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_playerInId_fkey" FOREIGN KEY ("playerInId") REFERENCES "SquadPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_playerOutId_fkey" FOREIGN KEY ("playerOutId") REFERENCES "SquadPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenaltyAttempt" ADD CONSTRAINT "PenaltyAttempt_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenaltyAttempt" ADD CONSTRAINT "PenaltyAttempt_competitionTeamId_fkey" FOREIGN KEY ("competitionTeamId") REFERENCES "CompetitionTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenaltyAttempt" ADD CONSTRAINT "PenaltyAttempt_takerId_fkey" FOREIGN KEY ("takerId") REFERENCES "SquadPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionStanding" ADD CONSTRAINT "CompetitionStanding_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionStanding" ADD CONSTRAINT "CompetitionStanding_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionStanding" ADD CONSTRAINT "CompetitionStanding_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CompetitionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionStanding" ADD CONSTRAINT "CompetitionStanding_competitionTeamId_fkey" FOREIGN KEY ("competitionTeamId") REFERENCES "CompetitionTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamStat" ADD CONSTRAINT "TeamStat_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamStat" ADD CONSTRAINT "TeamStat_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamStat" ADD CONSTRAINT "TeamStat_competitionTeamId_fkey" FOREIGN KEY ("competitionTeamId") REFERENCES "CompetitionTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStat" ADD CONSTRAINT "PlayerStat_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStat" ADD CONSTRAINT "PlayerStat_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStat" ADD CONSTRAINT "PlayerStat_squadPlayerId_fkey" FOREIGN KEY ("squadPlayerId") REFERENCES "SquadPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnockoutBracket" ADD CONSTRAINT "KnockoutBracket_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketSlot" ADD CONSTRAINT "BracketSlot_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "KnockoutBracket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketSlot" ADD CONSTRAINT "BracketSlot_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketSlot" ADD CONSTRAINT "BracketSlot_winnerToSlotId_fkey" FOREIGN KEY ("winnerToSlotId") REFERENCES "BracketSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketSlot" ADD CONSTRAINT "BracketSlot_loserToSlotId_fkey" FOREIGN KEY ("loserToSlotId") REFERENCES "BracketSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixtureGenerationRun" ADD CONSTRAINT "FixtureGenerationRun_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPost" ADD CONSTRAINT "NewsPost_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPost" ADD CONSTRAINT "NewsPost_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardRecord" ADD CONSTRAINT "AwardRecord_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardRecord" ADD CONSTRAINT "AwardRecord_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardRecord" ADD CONSTRAINT "AwardRecord_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardRecord" ADD CONSTRAINT "AwardRecord_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteContentBlock" ADD CONSTRAINT "SiteContentBlock_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;
