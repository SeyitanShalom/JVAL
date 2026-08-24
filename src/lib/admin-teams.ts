import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { competitions, teams } from "@/lib/league-data";

export type AdminTeamRecord = {
  id: string;
  teamSeasonId: string | null;
  slug: string;
  name: string;
  shortName: string;
  logoUrl: string;
  community: string;
  seasonLabel: string;
  coachName: string;
  captainName: string;
  squadCount: number;
  squadLimit: number;
  competitionNames: string[];
};

export type AdminTeamData = {
  source: "database" | "sample";
  databaseReady: boolean;
  error?: string;
  teams: AdminTeamRecord[];
  totalPlayers: number;
  goalkeeperCount: number;
};

function getSampleTeamData(error?: string): AdminTeamData {
  return {
    source: "sample",
    databaseReady: false,
    error,
    teams: teams.map((team) => ({
      id: team.id,
      teamSeasonId: null,
      slug: team.slug,
      name: team.name,
      shortName: team.shortName,
      logoUrl: team.logo,
      community: team.community,
      seasonLabel: "2026/2027",
      coachName: team.coach,
      captainName: team.captain,
      squadCount: 0,
      squadLimit: 25,
      competitionNames: team.competitionIds
        .map((id) => competitions.find((c) => c.id === id)?.name ?? "")
        .filter(Boolean),
    })),
    totalPlayers: 0,
    goalkeeperCount: 0,
  };
}

export async function getAdminTeamData(): Promise<AdminTeamData> {
  if (!hasDatabaseConfig()) {
    return getSampleTeamData(
      "Add DATABASE_URL and DIRECT_URL in .env, then run the Prisma migration and seed commands."
    );
  }

  try {
    const prisma = getPrismaClient();

    const [dbTeams, totalPlayers, goalkeepers] = await Promise.all([
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
                  competition: { select: { name: true } },
                },
              },
            },
          },
        },
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
          seasonLabel: currentSeason?.season.label ?? "—",
          coachName: currentSeason?.coachName ?? "—",
          captainName: currentSeason?.captainName ?? "—",
          squadCount: currentSeason?.squadPlayers.length ?? 0,
          squadLimit: currentSeason?.squadLimit ?? 25,
          competitionNames:
            currentSeason?.competitions.map((ct) => ct.competition.name) ?? [],
        };
      }),
      totalPlayers,
      goalkeeperCount: goalkeepers,
    };
  } catch (error) {
    console.error("Unable to load teams from database", error);
    return getSampleTeamData(
      "Database connection failed. Showing sample teams until Supabase is reachable."
    );
  }
}
