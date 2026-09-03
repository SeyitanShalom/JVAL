import { NextResponse } from "next/server";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import type { MatchStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const liveMatchStatuses: MatchStatus[] = ["LIVE", "HALFTIME", "PENALTIES"];

function noStoreJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Expires: "0",
      Pragma: "no-cache",
    },
  });
}

export async function GET() {
  try {
    if (!hasDatabaseConfig()) {
      return noStoreJson({
        liveCount: 0,
        liveMatches: [],
        fixtureVersion: "unavailable:0",
        updatedAt: new Date().toISOString(),
      });
    }

    const prisma = getPrismaClient();
    const [
      liveMatches,
      matchCount,
      latestMatch,
      eventCount,
      latestEvent,
      penaltyCount,
      latestPenalty,
    ] = await Promise.all([
      prisma.match.findMany({
        where: { status: { in: liveMatchStatuses } },
        orderBy: { kickoffAt: "asc" },
        select: {
          id: true,
          slug: true,
          status: true,
          minuteLabel: true,
          currentPeriod: true,
          firstHalfStartedAt: true,
          secondHalfStartedAt: true,
          homeScore: true,
          awayScore: true,
          homePenaltyScore: true,
          awayPenaltyScore: true,
          updatedAt: true,
        },
      }),
      prisma.match.count(),
      prisma.match.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.matchEvent.count(),
      prisma.matchEvent.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.penaltyAttempt.count(),
      prisma.penaltyAttempt.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const fixtureVersion = [
      matchCount,
      latestMatch?.updatedAt.toISOString() ?? "",
      eventCount,
      latestEvent?.createdAt.toISOString() ?? "",
      penaltyCount,
      latestPenalty?.createdAt.toISOString() ?? "",
    ].join(":");

    return noStoreJson({
      liveCount: liveMatches.length,
      liveMatches: liveMatches.map((m) => ({
        id: m.id,
        slug: m.slug,
        status: m.status,
        minute: m.minuteLabel,
        currentPeriod: m.currentPeriod,
        firstHalfStartedAt: m.firstHalfStartedAt?.toISOString() ?? null,
        secondHalfStartedAt: m.secondHalfStartedAt?.toISOString() ?? null,
        homeScore: m.homeScore ?? 0,
        awayScore: m.awayScore ?? 0,
        homePenaltyScore: m.homePenaltyScore,
        awayPenaltyScore: m.awayPenaltyScore,
      })),
      fixtureVersion,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return noStoreJson(
      { error: error instanceof Error ? error.message : "Internal Error" },
      500
    );
  }
}
