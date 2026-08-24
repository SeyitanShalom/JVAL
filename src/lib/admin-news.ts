import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { newsPosts } from "@/lib/league-data";

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
  source: "database" | "sample";
  databaseReady: boolean;
  error?: string;
  posts: AdminNewsRecord[];
  competitionOptions: { id: string; name: string }[];
  seasonOptions: { id: string; label: string }[];
  currentSeasonId: string | null;
};

// ─── Sample fallback ──────────────────────────────────────────────────────────

function getSampleData(error?: string): AdminNewsData {
  return {
    source: "sample",
    databaseReady: false,
    error,
    posts: newsPosts.map((p) => ({
      id: p.id,
      slug: p.id,
      title: p.title,
      excerpt: p.excerpt,
      content: Array.isArray(p.content) ? p.content.join("\n\n") : (p.content ?? ""),
      coverImageUrl: p.coverImage,
      publishDate: p.publishDate,
      competitionId: p.competitionId,
      competitionName: p.competitionId,
      seasonId: "sample",
      seasonLabel: "Sample",
    })),
    competitionOptions: [],
    seasonOptions: [],
    currentSeasonId: null,
  };
}

// ─── Live DB fetch ────────────────────────────────────────────────────────────

export async function getAdminNewsData(): Promise<AdminNewsData> {
  if (!hasDatabaseConfig()) return getSampleData();

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
      competitionOptions: dbCompetitions.map((c) => ({ id: c.id, name: c.name })),
      seasonOptions: dbSeasons.map((s) => ({ id: s.id, label: s.label })),
      currentSeasonId: currentSeason?.id ?? null,
    };
  } catch (e) {
    return getSampleData(e instanceof Error ? e.message : "Database error");
  }
}
