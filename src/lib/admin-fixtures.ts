import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

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
  homeCompetitionTeamId: string | null;
  awayCompetitionTeamId: string | null;
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
  minuteLabel?: string | null;
  currentPeriod?: string | null;
  firstHalfStartedAt?: string | null;
  secondHalfStartedAt?: string | null;
};

export type AdminFixtureActivityRecord = {
  id: string;
  type: string;
  minuteLabel: string;
  matchId: string;
  matchSlug: string;
  matchLabel: string;
  competitionName: string;
  teamShort: string;
  playerName: string;
  occurredAt: string;
};

export type AdminFixtureData = {
  source: "database" | "unavailable";
  databaseReady: boolean;
  error?: string;
  matches: AdminMatchRecord[];
  liveCount: number;
  upcomingCount: number;
  finishedCount: number;
  penaltyCount: number;
  venueOptions: { id: string; name: string; location?: string }[];
  teamOptions: {
    competitionTeamId: string;
    competitionId: string;
    teamId: string;
    teamName: string;
    shortName: string;
  }[];
  recentActivities: AdminFixtureActivityRecord[];
  lastSyncedAt: string | null;
};

export type LiveSquadPlayer = {
  id: string; // squadPlayerId
  playerId: string;
  name: string;
  number: number;
  position: string;
  category: string;
};

export type LiveLineupPlayer = LiveSquadPlayer & {
  role: "STARTER" | "SUBSTITUTE";
  sortOrder: number;
  isCaptain: boolean;
  isGoalkeeper: boolean;
};

export type LiveMatchLineup = {
  formation: string | null;
  captainId: string | null;
  goalkeeperId: string | null;
  players: LiveLineupPlayer[];
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
  source: "database" | "unavailable";
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
    currentPeriod?: string | null;
    firstHalfStartedAt?: string | null;
    secondHalfStartedAt?: string | null;
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
    lineup: LiveMatchLineup | null;
  };
  awayTeam: {
    id: string;
    competitionTeamId: string;
    name: string;
    shortName: string;
    logoUrl?: string;
    squad: LiveSquadPlayer[];
    lineup: LiveMatchLineup | null;
  };
  events: LiveMatchEvent[];
  penalties: LivePenaltyAttempt[];
};

// â”€â”€â”€ Sample fallback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getUnavailableData(error?: string): AdminFixtureData {
  return {
    source: "unavailable",
    databaseReady: false,
    error,
    matches: [],
    liveCount: 0,
    upcomingCount: 0,
    finishedCount: 0,
    penaltyCount: 0,
    venueOptions: [],
    teamOptions: [],
    recentActivities: [],
    lastSyncedAt: null,
  };
}

