import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { competitions, seasons } from "@/lib/league-data";

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
  source: "database" | "sample";
  databaseReady: boolean;
  error?: string;
  competitions: AdminCompetitionRecord[];
  seasons: AdminSeasonRecord[];
  currentSeasonId: string | null;
};

// ─── Sample fallback ──────────────────────────────────────────────────────────

function getSampleData(error?: string): AdminCompetitionData {
  const sampleSeasons: AdminSeasonRecord[] = seasons.map((s) => ({
    id: s.id,
    slug: s.id,
    label: s.label,
    status: s.status,
    isCurrent: s.status === "active",
    competitionCount: competitions.filter((c) => c.seasonId === s.id).length,
  }));

  const sampleCompetitions: AdminCompetitionRecord[] = competitions.map((c) => ({
    id: c.id,
    slug: c.id,
    name: c.name,
    description: c.description,
    type: c.type,
    status: c.status,
    plannedTeams: c.plannedTeams,
    potCount: c.potCount,
    qualifiers: c.qualifiers,
    knockoutStart: c.knockoutStart,
    seasonId: c.seasonId ?? "sample",
    seasonLabel: seasons.find((s) => s.id === c.seasonId)?.label ?? "Sample",
    teamCount: 0,
  }));

  const currentSeason = seasons.find((s) => s.status === "active") ?? null;

  return {
    source: "sample",
    databaseReady: false,
    error,
    competitions: sampleCompetitions,
    seasons: sampleSeasons,
    currentSeasonId: currentSeason?.id ?? null,
  };
}

// ─── Live DB fetch ────────────────────────────────────────────────────────────

export async function getAdminCompetitionData(): Promise<AdminCompetitionData> {
  if (!hasDatabaseConfig()) return getSampleData();

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

    const mappedCompetitions: AdminCompetitionRecord[] = dbCompetitions.map((c) => ({
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
    }));

    const mappedSeasons: AdminSeasonRecord[] = dbSeasons.map((s) => ({
      id: s.id,
      slug: s.slug,
      label: s.label,
      status: s.status,
      isCurrent: s.isCurrent,
      competitionCount: s._count.competitions,
    }));

    return {
      source: "database",
      databaseReady: true,
      competitions: mappedCompetitions,
      seasons: mappedSeasons,
      currentSeasonId: currentSeason?.id ?? null,
    };
  } catch (e) {
    return getSampleData(e instanceof Error ? e.message : "Database error");
  }
}
