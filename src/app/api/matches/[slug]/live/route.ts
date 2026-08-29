import { NextRequest, NextResponse } from "next/server";
import { getPublicMatchDetail } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data = await getPublicMatchDetail(slug);

    if (!data) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const { match, homeTeam, awayTeam, enrichedEvents, enrichedAttempts } = data;

    return NextResponse.json(
      {
        id: match.id,
        slug: match.slug,
        status: match.status,
        minute: match.minute,
        minuteLabel: match.minute,
        currentPeriod: match.currentPeriod ?? null,
        firstHalfStartedAt: match.firstHalfStartedAt ?? null,
        secondHalfStartedAt: match.secondHalfStartedAt ?? null,
        homeScore: match.homeScore ?? null,
        awayScore: match.awayScore ?? null,
        penalties: match.penalties ?? null,
        homeTeam: {
          id: homeTeam.id,
          name: homeTeam.name,
          shortName: homeTeam.shortName,
          logo: homeTeam.logo,
        },
        awayTeam: {
          id: awayTeam.id,
          name: awayTeam.name,
          shortName: awayTeam.shortName,
          logo: awayTeam.logo,
        },
        eventCount: enrichedEvents.length,
        penaltyCount: enrichedAttempts.length,
        events: enrichedEvents,
        penaltyAttempts: enrichedAttempts,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
