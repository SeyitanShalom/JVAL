import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

export type StandingRow = {
  rank: number;
  teamId: string;
  teamName: string;
  teamShort: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string;
  qualifiedForKnockout: boolean;
};

export type CompetitionTable = {
  competitionId: string;
  competitionName: string;
  competitionType: string;
  status: string;
  rows: StandingRow[];
};

export type PlayerLeaderboardRow = {
  rank: number;
  playerId: string;
  playerName: string;
  teamName: string;
  value: number;
};

export type AdminStatisticsData = {
  source: "database" | "unavailable";
  databaseReady: boolean;
  error?: string;
  tables: CompetitionTable[];
  topScorers: PlayerLeaderboardRow[];
  assistLeaders: PlayerLeaderboardRow[];
  cleanSheetLeaders: PlayerLeaderboardRow[];
  yellowCardLeaders: PlayerLeaderboardRow[];
  redCardLeaders: PlayerLeaderboardRow[];
  teamGoalLeaders: PlayerLeaderboardRow[];
  summary: {
    totalTeams: number;
    topScorer: string;
    topScorerGoals: number;
    assistLeader: string;
    assistLeaderAssists: number;
    cleanSheetLeader: string;
    cleanSheetLeaderCount: number;
  };
};

const emptySummary: AdminStatisticsData["summary"] = {
  totalTeams: 0,
  topScorer: "-",
  topScorerGoals: 0,
  assistLeader: "-",
  assistLeaderAssists: 0,
  cleanSheetLeader: "-",
  cleanSheetLeaderCount: 0,
};

function getUnavailableData(error?: string): AdminStatisticsData {
  return {
    source: "unavailable",
    databaseReady: false,
    error,
    tables: [],
    topScorers: [],
    assistLeaders: [],
    cleanSheetLeaders: [],
    yellowCardLeaders: [],
    redCardLeaders: [],
    teamGoalLeaders: [],
    summary: emptySummary,
  };
}

export async function getAdminStatisticsData(): Promise<AdminStatisticsData> {
  if (!hasDatabaseConfig()) {
    return getUnavailableData(
      "Add DATABASE_URL and DIRECT_URL in .env, then run the Prisma migration commands.",
    );
  }

  try {
    const prisma = getPrismaClient();

    const [dbStandings, dbPlayerStats, dbCompetitions] = await Promise.all([
      prisma.competitionStanding.findMany({
        orderBy: [{ competitionId: "asc" }, { rank: "asc" }],
        include: {
          competitionTeam: {
            include: {
              teamSeason: {
                include: {
                  team: { select: { id: true, name: true, shortName: true } },
                },
              },
            },
          },
          competition: { select: { id: true, name: true, type: true, status: true } },
        },
      }),
      prisma.playerStat.findMany({
        orderBy: { goals: "desc" },
        include: {
          squadPlayer: {
            include: {
              player: { select: { id: true, fullName: true } },
              teamSeason: {
                include: { team: { select: { name: true, shortName: true } } },
              },
            },
          },
        },
      }),
      prisma.competition.findMany({
        select: { id: true, name: true, type: true, status: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const compMap = new Map(dbCompetitions.map((c) => [c.id, c]));
    const standingsByComp = new Map<string, typeof dbStandings>();

    for (const row of dbStandings) {
      const rows = standingsByComp.get(row.competitionId) ?? [];
      rows.push(row);
      standingsByComp.set(row.competitionId, rows);
    }

    const tables: CompetitionTable[] = dbCompetitions.map((comp) => ({
      competitionId: comp.id,
      competitionName: comp.name,
      competitionType: comp.type,
      status: comp.status,
      rows: (standingsByComp.get(comp.id) ?? []).map((standing) => ({
        rank: standing.rank ?? 0,
        teamId: standing.competitionTeam.teamSeason.team.id,
        teamName: standing.competitionTeam.teamSeason.team.name,
        teamShort: standing.competitionTeam.teamSeason.team.shortName,
        played: standing.played,
        wins: standing.wins,
        draws: standing.draws,
        losses: standing.losses,
        goalsFor: standing.goalsFor,
        goalsAgainst: standing.goalsAgainst,
        goalDifference: standing.goalDifference,
        points: standing.points,
        form: standing.form,
        qualifiedForKnockout: standing.qualifiedForKnockout,
      })),
    }));

    const mapPlayerRows = (
      sorted: typeof dbPlayerStats,
      getValue: (stat: (typeof dbPlayerStats)[number]) => number,
    ): PlayerLeaderboardRow[] =>
      sorted
        .filter((stat) => getValue(stat) > 0)
        .slice(0, 10)
        .map((stat, index) => ({
          rank: index + 1,
          playerId: stat.squadPlayer.player.id,
          playerName: stat.squadPlayer.player.fullName,
          teamName: stat.squadPlayer.teamSeason.team.shortName,
          value: getValue(stat),
        }));

    const byGoals = [...dbPlayerStats].sort(
      (a, b) => b.goals - a.goals || b.assists - a.assists,
    );
    const byAssists = [...dbPlayerStats].sort(
      (a, b) => b.assists - a.assists || b.goals - a.goals,
    );
    const byCleanSheets = [...dbPlayerStats].sort(
      (a, b) => b.cleanSheets - a.cleanSheets,
    );
    const byYellowCards = [...dbPlayerStats].sort(
      (a, b) => b.yellowCards - a.yellowCards,
    );
    const byRedCards = [...dbPlayerStats].sort(
      (a, b) => b.redCards - a.redCards,
    );

    const topScorers = mapPlayerRows(byGoals, (stat) => stat.goals);
    const assistLeaders = mapPlayerRows(byAssists, (stat) => stat.assists);
    const cleanSheetLeaders = mapPlayerRows(
      byCleanSheets,
      (stat) => stat.cleanSheets,
    );
    const teamGoalLeaders: PlayerLeaderboardRow[] = [...dbStandings]
      .filter((standing) => standing.goalsFor > 0)
      .sort((a, b) => b.goalsFor - a.goalsFor)
      .slice(0, 10)
      .map((standing, index) => ({
        rank: index + 1,
        playerId: standing.competitionTeamId,
        playerName: standing.competitionTeam.teamSeason.team.name,
        teamName: compMap.get(standing.competitionId)?.name ?? "-",
        value: standing.goalsFor,
      }));

    return {
      source: "database",
      databaseReady: true,
      tables,
      topScorers,
      assistLeaders,
      cleanSheetLeaders,
      yellowCardLeaders: mapPlayerRows(
        byYellowCards,
        (stat) => stat.yellowCards,
      ),
      redCardLeaders: mapPlayerRows(byRedCards, (stat) => stat.redCards),
      teamGoalLeaders,
      summary: {
        totalTeams: new Set(
          dbStandings.map(
            (standing) => standing.competitionTeam.teamSeason.team.id,
          ),
        ).size,
        topScorer: topScorers[0]?.playerName ?? "-",
        topScorerGoals: topScorers[0]?.value ?? 0,
        assistLeader: assistLeaders[0]?.playerName ?? "-",
        assistLeaderAssists: assistLeaders[0]?.value ?? 0,
        cleanSheetLeader: cleanSheetLeaders[0]?.playerName ?? "-",
        cleanSheetLeaderCount: cleanSheetLeaders[0]?.value ?? 0,
      },
    };
  } catch (e) {
    return getUnavailableData(e instanceof Error ? e.message : "Database error");
  }
}
