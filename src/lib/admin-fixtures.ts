import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { matches, teams, players } from "@/lib/league-data";

export type AdminMatchRecord = {
  id: string;
  slug: string;
  status: string;
  stage: string;
  matchday: string;
  kickoffAt: string;
  competitionId: string;
  competitionName: string;
  seasonId: string;
  venueId: string;
  venueName: string;
  homeTeamId: string | null;
  homeTeamName: string;
  homeTeamShort: string;
  awayTeamId: string | null;
  awayTeamName: string;
  awayTeamShort: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
};

export type AdminFixtureData = {
  source: "database" | "sample";
  databaseReady: boolean;
  error?: string;
  matches: AdminMatchRecord[];
  liveCount: number;
  upcomingCount: number;
  finishedCount: number;
  penaltyCount: number;
};

export type LiveSquadPlayer = {
  id: string; // squadPlayerId
  playerId: string;
  name: string;
  number: number;
  position: string;
  category: string;
};

export type LiveMatchEvent = {
  id: string;
  type: string;
  minute: number | null;
  minuteLabel: string;
  competitionTeamId: string | null;
  playerId: string | null;
  playerName?: string;
  assistPlayerId: string | null;
  assistPlayerName?: string;
  playerInId: string | null;
  playerInName?: string;
  playerOutId: string | null;
  playerOutName?: string;
  note: string | null;
};

export type LivePenaltyAttempt = {
  id: string;
  competitionTeamId: string;
  takerId: string;
  takerName: string;
  sequence: number;
  round: number;
  scored: boolean;
  note: string | null;
};

export type AdminLiveMatchData = {
  source: "database" | "sample";
  databaseReady: boolean;
  error?: string;
  match: {
    id: string;
    slug: string;
    status: string;
    stage: string;
    matchday: string;
    kickoffAt: string;
    minuteLabel: string | null;
    referee: string | null;
    report: string | null;
    homeScore: number;
    awayScore: number;
    homePenaltyScore: number | null;
    awayPenaltyScore: number | null;
  };
  competition: { id: string; name: string };
  venue: { id: string; name: string; location: string };
  homeTeam: {
    id: string;
    competitionTeamId: string;
    name: string;
    shortName: string;
    logoUrl?: string;
    squad: LiveSquadPlayer[];
  };
  awayTeam: {
    id: string;
    competitionTeamId: string;
    name: string;
    shortName: string;
    logoUrl?: string;
    squad: LiveSquadPlayer[];
  };
  events: LiveMatchEvent[];
  penalties: LivePenaltyAttempt[];
};

// ─── Sample fallback ──────────────────────────────────────────────────────────

function getSampleData(error?: string): AdminFixtureData {
  const sampleMatches: AdminMatchRecord[] = matches.map((m) => ({
    id: m.id,
    slug: m.slug,
    status: m.status,
    stage: "GROUP",
    matchday: m.matchday,
    kickoffAt: m.date,
    competitionId: m.competitionId,
    competitionName: m.competitionId,
    seasonId: "sample",
    venueId: m.venueId,
    venueName: m.venueId,
    homeTeamId: m.homeTeamId,
    homeTeamName: m.homeTeamId,
    homeTeamShort: m.homeTeamId.slice(0, 3).toUpperCase(),
    awayTeamId: m.awayTeamId,
    awayTeamName: m.awayTeamId,
    awayTeamShort: m.awayTeamId.slice(0, 3).toUpperCase(),
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
    homePenaltyScore: m.penalties?.home ?? null,
    awayPenaltyScore: m.penalties?.away ?? null,
  }));

  return {
    source: "sample",
    databaseReady: false,
    error,
    matches: sampleMatches,
    liveCount: matches.filter((m) => m.status === "live").length,
    upcomingCount: matches.filter((m) => m.status === "upcoming").length,
    finishedCount: matches.filter((m) => m.status === "finished").length,
    penaltyCount: matches.filter((m) => m.penalties).length,
  };
}

// ─── Live DB fetch for all fixtures ───────────────────────────────────────────

