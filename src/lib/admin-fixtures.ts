import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { matches, teams, players, venues, competitions } from "@/lib/league-data";

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
  source: "database" | "sample";
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

function getSampleData(error?: string): AdminFixtureData {
  const sampleMatches: AdminMatchRecord[] = matches.map((m) => {
    const homeTeam = teams.find((t) => t.id === m.homeTeamId);
    const awayTeam = teams.find((t) => t.id === m.awayTeamId);
    const comp = competitions.find((c) => c.id === m.competitionId);
    const ven = venues.find((v) => v.id === m.venueId);

    return {
      id: m.id,
      slug: m.slug,
      status: m.status.toUpperCase(),
      stage: (m.stage || "GROUP").toUpperCase(),
      matchday: m.matchday,
      kickoffAt: m.date,
      competitionId: m.competitionId,
      competitionName: comp?.name ?? m.competitionId,
      seasonId: "season_2026_2027",
      venueId: m.venueId,
      venueName: ven?.name ?? m.venueId,
      homeCompetitionTeamId: "ct_" + m.homeTeamId + "_" + m.competitionId,
      awayCompetitionTeamId: "ct_" + m.awayTeamId + "_" + m.competitionId,
      homeTeamId: m.homeTeamId,
      homeTeamName: homeTeam?.name ?? m.homeTeamId,
      homeTeamShort: homeTeam?.shortName ?? m.homeTeamId.slice(0, 3).toUpperCase(),
      awayTeamId: m.awayTeamId,
      awayTeamName: awayTeam?.name ?? m.awayTeamId,
      awayTeamShort: awayTeam?.shortName ?? m.awayTeamId.slice(0, 3).toUpperCase(),
      homeScore: m.homeScore ?? null,
      awayScore: m.awayScore ?? null,
      homePenaltyScore: m.penalties?.home ?? null,
      awayPenaltyScore: m.penalties?.away ?? null,
      minuteLabel: m.minute ?? null,
      currentPeriod: null,
      firstHalfStartedAt: m.firstHalfStartedAt ?? null,
      secondHalfStartedAt: m.secondHalfStartedAt ?? null,
    };
  });

  const sampleVenues = venues.map((v) => ({ id: v.id, name: v.name, location: v.location }));
  const sampleTeams = teams.flatMap((t) =>
    t.competitionIds.map((cId) => ({
      competitionTeamId: "ct_" + t.id + "_" + cId,
      competitionId: cId,
      teamId: t.id,
      teamName: t.name,
      shortName: t.shortName,
    }))
  );
  const sampleActivities: AdminFixtureActivityRecord[] = matches
    .flatMap((m) => {
      const homeTeam = teams.find((t) => t.id === m.homeTeamId);
      const awayTeam = teams.find((t) => t.id === m.awayTeamId);
      const comp = competitions.find((c) => c.id === m.competitionId);

      return m.events.map((event) => {
        const eventTeam = event.teamId === m.homeTeamId ? homeTeam : awayTeam;
        const player = players.find((p) => p.id === event.playerId);

        return {
          id: event.id,
          type: event.type,
          minuteLabel: event.minute,
          matchId: m.id,
          matchSlug: m.slug,
          matchLabel: `${homeTeam?.shortName ?? "HOM"} vs ${awayTeam?.shortName ?? "AWY"}`,
          competitionName: comp?.name ?? m.competitionId,
          teamShort: eventTeam?.shortName ?? "TBD",
          playerName: player?.name ?? event.playerId,
          occurredAt: m.date,
        };
      });
    })
    .slice(0, 6);

  return {
    source: "sample",
    databaseReady: false,
    error,
    matches: sampleMatches,
    liveCount: matches.filter((m) => m.status === "live").length,
    upcomingCount: matches.filter((m) => m.status === "upcoming").length,
    finishedCount: matches.filter((m) => m.status === "finished").length,
    penaltyCount: matches.filter((m) => m.penalties).length,
    venueOptions: sampleVenues,
    teamOptions: sampleTeams,
    recentActivities: sampleActivities,
    lastSyncedAt: null,
  };
}

// â”€â”€â”€ Live DB fetch for all fixtures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getAdminFixtureData(): Promise<AdminFixtureData> {
  if (!hasDatabaseConfig()) return getSampleData();

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
    return getSampleData(e instanceof Error ? e.message : "Database error");
  }
}

