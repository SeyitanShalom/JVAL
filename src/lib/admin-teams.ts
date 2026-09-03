import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

export type AdminTeamRecord = {
  id: string;
  teamSeasonId: string | null;
  slug: string;
  name: string;
  shortName: string;
  logoUrl: string;
  community: string;
  seasonLabel: string;
  managerName: string;
  coachName: string;
  coachTwoName: string;
  captainName: string;
  squadCount: number;
  squadLimit: number;
  competitionIds: string[];
  competitionNames: string[];
};

export type AdminCompetitionFilterOption = {
  id: string;
  name: string;
};

export type AdminTeamData = {
  source: "database" | "unavailable";
  databaseReady: boolean;
  error?: string;
  teams: AdminTeamRecord[];
  competitionOptions: AdminCompetitionFilterOption[];
  totalPlayers: number;
  goalkeeperCount: number;
};

function getUnavailableTeamData(error?: string): AdminTeamData {
  return {
    source: "unavailable",
    databaseReady: false,
    error,
    teams: [],
    competitionOptions: [],
    totalPlayers: 0,
    goalkeeperCount: 0,
  };
}

export async function getAdminTeamData(): Promise<AdminTeamData> {
  if (!hasDatabaseConfig()) {
    return getUnavailableTeamData(
      "Add DATABASE_URL and DIRECT_URL in .env, then run the Prisma migration commands."
    );
  }

  try {
    const prisma = getPrismaClient();

    const [dbTeams, dbCompetitions, totalPlayers, goalkeepers] = await Promise.all([
      prisma.team.findMany({
        orderBy: { name: "asc" },
        include: {
          seasons: {
            where: {
              season: { isCurrent: true },
            },
            include: {
              season: { select: { label: true } },
              squadPlayers: { select: { id: true } },
              competitions: {
                include: {
                  competition: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      }),
      prisma.competition.findMany({
        where: { season: { isCurrent: true } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.squadPlayer.count({
        where: { season: { isCurrent: true } },
      }),
      prisma.squadPlayer.count({
        where: {
          season: { isCurrent: true },
          positionCategory: "GOALKEEPER",
        },
      }),
    ]);

    return {
      source: "database",
      databaseReady: true,
      teams: dbTeams.map((team) => {
        const currentSeason = team.seasons[0];
        return {
          id: team.id,
          teamSeasonId: currentSeason?.id ?? null,
          slug: team.slug,
          name: team.name,
          shortName: team.shortName,
          logoUrl: team.logoUrl,
          community: team.community,
          managerName: currentSeason?.managerName ?? "",
          coachTwoName: currentSeason?.coachTwoName ?? "",
          seasonLabel: currentSeason?.season.label ?? "—",
          coachName: currentSeason?.coachName ?? "—",
          captainName: currentSeason?.captainName ?? "—",
          squadCount: currentSeason?.squadPlayers.length ?? 0,
          squadLimit: currentSeason?.squadLimit ?? 25,
          competitionIds:
            currentSeason?.competitions.map((ct) => ct.competition.id) ?? [],
          competitionNames:
            currentSeason?.competitions.map((ct) => ct.competition.name) ?? [],
        };
      }),
      competitionOptions: dbCompetitions,
      totalPlayers,
      goalkeeperCount: goalkeepers,
    };
  } catch (error) {
    console.error("Unable to load teams from database", error);
    return getUnavailableTeamData("Database connection failed.");
  }
}
