/**
 * Johnvents Apex League - Tournament Engine
 * 
 * Implements:
 * 1. Pot distribution for a configurable number of pots
 * 2. League-phase fixture pairing from configurable pot rules
 * 3. Knockout bracket generator (Top 8 -> QF -> SF -> 3rd Place -> Final)
 * 4. Super Cup 32-team pathway (Top 8 from 4 LGA competitions)
 */

export type EngineTeam = {
  id: string;
  name: string;
  shortName?: string;
  potNumber?: number;
  community?: string;
  seed?: number;
};

export type EngineVenue = {
  id: string;
  name: string;
  location?: string;
};

export type GeneratedFixture = {
  slug: string;
  matchday: string;
  stage: "GROUP" | "QUARTER_FINAL" | "SEMI_FINAL" | "THIRD_PLACE" | "FINAL";
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  venueId: string;
  venueName: string;
  kickoffAt: Date;
  neutralVenue: boolean;
};

export type PotAllocation = {
  potNumber: number;
  teams: EngineTeam[];
};

// ─── 1. POT DISTRIBUTION ──────────────────────────────────────────────────────

/**
 * Distributes a list of teams evenly across `potCount` (default: 4) pots.
 * If randomize is true, shuffles teams first; otherwise preserves seeded order.
 */
export function distributeTeamsIntoPots(
  teams: EngineTeam[],
  potCount = 4,
  randomize = true
): PotAllocation[] {
  const pool = randomize ? [...teams].sort(() => Math.random() - 0.5) : [...teams];
  const pots: PotAllocation[] = Array.from({ length: potCount }, (_, i) => ({
    potNumber: i + 1,
    teams: [],
  }));

  pool.forEach((team, index) => {
    const potIndex = index % potCount;
    const assignedTeam = { ...team, potNumber: potIndex + 1 };
    pots[potIndex].teams.push(assignedTeam);
  });

  return pots;
}

// ─── 2. GROUP STAGE FIXTURE GENERATOR ─────────────────────────────────────────

export type GroupFixtureOptions = {
  competitionId: string;
  seasonId: string;
  pots: PotAllocation[];
  venues: EngineVenue[];
  startDate: Date;
  opponentsPerPot?: number; // default: 1 opponent from every eligible pot
  includeOwnPotOpponents?: boolean; // default: true
  matchdaysCount?: number; // minimum number of league-phase matchdays
  matchesPerDay?: number; // default: 3
  timeSlots?: string[]; // e.g. ["10:00", "13:00", "16:00"]
};

/**
 * Generates neutral-venue league-phase matches from pot rules.
 * Teams share one table, while fixtures are selected from each configured pot.
 */
