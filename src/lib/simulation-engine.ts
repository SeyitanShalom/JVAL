import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import type { MatchEventType, MatchStage, Prisma } from "@prisma/client";
import { recalculateAllLeagueTablesAndStats } from "@/lib/standings-engine";
import {
  generateKnockoutBracket,
  type EngineVenue,
} from "@/lib/tournament-engine";

// ─── 1. SIMULATE A SINGLE MATCH ───────────────────────────────────────────────

export type SimulateMatchResult = {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
  eventsCount: number;
  stage: string;
};

export async function simulateSingleMatch(
  matchId: string,
  options?: { mode?: "realistic" | "high_scoring" | "penalty_thriller" }
): Promise<SimulateMatchResult | null> {
  if (!hasDatabaseConfig()) return null;

  const prisma = getPrismaClient();

  // 1. Fetch match with squads
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      competition: true,
      homeCompetitionTeam: {
        include: {
          teamSeason: {
            include: {
              team: true,
              squadPlayers: { include: { player: true } },
            },
          },
        },
      },
      awayCompetitionTeam: {
        include: {
          teamSeason: {
            include: {
              team: true,
              squadPlayers: { include: { player: true } },
            },
          },
        },
      },
    },
  });

  if (!match || !match.homeCompetitionTeam || !match.awayCompetitionTeam) {
    return null;
  }

  const homeSquad = match.homeCompetitionTeam.teamSeason.squadPlayers;
  const awaySquad = match.awayCompetitionTeam.teamSeason.squadPlayers;
  const isKnockout = match.stage !== "GROUP";
  const mode = options?.mode || (isKnockout && Math.random() < 0.25 ? "penalty_thriller" : "realistic");

  // Determine goals
  let homeGoals = 0;
  let awayGoals = 0;

  if (mode === "penalty_thriller" && isKnockout) {
    // Force a draw in regular time so penalties decide it
    const drawScore = Math.floor(Math.random() * 3); // 0-0, 1-1, 2-2
    homeGoals = drawScore;
    awayGoals = drawScore;
  } else if (mode === "high_scoring") {
    homeGoals = Math.floor(Math.random() * 4) + 1; // 1-4
    awayGoals = Math.floor(Math.random() * 4) + 1; // 1-4
  } else {
    // Realistic football score distribution
    const roll = Math.random();
    if (roll < 0.20) { homeGoals = 1; awayGoals = 0; }
    else if (roll < 0.35) { homeGoals = 2; awayGoals = 1; }
    else if (roll < 0.50) { homeGoals = 1; awayGoals = 1; }
    else if (roll < 0.65) { homeGoals = 0; awayGoals = 1; }
    else if (roll < 0.75) { homeGoals = 2; awayGoals = 0; }
    else if (roll < 0.85) { homeGoals = 3; awayGoals = 1; }
    else if (roll < 0.93) { homeGoals = 0; awayGoals = 0; }
    else { homeGoals = 3; awayGoals = 2; }
  }

  // Clear existing events/penalties for this match before re-simulating
  await prisma.matchEvent.deleteMany({ where: { matchId } });
  await prisma.penaltyAttempt.deleteMany({ where: { matchId } });

  const eventsToCreate: Array<{
    matchId: string;
    competitionTeamId: string;
    type: MatchEventType;
    minute: number;
    minuteLabel: string;
    playerId: string | null;
    assistPlayerId: string | null;
    playerInId: string | null;
    playerOutId: string | null;
    note: string | null;
  }> = [];

  // Helper to pick a random player (weighted toward Forwards/Midfielders for goals)
  const pickScorer = (squad: typeof homeSquad) => {
    if (squad.length === 0) return null;
    const attackers = squad.filter(
      (p) => p.positionCategory === "FORWARD" || p.positionCategory === "MIDFIELDER"
    );
    const pool = attackers.length > 0 && Math.random() < 0.85 ? attackers : squad;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return picked.id;
  };

  const pickAssist = (squad: typeof homeSquad, scorerId: string | null) => {
    if (squad.length <= 1 || Math.random() < 0.3) return null; // 30% unassisted
    const others = squad.filter((p) => p.id !== scorerId);
    if (others.length === 0) return null;
    return others[Math.floor(Math.random() * others.length)].id;
  };

  // Generate Home Goals
  for (let i = 0; i < homeGoals; i++) {
    const minute = Math.floor(Math.random() * 88) + 2; // 2' to 90'
    const scorer = pickScorer(homeSquad);
    const assist = pickAssist(homeSquad, scorer);
    const isPen = Math.random() < 0.12;
    eventsToCreate.push({
      matchId,
      competitionTeamId: match.homeCompetitionTeamId!,
      type: isPen ? "PENALTY_SCORED" : "GOAL",
      minute,
      minuteLabel: minute + "'",
      playerId: scorer,
      assistPlayerId: isPen ? null : assist,
      playerInId: null,
      playerOutId: null,
      note: isPen ? "Penalty converted" : null,
    });
  }

  // Generate Away Goals
  for (let i = 0; i < awayGoals; i++) {
    const minute = Math.floor(Math.random() * 88) + 2;
    const scorer = pickScorer(awaySquad);
    const assist = pickAssist(awaySquad, scorer);
    const isPen = Math.random() < 0.12;
    eventsToCreate.push({
      matchId,
      competitionTeamId: match.awayCompetitionTeamId!,
      type: isPen ? "PENALTY_SCORED" : "GOAL",
      minute,
      minuteLabel: minute + "'",
      playerId: scorer,
      assistPlayerId: isPen ? null : assist,
      playerInId: null,
      playerOutId: null,
      note: isPen ? "Penalty converted" : null,
    });
  }

  // Generate Yellow/Red Cards (1 to 4 cards total)
  const cardCount = Math.floor(Math.random() * 4) + 1;
  for (let i = 0; i < cardCount; i++) {
    const isHome = Math.random() < 0.5;
    const squad = isHome ? homeSquad : awaySquad;
    const teamId = isHome ? match.homeCompetitionTeamId! : match.awayCompetitionTeamId!;
    if (squad.length > 0) {
      const minute = Math.floor(Math.random() * 85) + 5;
      const player = squad[Math.floor(Math.random() * squad.length)].id;
      const isRed = Math.random() < 0.08;
      eventsToCreate.push({
        matchId,
        competitionTeamId: teamId,
        type: isRed ? "RED_CARD" : "YELLOW_CARD",
        minute,
        minuteLabel: minute + "'",
        playerId: player,
        assistPlayerId: null,
        playerInId: null,
        playerOutId: null,
        note: isRed ? "Straight red card" : "Caution for foul",
      });
    }
  }

  // Generate 1-2 substitutions per team
  [
    { squad: homeSquad, teamId: match.homeCompetitionTeamId! },
    { squad: awaySquad, teamId: match.awayCompetitionTeamId! },
  ].forEach(({ squad, teamId }) => {
    if (squad.length >= 4) {
      const subCount = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < subCount; i++) {
        const minute = Math.floor(Math.random() * 35) + 55; // 55' to 90'
        const pIn = squad[i]?.id;
        const pOut = squad[squad.length - 1 - i]?.id;
        if (pIn && pOut && pIn !== pOut) {
          eventsToCreate.push({
            matchId,
            competitionTeamId: teamId,
            type: "SUBSTITUTION",
            minute,
            minuteLabel: minute + "'",
            playerId: null,
            assistPlayerId: null,
            playerInId: pIn,
            playerOutId: pOut,
            note: "Tactical change",
          });
        }
      }
    }
  });

  // Sort events chronologically by minute
  eventsToCreate.sort((a, b) => a.minute - b.minute);

  // Handle Penalty Shootout if Knockout Match ends in a Draw
  let homePenaltyScore: number | null = null;
  let awayPenaltyScore: number | null = null;
  const penaltiesToCreate: Array<{
    matchId: string;
    competitionTeamId: string;
    takerId: string;
    sequence: number;
    round: number;
    scored: boolean;
    note: string | null;
  }> = [];

  if (isKnockout && homeGoals === awayGoals) {
    let homePens = 0;
    let awayPens = 0;
    let seq = 1;
    const canRecordPenaltyAttempts = homeSquad.length > 0 && awaySquad.length > 0;

    // First 5 standard rounds
    for (let r = 1; r <= 5; r++) {
      // Home kick
      const hScored = Math.random() < 0.78;
      if (hScored) homePens++;
      const hTaker = homeSquad[(r - 1) % homeSquad.length]?.id;
      if (canRecordPenaltyAttempts && hTaker) {
        penaltiesToCreate.push({
          matchId,
          competitionTeamId: match.homeCompetitionTeamId!,
          takerId: hTaker,
          sequence: seq++,
          round: r,
          scored: hScored,
          note: hScored ? "Converted bottom corner" : "Saved by goalkeeper",
        });
      }

      // Away kick
      const aScored = Math.random() < 0.78;
      if (aScored) awayPens++;
      const aTaker = awaySquad[(r - 1) % awaySquad.length]?.id;
      if (canRecordPenaltyAttempts && aTaker) {
        penaltiesToCreate.push({
          matchId,
          competitionTeamId: match.awayCompetitionTeamId!,
          takerId: aTaker,
          sequence: seq++,
          round: r,
          scored: aScored,
          note: aScored ? "Converted" : "Hit the crossbar",
        });
      }
    }

    // Sudden death if tied after 5 kicks
    let suddenDeathRound = 6;
    while (homePens === awayPens && suddenDeathRound <= 11) {
      const hScored = Math.random() < 0.75;
      if (hScored) homePens++;
      const hTaker = homeSquad[(suddenDeathRound - 1) % homeSquad.length]?.id;
      if (canRecordPenaltyAttempts && hTaker) {
        penaltiesToCreate.push({
          matchId,
          competitionTeamId: match.homeCompetitionTeamId!,
          takerId: hTaker,
          sequence: seq++,
          round: suddenDeathRound,
          scored: hScored,
          note: hScored ? "Sudden death goal" : "Missed target",
        });
      }

      const aScored = Math.random() < 0.75;
      if (aScored) awayPens++;
      const aTaker = awaySquad[(suddenDeathRound - 1) % awaySquad.length]?.id;
      if (canRecordPenaltyAttempts && aTaker) {
        penaltiesToCreate.push({
          matchId,
          competitionTeamId: match.awayCompetitionTeamId!,
          takerId: aTaker,
          sequence: seq++,
          round: suddenDeathRound,
          scored: aScored,
          note: aScored ? "Sudden death goal" : "Saved",
        });
      }

      suddenDeathRound++;
    }

    // If still tied at round 11, force a 1-point difference
    if (homePens === awayPens) {
      homePens++;
    }

    homePenaltyScore = homePens;
    awayPenaltyScore = awayPens;
  }

  // Save everything to DB in a single transaction
  await prisma.$transaction([
    // Insert events
    ...eventsToCreate.map((e) => prisma.matchEvent.create({ data: e })),
    // Insert penalty attempts
    ...penaltiesToCreate.map((p) => prisma.penaltyAttempt.create({ data: p })),
    // Update match to FULLTIME
    prisma.match.update({
      where: { id: matchId },
      data: {
        status: "FULLTIME",
        minuteLabel: "FT",
        currentPeriod: "FULL_TIME",
        secondHalfEndedAt: new Date(),
        homeScore: homeGoals,
        awayScore: awayGoals,
        homePenaltyScore,
        awayPenaltyScore,
      },
    }),
  ]);

  // Recalculate standings and stats
  await recalculateAllLeagueTablesAndStats(match.competitionId);

  // Check and advance knockout bracket progression if needed!
  if (isKnockout) {
    await advanceKnockoutProgression(match.competitionId);
  }

  return {
    matchId,
    homeTeamName: match.homeCompetitionTeam.teamSeason.team.name,
    awayTeamName: match.awayCompetitionTeam.teamSeason.team.name,
    homeScore: homeGoals,
    awayScore: awayGoals,
    homePenaltyScore,
    awayPenaltyScore,
    eventsCount: eventsToCreate.length,
    stage: match.stage,
  };
}

