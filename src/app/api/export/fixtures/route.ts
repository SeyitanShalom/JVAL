import { NextRequest, NextResponse } from "next/server";
import { getPublicFixturesData } from "@/lib/public-data";
import { formatDate, formatMatchTime } from "@/lib/league-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function escCsv(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return "";
  const text = String(value);

  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return '"' + text.replace(/"/g, '""') + '"';
  }

  return text;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const competition = searchParams.get("competition") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const team = searchParams.get("team") ?? "all";
  const matchday = searchParams.get("matchday") ?? "all";
  const season = searchParams.get("season") ?? "all";
  const data = await getPublicFixturesData({
    competition,
    status,
    team,
    matchday,
    season,
  });

  const headers = [
    "Match ID",
    "Date",
    "Kickoff Time",
    "Competition",
    "Season",
    "Matchday",
    "Stage",
    "Status",
    "Home Team",
    "Away Team",
    "Venue",
    "Home Score",
    "Away Score",
    "Penalties (H)",
    "Penalties (A)",
    "Referee",
  ];

  const rows = data.matches.map((match) =>
    [
      match.id,
      formatDate(match.date),
      formatMatchTime(match.date),
      match.competitionName ?? match.competitionId,
      match.seasonId,
      match.matchday,
      match.stage,
      match.status,
      match.homeTeamName ?? match.homeTeamId,
      match.awayTeamName ?? match.awayTeamId,
      [match.venueName, match.venueLocation].filter(Boolean).join(" - "),
      match.homeScore ?? "",
      match.awayScore ?? "",
      match.penalties?.home ?? "",
      match.penalties?.away ?? "",
      match.referee ?? "",
    ]
      .map(escCsv)
      .join(","),
  );

  const csv = [headers.map(escCsv).join(","), ...rows].join("\r\n");
  const filename =
    [
      "jval-fixtures",
      competition !== "all" ? competition : null,
      status !== "all" ? status : null,
      new Date().toISOString().slice(0, 10),
    ]
      .filter(Boolean)
      .join("_") + ".csv";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
