import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

export type AdminAwardRecord = {
  id: string;
  type: string;
  title: string;
  winnerText: string;
  detail: string;
  seasonId: string;
  seasonLabel: string;
  competitionId: string | null;
  competitionName: string | null;
};

export type AdminAwardsData = {
  source: "database" | "unavailable";
  databaseReady: boolean;
  error?: string;
  awards: AdminAwardRecord[];
  competitionOptions: { id: string; name: string }[];
  seasonOptions: { id: string; label: string }[];
  currentSeasonId: string | null;
};

function getUnavailableData(error?: string): AdminAwardsData {
  return {
    source: "unavailable",
    databaseReady: false,
    error,
    awards: [],
    competitionOptions: [],
    seasonOptions: [],
    currentSeasonId: null,
  };
}

export async function getAdminAwardsData(): Promise<AdminAwardsData> {
  if (!hasDatabaseConfig()) {
    return getUnavailableData(
      "Add DATABASE_URL and DIRECT_URL in .env, then run the Prisma migration commands.",
    );
  }

  try {
    const prisma = getPrismaClient();

    const [dbAwards, dbCompetitions, dbSeasons] = await Promise.all([
      prisma.awardRecord.findMany({
        orderBy: [{ season: { startsAt: "desc" } }, { createdAt: "desc" }],
        include: {
          season: { select: { id: true, label: true } },
          competition: { select: { id: true, name: true } },
        },
      }),
      prisma.competition.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.season.findMany({
        select: { id: true, label: true, isCurrent: true },
        orderBy: { startsAt: "desc" },
      }),
    ]);

    const currentSeason = dbSeasons.find((s) => s.isCurrent) ?? null;

    return {
      source: "database",
      databaseReady: true,
      awards: dbAwards.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        winnerText: a.winnerText,
        detail: a.detail ?? "",
        seasonId: a.seasonId,
        seasonLabel: a.season.label,
        competitionId: a.competitionId,
        competitionName: a.competition?.name ?? null,
      })),
      competitionOptions: dbCompetitions.map((c) => ({
        id: c.id,
        name: c.name,
      })),
      seasonOptions: dbSeasons.map((s) => ({ id: s.id, label: s.label })),
      currentSeasonId: currentSeason?.id ?? null,
    };
  } catch (e) {
    return getUnavailableData(e instanceof Error ? e.message : "Database error");
  }
}