// â”€â”€â”€ Live DB fetch for all fixtures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getAdminFixtureData(): Promise<AdminFixtureData> {
  if (!hasDatabaseConfig()) {
    return getUnavailableData(
      "Add DATABASE_URL and DIRECT_URL in .env, then run the Prisma migration commands.",
    );
  }

  try {
    const prisma = getPrismaClient();

    const [dbMatches, dbVenues, dbCompTeams, recentEvents, recentPenalties] = await Promise.all([
      prisma.match.findMany({
        orderBy: { kickoffAt: "asc" },
        include: {
          competition: { select: { id: true, name: true } },
          venue: { select: { id: true, name: true, location: true } },
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
      }),
      prisma.venue.findMany({ orderBy: { name: "asc" } }),
      prisma.competitionTeam.findMany({
        include: {
          teamSeason: { include: { team: { select: { id: true, name: true, shortName: true } } } },
        },
      }),
      prisma.matchEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          competitionTeam: {
            include: {
              teamSeason: { include: { team: { select: { shortName: true } } } },
            },
          },
          player: { include: { player: { select: { fullName: true } } } },
          match: {
            include: {
              competition: { select: { name: true } },
              homeCompetitionTeam: {
                include: {
                  teamSeason: { include: { team: { select: { shortName: true } } } },
                },
              },
              awayCompetitionTeam: {
                include: {
                  teamSeason: { include: { team: { select: { shortName: true } } } },
                },
              },
            },
          },
        },
      }),
      prisma.penaltyAttempt.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          competitionTeam: {
            include: {
              teamSeason: { include: { team: { select: { shortName: true } } } },
            },
          },
          taker: { include: { player: { select: { fullName: true } } } },
          match: {
            include: {
              competition: { select: { name: true } },
              homeCompetitionTeam: {
                include: {
                  teamSeason: { include: { team: { select: { shortName: true } } } },
                },
              },
              awayCompetitionTeam: {
                include: {
                  teamSeason: { include: { team: { select: { shortName: true } } } },
                },
              },
            },
          },
        },
      }),
    ]);

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
      homeCompetitionTeamId: m.homeCompetitionTeamId,
      awayCompetitionTeamId: m.awayCompetitionTeamId,
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
      minuteLabel: m.minuteLabel,
      currentPeriod: m.currentPeriod,
      firstHalfStartedAt: m.firstHalfStartedAt?.toISOString() ?? null,
      secondHalfStartedAt: m.secondHalfStartedAt?.toISOString() ?? null,
    }));

    const venueOptions = dbVenues.map((v) => ({ id: v.id, name: v.name, location: v.location }));
    const teamOptions = dbCompTeams.map((ct) => ({
      competitionTeamId: ct.id,
      competitionId: ct.competitionId,
      teamId: ct.teamSeason.team.id,
      teamName: ct.teamSeason.team.name,
      shortName: ct.teamSeason.team.shortName,
    }));
    const eventActivities: AdminFixtureActivityRecord[] = recentEvents.map((event) => {
      const homeShort = event.match.homeCompetitionTeam?.teamSeason.team.shortName ?? "HOM";
      const awayShort = event.match.awayCompetitionTeam?.teamSeason.team.shortName ?? "AWY";
      const eventTeamShort =
        event.type === "OWN_GOAL" && event.competitionTeamId === event.match.homeCompetitionTeamId
          ? awayShort
          : event.type === "OWN_GOAL" && event.competitionTeamId === event.match.awayCompetitionTeamId
          ? homeShort
          : event.competitionTeam?.teamSeason.team.shortName ?? "TBD";

      return {
        id: event.id,
        type:
          event.type === "NOTE" && event.note?.toLowerCase().includes("disallowed goal")
            ? "DISALLOWED_GOAL"
            : event.type,
        minuteLabel: event.minuteLabel,
        matchId: event.matchId,
        matchSlug: event.match.slug,
        matchLabel: `${homeShort} vs ${awayShort}`,
        competitionName: event.match.competition.name,
        teamShort: eventTeamShort,
        playerName: event.player?.player.fullName ?? "Match note",
        occurredAt: event.createdAt.toISOString(),
      };
    });
    const penaltyActivities: AdminFixtureActivityRecord[] = recentPenalties.map((attempt) => {
      const homeShort = attempt.match.homeCompetitionTeam?.teamSeason.team.shortName ?? "HOM";
      const awayShort = attempt.match.awayCompetitionTeam?.teamSeason.team.shortName ?? "AWY";

      return {
        id: attempt.id,
        type: attempt.scored ? "PENALTY_SCORED" : "PENALTY_MISSED",
        minuteLabel: attempt.minuteLabel,
        matchId: attempt.matchId,
        matchSlug: attempt.match.slug,
        matchLabel: `${homeShort} vs ${awayShort}`,
        competitionName: attempt.match.competition.name,
        teamShort: attempt.competitionTeam.teamSeason.team.shortName,
        playerName: attempt.taker.player.fullName,
        occurredAt: attempt.createdAt.toISOString(),
      };
    });
    const recentActivities = [...eventActivities, ...penaltyActivities]
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 6);
    const lastSyncedAt =
      [...dbMatches.map((m) => m.updatedAt.toISOString()), ...recentActivities.map((a) => a.occurredAt)]
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

    return {
      source: "database",
      databaseReady: true,
      matches: mappedMatches,
      liveCount: mappedMatches.filter((m) => ["LIVE", "HALFTIME", "PENALTIES"].includes(m.status)).length,
      upcomingCount: mappedMatches.filter((m) => m.status === "UPCOMING").length,
      finishedCount: mappedMatches.filter((m) => m.status === "FULLTIME").length,
      penaltyCount: mappedMatches.filter((m) => m.homePenaltyScore !== null).length,
      venueOptions,
      teamOptions,
      recentActivities,
      lastSyncedAt,
    };
  } catch (e) {
    return getUnavailableData(e instanceof Error ? e.message : "Database error");
  }
}

