import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { calculatePredictionPoints } from "@/lib/prediction-utils";

export async function scoreFinishedPredictions(userId?: string) {
  if (!hasDatabaseConfig()) {
    return;
  }

  const prisma = getPrismaClient() as any;
  const where = {
    ...(userId ? { userId } : {}),
    match: {
      status: "FULLTIME",
      homeScore: { not: null },
      awayScore: { not: null },
    },
  };
  const predictions = await prisma.matchPrediction.findMany({
    where,
    include: {
      match: {
        select: {
          homeScore: true,
          awayScore: true,
        },
      },
    },
  });

  await Promise.all(
    predictions.map((prediction: any) => {
      const scored = calculatePredictionPoints({
        predictedHomeScore: prediction.predictedHomeScore,
        predictedAwayScore: prediction.predictedAwayScore,
        actualHomeScore: prediction.match.homeScore,
        actualAwayScore: prediction.match.awayScore,
      });

      if (
        prediction.awardedPoints === scored.awardedPoints &&
        prediction.exactScore === scored.exactScore &&
        prediction.scoredAt
      ) {
        return null;
      }

      return prisma.matchPrediction.update({
        where: { id: prediction.id },
        data: {
          ...scored,
          scoredAt: new Date(),
        },
      });
    }),
  );
}
