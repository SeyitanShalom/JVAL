import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

export type AdminDashboardMetrics = {
  source: "database" | "unavailable";
  liveMatchCount: number;
  upcomingFixtureCount: number;
  pendingResultCount: number;
  activeCompetitionCount: number;
  totalTeams: number;
  totalPlayers: number;
  currentSeasonLabel: string;
  teamCount: number;
  venueCount: number;
  newsCount: number;
  awardCount: number;
};

function getUnavailableMetrics(): AdminDashboardMetrics {
  return {
    source: "unavailable",
    liveMatchCount: 0,
    upcomingFixtureCount: 0,
    pendingResultCount: 0,
    activeCompetitionCount: 0,
    totalTeams: 0,
    totalPlayers: 0,
    currentSeasonLabel: "No active season",
    teamCount: 0,
    venueCount: 0,
    newsCount: 0,
    awardCount: 0,
  };
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  if (!hasDatabaseConfig()) {
    return getUnavailableMetrics();
  }

  try {
    const prisma = getPrismaClient();

    const [
      liveMatchCount,
      upcomingFixtureCount,
      pendingResultCount,
      activeCompetitionCount,
      totalTeams,
      totalPlayers,
      currentSeason,
      venueCount,
      newsCount,
      awardCount,
    ] = await Promise.all([
      prisma.match.count({ where: { status: { in: ["LIVE", "HALFTIME", "PENALTIES"] } } }),
      prisma.match.count({ where: { status: "UPCOMING" } }),
      prisma.match.count({ where: { status: "FULLTIME", referee: null } }),
      prisma.competition.count({ where: { status: "ACTIVE" } }),
      prisma.team.count(),
      prisma.squadPlayer.count({ where: { season: { isCurrent: true } } }),
      prisma.season.findFirst({
        where: { isCurrent: true },
        select: { label: true },
      }),
      prisma.venue.count(),
      prisma.newsPost.count(),
      prisma.awardRecord.count(),
    ]);

    return {
      source: "database",
      liveMatchCount,
      upcomingFixtureCount,
      pendingResultCount,
      activeCompetitionCount,
      totalTeams,
      totalPlayers,
      currentSeasonLabel: currentSeason?.label ?? "No active season",
      teamCount: totalTeams,
      venueCount,
      newsCount,
      awardCount,
    };
  } catch {
    return getUnavailableMetrics();
  }
}

export const liveControlEvents = [
  "Start match",
  "Add goal",
  "Add assist",
  "Add yellow card",
  "Add red card",
  "Add substitution",
  "Add injury/update note",
  "Start halftime",
  "Resume second half",
  "End match",
  "Publish final result",
];

export const tournamentRuleSummary = [
  { label: "Points", value: "Win 3, Draw 1, Loss 0" },
  { label: "Pots", value: "Set per competition" },
  { label: "League phase", value: "One table per competition" },
  { label: "LG qualifiers", value: "Top 8" },
  { label: "Super Cup qualifiers", value: "Top 16" },
  { label: "Knockout ties", value: "Straight to penalties" },
  { label: "Third place", value: "Enabled" },
];
