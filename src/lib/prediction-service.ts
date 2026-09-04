import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { calculatePredictionPoints } from "@/lib/prediction-utils";

type ScoreFinishedPredictionsOptions = {
  matchIds?: string[];
  resetUnfinished?: boolean;
};

export async function scoreFinishedPredictions(
  userId?: string,
  options: ScoreFinishedPredictionsOptions = {},
) {
  if (!hasDatabaseConfig()) {
    return;
  }

  const prisma = getPrismaClient() as any;
  const where = {
    ...(userId ? { userId } : {}),
    ...(options.matchIds?.length
      ? { matchId: { in: Array.from(new Set(options.matchIds)) } }
      : {}),
    ...(options.resetUnfinished
      ? {}
      : {
          match: {
            status: "FULLTIME",
            homeScore: { not: null },
            awayScore: { not: null },
          },
        }),
  };
  const predictions = await prisma.matchPrediction.findMany({
    where,
    include: {
      match: {
        select: {
          status: true,
          homeScore: true,
          awayScore: true,
        },
      },
    },
  });

  await Promise.all(
    predictions.map((prediction: any) => {
      const canScore =
        prediction.match.status === "FULLTIME" &&
        typeof prediction.match.homeScore === "number" &&
        typeof prediction.match.awayScore === "number";
      const scored = canScore
        ? calculatePredictionPoints({
            predictedHomeScore: prediction.predictedHomeScore,
            predictedAwayScore: prediction.predictedAwayScore,
            actualHomeScore: prediction.match.homeScore,
            actualAwayScore: prediction.match.awayScore,
          })
        : {
            awardedPoints: 0,
            exactScore: false,
          };

      if (
        prediction.awardedPoints === scored.awardedPoints &&
        prediction.exactScore === scored.exactScore &&
        (canScore ? prediction.scoredAt : !prediction.scoredAt)
      ) {
        return null;
      }

      return prisma.matchPrediction.update({
        where: { id: prediction.id },
        data: {
          ...scored,
          scoredAt: canScore ? new Date() : null,
        },
      });
    }),
  );
}
