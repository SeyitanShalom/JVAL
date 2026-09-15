import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type ComputedTeamRow = {
  competitionTeamId: string;
  seasonId: string;
  competitionId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  cleanSheets: number;
  form: string; // e.g. "WWDLW"
  headToHeadPoints: number;
  rank?: number;
  qualifiedForKnockout: boolean;
};

// ─── 1. RECALCULATE COMPETITION STANDINGS ─────────────────────────────────────

export async function recalculateCompetitionStandings(competitionId: string) {
  if (!hasDatabaseConfig()) return;

  const prisma = getPrismaClient();

  // 1. Fetch competition, teams, and all finished group-stage matches
  const comp = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      teams: {
        include: {
          teamSeason: { include: { team: true } },
        },
      },
      matches: {
        where: {
          stage: "GROUP",
          status: "FULLTIME",
          homeScore: { not: null },
          awayScore: { not: null },
        },
        orderBy: { kickoffAt: "asc" },
      },
    },
  });

  if (!comp || comp.teams.length === 0) return;

  const teamMap = new Map<string, ComputedTeamRow>();

  // Initialize stats for each enrolled team
  comp.teams.forEach((t) => {
    teamMap.set(t.id, {
      competitionTeamId: t.id,
      seasonId: comp.seasonId,
      competitionId: comp.id,
      teamName: t.teamSeason.team.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      cleanSheets: 0,
      form: "",
      headToHeadPoints: 0,
      qualifiedForKnockout: false,
    });
  });

  // Track head-to-head records: Map of key "teamA___teamB" -> points earned by teamA
  const h2hMap = new Map<string, number>();

  // Process all finished group-stage matches into one league table
  comp.matches.forEach((m) => {
    if (!m.homeCompetitionTeamId || !m.awayCompetitionTeamId) return;
    const home = teamMap.get(m.homeCompetitionTeamId);
    const away = teamMap.get(m.awayCompetitionTeamId);
    if (!home || !away) return;

    const hs = m.homeScore ?? 0;
    const as = m.awayScore ?? 0;

    home.played += 1;
    away.played += 1;
    home.goalsFor += hs;
    home.goalsAgainst += as;
    away.goalsFor += as;
    away.goalsAgainst += hs;
    if (as === 0) home.cleanSheets += 1;
    if (hs === 0) away.cleanSheets += 1;

    const hKey = `${m.homeCompetitionTeamId}___${m.awayCompetitionTeamId}`;
    const aKey = `${m.awayCompetitionTeamId}___${m.homeCompetitionTeamId}`;

    if (hs > as) {
      // Home win
      home.wins += 1;
      home.points += comp.winPoints;
      home.form += "W";

      away.losses += 1;
      away.points += comp.lossPoints;
      away.form += "L";

      h2hMap.set(hKey, (h2hMap.get(hKey) ?? 0) + comp.winPoints);
    } else if (as > hs) {
      // Away win
      away.wins += 1;
      away.points += comp.winPoints;
      away.form += "W";

      home.losses += 1;
      home.points += comp.lossPoints;
      home.form += "L";

      h2hMap.set(aKey, (h2hMap.get(aKey) ?? 0) + comp.winPoints);
    } else {
      // Draw
      home.draws += 1;
      home.points += comp.drawPoints;
      home.form += "D";

      away.draws += 1;
      away.points += comp.drawPoints;
      away.form += "D";

      h2hMap.set(hKey, (h2hMap.get(hKey) ?? 0) + comp.drawPoints);
      h2hMap.set(aKey, (h2hMap.get(aKey) ?? 0) + comp.drawPoints);
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  });

  const rows = Array.from(teamMap.values());

  // Keep only the last 5 match results for form
  rows.forEach((r) => {
    if (r.form.length > 5) {
      r.form = r.form.slice(-5);
    }
  });

  // Calculate Head-to-Head points for tiebreaking
  rows.forEach((teamA) => {
    let totalH2H = 0;
    rows.forEach((teamB) => {
      if (teamA.competitionTeamId !== teamB.competitionTeamId) {
        const key = `${teamA.competitionTeamId}___${teamB.competitionTeamId}`;
        totalH2H += h2hMap.get(key) ?? 0;
      }
    });
    teamA.headToHeadPoints = totalH2H;
  });

  // Sort rows by tournament ranking rules:
  // 1. Points (desc)
  // 2. Goal Difference (desc)
  // 3. Goals For (desc)
  // 4. Head-to-Head Points (desc)
  // 5. Team Name (asc)
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.headToHeadPoints !== a.headToHeadPoints) return b.headToHeadPoints - a.headToHeadPoints;
    return a.teamName.localeCompare(b.teamName);
  });

  const qualifiersCount = comp.qualifiersCount || 8;

  // Assign ranks and knockout qualification flags
  rows.forEach((r, idx) => {
    r.rank = idx + 1;
    r.qualifiedForKnockout = idx < qualifiersCount;
  });

  const qualifiedTeamIds = rows
    .filter((r) => r.qualifiedForKnockout)
    .map((r) => r.competitionTeamId);
  const unqualifiedTeamIds = rows
    .filter((r) => !r.qualifiedForKnockout)
    .map((r) => r.competitionTeamId);
  const calculatedAt = new Date();

  // Write standings and team stats to database in a transaction
  await prisma.$transaction(async (tx) => {
    for (const r of rows) {
      // Upsert CompetitionStanding
      await tx.competitionStanding.upsert({
        where: { competitionTeamId: r.competitionTeamId },
        create: {
          seasonId: r.seasonId,
          competitionId: r.competitionId,
          groupId: null,
          competitionTeamId: r.competitionTeamId,
          rank: r.rank,
          played: r.played,
          wins: r.wins,
          draws: r.draws,
          losses: r.losses,
          goalsFor: r.goalsFor,
          goalsAgainst: r.goalsAgainst,
          goalDifference: r.goalDifference,
          points: r.points,
          form: r.form,
          headToHeadPoints: r.headToHeadPoints,
          qualifiedForKnockout: r.qualifiedForKnockout,
          calculatedAt,
        },
        update: {
          groupId: null,
          rank: r.rank,
          played: r.played,
          wins: r.wins,
          draws: r.draws,
          losses: r.losses,
          goalsFor: r.goalsFor,
          goalsAgainst: r.goalsAgainst,
          goalDifference: r.goalDifference,
          points: r.points,
          form: r.form,
          headToHeadPoints: r.headToHeadPoints,
          qualifiedForKnockout: r.qualifiedForKnockout,
          calculatedAt,
        },
      });

      // Upsert TeamStat
      await tx.teamStat.upsert({
        where: { competitionTeamId: r.competitionTeamId },
        create: {
          seasonId: r.seasonId,
          competitionId: r.competitionId,
          competitionTeamId: r.competitionTeamId,
          played: r.played,
          wins: r.wins,
          draws: r.draws,
          losses: r.losses,
          goalsFor: r.goalsFor,
          goalsAgainst: r.goalsAgainst,
          goalDifference: r.goalDifference,
          points: r.points,
          cleanSheets: r.cleanSheets,
          calculatedAt,
        },
        update: {
          played: r.played,
          wins: r.wins,
          draws: r.draws,
          losses: r.losses,
          goalsFor: r.goalsFor,
          goalsAgainst: r.goalsAgainst,
          goalDifference: r.goalDifference,
          points: r.points,
          cleanSheets: r.cleanSheets,
          calculatedAt,
        },
      });
    }

    if (qualifiedTeamIds.length > 0) {
      await tx.competitionTeam.updateMany({
        where: { competitionId: comp.id, id: { in: qualifiedTeamIds } },
        data: { isQualifiedForKnockout: true },
      });
    }

    if (unqualifiedTeamIds.length > 0) {
      await tx.competitionTeam.updateMany({
        where: { competitionId: comp.id, id: { in: unqualifiedTeamIds } },
        data: { isQualifiedForKnockout: false },
      });
    }
  }, { timeout: 30_000 });
}