// ─── 2. KNOCKOUT AUTOMATIC PROGRESSION ────────────────────────────────────────

export async function advanceKnockoutProgression(competitionId: string) {
  if (!hasDatabaseConfig()) return;

  const prisma = getPrismaClient();

  const knockoutMatches = await prisma.match.findMany({
    where: {
      competitionId,
      stage: { in: ["QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"] },
    },
    include: {
      homeCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
      awayCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
    },
    orderBy: { kickoffAt: "asc" },
  });

  const getWinner = (m: (typeof knockoutMatches)[0]) => {
    if (m.status !== "FULLTIME") return null;
    const hs = m.homeScore ?? 0;
    const as = m.awayScore ?? 0;
    if (hs > as) return m.homeCompetitionTeamId;
    if (as > hs) return m.awayCompetitionTeamId;
    if (m.homePenaltyScore !== null && m.awayPenaltyScore !== null) {
      return m.homePenaltyScore > m.awayPenaltyScore
        ? m.homeCompetitionTeamId
        : m.awayCompetitionTeamId;
    }
    return null;
  };

  const getLoser = (m: (typeof knockoutMatches)[0]) => {
    const winner = getWinner(m);
    if (!winner) return null;
    return winner === m.homeCompetitionTeamId ? m.awayCompetitionTeamId : m.homeCompetitionTeamId;
  };

  const qfs = knockoutMatches.filter((m) => m.stage === "QUARTER_FINAL");
  const sfs = knockoutMatches.filter((m) => m.stage === "SEMI_FINAL");
  const third = knockoutMatches.find((m) => m.stage === "THIRD_PLACE");
  const final = knockoutMatches.find((m) => m.stage === "FINAL");

  // Advance QF winners to SFs
  if (qfs.length === 4 && qfs.every((q) => q.status === "FULLTIME") && sfs.length === 2) {
    const wQF1 = getWinner(qfs[0]);
    const wQF2 = getWinner(qfs[1]);
    const wQF3 = getWinner(qfs[2]);
    const wQF4 = getWinner(qfs[3]);

    if (wQF1 && wQF4 && sfs[0].status === "UPCOMING") {
      await prisma.match.update({
        where: { id: sfs[0].id },
        data: {
          homeCompetitionTeamId: wQF1,
          awayCompetitionTeamId: wQF4,
        },
      });
    }

    if (wQF2 && wQF3 && sfs[1].status === "UPCOMING") {
      await prisma.match.update({
        where: { id: sfs[1].id },
        data: {
          homeCompetitionTeamId: wQF2,
          awayCompetitionTeamId: wQF3,
        },
      });
    }
  }

  // Advance SF winners to Final and losers to 3rd Place
  if (sfs.length === 2 && sfs.every((s) => s.status === "FULLTIME")) {
    const wSF1 = getWinner(sfs[0]);
    const wSF2 = getWinner(sfs[1]);
    const lSF1 = getLoser(sfs[0]);
    const lSF2 = getLoser(sfs[1]);

    if (wSF1 && wSF2 && final && final.status === "UPCOMING") {
      await prisma.match.update({
        where: { id: final.id },
        data: {
          homeCompetitionTeamId: wSF1,
          awayCompetitionTeamId: wSF2,
        },
      });
    }

    if (lSF1 && lSF2 && third && third.status === "UPCOMING") {
      await prisma.match.update({
        where: { id: third.id },
        data: {
          homeCompetitionTeamId: lSF1,
          awayCompetitionTeamId: lSF2,
        },
      });
    }
  }

  // Record Champion if Final is complete
  if (final && final.status === "FULLTIME") {
    const championId = getWinner(final);
    const runnerUpId = getLoser(final);

    if (championId && runnerUpId) {
      const champion = await prisma.competitionTeam.findUnique({
        where: { id: championId },
        include: { teamSeason: { include: { team: true } } },
      });
      const runnerUp = await prisma.competitionTeam.findUnique({
        where: { id: runnerUpId },
        include: { teamSeason: { include: { team: true } } },
      });

      if (champion && runnerUp) {
        // Record Champion Award
        await prisma.awardRecord.upsert({
          where: { id: "champion-" + competitionId },
          create: {
            id: "champion-" + competitionId,
            type: "AWARD",
            seasonId: final.seasonId,
            competitionId,
            title: "Competition Champion",
            winnerText: champion.teamSeason.team.name,
            detail: "Winner of Grand Final (" + final.homeScore + "-" + final.awayScore + ")",
          },
          update: {
            type: "AWARD",
            winnerText: champion.teamSeason.team.name,
            detail: "Winner of Grand Final (" + final.homeScore + "-" + final.awayScore + ")",
          },
        });
      }
    }
  }
}

