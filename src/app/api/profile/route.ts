/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { scoreFinishedPredictions } from "@/lib/prediction-service";
import {
  calculateWeeklyBonusPoints,
  getCompletedPredictionWeeks,
  getPredictionWeekKey,
  PREDICTION_POINTS,
} from "@/lib/prediction-utils";
import {
  cleanPublicDisplayName,
  getPublicDisplayNameKey,
  getPublicAuthUser,
  upsertPublicUserProfile,
} from "@/lib/public-user-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const user = await getPublicAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasDatabaseConfig()) {
      return NextResponse.json(
        { error: "DATABASE_URL is required for profiles." },
        { status: 503 },
      );
    }

    const prisma = getPrismaClient() as any;

    await upsertPublicUserProfile(user);
    await scoreFinishedPredictions(user.id);

    const [profile, userPredictions, recentPredictions, profiles, allMatches] =
      await Promise.all([
        prisma.publicUserProfile.findUnique({
          where: { id: user.id },
        }),
        prisma.matchPrediction.findMany({
          where: { userId: user.id },
          select: {
            matchId: true,
            weekKey: true,
            awardedPoints: true,
            exactScore: true,
          },
        }),
        prisma.matchPrediction.findMany({
          where: { userId: user.id },
          orderBy: { submittedAt: "desc" },
          take: 20,
          include: {
            match: {
              select: {
                id: true,
                slug: true,
                matchday: true,
                status: true,
                kickoffAt: true,
                homeScore: true,
                awayScore: true,
                homeSourceLabel: true,
                awaySourceLabel: true,
                competition: { select: { name: true } },
                venue: { select: { name: true } },
                homeCompetitionTeam: {
                  select: {
                    teamSeason: {
                      select: {
                        team: {
                          select: {
                            name: true,
                            shortName: true,
                            logoUrl: true,
                          },
                        },
                      },
                    },
                  },
                },
                awayCompetitionTeam: {
                  select: {
                    teamSeason: {
                      select: {
                        team: {
                          select: {
                            name: true,
                            shortName: true,
                            logoUrl: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        prisma.publicUserProfile.findMany({
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
            predictions: {
              select: {
                matchId: true,
                weekKey: true,
                awardedPoints: true,
                exactScore: true,
              },
            },
          },
        }),
        prisma.match.findMany({
          select: {
            id: true,
            kickoffAt: true,
            status: true,
            homeScore: true,
            awayScore: true,
          },
        }),
      ]);

    const currentWeekKey = getPredictionWeekKey(new Date());
    const completedWeeks = getCompletedPredictionWeeks(allMatches);
    const summary = getPredictionSummary(
      userPredictions,
      currentWeekKey,
      completedWeeks,
    );
    const leaderboard = profiles
      .map((item: any) => {
        const weeklyBonus = calculateWeeklyBonusPoints(
          item.predictions,
          completedWeeks,
        );
        const exactScores = item.predictions.filter(
          (prediction: any) => prediction.exactScore,
        ).length;
        const totalPoints =
          sumPoints(item.predictions) + weeklyBonus.bonusPoints;

        return {
          id: item.id,
          name: item.displayName ?? item.username ?? "Apex fan",
          username: item.username,
          avatarUrl: item.avatarUrl,
          totalPoints,
          bonusPoints: weeklyBonus.bonusPoints,
          perfectWeeks: weeklyBonus.perfectWeeks,
          predictionCount: item.predictions.length,
          exactScores,
        };
      })
      .sort(
        (a: any, b: any) =>
          b.totalPoints - a.totalPoints ||
          b.exactScores - a.exactScores ||
          b.perfectWeeks - a.perfectWeeks ||
          a.name.localeCompare(b.name),
      );
    const rank = leaderboard.findIndex((item: any) => item.id === user.id) + 1;

    return NextResponse.json({
      profile,
      summary: {
        ...summary,
        rank: rank || null,
      },
      recentPredictions: recentPredictions.map(mapPrediction),
      leaderboard: leaderboard.slice(0, 10),
    });
  } catch (error) {
    console.error("Profile API error:", error);
    const { message, status } = getProfileApiErrorResponse(error);

    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getPublicAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasDatabaseConfig()) {
      return NextResponse.json(
        { error: "DATABASE_URL is required for profiles." },
        { status: 503 },
      );
    }

    const prisma = getPrismaClient() as any;
    const body = await request.json().catch(() => ({}));
    const displayName = cleanPublicDisplayName(body.displayName);
    const displayNameKey = getPublicDisplayNameKey(displayName);
    const username = cleanUsername(body.username);
    const favoriteTeamId = cleanText(body.favoriteTeamId, 80);

    await upsertPublicUserProfile(user);

    const conflictMessage = await getProfileNameConflictMessage(
      prisma,
      user.id,
      displayNameKey,
      username,
    );

    if (conflictMessage) {
      return NextResponse.json({ error: conflictMessage }, { status: 409 });
    }

    try {
      const profile = await prisma.publicUserProfile.update({
        where: { id: user.id },
        data: {
          displayName: displayName ?? null,
          displayNameKey,
          username,
          favoriteTeamId: favoriteTeamId ?? null,
        },
      });

      return NextResponse.json({ profile });
    } catch (error) {
      const message =
        getUniqueProfileFieldMessage(error) ??
        (error instanceof Error && error.message.includes("Unique constraint")
          ? "That display name or username is already taken."
          : getProfileApiErrorResponse(error).message);

      return NextResponse.json({ error: message }, { status: 400 });
    }
  } catch (error) {
    console.error("Profile API update error:", error);
    const { message, status } = getProfileApiErrorResponse(error);

    return NextResponse.json({ error: message }, { status });
  }
}

function getPredictionSummary(
  predictions: any[],
  currentWeekKey: string,
  completedWeeks: Array<{ weekKey: string; matchIds: string[] }>,
) {
  const weeklyBonus = calculateWeeklyBonusPoints(predictions, completedWeeks);
  const exactScores = predictions.filter((prediction) => prediction.exactScore)
    .length;

  return {
    totalPoints: sumPoints(predictions) + weeklyBonus.bonusPoints,
    basePoints: sumPoints(predictions),
    bonusPoints: weeklyBonus.bonusPoints,
    perfectWeeks: weeklyBonus.perfectWeeks,
    thisWeekPoints:
      sumPoints(
        predictions.filter((prediction) => prediction.weekKey === currentWeekKey),
      ) +
      (weeklyBonus.weekKeys.includes(currentWeekKey)
        ? PREDICTION_POINTS.perfectWeekBonus
        : 0),
    predictionCount: predictions.length,
    exactScores,
  };
}

function sumPoints(predictions: any[]) {
  return predictions.reduce(
    (total, prediction) => total + prediction.awardedPoints,
    0,
  );
}

function mapPrediction(prediction: any) {
  return {
    id: prediction.id,
    matchId: prediction.matchId,
    weekKey: prediction.weekKey,
    predictedHomeScore: prediction.predictedHomeScore,
    predictedAwayScore: prediction.predictedAwayScore,
    awardedPoints: prediction.awardedPoints,
    exactScore: prediction.exactScore,
    submittedAt: prediction.submittedAt,
    scoredAt: prediction.scoredAt,
    match: {
      id: prediction.match.id,
      slug: prediction.match.slug,
      matchday: prediction.match.matchday,
      status: prediction.match.status,
      kickoffAt: prediction.match.kickoffAt,
      homeScore: prediction.match.homeScore,
      awayScore: prediction.match.awayScore,
      competitionName: prediction.match.competition.name,
      venueName: prediction.match.venue.name,
      homeTeam: mapTeam(
        prediction.match.homeCompetitionTeam,
        prediction.match.homeSourceLabel,
      ),
      awayTeam: mapTeam(
        prediction.match.awayCompetitionTeam,
        prediction.match.awaySourceLabel,
      ),
    },
  };
}

function mapTeam(competitionTeam: any, fallbackName?: string | null) {
  const team = competitionTeam?.teamSeason?.team;
  const name = team?.name ?? fallbackName ?? "TBD";

  return {
    name,
    shortName: team?.shortName ?? name.slice(0, 3).toUpperCase(),
    logo: team?.logoUrl ?? "/football club.png",
  };
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function cleanUsername(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 30);

  return cleaned || null;
}

async function getProfileNameConflictMessage(
  prisma: any,
  userId: string,
  displayNameKey: string | null,
  username: string | null,
) {
  const filters = [
    ...(displayNameKey ? [{ displayNameKey }] : []),
    ...(username ? [{ username }] : []),
  ];

  if (!filters.length) {
    return null;
  }

  const conflict = await prisma.publicUserProfile.findFirst({
    where: {
      id: { not: userId },
      OR: filters,
    },
    select: {
      displayNameKey: true,
      username: true,
    },
  });

  if (!conflict) {
    return null;
  }

  if (displayNameKey && conflict.displayNameKey === displayNameKey) {
    return "That display name is already taken.";
  }

  if (username && conflict.username === username) {
    return "That username is already taken.";
  }

  return "That display name or username is already taken.";
}

function getProfileApiErrorResponse(error: unknown) {
  const code = readErrorCode(error);
  const message = readErrorMessage(error);

  if (
    code === "P2021" ||
    code === "P2022" ||
    message.includes("does not exist") ||
    message.includes("PublicUserProfile") ||
    message.includes("MatchPrediction")
  ) {
    return {
      status: 503,
      message:
        "Profile tables are not ready yet. Run `npx prisma migrate deploy`, then try signing in again.",
    };
  }

  if (
    message.includes("Can't reach database server") ||
    message.includes("Connection terminated") ||
    message.includes("ECONN")
  ) {
    return {
      status: 503,
      message:
        "The profile database is not reachable right now. Check DATABASE_URL and your Supabase database status.",
    };
  }

  return {
    status: 500,
    message: "Unable to load profile.",
  };
}

function getUniqueProfileFieldMessage(error: unknown) {
  if (readErrorCode(error) !== "P2002") {
    return null;
  }

  const target = readErrorTarget(error);

  if (target.includes("displayNameKey")) {
    return "That display name is already taken.";
  }

  if (target.includes("username")) {
    return "That username is already taken.";
  }

  return "That display name or username is already taken.";
}

function readErrorCode(error: unknown) {
  if (typeof error !== "object" || !error || !("code" in error)) {
    return "";
  }

  const code = (error as Record<string, unknown>).code;

  return typeof code === "string" ? code : "";
}

function readErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}

function readErrorTarget(error: unknown) {
  if (typeof error !== "object" || !error || !("meta" in error)) {
    return "";
  }

  const meta = (error as Record<string, unknown>).meta;

  if (typeof meta !== "object" || !meta || !("target" in meta)) {
    return "";
  }

  const target = (meta as Record<string, unknown>).target;

  return Array.isArray(target) ? target.join(",") : String(target ?? "");
}
