import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

export type AdminNewsRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  publishDate: string;
  competitionId: string;
  competitionName: string;
  seasonId: string;
  seasonLabel: string;
};

export type AdminNewsData = {
  source: "database" | "unavailable";
  databaseReady: boolean;
  error?: string;
  posts: AdminNewsRecord[];
  competitionOptions: { id: string; name: string }[];
  seasonOptions: { id: string; label: string }[];
  currentSeasonId: string | null;
};

function getUnavailableData(error?: string): AdminNewsData {
  return {
    source: "unavailable",
    databaseReady: false,
    error,
    posts: [],
    competitionOptions: [],
    seasonOptions: [],
    currentSeasonId: null,
  };
}

export async function getAdminNewsData(): Promise<AdminNewsData> {
  if (!hasDatabaseConfig()) {
    return getUnavailableData(
      "Add DATABASE_URL and DIRECT_URL in .env, then run the Prisma migration commands.",
    );
  }

  try {
    const prisma = getPrismaClient();

    const [dbPosts, dbCompetitions, dbSeasons] = await Promise.all([
      prisma.newsPost.findMany({
        orderBy: { publishDate: "desc" },
        include: {
          competition: { select: { id: true, name: true } },
          season: { select: { id: true, label: true } },
        },
      }),
      prisma.competition.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.season.findMany({
        select: { id: true, label: true, isCurrent: true },
        orderBy: { startsAt: "desc" },
      }),
    ]);

    const currentSeason = dbSeasons.find((s) => s.isCurrent) ?? null;

    return {
      source: "database",
      databaseReady: true,
      posts: dbPosts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt ?? "",
        content: p.content,
        coverImageUrl: p.coverImageUrl,
        publishDate: p.publishDate.toISOString(),
        competitionId: p.competitionId,
        competitionName: p.competition.name,
        seasonId: p.seasonId,
        seasonLabel: p.season.label,
      })),
      competitionOptions: dbCompetitions.map((c) => ({
        id: c.id,
        name: c.name,
      })),
      seasonOptions: dbSeasons.map((s) => ({ id: s.id, label: s.label })),
      currentSeasonId: currentSeason?.id ?? null,
    };
  } catch (e) {
    return getUnavailableData(e instanceof Error ? e.message : "Database error");
  }
}
