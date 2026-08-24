import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { players, teams } from "@/lib/league-data";

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
  teamName: string;
  teamSeasonId: string | null;
  seasonLabel: string;
};

export type AdminPlayerData = {
  source: "database" | "sample";
  databaseReady: boolean;
  error?: string;
  players: AdminPlayerRecord[];
  goalkeeperCount: number;
  outfieldCount: number;
  currentSeasonId: string | null;
  teamOptions: { id: string; teamSeasonId: string; name: string }[];
};

function getSamplePlayerData(error?: string): AdminPlayerData {
  const gkCount = players.filter((p) => p.positionGroup === "Goalkeeper").length;
  return {
    source: "sample",
    databaseReady: false,
    error,
    players: players.map((p) => ({
      id: p.id,
      slug: p.slug,
      squadPlayerId: null,
      fullName: p.name,
      photoUrl: p.photo,
      dateOfBirth: p.dateOfBirth,
      squadNumber: p.number,
      positionCategory: p.positionGroup,
      detailedPosition: p.detailedPosition,
      teamName: teams.find((t) => t.id === p.teamId)?.name ?? "—",
      teamSeasonId: null,
      seasonLabel: "2026/2027",
    })),
    goalkeeperCount: gkCount,
    outfieldCount: players.length - gkCount,
    currentSeasonId: null,
    teamOptions: teams.map((t) => ({ id: t.id, teamSeasonId: t.id, name: t.name })),
  };
}

export async function getAdminPlayerData(): Promise<AdminPlayerData> {
  if (!hasDatabaseConfig()) {
    return getSamplePlayerData(
      "Add DATABASE_URL and DIRECT_URL in .env, then run the Prisma migration and seed commands."
    );
  }

  try {
    const prisma = getPrismaClient();

    const [currentSeason, dbPlayers, teamSeasons] = await Promise.all([
      prisma.season.findFirst({ where: { isCurrent: true }, select: { id: true } }),
      prisma.squadPlayer.findMany({
        where: { season: { isCurrent: true } },
        orderBy: [{ teamSeason: { team: { name: "asc" } } }, { squadNumber: "asc" }],
        include: {
          player: true,
          teamSeason: {
            include: {
              team: { select: { name: true } },
              season: { select: { label: true } },
            },
          },
        },
      }),
      prisma.teamSeason.findMany({
        where: { season: { isCurrent: true } },
        include: { team: { select: { name: true } } },
        orderBy: { team: { name: "asc" } },
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
        teamName: sp.teamSeason.team.name,
        teamSeasonId: sp.teamSeasonId,
        seasonLabel: sp.teamSeason.season.label,
      })),
      goalkeeperCount: gkCount,
      outfieldCount: dbPlayers.length - gkCount,
      currentSeasonId: currentSeason?.id ?? null,
      teamOptions: teamSeasons.map((ts) => ({
        id: ts.teamId,
        teamSeasonId: ts.id,
        name: ts.team.name,
      })),
    };
  } catch (error) {
    console.error("Unable to load players from database", error);
    return getSamplePlayerData(
      "Database connection failed. Showing sample players until Supabase is reachable."
    );
  }
}