// ─── 3. SIMULATE BATCH MATCHES / MATCHDAY ─────────────────────────────────────

export async function simulateBatchMatches(
  competitionId: string,
  matchday?: string
): Promise<{ count: number; results: SimulateMatchResult[] }> {
  if (!hasDatabaseConfig()) return { count: 0, results: [] };

  const prisma = getPrismaClient();

  const whereClause: Prisma.MatchWhereInput = {
    competitionId,
    status: "UPCOMING",
    homeCompetitionTeamId: { not: null },
    awayCompetitionTeamId: { not: null },
  };

  if (matchday && matchday !== "all") {
    whereClause.matchday = matchday;
  }

  const upcomingMatches = await prisma.match.findMany({
    where: whereClause,
    orderBy: { kickoffAt: "asc" },
  });

  const results: SimulateMatchResult[] = [];

  for (const m of upcomingMatches) {
    const res = await simulateSingleMatch(m.id);
    if (res) results.push(res);
  }

  return { count: results.length, results };
}

// ─── 4. FULL TOURNAMENT END-TO-END SIMULATION ─────────────────────────────────

export async function simulateFullTournament(competitionId: string) {
  if (!hasDatabaseConfig()) return;

  const prisma = getPrismaClient();

  // 1. Simulate all group matches
  await simulateBatchMatches(competitionId);

  // 2. Check if Knockout matches exist
  const knockoutMatches = await prisma.match.findMany({
    where: {
      competitionId,
      stage: { in: ["QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"] },
    },
  });

  // If no knockout matches exist, generate them
  if (knockoutMatches.length === 0) {
    const [comp, dbVenues, dbStandings] = await Promise.all([
      prisma.competition.findUnique({
        where: { id: competitionId },
        include: { teams: { include: { teamSeason: { include: { team: true } } } } },
      }),
      prisma.venue.findMany(),
      prisma.competitionStanding.findMany({
        where: { competitionId },
        orderBy: { rank: "asc" },
        include: {
          competitionTeam: {
            include: { teamSeason: { include: { team: true } } },
          },
        },
      }),
    ]);

    if (comp && dbVenues.length > 0 && dbStandings.length >= 8) {
      const top8 = dbStandings.slice(0, 8).map((s) => ({
        id: s.competitionTeam.id,
        name: s.competitionTeam.teamSeason.team.name,
        shortName: s.competitionTeam.teamSeason.team.shortName,
      }));

      const engineVenues: EngineVenue[] = dbVenues.map((v) => ({ id: v.id, name: v.name, location: v.location }));
      const generated = generateKnockoutBracket({
        competitionId,
        seasonId: comp.seasonId,
        top8RankedTeams: top8,
        venues: engineVenues,
        knockoutStartDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });

      await prisma.$transaction(
        generated.map((fix) =>
          prisma.match.create({
            data: {
              seasonId: comp.seasonId,
              competitionId,
              homeCompetitionTeamId: fix.homeTeamId,
              awayCompetitionTeamId: fix.awayTeamId,
              venueId: fix.venueId,
              slug: fix.slug,
              matchday: fix.matchday,
              stage: fix.stage as MatchStage,
              status: "UPCOMING",
              kickoffAt: fix.kickoffAt,
              neutralVenue: true,
            },
          })
        )
      );
    }
  }

  // 3. Simulate Quarter-Finals
  const qfs = await prisma.match.findMany({
    where: { competitionId, stage: "QUARTER_FINAL", status: "UPCOMING" },
  });
  for (const qf of qfs) {
    await simulateSingleMatch(qf.id);
  }

  // 4. Simulate Semi-Finals (now populated with winners)
  const sfs = await prisma.match.findMany({
    where: { competitionId, stage: "SEMI_FINAL", status: "UPCOMING" },
  });
  for (const sf of sfs) {
    await simulateSingleMatch(sf.id);
  }

  // 5. Simulate 3rd Place & Final
  const finals = await prisma.match.findMany({
    where: {
      competitionId,
      stage: { in: ["THIRD_PLACE", "FINAL"] },
      status: "UPCOMING",
    },
  });
  for (const fn of finals) {
    await simulateSingleMatch(fn.id);
  }

  // Final standing & stats recalculation
  await recalculateAllLeagueTablesAndStats(competitionId);
}

