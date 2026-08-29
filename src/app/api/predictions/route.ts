/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { scoreFinishedPredictions } from "@/lib/prediction-service";
import { getPredictionWeekKey } from "@/lib/prediction-utils";
import {
  getPublicAuthUser,
  upsertPublicUserProfile,
} from "@/lib/public-user-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const user = await getPublicAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabaseConfig()) {
    return NextResponse.json(
      { error: "DATABASE_URL is required for predictions." },
      { status: 503 },
    );
  }

  const prisma = getPrismaClient() as any;
  const weekKey = request.nextUrl.searchParams.get("weekKey");

  await upsertPublicUserProfile(user);
  await scoreFinishedPredictions(user.id);

  const predictions = await prisma.matchPrediction.findMany({
    where: {
      userId: user.id,
      ...(weekKey ? { weekKey } : {}),
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({
    predictions: predictions.map((prediction: any) => ({
      id: prediction.id,
      matchId: prediction.matchId,
      weekKey: prediction.weekKey,
      predictedHomeScore: prediction.predictedHomeScore,
      predictedAwayScore: prediction.predictedAwayScore,
      awardedPoints: prediction.awardedPoints,
      exactScore: prediction.exactScore,
      submittedAt: prediction.submittedAt,
      scoredAt: prediction.scoredAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getPublicAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabaseConfig()) {
    return NextResponse.json(
      { error: "DATABASE_URL is required for predictions." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsedPredictions = parsePredictions(body.predictions);

  if (!parsedPredictions.length) {
    return NextResponse.json(
      { error: "Add a score for each match before saving." },
      { status: 400 },
    );
  }

  const prisma = getPrismaClient() as any;
  const matchIds = parsedPredictions.map((prediction) => prediction.matchId);
  const matches = await prisma.match.findMany({
    where: { id: { in: matchIds } },
    select: {
      id: true,
      kickoffAt: true,
      status: true,
    },
  });
  const matchMap = new Map<string, { id: string; kickoffAt: Date; status: string }>(
    matches.map((match: any) => [match.id, match]),
  );

  if (matchMap.size !== matchIds.length) {
    return NextResponse.json(
      { error: "One or more matches could not be found." },
      { status: 400 },
    );
  }

  const now = new Date();
  const lockedMatch = matches.find(
    (match: any) =>
      match.status !== "UPCOMING" || match.kickoffAt.getTime() <= now.getTime(),
  );

  if (lockedMatch) {
    return NextResponse.json(
      { error: "Predictions lock when a match kicks off." },
      { status: 409 },
    );
  }

  await upsertPublicUserProfile(user);

  const savedPredictions = await Promise.all(
    parsedPredictions.map((prediction) => {
      const match = matchMap.get(prediction.matchId)!;

      return prisma.matchPrediction.upsert({
        where: {
          userId_matchId: {
            userId: user.id,
            matchId: prediction.matchId,
          },
        },
        create: {
          userId: user.id,
          matchId: prediction.matchId,
          weekKey: getPredictionWeekKey(match.kickoffAt),
          predictedHomeScore: prediction.predictedHomeScore,
          predictedAwayScore: prediction.predictedAwayScore,
        },
        update: {
          weekKey: getPredictionWeekKey(match.kickoffAt),
          predictedHomeScore: prediction.predictedHomeScore,
          predictedAwayScore: prediction.predictedAwayScore,
          awardedPoints: 0,
          exactScore: false,
          scoredAt: null,
        },
      });
    }),
  );

  return NextResponse.json({
    predictions: savedPredictions.map((prediction: any) => ({
      id: prediction.id,
      matchId: prediction.matchId,
      weekKey: prediction.weekKey,
      predictedHomeScore: prediction.predictedHomeScore,
      predictedAwayScore: prediction.predictedAwayScore,
      awardedPoints: prediction.awardedPoints,
      exactScore: prediction.exactScore,
      submittedAt: prediction.submittedAt,
      scoredAt: prediction.scoredAt,
    })),
  });
}

function parsePredictions(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const byMatch = new Map<
    string,
    {
      matchId: string;
      predictedHomeScore: number;
      predictedAwayScore: number;
    }
  >();

  for (const item of value.slice(0, 40)) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const matchId = typeof record.matchId === "string" ? record.matchId : "";
    const homeScore = parseScore(record.predictedHomeScore);
    const awayScore = parseScore(record.predictedAwayScore);

    if (!matchId || homeScore === null || awayScore === null) {
      continue;
    }

    byMatch.set(matchId, {
      matchId,
      predictedHomeScore: homeScore,
      predictedAwayScore: awayScore,
    });
  }

  return Array.from(byMatch.values());
}

function parseScore(value: unknown) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 30) {
    return null;
  }

  return parsed;
}
