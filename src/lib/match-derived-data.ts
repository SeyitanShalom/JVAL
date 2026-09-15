import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { scoreFinishedPredictions } from "@/lib/prediction-service";
import { recalculateAllLeagueTablesAndStats } from "@/lib/standings-engine";

type SyncFinishedMatchDerivedDataOptions = {
  competitionId?: string | null;
  matchIds?: string[];
  resetUnfinished?: boolean;
};

export async function syncFinishedMatchDerivedData({
  competitionId,
  matchIds = [],
  resetUnfinished = false,
}: SyncFinishedMatchDerivedDataOptions = {}) {
  if (!hasDatabaseConfig()) return;

  const uniqueMatchIds = Array.from(new Set(matchIds.filter(Boolean)));
  const competitionIds = new Set<string>();

  if (competitionId) {
    competitionIds.add(competitionId);
  }

  if (uniqueMatchIds.length > 0) {
    const prisma = getPrismaClient();
    const matches = await prisma.match.findMany({
      where: { id: { in: uniqueMatchIds } },
      select: { competitionId: true },
    });

    matches.forEach((match) => competitionIds.add(match.competitionId));
  }

  if (competitionIds.size > 0) {
    for (const id of competitionIds) {
      await recalculateAllLeagueTablesAndStats(id);
    }
  } else if (uniqueMatchIds.length === 0) {
    await recalculateAllLeagueTablesAndStats();
  }

  if (resetUnfinished && uniqueMatchIds.length === 0) {
    return;
  }

  await scoreFinishedPredictions(undefined, {
    matchIds: uniqueMatchIds,
    resetUnfinished,
  });
}