// ─── 5. RESET SIMULATION ──────────────────────────────────────────────────────

export async function resetCompetitionMatches(competitionId: string) {
  if (!hasDatabaseConfig()) return;

  const prisma = getPrismaClient();

  const compMatches = await prisma.match.findMany({
    where: { competitionId },
    select: { id: true, stage: true },
  });

  const matchIds = compMatches.map((m) => m.id);

  // Delete events and penalties
  await prisma.matchEvent.deleteMany({ where: { matchId: { in: matchIds } } });
  await prisma.penaltyAttempt.deleteMany({ where: { matchId: { in: matchIds } } });

  // Delete knockout matches that were dynamically generated
  await prisma.match.deleteMany({
    where: {
      competitionId,
      stage: { in: ["QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"] },
    },
  });

  // Reset group matches to UPCOMING with null scores
  await prisma.match.updateMany({
    where: { competitionId, stage: "GROUP" },
    data: {
      status: "UPCOMING",
      minuteLabel: null,
      currentPeriod: "FIRST_HALF",
      firstHalfStartedAt: null,
      firstHalfEndedAt: null,
      secondHalfStartedAt: null,
      secondHalfEndedAt: null,
      extraTimeStartedAt: null,
      extraTimeEndedAt: null,
      stoppageTimeFirstHalf: null,
      stoppageTimeSecondHalf: null,
      homeScore: null,
      awayScore: null,
      homePenaltyScore: null,
      awayPenaltyScore: null,
    },
  });

  // Recalculate standings back to zero
  await recalculateAllLeagueTablesAndStats(competitionId);
}