export function generateGroupStageFixtures(options: GroupFixtureOptions): GeneratedFixture[] {
  const {
    pots,
    venues,
    startDate,
    opponentsPerPot = 1,
    includeOwnPotOpponents = true,
    matchdaysCount,
    matchesPerDay,
    timeSlots = ["09:00", "12:00", "15:00", "17:30"],
  } = options;

  if (venues.length === 0) {
    throw new Error("At least one neutral venue is required to generate fixtures.");
  }

  // Flatten all teams with assigned pot numbers
  const allTeams: EngineTeam[] = [];
  pots.forEach((p) => {
    p.teams.forEach((t) => allTeams.push({ ...t, potNumber: p.potNumber }));
  });

  if (allTeams.length < 2) {
    throw new Error("At least 2 teams are required to generate fixtures.");
  }

  const fixturePairs = buildLeaguePhasePairings(
    pots,
    Math.max(1, Math.floor(opponentsPerPot)),
    includeOwnPotOpponents
  );

  if (fixturePairs.length === 0) {
    throw new Error("No valid pot-based fixtures could be generated for this competition.");
  }

  const minimumMatchdays = matchdaysCount ? Math.max(1, matchdaysCount) : 0;
  const rounds = spreadPairsAcrossMatchdays(fixturePairs, minimumMatchdays);
  const maxVenueSlotsPerDay = venues.length * Math.max(1, timeSlots.length);
  const maxMatchesPerDay = Math.max(
    1,
    Math.min(maxVenueSlotsPerDay, matchesPerDay ?? maxVenueSlotsPerDay)
  );
  const fixtures: GeneratedFixture[] = [];
  let dayOffset = 0;

  rounds.forEach((roundPairs, roundIndex) => {
    const daysNeeded = Math.max(1, Math.ceil(roundPairs.length / maxMatchesPerDay));

    roundPairs.forEach((pair, matchIndex) => {
      const slotNumber = matchIndex % maxMatchesPerDay;
      const venue = venues[slotNumber % venues.length];
      const timeString = timeSlots[Math.floor(slotNumber / venues.length) % timeSlots.length] ?? "10:00";
      const [hours, minutes] = timeString.split(":").map(Number);
      const kickoffAt = new Date(startDate.getTime() + (dayOffset + Math.floor(matchIndex / maxMatchesPerDay)) * 24 * 60 * 60 * 1000);
      kickoffAt.setHours(hours || 10, minutes || 0, 0, 0);

      const { home, away } = balanceHomeAway(pair, fixtures);
      const fixtureNumber = fixtures.length + 1;
      const slug = `${home.shortName || home.name}-vs-${away.shortName || away.name}-md${roundIndex + 1}-${fixtureNumber}-${Date.now().toString(36)}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      fixtures.push({
        slug,
        matchday: `Matchday ${roundIndex + 1}`,
        stage: "GROUP",
        homeTeamId: home.id,
        homeTeamName: home.name,
        awayTeamId: away.id,
        awayTeamName: away.name,
        venueId: venue.id,
        venueName: venue.name,
        kickoffAt,
        neutralVenue: true,
      });
    });

    dayOffset += daysNeeded * 3;
  });

  return fixtures;
}

type FixturePair = {
  first: EngineTeam;
  second: EngineTeam;
};

function buildLeaguePhasePairings(
  pots: PotAllocation[],
  opponentsPerPot: number,
  includeOwnPotOpponents: boolean
): FixturePair[] {
  const pairings: FixturePair[] = [];
  const existingPairings = new Set<string>();
  const opponentCounts = new Map<string, Map<number, number>>();
  const activePots = pots
    .map((pot) => ({
      potNumber: pot.potNumber,
      teams: pot.teams.map((team) => ({ ...team, potNumber: pot.potNumber })),
    }))
    .filter((pot) => pot.teams.length > 0)
    .sort((a, b) => a.potNumber - b.potNumber);

  if (includeOwnPotOpponents) {
    activePots.forEach((pot) =>
      createSamePotPairings(pot, opponentsPerPot, pairings, existingPairings, opponentCounts)
    );
  }

  for (let leftIndex = 0; leftIndex < activePots.length; leftIndex++) {
    for (let rightIndex = leftIndex + 1; rightIndex < activePots.length; rightIndex++) {
      createCrossPotPairings(
        activePots[leftIndex],
        activePots[rightIndex],
        opponentsPerPot,
        pairings,
        existingPairings,
        opponentCounts
      );
    }
  }

  return pairings;
}

function createSamePotPairings(
  pot: PotAllocation,
  opponentsPerPot: number,
  pairings: FixturePair[],
  existingPairings: Set<string>,
  opponentCounts: Map<string, Map<number, number>>
) {
  const teams = pot.teams;
  if (teams.length < 2) return;

  const candidates: FixturePair[] = [];
  const seenCandidates = new Set<string>();

  for (let distance = 1; distance < teams.length; distance++) {
    teams.forEach((team, index) => {
      const opponent = teams[(index + distance) % teams.length];
      const key = getPairKey(team.id, opponent.id);

      if (!seenCandidates.has(key)) {
        seenCandidates.add(key);
        candidates.push({ first: team, second: opponent });
      }
    });
  }

  let madeProgress = true;
  while (
    madeProgress &&
    !teams.every((team) => getOpponentCount(opponentCounts, team.id, pot.potNumber) >= opponentsPerPot)
  ) {
    madeProgress = false;
    const sortedCandidates = [...candidates].sort((a, b) => {
      const aCount =
        getOpponentCount(opponentCounts, a.first.id, pot.potNumber) +
        getOpponentCount(opponentCounts, a.second.id, pot.potNumber);
      const bCount =
        getOpponentCount(opponentCounts, b.first.id, pot.potNumber) +
        getOpponentCount(opponentCounts, b.second.id, pot.potNumber);

      return aCount - bCount;
    });

    sortedCandidates.forEach((pair) => {
      if (addPair(pair.first, pair.second, opponentsPerPot, pairings, existingPairings, opponentCounts)) {
        madeProgress = true;
      }
    });
  }
}

function createCrossPotPairings(
  leftPot: PotAllocation,
  rightPot: PotAllocation,
  opponentsPerPot: number,
  pairings: FixturePair[],
  existingPairings: Set<string>,
  opponentCounts: Map<string, Map<number, number>>
) {
  if (leftPot.teams.length === 0 || rightPot.teams.length === 0) return;

  const maxOffsets = Math.max(leftPot.teams.length, rightPot.teams.length);

  for (let offset = 0; offset < maxOffsets; offset++) {
    if (
      leftPot.teams.every(
        (team) => getOpponentCount(opponentCounts, team.id, rightPot.potNumber) >= opponentsPerPot
      ) &&
      rightPot.teams.every(
        (team) => getOpponentCount(opponentCounts, team.id, leftPot.potNumber) >= opponentsPerPot
      )
    ) {
      return;
    }

    leftPot.teams.forEach((leftTeam, index) => {
      const rightTeam = rightPot.teams[(index + offset) % rightPot.teams.length];
      addPair(leftTeam, rightTeam, opponentsPerPot, pairings, existingPairings, opponentCounts);
    });
  }
}

function addPair(
  first: EngineTeam,
  second: EngineTeam,
  opponentsPerPot: number,
  pairings: FixturePair[],
  existingPairings: Set<string>,
  opponentCounts: Map<string, Map<number, number>>
) {
  const firstPot = first.potNumber;
  const secondPot = second.potNumber;
  const key = getPairKey(first.id, second.id);

  if (
    !firstPot ||
    !secondPot ||
    first.id === second.id ||
    existingPairings.has(key) ||
    getOpponentCount(opponentCounts, first.id, secondPot) >= opponentsPerPot ||
    getOpponentCount(opponentCounts, second.id, firstPot) >= opponentsPerPot
  ) {
    return false;
  }

  existingPairings.add(key);
  incrementOpponentCount(opponentCounts, first.id, secondPot);
  incrementOpponentCount(opponentCounts, second.id, firstPot);
  pairings.push({ first, second });
  return true;
}

function spreadPairsAcrossMatchdays(pairs: FixturePair[], requestedMatchdays: number) {
  const rounds: FixturePair[][] = Array.from({ length: requestedMatchdays }, () => []);

  pairs.forEach((pair, pairIndex) => {
    if (rounds.length === 0) {
      rounds.push([pair]);
      return;
    }

    const startIndex = pairIndex % rounds.length;
    for (let offset = 0; offset < rounds.length; offset++) {
      const round = rounds[(startIndex + offset) % rounds.length];
      if (!round.some((candidate) => pairsShareTeam(candidate, pair))) {
        round.push(pair);
        return;
      }
    }

    rounds.push([pair]);
  });

  return rounds.filter((round) => round.length > 0);
}

function balanceHomeAway(pair: FixturePair, fixtures: GeneratedFixture[]) {
  const firstHomeCount = fixtures.filter((fixture) => fixture.homeTeamId === pair.first.id).length;
  const secondHomeCount = fixtures.filter((fixture) => fixture.homeTeamId === pair.second.id).length;

  if (firstHomeCount > secondHomeCount) {
    return { home: pair.second, away: pair.first };
  }

  return { home: pair.first, away: pair.second };
}

function pairsShareTeam(first: FixturePair, second: FixturePair) {
  const firstTeamIds = new Set([first.first.id, first.second.id]);
  return firstTeamIds.has(second.first.id) || firstTeamIds.has(second.second.id);
}

function getPairKey(idA: string, idB: string) {
  return [idA, idB].sort().join("___");
}

function getOpponentCount(
  opponentCounts: Map<string, Map<number, number>>,
  teamId: string,
  targetPotNumber: number
) {
  return opponentCounts.get(teamId)?.get(targetPotNumber) ?? 0;
}

function incrementOpponentCount(
  opponentCounts: Map<string, Map<number, number>>,
  teamId: string,
  targetPotNumber: number
) {
  const teamCounts = opponentCounts.get(teamId) ?? new Map<number, number>();
  teamCounts.set(targetPotNumber, (teamCounts.get(targetPotNumber) ?? 0) + 1);
  opponentCounts.set(teamId, teamCounts);
}

// ─── 3. KNOCKOUT BRACKET GENERATOR ────────────────────────────────────────────

export type KnockoutSeedingParams = {
  competitionId: string;
  seasonId: string;
  top8RankedTeams: EngineTeam[]; // Ranked 1st to 8th
  venues: EngineVenue[];
  knockoutStartDate: Date;
};

/**
 * Generates Quarter-finals, Semi-finals, 3rd Place Match, and Final.
 * Direct penalty shootout on ties (handled at match level).
 */
export function generateKnockoutBracket(params: KnockoutSeedingParams): GeneratedFixture[] {
  const { top8RankedTeams, venues, knockoutStartDate } = params;

  if (top8RankedTeams.length < 8) {
    throw new Error("Exactly 8 qualified teams are required to seed the Quarter-finals.");
  }

  if (venues.length === 0) {
    throw new Error("At least one neutral venue is required for knockout matches.");
  }

  const fixtures: GeneratedFixture[] = [];
  const venue = venues[0];

  // ── Quarter-Finals ──
  // Match 1: Rank 1 vs Rank 8
  // Match 2: Rank 2 vs Rank 7
  // Match 3: Rank 3 vs Rank 6
  // Match 4: Rank 4 vs Rank 5
  const qfPairs = [
    { name: "Quarter-final 1", home: top8RankedTeams[0], away: top8RankedTeams[7], hour: 10 },
    { name: "Quarter-final 2", home: top8RankedTeams[1], away: top8RankedTeams[6], hour: 13 },
    { name: "Quarter-final 3", home: top8RankedTeams[2], away: top8RankedTeams[5], hour: 15 },
    { name: "Quarter-final 4", home: top8RankedTeams[3], away: top8RankedTeams[4], hour: 17 },
  ];

  const qfDate = new Date(knockoutStartDate);

  qfPairs.forEach((qf, i) => {
    const kickoff = new Date(qfDate);
    kickoff.setHours(qf.hour, 0, 0, 0);

    fixtures.push({
      slug: `qf${i + 1}-${qf.home.shortName || qf.home.name}-vs-${qf.away.shortName || qf.away.name}-${Date.now().toString(36)}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      matchday: qf.name,
      stage: "QUARTER_FINAL",
      homeTeamId: qf.home.id,
      homeTeamName: qf.home.name,
      awayTeamId: qf.away.id,
      awayTeamName: qf.away.name,
      venueId: venues[i % venues.length].id,
      venueName: venues[i % venues.length].name,
      kickoffAt: kickoff,
      neutralVenue: true,
    });
  });

  // ── Semi-Finals (Scheduled 4 days after QF) ──
  const sfDate = new Date(qfDate.getTime() + 4 * 24 * 60 * 60 * 1000);

  // SF1: Winner QF1 vs Winner QF4 (placeholder pairing with highest seed)
  const sf1Kickoff = new Date(sfDate);
  sf1Kickoff.setHours(14, 0, 0, 0);
  fixtures.push({
    slug: `sf1-winner-qf1-vs-winner-qf4-${Date.now().toString(36)}`.toLowerCase(),
    matchday: "Semi-final 1",
    stage: "SEMI_FINAL",
    homeTeamId: top8RankedTeams[0].id, // Seeded holder
    homeTeamName: `Winner QF1 (${top8RankedTeams[0].shortName || top8RankedTeams[0].name})`,
    awayTeamId: top8RankedTeams[3].id, // Seeded holder
    awayTeamName: `Winner QF4 (${top8RankedTeams[3].shortName || top8RankedTeams[3].name})`,
    venueId: venue.id,
    venueName: venue.name,
    kickoffAt: sf1Kickoff,
    neutralVenue: true,
  });

  // SF2: Winner QF2 vs Winner QF3
  const sf2Kickoff = new Date(sfDate);
  sf2Kickoff.setHours(16, 30, 0, 0);
  fixtures.push({
    slug: `sf2-winner-qf2-vs-winner-qf3-${Date.now().toString(36)}`.toLowerCase(),
    matchday: "Semi-final 2",
    stage: "SEMI_FINAL",
    homeTeamId: top8RankedTeams[1].id,
    homeTeamName: `Winner QF2 (${top8RankedTeams[1].shortName || top8RankedTeams[1].name})`,
    awayTeamId: top8RankedTeams[2].id,
    awayTeamName: `Winner QF3 (${top8RankedTeams[2].shortName || top8RankedTeams[2].name})`,
    venueId: venue.id,
    venueName: venue.name,
    kickoffAt: sf2Kickoff,
    neutralVenue: true,
  });

  // ── 3rd Place Match (4 days after SF) ──
  const finalDate = new Date(sfDate.getTime() + 4 * 24 * 60 * 60 * 1000);
  const thirdPlaceKickoff = new Date(finalDate);
  thirdPlaceKickoff.setHours(13, 0, 0, 0);

  fixtures.push({
    slug: `3rd-place-match-${Date.now().toString(36)}`.toLowerCase(),
    matchday: "3rd Place Playoff",
    stage: "THIRD_PLACE",
    homeTeamId: top8RankedTeams[2].id,
    homeTeamName: "Loser Semi-final 1",
    awayTeamId: top8RankedTeams[3].id,
    awayTeamName: "Loser Semi-final 2",
    venueId: venue.id,
    venueName: venue.name,
    kickoffAt: thirdPlaceKickoff,
    neutralVenue: true,
  });

  // ── Grand Final ──
  const finalKickoff = new Date(finalDate);
  finalKickoff.setHours(16, 0, 0, 0);

  fixtures.push({
    slug: `grand-final-${Date.now().toString(36)}`.toLowerCase(),
    matchday: "Grand Final",
    stage: "FINAL",
    homeTeamId: top8RankedTeams[0].id,
    homeTeamName: "Winner Semi-final 1",
    awayTeamId: top8RankedTeams[1].id,
    awayTeamName: "Winner Semi-final 2",
    venueId: venue.id,
    venueName: venue.name,
    kickoffAt: finalKickoff,
    neutralVenue: true,
  });

  return fixtures;
}

