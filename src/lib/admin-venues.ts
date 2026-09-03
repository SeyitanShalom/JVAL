import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

export type AdminVenueRecord = {
  id: string;
  slug: string;
  name: string;
  location: string;
  matchCount: number;
};

export type AdminVenueData = {
  source: "database" | "unavailable";
  databaseReady: boolean;
  error?: string;
  venues: AdminVenueRecord[];
  totalMatches: number;
  scheduledVenueCount: number;
};

function getUnavailableVenueData(error?: string): AdminVenueData {
  return {
    source: "unavailable",
    databaseReady: false,
    error,
    venues: [],
    totalMatches: 0,
    scheduledVenueCount: 0,
  };
}

export async function getAdminVenueData(): Promise<AdminVenueData> {
  if (!hasDatabaseConfig()) {
    return getUnavailableVenueData(
      "Add DATABASE_URL and DIRECT_URL in .env, then run the Prisma migration commands.",
    );
  }

  try {
    const prisma = getPrismaClient();
    const [dbVenues, totalMatches] = await Promise.all([
      prisma.venue.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { matches: true },
          },
        },
      }),
      prisma.match.count(),
    ]);

    return {
      source: "database",
      databaseReady: true,
      venues: dbVenues.map((venue) => ({
        id: venue.id,
        slug: venue.slug,
        name: venue.name,
        location: venue.location,
        matchCount: venue._count.matches,
      })),
      totalMatches,
      scheduledVenueCount: dbVenues.filter((venue) => venue._count.matches > 0)
        .length,
    };
  } catch (error) {
    console.error("Unable to load venues from database", error);
    return getUnavailableVenueData("Database connection failed.");
  }
}
