import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const image = {
  logo: "/football club.png",
  player: "/Profile.png",
  hero: "/Hero Image.png",
  news: "/still-life-colombian-national-soccer-team.jpg",
};

async function main() {
  await prisma.$transaction([
    prisma.contactMethod.deleteMany(),
    prisma.siteContentBlock.deleteMany(),
    prisma.awardRecord.deleteMany(),
    prisma.galleryImage.deleteMany(),
    prisma.newsPost.deleteMany(),
    prisma.bracketSlot.deleteMany(),
    prisma.knockoutBracket.deleteMany(),
    prisma.playerStat.deleteMany(),
    prisma.teamStat.deleteMany(),
    prisma.competitionStanding.deleteMany(),
    prisma.penaltyAttempt.deleteMany(),
    prisma.matchEvent.deleteMany(),
    prisma.matchLineupPlayer.deleteMany(),
    prisma.matchLineup.deleteMany(),
    prisma.match.deleteMany(),
    prisma.fixtureGenerationRun.deleteMany(),
    prisma.squadPlayer.deleteMany(),
    prisma.competitionTeam.deleteMany(),
    prisma.player.deleteMany(),
    prisma.teamSeason.deleteMany(),
    prisma.team.deleteMany(),
    prisma.rankingRule.deleteMany(),
    prisma.competitionPot.deleteMany(),
    prisma.competitionGroup.deleteMany(),
    prisma.competitionFeed.deleteMany(),
    prisma.competition.deleteMany(),
    prisma.venue.deleteMany(),
    prisma.season.deleteMany(),
  ]);

  await prisma.season.createMany({
    data: [
      {
        id: "season_2026_2027",
        label: "2026/2027",
        slug: "2026-2027",
        status: "ACTIVE",
        isCurrent: true,
        startsAt: new Date("2026-08-01T00:00:00+01:00"),
        endsAt: new Date("2027-06-30T23:59:59+01:00"),
      },
      {
        id: "season_2025_2026",
        label: "2025/2026",
        slug: "2025-2026",
        status: "COMPLETED",
        isCurrent: false,
      },
      {
        id: "season_2024_2025",
        label: "2024/2025",
        slug: "2024-2025",
        status: "COMPLETED",
        isCurrent: false,
      },
    ],
  });

  await prisma.venue.createMany({
    data: [
      {
        id: "venue_akure_township",
        slug: "akure-township-stadium",
        name: "Akure Township Stadium",
        location: "Akure, Ondo State",
      },
      {
        id: "venue_ondo_sports_complex",
        slug: "ondo-sports-complex",
        name: "Ondo Sports Complex",
        location: "Ondo, Ondo State",
      },
      {
        id: "venue_owo_community_field",
        slug: "owo-community-field",
        name: "Owo Community Field",
        location: "Owo, Ondo State",
      },
      {
        id: "venue_idanre_center",
        slug: "idanre-football-center",
        name: "Idanre Football Center",
        location: "Idanre, Ondo State",
      },
    ],
  });

  await prisma.competition.createMany({
    data: [
      {
        id: "competition_akure",
        seasonId: "season_2026_2027",
        slug: "akure-south-north",
        name: "Akure South & North",
        type: "LGA",
        status: "ACTIVE",
        plannedTeamCount: 28,
        potCount: 4,
        opponentsPerPot: 1,
        qualifiersCount: 8,
        knockoutStartRound: "QUARTER_FINAL",
        description:
          "A 28-team local government competition using pot-based group fixtures before the top eight move into the knockout rounds.",
      },
      {
        id: "competition_ondo",
        seasonId: "season_2026_2027",
        slug: "ondo-ile-oluji",
        name: "Ondo & Ile-Oluji",
        type: "LGA",
        status: "ACTIVE",
        plannedTeamCount: 28,
        potCount: 4,
        opponentsPerPot: 1,
        qualifiersCount: 8,
        knockoutStartRound: "QUARTER_FINAL",
        description:
          "A combined competition for Ondo and Ile-Oluji teams, built around a single table and a quarter-final knockout path.",
      },
      {
        id: "competition_idanre",
        seasonId: "season_2026_2027",
        slug: "idanre",
        name: "Idanre",
        type: "LGA",
        status: "UPCOMING",
        plannedTeamCount: 10,
        potCount: 4,
        opponentsPerPot: 1,
        qualifiersCount: 8,
        knockoutStartRound: "QUARTER_FINAL",
        description:
          "A compact 10-team competition where pot assignments keep the group phase competitive before eight teams qualify.",
      },
      {
        id: "competition_owo_ose",
        seasonId: "season_2026_2027",
        slug: "owo-ose",
        name: "Owo & Ose",
        type: "LGA",
        status: "ACTIVE",
        plannedTeamCount: 16,
        potCount: 4,
        opponentsPerPot: 1,
        qualifiersCount: 8,
        knockoutStartRound: "QUARTER_FINAL",
        description:
          "A 16-team local government competition with neutral venues, table ranking, and a quarter-final knockout stage.",
      },
      {
        id: "competition_super_cup",
        seasonId: "season_2026_2027",
        slug: "super-cup",
        name: "Super Cup",
        type: "SUPER_CUP",
        status: "UPCOMING",
        plannedTeamCount: 32,
        potCount: 4,
        opponentsPerPot: 1,
        qualifiersCount: 16,
        knockoutStartRound: "ROUND_OF_16",
        description:
          "The 32-team championship for top-eight qualifiers from each local government competition, ending with a final and third-place match.",
      },
    ],
  });

  await prisma.competitionFeed.createMany({
    data: [
      {
        id: "feed_akure_super_cup",
        sourceCompetitionId: "competition_akure",
        targetCompetitionId: "competition_super_cup",
        qualifierCount: 8,
        sourceRankEnd: 8,
      },
      {
        id: "feed_ondo_super_cup",
        sourceCompetitionId: "competition_ondo",
        targetCompetitionId: "competition_super_cup",
        qualifierCount: 8,
        sourceRankEnd: 8,
      },
      {
        id: "feed_idanre_super_cup",
        sourceCompetitionId: "competition_idanre",
        targetCompetitionId: "competition_super_cup",
        qualifierCount: 8,
        sourceRankEnd: 8,
      },
      {
        id: "feed_owo_ose_super_cup",
        sourceCompetitionId: "competition_owo_ose",
        targetCompetitionId: "competition_super_cup",
        qualifierCount: 8,
        sourceRankEnd: 8,
      },
    ],
  });

  await Promise.all(
    [
      ["competition_akure", [7, 7, 7, 7]],
      ["competition_ondo", [7, 7, 7, 7]],
      ["competition_idanre", [3, 3, 2, 2]],
      ["competition_owo_ose", [4, 4, 4, 4]],
      ["competition_super_cup", [8, 8, 8, 8]],
    ].map(([competitionId, potSizes]) =>
      prisma.competitionPot.createMany({
        data: potSizes.map((targetTeamCount, index) => ({
          id: `pot_${competitionId}_${index + 1}`,
          competitionId,
          number: index + 1,
          name: `Pot ${index + 1}`,
          targetTeamCount,
        })),
      })
    )
  );

  await Promise.all(
    [
      "competition_akure",
      "competition_ondo",
      "competition_idanre",
      "competition_owo_ose",
      "competition_super_cup",
    ].map((competitionId) =>
      prisma.competitionGroup.create({
        data: {
          id: `group_${competitionId}_overall`,
          competitionId,
          slug: "overall",
          name: "Overall Table",
        },
      })
    )
  );

  const rankingRules = [
    { criterion: "POINTS", direction: "DESC" },
    { criterion: "GOAL_DIFFERENCE", direction: "DESC" },
    { criterion: "GOALS_SCORED", direction: "DESC" },
    { criterion: "HEAD_TO_HEAD", direction: "DESC" },
  ];

  await Promise.all(
    [
      "competition_akure",
      "competition_ondo",
      "competition_idanre",
      "competition_owo_ose",
      "competition_super_cup",
    ].map((competitionId) =>
      prisma.rankingRule.createMany({
        data: rankingRules.map((rule, index) => ({
          id: `ranking_${competitionId}_${index + 1}`,
          competitionId,
          order: index + 1,
          criterion: rule.criterion,
          direction: rule.direction,
        })),
      })
    )
  );

  const teamRows = [
    ["team_oyemekun", "oyemekun-fc", "Oyemekun FC", "OYE", "Akure South", "Coach Akin Adebayo", "Tomiwa Aluko"],
    ["team_aquinas", "aquinas-fc", "Aquinas FC", "AQU", "Akure North", "Coach Sunday Bello", "Daniel Ojo"],
    ["team_apex_united", "apex-united", "Apex United", "APX", "Akure South", "Coach Emmanuel Adeyemi", "Boluwatife James"],
    ["team_bright_stars", "bright-stars-fc", "Bright Stars FC", "BST", "Akure North", "Coach Femi Martins", "Ilerioluwa Falade"],
    ["team_ileoluji_stars", "ile-oluji-stars", "Ile-Oluji Stars", "IOS", "Ile-Oluji", "Coach Peter Ajayi", "Segun Afolabi"],
    ["team_ondo_city", "ondo-city-fc", "Ondo City FC", "OCF", "Ondo", "Coach Samuel Olanrewaju", "Victor Aina"],
    ["team_idanre_hills", "idanre-hills-fc", "Idanre Hills FC", "IDH", "Idanre", "Coach Kayode Lawal", "Ayo Martins"],
    ["team_owo_united", "owo-united", "Owo United", "OWO", "Owo", "Coach Tunde Akande", "Moses Ogunleye"],
    ["team_ose_rangers", "ose-rangers", "Ose Rangers", "OSE", "Ose", "Coach Gabriel Ade", "Seyi Adeola"],
    ["team_future_kings", "future-kings", "Future Kings", "FKG", "Qualified Teams", "Coach Isaac Tella", "Samuel George"],
  ];

  await prisma.team.createMany({
    data: teamRows.map(([id, slug, name, shortName, community]) => ({
      id,
      slug,
      name,
      shortName,
      community,
      logoUrl: image.logo,
    })),
  });

  await prisma.teamSeason.createMany({
    data: teamRows.map(([id, , , , , coachName, captainName]) => ({
      id: `team_season_${id.replace("team_", "")}`,
      seasonId: "season_2026_2027",
      teamId: id,
      coachName,
      captainName,
      squadLimit: 25,
    })),
  });

  const playerRows = [
    ["player_benjamin_evans", "benjamin-evans", "Benjamin Evans", "2008-04-14T00:00:00+01:00"],
    ["player_daniel_ojo", "daniel-ojo", "Daniel Ojo", "2007-11-02T00:00:00+01:00"],
    ["player_boluwatife_james", "boluwatife-james", "Boluwatife James", "2008-01-22T00:00:00+01:00"],
    ["player_tomiwa_aluko", "tomiwa-aluko", "Tomiwa Aluko", "2007-07-19T00:00:00+01:00"],
    ["player_ayo_martins", "ayo-martins", "Ayo Martins", "2007-09-09T00:00:00+01:00"],
    ["player_victor_aina", "victor-aina", "Victor Aina", "2008-06-27T00:00:00+01:00"],
    ["player_moses_ogunleye", "moses-ogunleye", "Moses Ogunleye", "2007-12-16T00:00:00+01:00"],
  ];

  await prisma.player.createMany({
    data: playerRows.map(([id, slug, fullName, dateOfBirth]) => ({
      id,
      slug,
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      photoUrl: image.player,
    })),
  });

  const squadRows = [
    ["squad_benjamin_evans", "team_season_oyemekun", "player_benjamin_evans", 9, "FORWARD", "ST"],
    ["squad_daniel_ojo", "team_season_aquinas", "player_daniel_ojo", 10, "MIDFIELDER", "AM"],
    ["squad_boluwatife_james", "team_season_apex_united", "player_boluwatife_james", 7, "FORWARD", "LW"],
    ["squad_tomiwa_aluko", "team_season_oyemekun", "player_tomiwa_aluko", 4, "DEFENDER", "CB"],
    ["squad_ayo_martins", "team_season_idanre_hills", "player_ayo_martins", 1, "GOALKEEPER", "GK"],
    ["squad_victor_aina", "team_season_ondo_city", "player_victor_aina", 8, "MIDFIELDER", "CM"],
    ["squad_moses_ogunleye", "team_season_owo_united", "player_moses_ogunleye", 11, "FORWARD", "RW"],
  ];

  await prisma.squadPlayer.createMany({
    data: squadRows.map(([id, teamSeasonId, playerId, squadNumber, positionCategory, detailedPosition]) => ({
      id,
      seasonId: "season_2026_2027",
      teamSeasonId,
      playerId,
      squadNumber,
      positionCategory,
      detailedPosition,
    })),
  });

  const competitionTeamRows = [
    ["entry_oyemekun_akure", "competition_akure", "team_season_oyemekun", 1, 1, true, true],
    ["entry_aquinas_akure", "competition_akure", "team_season_aquinas", 2, 2, true, true],
    ["entry_apex_akure", "competition_akure", "team_season_apex_united", 3, 3, true, true],
    ["entry_bright_stars_akure", "competition_akure", "team_season_bright_stars", 4, 4, false, false],
    ["entry_ileoluji_ondo", "competition_ondo", "team_season_ileoluji_stars", 1, 1, true, true],
    ["entry_ondo_city_ondo", "competition_ondo", "team_season_ondo_city", 2, 2, true, true],
    ["entry_idanre_hills_idanre", "competition_idanre", "team_season_idanre_hills", 1, 1, true, true],
    ["entry_owo_united_owo_ose", "competition_owo_ose", "team_season_owo_united", 1, 1, true, true],
    ["entry_ose_rangers_owo_ose", "competition_owo_ose", "team_season_ose_rangers", 2, 2, true, true],
    ["entry_idanre_hills_super_cup", "competition_super_cup", "team_season_idanre_hills", 1, 1, true, false, "competition_idanre", 1],
    ["entry_ondo_city_super_cup", "competition_super_cup", "team_season_ondo_city", 2, 2, true, false, "competition_ondo", 2],
    ["entry_future_kings_super_cup", "competition_super_cup", "team_season_future_kings", 3, 3, false, false],
  ];

  await prisma.competitionTeam.createMany({
    data: competitionTeamRows.map(
      ([
        id,
        competitionId,
        teamSeasonId,
        potNumber,
        seed,
        isQualifiedForKnockout,
        isQualifiedForNextCompetition,
        qualifiedFromCompetitionId,
        qualificationRank,
      ]) => ({
      id,
      competitionId,
      teamSeasonId,
      groupId: `group_${competitionId}_overall`,
      potId: `pot_${competitionId}_${potNumber}`,
      seed,
      isQualifiedForKnockout,
      isQualifiedForNextCompetition,
      qualifiedFromCompetitionId,
      qualificationRank,
      })
    ),
  });

  await prisma.fixtureGenerationRun.create({
    data: {
      id: "fixture_run_akure_md5",
      competitionId: "competition_akure",
      mode: "AUTO",
      opponentsPerPot: 1,
      includeOwnPot: true,
      avoidSameAreaEarly: true,
      notes: "Sample generated matchday showing pot-based pairings.",
    },
  });

  await prisma.match.createMany({
    data: [
      {
        id: "match_oyemekun_aquinas_live",
        seasonId: "season_2026_2027",
        competitionId: "competition_akure",
        groupId: "group_competition_akure_overall",
        slug: "oyemekun-fc-v-aquinas-fc",
        matchday: "Matchday 5",
        stage: "GROUP",
        status: "LIVE",
        minuteLabel: "50'",
        kickoffAt: new Date("2026-09-12T15:00:00+01:00"),
        venueId: "venue_akure_township",
        homeCompetitionTeamId: "entry_oyemekun_akure",
        awayCompetitionTeamId: "entry_aquinas_akure",
        homeScore: 2,
        awayScore: 2,
        referee: "Mr. Adewale Johnson",
        playerOfMatchId: "squad_benjamin_evans",
        generationRunId: "fixture_run_akure_md5",
      },
      {
        id: "match_apex_bright_stars",
        seasonId: "season_2026_2027",
        competitionId: "competition_akure",
        groupId: "group_competition_akure_overall",
        slug: "apex-united-v-bright-stars-fc",
        matchday: "Matchday 5",
        stage: "GROUP",
        status: "UPCOMING",
        kickoffAt: new Date("2026-09-12T17:30:00+01:00"),
        venueId: "venue_akure_township",
        homeCompetitionTeamId: "entry_apex_akure",
        awayCompetitionTeamId: "entry_bright_stars_akure",
        generationRunId: "fixture_run_akure_md5",
      },
      {
        id: "match_ondo_ileoluji",
        seasonId: "season_2026_2027",
        competitionId: "competition_ondo",
        groupId: "group_competition_ondo_overall",
        slug: "ondo-city-fc-v-ile-oluji-stars",
        matchday: "Matchday 4",
        stage: "GROUP",
        status: "UPCOMING",
        kickoffAt: new Date("2026-09-13T15:00:00+01:00"),
        venueId: "venue_ondo_sports_complex",
        homeCompetitionTeamId: "entry_ondo_city_ondo",
        awayCompetitionTeamId: "entry_ileoluji_ondo",
      },
      {
        id: "match_owo_ose",
        seasonId: "season_2026_2027",
        competitionId: "competition_owo_ose",
        groupId: "group_competition_owo_ose_overall",
        slug: "owo-united-v-ose-rangers",
        matchday: "Matchday 4",
        stage: "GROUP",
        status: "FULLTIME",
        kickoffAt: new Date("2026-09-07T16:00:00+01:00"),
        venueId: "venue_owo_community_field",
        homeCompetitionTeamId: "entry_owo_united_owo_ose",
        awayCompetitionTeamId: "entry_ose_rangers_owo_ose",
        homeScore: 3,
        awayScore: 1,
      },
      {
        id: "match_idanre_hills_penalties",
        seasonId: "season_2026_2027",
        competitionId: "competition_super_cup",
        groupId: "group_competition_super_cup_overall",
        slug: "idanre-hills-fc-v-ondo-city-fc",
        matchday: "Quarter-final",
        stage: "QUARTER_FINAL",
        status: "FULLTIME",
        kickoffAt: new Date("2026-11-21T16:00:00+01:00"),
        venueId: "venue_akure_township",
        homeCompetitionTeamId: "entry_idanre_hills_super_cup",
        awayCompetitionTeamId: "entry_ondo_city_super_cup",
        homeSourceLabel: "Idanre qualifier",
        awaySourceLabel: "Ondo & Ile-Oluji qualifier",
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 4,
        awayPenaltyScore: 3,
      },
    ],
  });

  await prisma.matchLineup.createMany({
    data: [
      {
        id: "lineup_oyemekun_live",
        matchId: "match_oyemekun_aquinas_live",
        competitionTeamId: "entry_oyemekun_akure",
        formation: "4-3-3",
        captainId: "squad_tomiwa_aluko",
      },
      {
        id: "lineup_aquinas_live",
        matchId: "match_oyemekun_aquinas_live",
        competitionTeamId: "entry_aquinas_akure",
        formation: "4-2-3-1",
        captainId: "squad_daniel_ojo",
      },
    ],
  });

  await prisma.matchLineupPlayer.createMany({
    data: [
      {
        lineupId: "lineup_oyemekun_live",
        squadPlayerId: "squad_benjamin_evans",
        role: "STARTER",
        position: "ST",
        shirtNumber: 9,
        sortOrder: 9,
      },
      {
        lineupId: "lineup_oyemekun_live",
        squadPlayerId: "squad_tomiwa_aluko",
        role: "STARTER",
        position: "CB",
        shirtNumber: 4,
        sortOrder: 4,
        isCaptain: true,
      },
      {
        lineupId: "lineup_aquinas_live",
        squadPlayerId: "squad_daniel_ojo",
        role: "STARTER",
        position: "AM",
        shirtNumber: 10,
        sortOrder: 10,
        isCaptain: true,
      },
    ],
  });

  await prisma.matchEvent.createMany({
    data: [
      {
        id: "event_1",
        matchId: "match_oyemekun_aquinas_live",
        competitionTeamId: "entry_oyemekun_akure",
        type: "GOAL",
        period: "FIRST_HALF",
        minute: 12,
        minuteLabel: "12'",
        playerId: "squad_benjamin_evans",
        sortOrder: 1,
      },
      {
        id: "event_2",
        matchId: "match_oyemekun_aquinas_live",
        competitionTeamId: "entry_aquinas_akure",
        type: "GOAL",
        period: "FIRST_HALF",
        minute: 24,
        minuteLabel: "24'",
        playerId: "squad_daniel_ojo",
        sortOrder: 2,
      },
      {
        id: "event_3",
        matchId: "match_oyemekun_aquinas_live",
        competitionTeamId: "entry_oyemekun_akure",
        type: "YELLOW_CARD",
        period: "FIRST_HALF",
        minute: 41,
        minuteLabel: "41'",
        playerId: "squad_tomiwa_aluko",
        sortOrder: 3,
      },
      {
        id: "event_4",
        matchId: "match_oyemekun_aquinas_live",
        competitionTeamId: "entry_oyemekun_akure",
        type: "GOAL",
        period: "FIRST_HALF",
        minute: 45,
        stoppageMinute: 2,
        minuteLabel: "45+2'",
        playerId: "squad_benjamin_evans",
        sortOrder: 4,
      },
      {
        id: "event_5",
        matchId: "match_oyemekun_aquinas_live",
        competitionTeamId: "entry_aquinas_akure",
        type: "GOAL",
        period: "SECOND_HALF",
        minute: 49,
        minuteLabel: "49'",
        playerId: "squad_daniel_ojo",
        sortOrder: 5,
      },
      {
        id: "event_6",
        matchId: "match_owo_ose",
        competitionTeamId: "entry_owo_united_owo_ose",
        type: "GOAL",
        period: "FIRST_HALF",
        minute: 9,
        minuteLabel: "9'",
        playerId: "squad_moses_ogunleye",
        sortOrder: 1,
      },
      {
        id: "event_7",
        matchId: "match_owo_ose",
        competitionTeamId: "entry_owo_united_owo_ose",
        type: "PENALTY_SCORED",
        period: "SECOND_HALF",
        minute: 72,
        minuteLabel: "72'",
        playerId: "squad_moses_ogunleye",
        sortOrder: 2,
      },
    ],
  });

  await prisma.penaltyAttempt.createMany({
    data: [
      {
        id: "penalty_1",
        matchId: "match_idanre_hills_penalties",
        competitionTeamId: "entry_idanre_hills_super_cup",
        takerId: "squad_ayo_martins",
        sequence: 1,
        round: 1,
        scored: true,
      },
      {
        id: "penalty_2",
        matchId: "match_idanre_hills_penalties",
        competitionTeamId: "entry_ondo_city_super_cup",
        takerId: "squad_victor_aina",
        sequence: 2,
        round: 1,
        scored: true,
      },
      {
        id: "penalty_3",
        matchId: "match_idanre_hills_penalties",
        competitionTeamId: "entry_idanre_hills_super_cup",
        takerId: "squad_ayo_martins",
        sequence: 3,
        round: 2,
        scored: true,
      },
      {
        id: "penalty_4",
        matchId: "match_idanre_hills_penalties",
        competitionTeamId: "entry_ondo_city_super_cup",
        takerId: "squad_victor_aina",
        sequence: 4,
        round: 2,
        scored: false,
      },
    ],
  });

  const standings = [
    ["standing_oyemekun", "competition_akure", "entry_oyemekun_akure", 1, 5, 4, 1, 0, 13, 5, 13, "WWDWW", true, true],
    ["standing_aquinas", "competition_akure", "entry_aquinas_akure", 2, 5, 3, 2, 0, 11, 6, 11, "WDWDW", true, true],
    ["standing_apex", "competition_akure", "entry_apex_akure", 3, 5, 3, 1, 1, 10, 7, 10, "LWWDW", true, true],
    ["standing_bright_stars", "competition_akure", "entry_bright_stars_akure", 4, 5, 2, 1, 2, 8, 8, 7, "WLDLW", false, false],
    ["standing_owo_united", "competition_owo_ose", "entry_owo_united_owo_ose", 1, 5, 3, 1, 1, 10, 5, 10, "WDWLW", true, true],
    ["standing_ose_rangers", "competition_owo_ose", "entry_ose_rangers_owo_ose", 2, 5, 2, 2, 1, 7, 6, 8, "DWLWD", true, true],
  ];

  await prisma.competitionStanding.createMany({
    data: standings.map(
      ([id, competitionId, competitionTeamId, rank, played, wins, draws, losses, goalsFor, goalsAgainst, points, form, qualifiedForKnockout, qualifiedForNextCompetition]) => ({
        id,
        seasonId: "season_2026_2027",
        competitionId,
        groupId: `group_${competitionId}_overall`,
        competitionTeamId,
        rank,
        played,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points,
        form,
        qualifiedForKnockout,
        qualifiedForNextCompetition,
      })
    ),
  });

  await prisma.teamStat.createMany({
    data: standings.map(
      ([id, competitionId, competitionTeamId, , played, wins, draws, losses, goalsFor, goalsAgainst, points]) => ({
        id: id.replace("standing", "team_stat"),
        seasonId: "season_2026_2027",
        competitionId,
        competitionTeamId,
        played,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points,
      })
    ),
  });

  const playerStats = [
    ["player_stat_benjamin", "competition_akure", "squad_benjamin_evans", 5, 5, 7, 2, 0, 1, 0, 0, 0, 1, 0, 1],
    ["player_stat_daniel", "competition_akure", "squad_daniel_ojo", 5, 5, 4, 5, 0, 0, 0, 0, 0, 0, 0, 0],
    ["player_stat_boluwatife", "competition_akure", "squad_boluwatife_james", 5, 5, 5, 3, 0, 1, 0, 0, 0, 0, 0, 0],
    ["player_stat_tomiwa", "competition_akure", "squad_tomiwa_aluko", 5, 5, 1, 1, 2, 2, 0, 0, 0, 0, 0, 0],
    ["player_stat_ayo", "competition_idanre", "squad_ayo_martins", 4, 4, 0, 0, 3, 0, 0, 3, 0, 0, 0, 0],
    ["player_stat_victor", "competition_ondo", "squad_victor_aina", 5, 5, 3, 4, 0, 1, 0, 0, 0, 0, 0, 0],
    ["player_stat_moses", "competition_owo_ose", "squad_moses_ogunleye", 5, 5, 4, 2, 0, 0, 0, 0, 0, 1, 0, 0],
  ];

  await prisma.playerStat.createMany({
    data: playerStats.map(
      ([
        id,
        competitionId,
        squadPlayerId,
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
        playerOfMatchAwards,
      ]) => ({
        id,
        seasonId: "season_2026_2027",
        competitionId,
        squadPlayerId,
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
        playerOfMatchAwards,
      })
    ),
  });

  await prisma.knockoutBracket.create({
    data: {
      id: "bracket_super_cup_2026",
      competitionId: "competition_super_cup",
      name: "Super Cup Knockout",
      startingRound: "ROUND_OF_16",
      hasThirdPlaceMatch: true,
      slots: {
        create: [
          {
            id: "slot_super_qf_1",
            round: "QUARTER_FINAL",
            slotNumber: 1,
            matchId: "match_idanre_hills_penalties",
            homeSourceLabel: "Round of 16 winner",
            awaySourceLabel: "Round of 16 winner",
          },
          {
            id: "slot_super_final",
            round: "FINAL",
            slotNumber: 1,
            homeSourceLabel: "Semi-final winner 1",
            awaySourceLabel: "Semi-final winner 2",
          },
          {
            id: "slot_super_third_place",
            round: "THIRD_PLACE",
            slotNumber: 1,
            homeSourceLabel: "Semi-final loser 1",
            awaySourceLabel: "Semi-final loser 2",
          },
        ],
      },
    },
  });

  await prisma.newsPost.createMany({
    data: [
      {
        id: "news_season_launch",
        seasonId: "season_2026_2027",
        competitionId: "competition_akure",
        slug: "johnvents-apex-league-2026-2027-season-launch",
        title: "Johnvents Apex League opens the 2026/2027 season",
        coverImageUrl: image.news,
        publishDate: new Date("2026-08-01T09:00:00+01:00"),
        excerpt:
          "The new season begins with expanded competition coverage, neutral venues, and a sharper pathway into the Super Cup.",
        content:
          "Johnvents Apex League returns for the 2026/2027 season with local government competitions feeding into the Super Cup.\n\nThe tournament will use a pot-based group phase, automatic table ranking, knockout matches, and penalty shootouts where required.",
      },
      {
        id: "news_oyemekun_aquinas_report",
        seasonId: "season_2026_2027",
        competitionId: "competition_akure",
        slug: "oyemekun-and-aquinas-share-points",
        title: "Oyemekun and Aquinas share points in Akure thriller",
        coverImageUrl: image.hero,
        publishDate: new Date("2026-09-12T19:00:00+01:00"),
        excerpt:
          "A fast group phase match stayed level deep into the second half as both teams traded goals and momentum.",
        content:
          "Oyemekun FC and Aquinas FC delivered one of the liveliest fixtures of the current matchday.\n\nBoth sides remain in the qualification places, with the top eight moving into the quarter-finals.",
      },
      {
        id: "news_super_cup_path",
        seasonId: "season_2026_2027",
        competitionId: "competition_super_cup",
        slug: "road-to-the-super-cup-confirmed",
        title: "Road to the Super Cup confirmed",
        coverImageUrl: image.news,
        publishDate: new Date("2026-09-20T09:00:00+01:00"),
        excerpt:
          "The top eight teams from each local government competition will qualify for the 32-team Super Cup.",
        content:
          "The Super Cup will bring together qualified teams from Akure South & North, Ondo & Ile-Oluji, Idanre, and Owo & Ose.\n\nAfter the group phase, the top 16 teams will progress to the Round of 16.",
      },
    ],
  });

  await prisma.galleryImage.createMany({
    data: [
      {
        id: "gallery_opening_matchday",
        seasonId: "season_2026_2027",
        competitionId: "competition_akure",
        matchId: "match_oyemekun_aquinas_live",
        scope: "MATCH",
        title: "Opening matchday energy",
        imageUrl: image.news,
        altText: "Opening matchday football scene",
      },
      {
        id: "gallery_apex_branding",
        seasonId: "season_2026_2027",
        competitionId: "competition_super_cup",
        scope: "COMPETITION",
        title: "Apex League branding",
        imageUrl: image.hero,
        altText: "Johnvents Apex League branding",
      },
      {
        id: "gallery_player_session",
        seasonId: "season_2026_2027",
        teamId: "team_oyemekun",
        playerId: "player_benjamin_evans",
        scope: "PLAYER",
        title: "Player profile session",
        imageUrl: image.player,
        altText: "Player profile portrait",
      },
    ],
  });

  await prisma.awardRecord.createMany({
    data: [
      {
        id: "award_2025_champions",
        seasonId: "season_2025_2026",
        type: "AWARD",
        title: "Champions",
        winnerText: "Apex United",
        detail: "Super Cup winners",
        teamId: "team_apex_united",
      },
      {
        id: "award_golden_boot_race",
        seasonId: "season_2026_2027",
        competitionId: "competition_akure",
        type: "AWARD",
        title: "Golden Boot Race",
        winnerText: "Benjamin Evans",
        detail: "7 goals",
        value: "7",
        playerId: "player_benjamin_evans",
      },
      {
        id: "record_highest_scoring_match",
        seasonId: "season_2026_2027",
        competitionId: "competition_owo_ose",
        type: "RECORD",
        title: "Highest Scoring Match",
        winnerText: "Owo United 3-1 Ose Rangers",
        detail: "4 goals",
        value: "4",
      },
      {
        id: "award_golden_glove_race",
        seasonId: "season_2026_2027",
        competitionId: "competition_idanre",
        type: "AWARD",
        title: "Golden Glove Race",
        winnerText: "Ayo Martins",
        detail: "3 clean sheets",
        value: "3",
        playerId: "player_ayo_martins",
      },
    ],
  });

  await prisma.siteContentBlock.create({
    data: {
      id: "content_about_2026",
      seasonId: "season_2026_2027",
      key: "about",
      title: "About Johnvents Apex League",
      content: {
        sponsor: "Powered by Johnvents Foods",
        body: [
          "Johnvents Apex League is a modern, mobile-prioritized football tournament platform for recurring seasonal competitions.",
          "The platform supports local government competitions, the Super Cup, archived seasons, live match updates, statistics, galleries, awards, and records.",
        ],
      },
    },
  });

  await prisma.contactMethod.createMany({
    data: [
      {
        id: "contact_phone",
        type: "PHONE",
        label: "Phone",
        value: "+234 000 000 0000",
        url: "tel:+2340000000000",
        sortOrder: 1,
      },
      {
        id: "contact_whatsapp",
        type: "WHATSAPP",
        label: "WhatsApp",
        value: "+234 000 000 0000",
        url: "https://wa.me/2340000000000",
        sortOrder: 2,
      },
      {
        id: "contact_facebook",
        type: "FACEBOOK",
        label: "Facebook",
        value: "Apex League",
        url: "https://facebook.com/",
        sortOrder: 3,
      },
      {
        id: "contact_instagram",
        type: "INSTAGRAM",
        label: "Instagram",
        value: "ApexLeague01",
        url: "https://instagram.com/",
        sortOrder: 4,
      },
      {
        id: "contact_email",
        type: "EMAIL",
        label: "Email",
        value: "info@johnventsapexleague.com",
        url: "mailto:info@johnventsapexleague.com",
        sortOrder: 5,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seeded Johnvents Apex League sample tournament data.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
