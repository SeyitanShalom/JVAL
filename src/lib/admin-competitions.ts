import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

export type AdminCompetitionRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: string;
  status: string;
  plannedTeams: number;
  potCount: number;
  qualifiers: number;
  knockoutStart: string;
  seasonId: string;
  seasonLabel: string;
  teamCount: number;
};

export type AdminSeasonRecord = {
  id: string;
  slug: string;
  label: string;
  status: string;
  isCurrent: boolean;
  competitionCount: number;
};

export type AdminCompetitionData = {
  source: "database" | "unavailable";
  databaseReady: boolean;
  error?: string;
  competitions: AdminCompetitionRecord[];
  seasons: AdminSeasonRecord[];
  currentSeasonId: string | null;
};

function getUnavailableData(error?: string): AdminCompetitionData {
  return {
    source: "unavailable",
    databaseReady: false,
    error,
    competitions: [],
    seasons: [],
    currentSeasonId: null,
  };
}

export async function getAdminCompetitionData(): Promise<AdminCompetitionData> {
  if (!hasDatabaseConfig()) {
    return getUnavailableData(
      "Add DATABASE_URL and DIRECT_URL in .env, then run the Prisma migration commands.",
    );
  }

  try {
    const prisma = getPrismaClient();

    const [dbCompetitions, dbSeasons] = await Promise.all([
      prisma.competition.findMany({
        orderBy: [{ season: { startsAt: "desc" } }, { name: "asc" }],
        include: {
          season: { select: { id: true, label: true } },
          _count: { select: { teams: true } },
        },
      }),
      prisma.season.findMany({
        orderBy: { startsAt: "desc" },
        include: { _count: { select: { competitions: true } } },
      }),
    ]);

    const currentSeason = dbSeasons.find((s) => s.isCurrent) ?? null;

    return {
      source: "database",
      databaseReady: true,
      competitions: dbCompetitions.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        type: c.type,
        status: c.status,
        plannedTeams: c.plannedTeamCount,
        potCount: c.potCount,
        qualifiers: c.qualifiersCount,
        knockoutStart: c.knockoutStartRound,
        seasonId: c.seasonId,
        seasonLabel: c.season.label,
        teamCount: c._count.teams,
      })),
      seasons: dbSeasons.map((s) => ({
        id: s.id,
        slug: s.slug,
        label: s.label,
        status: s.status,
        isCurrent: s.isCurrent,
        competitionCount: s._count.competitions,
      })),
      currentSeasonId: currentSeason?.id ?? null,
    };
  } catch (e) {
    return getUnavailableData(e instanceof Error ? e.message : "Database error");
  }
}