// â”€â”€â”€ Live match detail for Console â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getAdminLiveMatchData(matchId: string): Promise<AdminLiveMatchData | null> {
  if (!hasDatabaseConfig()) {
    const sampleMatch = matches.find((m) => m.id === matchId) || matches[0];
    if (!sampleMatch) return null;

    const sampleHome = teams.find((t) => t.id === sampleMatch.homeTeamId) || teams[0];
    const sampleAway = teams.find((t) => t.id === sampleMatch.awayTeamId) || teams[1];

    const squad1: LiveSquadPlayer[] = players.slice(0, 11).map((p, i) => ({
      id: "sq-" + p.id,
      playerId: p.id,
      name: p.name,
      number: p.number || i + 1,
      position: p.detailedPosition,
      category: p.positionGroup,
    }));

    const squad2: LiveSquadPlayer[] = players.slice(11, 22).map((p, i) => ({
      id: "sq-" + p.id,
      playerId: p.id,
      name: p.name,
      number: p.number || i + 1,
      position: p.detailedPosition,
      category: p.positionGroup,
    }));
    const sampleLineup = (
      squad: LiveSquadPlayer[],
      formation: string,
    ): LiveMatchLineup => {
      const goalkeeper = squad.find((p) => p.category === "Goalkeeper");

      return {
        formation,
        captainId: squad[0]?.id ?? null,
        goalkeeperId: goalkeeper?.id ?? squad[0]?.id ?? null,
        players: squad.slice(0, 18).map((player, index) => ({
          ...player,
          role: index < 11 ? "STARTER" : "SUBSTITUTE",
          sortOrder: index + 1,
          isCaptain: index === 0,
          isGoalkeeper: player.id === goalkeeper?.id,
        })),
      };
    };

    return {
      source: "sample",
      databaseReady: false,
      match: {
        id: sampleMatch.id,
        slug: sampleMatch.slug,
        status: sampleMatch.status.toUpperCase(),
        stage: (sampleMatch.stage || "GROUP").toUpperCase(),
        matchday: sampleMatch.matchday,
        kickoffAt: sampleMatch.date,
        minuteLabel: sampleMatch.minute ?? null,
        referee: sampleMatch.referee ?? "Official Referee",
        report: null,
        homeScore: sampleMatch.homeScore ?? 0,
        awayScore: sampleMatch.awayScore ?? 0,
        homePenaltyScore: sampleMatch.penalties?.home ?? null,
        awayPenaltyScore: sampleMatch.penalties?.away ?? null,
        currentPeriod: null,
        firstHalfStartedAt: sampleMatch.firstHalfStartedAt ?? null,
        secondHalfStartedAt: sampleMatch.secondHalfStartedAt ?? null,
      },
      competition: { id: sampleMatch.competitionId, name: sampleMatch.competitionId },
      venue: { id: sampleMatch.venueId, name: sampleMatch.venueId, location: "Akure" },
      homeTeam: {
        id: sampleHome.id,
        competitionTeamId: "ct_" + sampleHome.id,
        name: sampleHome.name,
        shortName: sampleHome.shortName,
        logoUrl: sampleHome.logo,
        squad: squad1,
        lineup: sampleLineup(squad1, "4-3-3"),
      },
      awayTeam: {
        id: sampleAway.id,
        competitionTeamId: "ct_" + sampleAway.id,
        name: sampleAway.name,
        shortName: sampleAway.shortName,
        logoUrl: sampleAway.logo,
        squad: squad2,
        lineup: sampleLineup(squad2, "4-2-3-1"),
      },
      events: sampleMatch.events.map((e, idx) => ({
        id: e.id || "ev-" + idx,
        type: e.type.toUpperCase().replace(/ /g, "_"),
        minute: parseInt(e.minute.replace(/[^0-9]/g, ""), 10) || 1,
        minuteLabel: e.minute,
        competitionTeamId: e.teamId === sampleHome.id ? "ct_" + sampleHome.id : "ct_" + sampleAway.id,
        playerId: e.playerId,
        playerName: e.playerId,
        assistPlayerId: e.assistPlayerId ?? null,
        assistPlayerName: e.assistPlayerId ?? undefined,
        playerInId: null,
        playerOutId: null,
        note: null,
      })),
      penalties: (sampleMatch.penalties?.attempts ?? []).map((p, idx) => ({
        id: p.id || "pen-" + idx,
        competitionTeamId: p.teamId === sampleHome.id ? "ct_" + sampleHome.id : "ct_" + sampleAway.id,
        takerId: p.playerId,
        takerName: p.playerId,
        sequence: p.order,
        round: Math.ceil(p.order / 2),
        scored: p.scored,
        note: null,
      })),
    };
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