// ─── 2. RECALCULATE PLAYER STATISTICS ─────────────────────────────────────────

export async function recalculatePlayerStatistics(competitionId?: string) {
  if (!hasDatabaseConfig()) return;

  const prisma = getPrismaClient();
  const calculatedAt = new Date();

  // Fetch all squad players enrolled in competitions
  const squadPlayers = await prisma.squadPlayer.findMany({
    where: {
      teamSeason: {
        competitions: {
          some: competitionId ? { competitionId } : {},
        },
      },
    },
    include: {
      teamSeason: {
        include: {
          competitions: {
            where: competitionId ? { competitionId } : undefined,
          },
        },
      },
    },
  });

  // Fetch all events for the targeted competitions
  const events = await prisma.matchEvent.findMany({
    where: {
      match: {
        ...(competitionId ? { competitionId } : {}),
        status: "FULLTIME",
        homeScore: { not: null },
        awayScore: { not: null },
      },
    },
    include: { match: true },
  });

  // Fetch all completed matches to calculate clean sheets and appearances
  const finishedMatches = await prisma.match.findMany({
    where: {
      status: "FULLTIME",
      homeScore: { not: null },
      awayScore: { not: null },
      ...(competitionId ? { competitionId } : {}),
    },
    include: {
      lineups: {
        include: { players: true },
      },
    },
  });

  const statsRows: Prisma.PlayerStatCreateManyInput[] = [];

  for (const sq of squadPlayers) {
    for (const compTeam of sq.teamSeason.competitions) {
      const compId = compTeam.competitionId;

      // Filter events involving this player in this competition
      const compEvents = events.filter((e) => e.match.competitionId === compId);

      const goals = compEvents.filter(
        (e) => e.playerId === sq.id && (e.type === "GOAL" || e.type === "PENALTY_SCORED")
      ).length;

      const assists = compEvents.filter((e) => e.assistPlayerId === sq.id).length;
      const yellowCards = compEvents.filter((e) => e.playerId === sq.id && e.type === "YELLOW_CARD").length;
      const redCards = compEvents.filter((e) => e.playerId === sq.id && e.type === "RED_CARD").length;
      const penaltiesScored = compEvents.filter(
        (e) => e.playerId === sq.id && e.type === "PENALTY_SCORED"
      ).length;
      const penaltiesMissed = compEvents.filter(
        (e) => e.playerId === sq.id && e.type === "PENALTY_MISSED"
      ).length;
      const ownGoals = compEvents.filter((e) => e.playerId === sq.id && e.type === "OWN_GOAL").length;

      // Calculate clean sheets (for goalkeepers who played in matches where team conceded 0)
      let cleanSheets = 0;
      let appearances = 0;
      let starts = 0;
      let goalsConceded = 0;

      finishedMatches
        .filter((m) => m.competitionId === compId)
        .forEach((m) => {
          const isHome = m.homeCompetitionTeamId === compTeam.id;
          const isAway = m.awayCompetitionTeamId === compTeam.id;
          if (!isHome && !isAway) return;

          // Check if player had an event or was in lineup
          const hadEvent = compEvents.some(
            (e) =>
              e.matchId === m.id &&
              (e.playerId === sq.id || e.playerInId === sq.id || e.assistPlayerId === sq.id)
          );
          const lineupPlayer = m.lineups
            .find((lineup) => lineup.competitionTeamId === compTeam.id)
            ?.players.find((player) => player.squadPlayerId === sq.id);
          const wasInLineup = Boolean(lineupPlayer);

          if (hadEvent || wasInLineup) {
            appearances++;
            if (lineupPlayer?.role === "STARTER") starts++;
            if (sq.positionCategory === "GOALKEEPER") {
              const matchGoalsConceded = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
              goalsConceded += matchGoalsConceded;
              if (matchGoalsConceded === 0) {
                cleanSheets++;
              }
            }
          }
        });

      statsRows.push({
        seasonId: sq.seasonId,
        competitionId: compId,
        squadPlayerId: sq.id,
        appearances,
        starts,
        goals,
        assists,
        cleanSheets,
        yellowCards,
        redCards,
        goalsConceded,
        ownGoals,
        penaltiesScored,
        penaltiesMissed,
        calculatedAt,
      });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.playerStat.deleteMany({
      where: competitionId ? { competitionId } : {},
    });

    if (statsRows.length > 0) {
      await tx.playerStat.createMany({ data: statsRows });
    }
  }, { timeout: 60_000 });
}

// ─── 3. RECALCULATE EVERYTHING ────────────────────────────────────────────────

export async function recalculateAllLeagueTablesAndStats(targetCompetitionId?: string) {
  if (!hasDatabaseConfig()) return;

  const prisma = getPrismaClient();

  if (targetCompetitionId) {
    await recalculateCompetitionStandings(targetCompetitionId);
    await recalculatePlayerStatistics(targetCompetitionId);
  } else {
    const competitions = await prisma.competition.findMany({ select: { id: true } });
    for (const comp of competitions) {
      await recalculateCompetitionStandings(comp.id);
    }
    await recalculatePlayerStatistics();
  }
}
