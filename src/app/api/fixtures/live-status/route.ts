import { NextResponse } from "next/server";
import { getPublicHomeData } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getPublicHomeData();
    const liveSummaries = data.liveMatches.map((m) => ({
      id: m.id,
      slug: m.slug,
      status: m.status,
      minute: m.minute,
      homeScore: m.homeScore ?? 0,
      awayScore: m.awayScore ?? 0,
    }));

    return NextResponse.json(
      {
        liveCount: data.liveMatches.length,
        liveMatches: liveSummaries,
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
      { error: error instanceof Error ? error.message : "Internal Error" },
      { status: 500 }
    );
  }
}