export async function getAdminFixtureData(): Promise<AdminFixtureData> {
  if (!hasDatabaseConfig()) return getSampleData();

  try {
    const prisma = getPrismaClient();

    const dbMatches = await prisma.match.findMany({
      orderBy: { kickoffAt: "asc" },
      include: {
        competition: { select: { id: true, name: true } },
        venue: { select: { id: true, name: true } },
        homeCompetitionTeam: {
          include: {
            teamSeason: { include: { team: { select: { id: true, name: true, shortName: true } } } },
          },
        },
        awayCompetitionTeam: {
          include: {
            teamSeason: { include: { team: { select: { id: true, name: true, shortName: true } } } },
          },
        },
      },
    });

    const mappedMatches: AdminMatchRecord[] = dbMatches.map((m) => ({
      id: m.id,
      slug: m.slug,
      status: m.status,
      stage: m.stage,
      matchday: m.matchday,
      kickoffAt: m.kickoffAt.toISOString(),
      competitionId: m.competitionId,
      competitionName: m.competition.name,
      seasonId: m.seasonId,
      venueId: m.venueId,
      venueName: m.venue.name,
      homeTeamId: m.homeCompetitionTeam?.teamSeason.team.id ?? null,
      homeTeamName: m.homeCompetitionTeam?.teamSeason.team.name ?? (m.homeSourceLabel ?? "TBD"),
      homeTeamShort: m.homeCompetitionTeam?.teamSeason.team.shortName ?? "TBD",
      awayTeamId: m.awayCompetitionTeam?.teamSeason.team.id ?? null,
      awayTeamName: m.awayCompetitionTeam?.teamSeason.team.name ?? (m.awaySourceLabel ?? "TBD"),
      awayTeamShort: m.awayCompetitionTeam?.teamSeason.team.shortName ?? "TBD",
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homePenaltyScore: m.homePenaltyScore,
      awayPenaltyScore: m.awayPenaltyScore,
    }));

    return {
      source: "database",
      databaseReady: true,
      matches: mappedMatches,
      liveCount: mappedMatches.filter((m) => m.status === "LIVE").length,
      upcomingCount: mappedMatches.filter((m) => m.status === "UPCOMING").length,
      finishedCount: mappedMatches.filter((m) => m.status === "FULLTIME").length,
      penaltyCount: mappedMatches.filter((m) => m.homePenaltyScore !== null).length,
    };
  } catch (e) {
    return getSampleData(e instanceof Error ? e.message : "Database error");
  }
}

// ─── Live match detail for Console ────────────────────────────────────────────

