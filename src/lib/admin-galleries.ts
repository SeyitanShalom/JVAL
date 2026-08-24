import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { galleryItems } from "@/lib/league-data";

export type AdminGalleryRecord = {
  id: string;
  title: string;
  imageUrl: string;
  altText: string;
  scope: string;
  seasonId: string | null;
  seasonLabel: string | null;
  competitionId: string | null;
  competitionName: string | null;
  takenAt: string | null;
};

export type AdminGalleryData = {
  source: "database" | "sample";
  databaseReady: boolean;
  error?: string;
  images: AdminGalleryRecord[];
  competitionOptions: { id: string; name: string }[];
  seasonOptions: { id: string; label: string }[];
  currentSeasonId: string | null;
  scopeOptions: string[];
};

const SCOPES = ["SEASON", "COMPETITION", "MATCH", "TEAM", "PLAYER", "VENUE", "GENERAL"];

// ─── Sample fallback ──────────────────────────────────────────────────────────

function getSampleData(error?: string): AdminGalleryData {
  return {
    source: "sample",
    databaseReady: false,
    error,
    images: galleryItems.map((g) => ({
      id: g.id,
      title: g.title,
      imageUrl: g.image,
      altText: g.title,
      scope: (g.scope ?? "GENERAL").toUpperCase(),
      seasonId: null,
      seasonLabel: null,
      competitionId: g.competitionId ?? null,
      competitionName: g.competitionId ?? null,
      takenAt: null,
    })),
    competitionOptions: [],
    seasonOptions: [],
    currentSeasonId: null,
    scopeOptions: SCOPES,
  };
}

// ─── Live DB fetch ────────────────────────────────────────────────────────────

export async function getAdminGalleryData(): Promise<AdminGalleryData> {
  if (!hasDatabaseConfig()) return getSampleData();

  try {
    const prisma = getPrismaClient();

    const [dbImages, dbCompetitions, dbSeasons] = await Promise.all([
      prisma.galleryImage.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          competition: { select: { id: true, name: true } },
          season: { select: { id: true, label: true } },
        },
      }),
      prisma.competition.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.season.findMany({ select: { id: true, label: true, isCurrent: true }, orderBy: { startsAt: "desc" } }),
    ]);

    const currentSeason = dbSeasons.find((s) => s.isCurrent) ?? null;

    return {
      source: "database",
      databaseReady: true,
      images: dbImages.map((img) => ({
        id: img.id,
        title: img.title,
        imageUrl: img.imageUrl,
        altText: img.altText ?? img.title,
        scope: img.scope,
        seasonId: img.seasonId,
        seasonLabel: img.season?.label ?? null,
        competitionId: img.competitionId,
        competitionName: img.competition?.name ?? null,
        takenAt: img.takenAt?.toISOString() ?? null,
      })),
      competitionOptions: dbCompetitions.map((c) => ({ id: c.id, name: c.name })),
      seasonOptions: dbSeasons.map((s) => ({ id: s.id, label: s.label })),
      currentSeasonId: currentSeason?.id ?? null,
      scopeOptions: SCOPES,
    };
  } catch (e) {
    return getSampleData(e instanceof Error ? e.message : "Database error");
  }
}
