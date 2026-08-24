import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { matches, venues } from "@/lib/league-data";

export type AdminVenueRecord = {
  id: string;
  slug: string;
  name: string;
  location: string;
  matchCount: number;
};

export type AdminVenueData = {
  source: "database" | "sample";
  databaseReady: boolean;
  error?: string;
  venues: AdminVenueRecord[];
  totalMatches: number;
  scheduledVenueCount: number;
};

function getSampleVenueData(error?: string): AdminVenueData {
  const sampleVenues = venues.map((venue) => ({
    id: venue.id,
    slug: venue.slug,
    name: venue.name,
    location: venue.location,
    matchCount: matches.filter((match) => match.venueId === venue.id).length,
  }));

  return {
    source: "sample",
    databaseReady: false,
    error,
    venues: sampleVenues,
    totalMatches: matches.length,
    scheduledVenueCount: new Set(matches.map((match) => match.venueId)).size,
  };
}

export async function getAdminVenueData(): Promise<AdminVenueData> {
  if (!hasDatabaseConfig()) {
    return getSampleVenueData("Add DATABASE_URL and DIRECT_URL in .env, then run the Prisma migration and seed commands.");
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
      scheduledVenueCount: dbVenues.filter((venue) => venue._count.matches > 0).length,
    };
  } catch (error) {
    console.error("Unable to load venues from database", error);
    return getSampleVenueData("Database connection failed. Showing sample venues until Supabase is reachable.");
  }
}
