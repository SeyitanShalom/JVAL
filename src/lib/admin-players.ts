import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

export type AdminPlayerRecord = {
  id: string;
  slug: string;
  squadPlayerId: string | null;
  fullName: string;
  photoUrl: string;
  dateOfBirth: string;
  squadNumber: number;
  positionCategory: string;
  detailedPosition: string;
  teamId: string;
  teamName: string;
  teamSeasonId: string | null;
  seasonLabel: string;
  competitionIds: string[];
};

export type AdminCompetitionFilterOption = {
  id: string;
  name: string;
};

export type AdminPlayerData = {
  source: "database" | "unavailable";
  databaseReady: boolean;
  error?: string;
  players: AdminPlayerRecord[];
  goalkeeperCount: number;
  outfieldCount: number;
  currentSeasonId: string | null;
  teamOptions: { id: string; teamSeasonId: string; name: string }[];
  competitionOptions: AdminCompetitionFilterOption[];
};

function getUnavailablePlayerData(error?: string): AdminPlayerData {
  return {
    source: "unavailable",
    databaseReady: false,
    error,
    players: [],
    goalkeeperCount: 0,
    outfieldCount: 0,
    currentSeasonId: null,
    teamOptions: [],
    competitionOptions: [],
  };
}

export async function getAdminPlayerData(): Promise<AdminPlayerData> {
  if (!hasDatabaseConfig()) {
    return getUnavailablePlayerData(
      "Add DATABASE_URL and DIRECT_URL in .env, then run the Prisma migration commands."
    );
  }

  try {
    const prisma = getPrismaClient();

    const [currentSeason, dbPlayers, teamSeasons, dbCompetitions] = await Promise.all([
      prisma.season.findFirst({ where: { isCurrent: true }, select: { id: true } }),
      prisma.squadPlayer.findMany({
        where: { season: { isCurrent: true } },
        orderBy: [{ teamSeason: { team: { name: "asc" } } }, { squadNumber: "asc" }],
        include: {
          player: true,
          teamSeason: {
            include: {
              team: { select: { id: true, name: true } },
              season: { select: { label: true } },
              competitions: { select: { competitionId: true } },
            },
          },
        },
      }),
      prisma.teamSeason.findMany({
        where: { season: { isCurrent: true } },
        include: { team: { select: { name: true } } },
        orderBy: { team: { name: "asc" } },
      }),
      prisma.competition.findMany({
        where: { season: { isCurrent: true } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const gkCount = dbPlayers.filter((sp) => sp.positionCategory === "GOALKEEPER").length;

    return {
      source: "database",
      databaseReady: true,
      players: dbPlayers.map((sp) => ({
        id: sp.player.id,
        slug: sp.player.slug,
        squadPlayerId: sp.id,
        fullName: sp.player.fullName,
        photoUrl: sp.player.photoUrl,
        dateOfBirth: sp.player.dateOfBirth.toISOString().split("T")[0],
        squadNumber: sp.squadNumber,
        positionCategory: sp.positionCategory,
        detailedPosition: sp.detailedPosition,
        teamId: sp.teamSeason.team.id,
        teamName: sp.teamSeason.team.name,
        teamSeasonId: sp.teamSeasonId,
        seasonLabel: sp.teamSeason.season.label,
        competitionIds: sp.teamSeason.competitions.map(
          (competitionTeam) => competitionTeam.competitionId,
        ),
      })),
      goalkeeperCount: gkCount,
      outfieldCount: dbPlayers.length - gkCount,
      currentSeasonId: currentSeason?.id ?? null,
      teamOptions: teamSeasons.map((ts) => ({
        id: ts.teamId,
        teamSeasonId: ts.id,
        name: ts.team.name,
      })),
      competitionOptions: dbCompetitions,
    };
  } catch (error) {
    console.error("Unable to load players from database", error);
    return getUnavailablePlayerData("Database connection failed.");
  }
}