export async function getAdminLiveMatchData(matchId: string): Promise<AdminLiveMatchData | null> {
  if (!hasDatabaseConfig()) {
    const sampleMatch = matches.find((m) => m.id === matchId) || matches[0];
    if (!sampleMatch) return null;

    const sampleHome = teams.find((t) => t.id === sampleMatch.homeTeamId) || teams[0];
    const sampleAway = teams.find((t) => t.id === sampleMatch.awayTeamId) || teams[1];

    const squad1: LiveSquadPlayer[] = players.slice(0, 11).map((p, i) => ({
      id: `sq-${p.id}`,
      playerId: p.id,
      name: p.name,
      number: p.number || i + 1,
      position: p.detailedPosition,
      category: p.positionGroup,
    }));

    const squad2: LiveSquadPlayer[] = players.slice(11, 22).map((p, i) => ({
      id: `sq-${p.id}`,
      playerId: p.id,
      name: p.name,
      number: p.number || i + 1,
      position: p.detailedPosition,
      category: p.positionGroup,
    }));

    return {
      source: "sample",
      databaseReady: false,
      match: {
        id: sampleMatch.id,
        slug: sampleMatch.slug,
        status: sampleMatch.status.toUpperCase(),
        stage: "GROUP",
        matchday: sampleMatch.matchday,
        kickoffAt: sampleMatch.date,
        minuteLabel: sampleMatch.minute ? `${sampleMatch.minute}'` : null,
        referee: "Alabi Adebayo",
        report: null,
        homeScore: sampleMatch.homeScore ?? 0,
        awayScore: sampleMatch.awayScore ?? 0,
        homePenaltyScore: sampleMatch.penalties?.home ?? null,
        awayPenaltyScore: sampleMatch.penalties?.away ?? null,
      },
      competition: { id: sampleMatch.competitionId, name: "Akure South & North Apex League" },
      venue: { id: sampleMatch.venueId, name: sampleMatch.venueId, location: "Akure" },
      homeTeam: {
        id: sampleHome.id,
        competitionTeamId: `ct-${sampleHome.id}`,
        name: sampleHome.name,
        shortName: sampleHome.shortName,
        logoUrl: sampleHome.logo,
        squad: squad1,
      },
      awayTeam: {
        id: sampleAway.id,
        competitionTeamId: `ct-${sampleAway.id}`,
        name: sampleAway.name,
        shortName: sampleAway.shortName,
        logoUrl: sampleAway.logo,
        squad: squad2,
      },
      events: (sampleMatch.events || []).map((ev, i) => ({
        id: `ev-${i}`,
        type: ev.type.toUpperCase().replace(/\s+/g, "_"),
        minute: parseInt(ev.minute, 10) || 0,
        minuteLabel: ev.minute,
        competitionTeamId: ev.teamId ? `ct-${ev.teamId}` : null,
        playerId: `sq-${ev.playerId}`,
        playerName: ev.playerId,
        assistPlayerId: ev.assistPlayerId ? `sq-${ev.assistPlayerId}` : null,
        assistPlayerName: ev.assistPlayerId,
        playerInId: null,
        playerOutId: null,
        note: null,
      })),
      penalties: [],
    };
  }

  try {
    const prisma = getPrismaClient();

    const m = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        competition: true,
        venue: true,
        homeCompetitionTeam: {
          include: {
            teamSeason: {
              include: {
                team: true,
                squadPlayers: { include: { player: true }, orderBy: { squadNumber: "asc" } },
              },
            },
          },
        },
        awayCompetitionTeam: {
          include: {
            teamSeason: {
              include: {
                team: true,
                squadPlayers: { include: { player: true }, orderBy: { squadNumber: "asc" } },
              },
            },
          },
        },
        events: {
          orderBy: [{ minute: "asc" }, { sortOrder: "asc" }],
          include: {
            player: { include: { player: true } },
            assistPlayer: { include: { player: true } },
            playerIn: { include: { player: true } },
            playerOut: { include: { player: true } },
          },
        },
        penaltyAttempts: {
          orderBy: { sequence: "asc" },
          include: { taker: { include: { player: true } } },
        },
      },
    });

    if (!m) return null;

    const homeSquad: LiveSquadPlayer[] =
      m.homeCompetitionTeam?.teamSeason.squadPlayers.map((sq) => ({
        id: sq.id,
        playerId: sq.player.id,
        name: sq.player.fullName,
        number: sq.squadNumber,
        position: sq.detailedPosition,
        category: sq.positionCategory,
      })) ?? [];

    const awaySquad: LiveSquadPlayer[] =
      m.awayCompetitionTeam?.teamSeason.squadPlayers.map((sq) => ({
        id: sq.id,
        playerId: sq.player.id,
        name: sq.player.fullName,
        number: sq.squadNumber,
        position: sq.detailedPosition,
        category: sq.positionCategory,
      })) ?? [];

    return {
      source: "database",
      databaseReady: true,
      match: {
        id: m.id,
        slug: m.slug,
        status: m.status,
        stage: m.stage,
        matchday: m.matchday,
        kickoffAt: m.kickoffAt.toISOString(),
        minuteLabel: m.minuteLabel,
        referee: m.referee,
        report: m.report,
        homeScore: m.homeScore ?? 0,
        awayScore: m.awayScore ?? 0,
        homePenaltyScore: m.homePenaltyScore,
        awayPenaltyScore: m.awayPenaltyScore,
      },
      competition: { id: m.competition.id, name: m.competition.name },
      venue: { id: m.venue.id, name: m.venue.name, location: m.venue.location },
      homeTeam: {
        id: m.homeCompetitionTeam?.teamSeason.team.id ?? "home",
        competitionTeamId: m.homeCompetitionTeam?.id ?? "home-ct",
        name: m.homeCompetitionTeam?.teamSeason.team.name ?? (m.homeSourceLabel ?? "Home Team"),
        shortName: m.homeCompetitionTeam?.teamSeason.team.shortName ?? "HOME",
        logoUrl: m.homeCompetitionTeam?.teamSeason.team.logoUrl,
        squad: homeSquad,
      },
      awayTeam: {
        id: m.awayCompetitionTeam?.teamSeason.team.id ?? "away",
        competitionTeamId: m.awayCompetitionTeam?.id ?? "away-ct",
        name: m.awayCompetitionTeam?.teamSeason.team.name ?? (m.awaySourceLabel ?? "Away Team"),
        shortName: m.awayCompetitionTeam?.teamSeason.team.shortName ?? "AWAY",
        logoUrl: m.awayCompetitionTeam?.teamSeason.team.logoUrl,
        squad: awaySquad,
      },
      events: m.events.map((ev) => ({
        id: ev.id,
        type: ev.type,
        minute: ev.minute,
        minuteLabel: ev.minuteLabel,
        competitionTeamId: ev.competitionTeamId,
        playerId: ev.playerId,
        playerName: ev.player?.player.fullName,
        assistPlayerId: ev.assistPlayerId,
        assistPlayerName: ev.assistPlayer?.player.fullName,
        playerInId: ev.playerInId,
        playerInName: ev.playerIn?.player.fullName,
        playerOutId: ev.playerOutId,
        playerOutName: ev.playerOut?.player.fullName,
        note: ev.note,
      })),
      penalties: m.penaltyAttempts.map((p) => ({
        id: p.id,
        competitionTeamId: p.competitionTeamId,
        takerId: p.takerId,
        takerName: p.taker.player.fullName,
        sequence: p.sequence,
        round: p.round,
        scored: p.scored,
        note: p.note,
      })),
    };
  } catch {
    return null;
  }
}
