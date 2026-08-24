import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import {
  awardsRecords,
  competitions,
  galleryItems,
  matches,
  newsPosts,
  players,
  seasons,
  teams,
  venues,
} from "@/lib/league-data";

// ─── Static sample data (used as fallback) ───────────────────────────────────

const currentSeasonSample = seasons.find((s) => s.status === "active") ?? seasons[0];

export const adminOverview = {
  liveMatches: matches.filter((m) => m.status === "live"),
  upcomingFixtures: matches.filter((m) => m.status === "upcoming"),
  pendingResults: matches.filter((m) => m.status === "finished" && !m.referee),
  recentNews: [...newsPosts].sort(
    (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  ),
  totalTeams: teams.length,
  totalPlayers: players.length,
  activeCompetitions: competitions.filter((c) => c.status === "active"),
  currentSeason: currentSeasonSample,
};

export const adminResources = [
  {
    title: "Competitions",
    href: "/admin/competitions",
    count: competitions.length,
    detail: `${adminOverview.activeCompetitions.length} active`,
  },
  {
    title: "Fixtures",
    href: "/admin/fixtures",
    count: matches.length,
    detail: `${adminOverview.liveMatches.length} live`,
  },
  {
    title: "Teams",
    href: "/admin/teams",
    count: teams.length,
    detail: "Squad limit 25",
  },
  {
    title: "Players",
    href: "/admin/players",
    count: players.length,
    detail: "DOB stored",
  },
  {
    title: "Statistics",
    href: "/admin/statistics",
    count: players.length + teams.length,
    detail: "Auto-calculated",
  },
  {
    title: "News",
    href: "/admin/news",
    count: newsPosts.length,
    detail: "Linked to competitions",
  },
  {
    title: "Galleries",
    href: "/admin/galleries",
    count: galleryItems.length,
    detail: "Flexible scopes",
  },
  {
    title: "Venues",
    href: "/admin/venues",
    count: venues.length,
    detail: "Neutral matches",
  },
  {
    title: "Awards",
    href: "/admin/awards-records",
    count: awardsRecords.length,
    detail: "Season tracked",
  },
];

// ─── Live DB dashboard data ───────────────────────────────────────────────────

export type AdminDashboardMetrics = {
  source: "database" | "sample";
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
  galleryCount: number;
};

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  if (!hasDatabaseConfig()) {
    return {
      source: "sample",
      liveMatchCount: adminOverview.liveMatches.length,
      upcomingFixtureCount: adminOverview.upcomingFixtures.length,
      pendingResultCount: adminOverview.pendingResults.length,
      activeCompetitionCount: adminOverview.activeCompetitions.length,
      totalTeams: teams.length,
      totalPlayers: players.length,
      currentSeasonLabel: currentSeasonSample.label,
      teamCount: teams.length,
      venueCount: venues.length,
      newsCount: newsPosts.length,
      galleryCount: galleryItems.length,
    };
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
      galleryCount,
    ] = await Promise.all([
      prisma.match.count({ where: { status: "LIVE" } }),
      prisma.match.count({ where: { status: "UPCOMING" } }),
      prisma.match.count({ where: { status: "FULLTIME", referee: null } }),
      prisma.competition.count({ where: { status: "ACTIVE" } }),
      prisma.team.count(),
      prisma.squadPlayer.count({ where: { season: { isCurrent: true } } }),
      prisma.season.findFirst({ where: { isCurrent: true }, select: { label: true } }),
      prisma.venue.count(),
      prisma.newsPost.count(),
      prisma.galleryImage.count(),
    ]);

    return {
      source: "database",
      liveMatchCount,
      upcomingFixtureCount,
      pendingResultCount,
      activeCompetitionCount,
      totalTeams,
      totalPlayers,
      currentSeasonLabel: currentSeason?.label ?? "—",
      teamCount: totalTeams,
      venueCount,
      newsCount,
      galleryCount,
    };
  } catch {
    return {
      source: "sample",
      liveMatchCount: adminOverview.liveMatches.length,
      upcomingFixtureCount: adminOverview.upcomingFixtures.length,
      pendingResultCount: adminOverview.pendingResults.length,
      activeCompetitionCount: adminOverview.activeCompetitions.length,
      totalTeams: teams.length,
      totalPlayers: players.length,
      currentSeasonLabel: currentSeasonSample.label,
      teamCount: teams.length,
      venueCount: venues.length,
      newsCount: newsPosts.length,
      galleryCount: galleryItems.length,
    };
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
  { label: "Pots", value: "4 per competition" },
  { label: "LG qualifiers", value: "Top 8" },
  { label: "Super Cup qualifiers", value: "Top 16" },
  { label: "Knockout ties", value: "Straight to penalties" },
  { label: "Third place", value: "Enabled" },
];
