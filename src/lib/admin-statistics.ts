import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import {
  competitions,
  getCleanSheetLeaders,
  getAssistLeaders,
  getTableRows,
  getTopScorers,
} from "@/lib/league-data";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  source: "database" | "sample";
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

// ─── Sample fallback ──────────────────────────────────────────────────────────

function getSampleData(error?: string): AdminStatisticsData {
  const topScorers = getTopScorers(10);
  const assistLeaders = getAssistLeaders(10);
  const cleanSheetLeaders = getCleanSheetLeaders(10);

  const tables: CompetitionTable[] = competitions.map((c) => ({
    competitionId: c.id,
    competitionName: c.name,
    competitionType: c.type,
    status: c.status,
    rows: getTableRows(c.id).map((team, i) => ({
      rank: i + 1,
      teamId: team.id,
      teamName: team.name,
      teamShort: team.shortName,
      played: team.played,
      wins: team.wins,
      draws: team.draws,
      losses: team.losses,
      goalsFor: team.goalsFor,
      goalsAgainst: team.goalsAgainst,
      goalDifference: team.goalsFor - team.goalsAgainst,
      points: team.points,
      form: team.form.join(""),
      qualifiedForKnockout: false,
    })),
  }));

  return {
    source: "sample",
    databaseReady: false,
    error,
    tables,
    topScorers: topScorers.map((p, i) => ({
      rank: i + 1,
      playerId: p.id,
      playerName: p.name,
      teamName: p.teamId,
      value: p.goals,
    })),
    assistLeaders: assistLeaders.map((p, i) => ({
      rank: i + 1,
      playerId: p.id,
      playerName: p.name,
      teamName: p.teamId,
      value: p.assists,
    })),
    cleanSheetLeaders: cleanSheetLeaders.map((p, i) => ({
      rank: i + 1,
      playerId: p.id,
      playerName: p.name,
      teamName: p.teamId,
      value: p.cleanSheets,
    })),
    yellowCardLeaders: [],
    redCardLeaders: [],
    teamGoalLeaders: [],
    summary: {
      totalTeams: tables.reduce((s, t) => s + t.rows.length, 0),
      topScorer: topScorers[0]?.name ?? "—",
      topScorerGoals: topScorers[0]?.goals ?? 0,
      assistLeader: assistLeaders[0]?.name ?? "—",
      assistLeaderAssists: assistLeaders[0]?.assists ?? 0,
      cleanSheetLeader: cleanSheetLeaders[0]?.name ?? "—",
      cleanSheetLeaderCount: cleanSheetLeaders[0]?.cleanSheets ?? 0,
    },
  };
}

// ─── Live DB fetch ────────────────────────────────────────────────────────────

export async function getAdminStatisticsData(): Promise<AdminStatisticsData> {
  if (!hasDatabaseConfig()) return getSampleData();

  try {
    const prisma = getPrismaClient();

    const [dbStandings, dbPlayerStats, dbCompetitions] = await Promise.all([
      prisma.competitionStanding.findMany({
        orderBy: [{ competitionId: "asc" }, { rank: "asc" }],
        include: {
          competitionTeam: {
            include: {
              teamSeason: {
                include: { team: { select: { id: true, name: true, shortName: true } } },
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

    // Build competition lookup
    const compMap = new Map(dbCompetitions.map((c) => [c.id, c]));

    // Group standings by competition
    const standingsByComp = new Map<string, typeof dbStandings>();
    for (const row of dbStandings) {
      const arr = standingsByComp.get(row.competitionId) ?? [];
      arr.push(row);
      standingsByComp.set(row.competitionId, arr);
    }

    const tables: CompetitionTable[] = dbCompetitions.map((comp) => {
      const rows = (standingsByComp.get(comp.id) ?? []).map((s) => ({
        rank: s.rank ?? 0,
        teamId: s.competitionTeam.teamSeason.team.id,
        teamName: s.competitionTeam.teamSeason.team.name,
        teamShort: s.competitionTeam.teamSeason.team.shortName,
        played: s.played,
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        goalDifference: s.goalDifference,
        points: s.points,
        form: s.form,
        qualifiedForKnockout: s.qualifiedForKnockout,
      }));

      return {
        competitionId: comp.id,
        competitionName: comp.name,
        competitionType: comp.type,
        status: comp.status,
        rows,
      };
    });

    // Player leaderboards
    const mapPlayerRows = (
      sorted: typeof dbPlayerStats,
      getValue: (s: (typeof dbPlayerStats)[0]) => number
    ): PlayerLeaderboardRow[] =>
      sorted
        .filter((s) => getValue(s) > 0)
        .slice(0, 10)
        .map((s, i) => ({
          rank: i + 1,
          playerId: s.squadPlayer.player.id,
          playerName: s.squadPlayer.player.fullName,
          teamName: s.squadPlayer.teamSeason.team.shortName,
          value: getValue(s),
        }));

    const byGoals = [...dbPlayerStats].sort((a, b) => b.goals - a.goals || b.assists - a.assists);
    const byAssists = [...dbPlayerStats].sort((a, b) => b.assists - a.assists || b.goals - a.goals);
    const byCleanSheets = [...dbPlayerStats].sort((a, b) => b.cleanSheets - a.cleanSheets);
    const byYellowCards = [...dbPlayerStats].sort((a, b) => b.yellowCards - a.yellowCards);
    const byRedCards = [...dbPlayerStats].sort((a, b) => b.redCards - a.redCards);

    // Team goals from standings
    const teamGoalRows: PlayerLeaderboardRow[] = [...dbStandings]
      .sort((a, b) => b.goalsFor - a.goalsFor)
      .slice(0, 10)
      .map((s, i) => ({
        rank: i + 1,
        playerId: s.competitionTeamId,
        playerName: s.competitionTeam.teamSeason.team.name,
        teamName: compMap.get(s.competitionId)?.name ?? "—",
        value: s.goalsFor,
      }));

    const topScorers = mapPlayerRows(byGoals, (s) => s.goals);
    const assistLeaders = mapPlayerRows(byAssists, (s) => s.assists);
    const cleanSheetLeaders = mapPlayerRows(byCleanSheets, (s) => s.cleanSheets);

    return {
      source: "database",
      databaseReady: true,
      tables,
      topScorers,
      assistLeaders,
      cleanSheetLeaders,
      yellowCardLeaders: mapPlayerRows(byYellowCards, (s) => s.yellowCards),
      redCardLeaders: mapPlayerRows(byRedCards, (s) => s.redCards),
      teamGoalLeaders: teamGoalRows,
      summary: {
        totalTeams: new Set(dbStandings.map((s) => s.competitionTeam.teamSeason.team.id)).size,
        topScorer: topScorers[0]?.playerName ?? "—",
        topScorerGoals: topScorers[0]?.value ?? 0,
        assistLeader: assistLeaders[0]?.playerName ?? "—",
        assistLeaderAssists: assistLeaders[0]?.value ?? 0,
        cleanSheetLeader: cleanSheetLeaders[0]?.playerName ?? "—",
        cleanSheetLeaderCount: cleanSheetLeaders[0]?.value ?? 0,
      },
    };
  } catch (e) {
    return getSampleData(e instanceof Error ? e.message : "Database error");
  }
}
