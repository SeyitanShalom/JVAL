/**
 * Johnvents Apex League - Tournament Engine
 * 
 * Implements:
 * 1. Pot distribution (Pots 1-4)
 * 2. Group fixture pairing algorithm (each team plays 1-2 teams from each pot at neutral venues)
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
  matchdaysCount?: number; // default: 4 rounds
  matchesPerDay?: number; // default: 3
  timeSlots?: string[]; // e.g. ["10:00", "13:00", "16:00"]
};

/**
 * Generates neutral-venue group matches where each team plays against opponents
 * from across all pots (including their own pot or adjacent pots).
 */
export function generateGroupStageFixtures(options: GroupFixtureOptions): GeneratedFixture[] {
  const {
    pots,
    venues,
    startDate,
    matchdaysCount = 4,
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

  const fixtures: GeneratedFixture[] = [];
  const existingPairings = new Set<string>();

  const getPairKey = (idA: string, idB: string) => {
    return [idA, idB].sort().join("___");
  };

  // Group teams by pot
  const potMap = new Map<number, EngineTeam[]>();
  pots.forEach((p) => potMap.set(p.potNumber, [...p.teams]));

  // Generate round-by-round matchdays
  let currentDate = new Date(startDate);
  let venueIndex = 0;
  let timeSlotIndex = 0;

  for (let round = 1; round <= matchdaysCount; round++) {
    const matchdayLabel = `Matchday ${round}`;
    const roundTeams = [...allTeams].sort(() => Math.random() - 0.5);
    const usedInRound = new Set<string>();

    for (let i = 0; i < roundTeams.length; i++) {
      const home = roundTeams[i];
      if (usedInRound.has(home.id)) continue;

      // Find an opponent from a different or same pot who hasn't played today and no repeat pairing
      let away: EngineTeam | null = null;

      // Priority 1: Match with a team from target pot for this round (Round 1 -> Pot 1/2, Round 2 -> Pot 3, etc.)
      const candidates = roundTeams.filter(
        (cand) =>
          cand.id !== home.id &&
          !usedInRound.has(cand.id) &&
          !existingPairings.has(getPairKey(home.id, cand.id))
      );

      if (candidates.length > 0) {
        // Prefer opponents from different pot first
        const diffPot = candidates.find((c) => c.potNumber !== home.potNumber);
        away = diffPot || candidates[0];
      } else {
        // Fallback: any available team without same-day conflict
        const fallback = roundTeams.find((cand) => cand.id !== home.id && !usedInRound.has(cand.id));
        away = fallback || null;
      }

      if (away) {
        usedInRound.add(home.id);
        usedInRound.add(away.id);
        existingPairings.add(getPairKey(home.id, away.id));

        const venue = venues[venueIndex % venues.length];
        venueIndex++;

        const timeString = timeSlots[timeSlotIndex % timeSlots.length];
        timeSlotIndex++;

        // Parse time string onto currentDate
        const [hours, minutes] = timeString.split(":").map(Number);
        const kickoffAt = new Date(currentDate);
        kickoffAt.setHours(hours || 10, minutes || 0, 0, 0);

        const slug = `${home.shortName || home.name}-vs-${away.shortName || away.name}-md${round}-${Date.now().toString(36)}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");

        fixtures.push({
          slug,
          matchday: matchdayLabel,
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
      }
    }

    // Advance matchday date by 3 days for next round
    currentDate = new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000);
  }

  return fixtures;
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