// â”€â”€â”€ Live match detail for Console â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getAdminLiveMatchData(matchId: string): Promise<AdminLiveMatchData | null> {
  if (!hasDatabaseConfig()) {
    return null;
  }

  try {
    const prisma = getPrismaClient();

    const dbMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        competition: { select: { id: true, name: true } },
        venue: { select: { id: true, name: true, location: true } },
        homeCompetitionTeam: {
          include: {
            teamSeason: {
              include: {
                team: true,
                squadPlayers: {
                  include: { player: true },
                  orderBy: { squadNumber: "asc" },
                },
              },
            },
          },
        },
        awayCompetitionTeam: {
          include: {
            teamSeason: {
              include: {
                team: true,
                squadPlayers: {
                  include: { player: true },
                  orderBy: { squadNumber: "asc" },
                },
              },
            },
          },
        },
        events: {
          include: {
            player: { include: { player: true } },
            assistPlayer: { include: { player: true } },
            playerIn: { include: { player: true } },
            playerOut: { include: { player: true } },
          },
          orderBy: [{ minute: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        },
        penaltyAttempts: {
          include: { taker: { include: { player: true } } },
          orderBy: { sequence: "asc" },
        },
        lineups: {
          include: {
            players: {
              include: { squadPlayer: { include: { player: true } } },
              orderBy: [{ role: "asc" }, { sortOrder: "asc" }],
            },
          },
        },
      },
    });

    if (!dbMatch) return null;

    const homeTs = dbMatch.homeCompetitionTeam?.teamSeason;
    const awayTs = dbMatch.awayCompetitionTeam?.teamSeason;

    const homeSquad: LiveSquadPlayer[] = (homeTs?.squadPlayers || []).map((sq) => ({
      id: sq.id,
      playerId: sq.player.id,
      name: sq.player.fullName,
      number: sq.squadNumber,
      position: sq.detailedPosition || "MF",
      category: sq.positionCategory,
    }));

    const awaySquad: LiveSquadPlayer[] = (awayTs?.squadPlayers || []).map((sq) => ({
      id: sq.id,
      playerId: sq.player.id,
      name: sq.player.fullName,
      number: sq.squadNumber,
      position: sq.detailedPosition || "MF",
      category: sq.positionCategory,
    }));

    const mappedEvents: LiveMatchEvent[] = dbMatch.events.map((e) => ({
      id: e.id,
      type: e.type,
      minute: e.minute,
      minuteLabel: e.minuteLabel || (e.minute ? `${e.minute}'` : "0'"),
      competitionTeamId: e.competitionTeamId,
      playerId: e.playerId,
      playerName: e.player?.player.fullName,
      assistPlayerId: e.assistPlayerId,
      assistPlayerName: e.assistPlayer?.player.fullName,
      playerInId: e.playerInId,
      playerInName: e.playerIn?.player.fullName,
      playerOutId: e.playerOutId,
      playerOutName: e.playerOut?.player.fullName,
      note: e.note,
    }));

    const mappedPenalties: LivePenaltyAttempt[] = dbMatch.penaltyAttempts.map((p) => ({
      id: p.id,
      competitionTeamId: p.competitionTeamId,
      takerId: p.takerId,
      takerName: p.taker?.player.fullName ?? "Taker",
      sequence: p.sequence,
      round: p.round,
      scored: p.scored,
      note: p.note,
    }));
    const mapLineup = (
      competitionTeamId: string | null | undefined,
      squad: LiveSquadPlayer[],
    ): LiveMatchLineup | null => {
      const lineup = dbMatch.lineups.find(
        (item) => item.competitionTeamId === competitionTeamId,
      );
      if (!lineup) return null;

      const squadById = new Map(squad.map((player) => [player.id, player]));
      const lineupPlayers: LiveLineupPlayer[] = lineup.players.map((entry) => {
        const fallback = squadById.get(entry.squadPlayerId);

        return {
          id: entry.squadPlayerId,
          playerId: entry.squadPlayer.player.id,
          name: entry.squadPlayer.player.fullName,
          number: entry.shirtNumber ?? entry.squadPlayer.squadNumber,
          position:
            entry.position ??
            entry.squadPlayer.detailedPosition ??
            fallback?.position ??
            "MF",
          category:
            entry.squadPlayer.positionCategory ?? fallback?.category ?? "MIDFIELDER",
          role: entry.role,
          sortOrder: entry.sortOrder,
          isCaptain: entry.isCaptain,
          isGoalkeeper: entry.isGoalkeeper,
        };
      });

      return {
        formation: lineup.formation,
        captainId: lineup.captainId,
        goalkeeperId: lineup.goalkeeperId,
        players: lineupPlayers,
      };
    };
    const homeLineup = mapLineup(dbMatch.homeCompetitionTeamId, homeSquad);
    const awayLineup = mapLineup(dbMatch.awayCompetitionTeamId, awaySquad);

    return {
      source: "database",
      databaseReady: true,
      match: {
        id: dbMatch.id,
        slug: dbMatch.slug,
        status: dbMatch.status,
        stage: dbMatch.stage,
        matchday: dbMatch.matchday,
        kickoffAt: dbMatch.kickoffAt.toISOString(),
        minuteLabel: dbMatch.minuteLabel,
        referee: dbMatch.referee,
        report: dbMatch.report,
        homeScore: dbMatch.homeScore ?? 0,
        awayScore: dbMatch.awayScore ?? 0,
        homePenaltyScore: dbMatch.homePenaltyScore,
        awayPenaltyScore: dbMatch.awayPenaltyScore,
        currentPeriod: dbMatch.currentPeriod,
        firstHalfStartedAt: dbMatch.firstHalfStartedAt?.toISOString() ?? null,
        secondHalfStartedAt: dbMatch.secondHalfStartedAt?.toISOString() ?? null,
      },
      competition: { id: dbMatch.competition.id, name: dbMatch.competition.name },
      venue: { id: dbMatch.venue.id, name: dbMatch.venue.name, location: dbMatch.venue.location },
      homeTeam: {
        id: homeTs?.team.id ?? "home",
        competitionTeamId: dbMatch.homeCompetitionTeamId ?? "home",
        name: homeTs?.team.name ?? (dbMatch.homeSourceLabel ?? "Home Team"),
        shortName: homeTs?.team.shortName ?? "HOM",
        logoUrl: homeTs?.team.logoUrl ?? undefined,
        squad: homeSquad,
        lineup: homeLineup,
      },
      awayTeam: {
        id: awayTs?.team.id ?? "away",
        competitionTeamId: dbMatch.awayCompetitionTeamId ?? "away",
        name: awayTs?.team.name ?? (dbMatch.awaySourceLabel ?? "Away Team"),
        shortName: awayTs?.team.shortName ?? "AWY",
        logoUrl: awayTs?.team.logoUrl ?? undefined,
        squad: awaySquad,
        lineup: awayLineup,
      },
      events: mappedEvents,
      penalties: mappedPenalties,
    };
  } catch (e) {
    console.error("Live match query error:", e);
    return null;
  }
}