// ─── 4. SUPER CUP 32-TEAM QUALIFICATION FEED ──────────────────────────────────

export type LGAQualificationResult = {
  competitionId: string;
  competitionName: string;
  top8Teams: EngineTeam[];
};

/**
 * Validates and combines the Top 8 teams from each of the 4 LGA competitions
 * into the 32-team Super Cup roster.
 */
export function buildSuperCup32Roster(lgaResults: LGAQualificationResult[]): {
  totalTeams: number;
  roster: Array<EngineTeam & { qualifiedFromLGA: string; lgaRank: number }>;
  pots: PotAllocation[];
} {
  const roster: Array<EngineTeam & { qualifiedFromLGA: string; lgaRank: number }> = [];

  lgaResults.forEach((lga) => {
    const qualifiers = lga.top8Teams.slice(0, 8);
    qualifiers.forEach((team, index) => {
      roster.push({
        ...team,
        qualifiedFromLGA: lga.competitionName,
        lgaRank: index + 1,
      });
    });
  });

  // Super Cup Pots:
  // Pot 1: Champions & Runners-up of the 4 LGAs (Rank 1 & 2 from each = 8 teams)
  // Pot 2: 3rd & 4th place from each LGA (8 teams)
  // Pot 3: 5th & 6th place from each LGA (8 teams)
  // Pot 4: 7th & 8th place from each LGA (8 teams)
  const pot1 = roster.filter((t) => t.lgaRank === 1 || t.lgaRank === 2);
  const pot2 = roster.filter((t) => t.lgaRank === 3 || t.lgaRank === 4);
  const pot3 = roster.filter((t) => t.lgaRank === 5 || t.lgaRank === 6);
  const pot4 = roster.filter((t) => t.lgaRank === 7 || t.lgaRank === 8);

  const pots: PotAllocation[] = [
    { potNumber: 1, teams: pot1 },
    { potNumber: 2, teams: pot2 },
    { potNumber: 3, teams: pot3 },
    { potNumber: 4, teams: pot4 },
  ];

  return {
    totalTeams: roster.length,
    roster,
    pots,
  };
}
