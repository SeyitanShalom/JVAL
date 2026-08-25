import { NextRequest, NextResponse } from "next/server";
import {
  competitions,
  matches,
  seasons,
  teams,
  getTeamById,
  getCompetitionById,
  getVenueById,
  formatDate,
  formatMatchTime,
} from "@/lib/league-data";

function escCsv(val: string | number | undefined | null): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const competition = searchParams.get("competition") ?? "all";
  const status      = searchParams.get("status")      ?? "all";
  const team        = searchParams.get("team")         ?? "all";
  const matchday    = searchParams.get("matchday")     ?? "all";
  const season      = searchParams.get("season")       ?? "all";

  const filtered = matches.filter((m) => {
    if (competition !== "all" && m.competitionId !== competition) return false;
    if (status      !== "all" && m.status        !== status)      return false;
    if (team        !== "all" && m.homeTeamId    !== team && m.awayTeamId !== team) return false;
    if (matchday    !== "all" && m.matchday       !== matchday)    return false;
    if (season      !== "all" && m.seasonId       !== season)      return false;
    return true;
  });

  const headers = [
    "Match ID", "Date", "Kickoff Time", "Competition", "Season", "Matchday",
    "Stage", "Status", "Home Team", "Away Team", "Venue",
    "Home Score", "Away Score", "Penalties (H)", "Penalties (A)", "Referee",
  ];

  const rows = filtered.map((m) => {
    const home = getTeamById(m.homeTeamId);
    const away = getTeamById(m.awayTeamId);
    const comp = getCompetitionById(m.competitionId);
    const venue = getVenueById(m.venueId);
    return [
      m.id,
      formatDate(m.date),
      formatMatchTime(m.date),
      comp?.name ?? m.competitionId,
      m.seasonId,
      m.matchday,
      m.stage,
      m.status,
      home?.name ?? m.homeTeamId,
      away?.name ?? m.awayTeamId,
      venue ? venue.name + " – " + venue.location : m.venueId,
      m.homeScore ?? "",
      m.awayScore ?? "",
      m.penalties?.home ?? "",
      m.penalties?.away ?? "",
      m.referee ?? "",
    ].map(escCsv).join(",");
  });

  const csv = [headers.map(escCsv).join(","), ...rows].join("\r\n");

  const filename = [
    "jval-fixtures",
    competition !== "all" ? competition : null,
    status      !== "all" ? status      : null,
    new Date().toISOString().slice(0, 10),
  ].filter(Boolean).join("_") + ".csv";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="' + filename + '"',
    },
  });
}