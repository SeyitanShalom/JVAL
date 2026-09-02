"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { recalculateAllLeagueTablesAndStats } from "@/lib/standings-engine";

const BASE = "/admin/fixtures";

function isNextRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

// â”€â”€â”€ Create Fixture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createFixture(formData: FormData) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const competitionId = (formData.get("competitionId") as string | null)?.trim();
  const venueId = (formData.get("venueId") as string | null)?.trim();
  const matchday = (formData.get("matchday") as string | null)?.trim();
  const kickoffAt = (formData.get("kickoffAt") as string | null)?.trim();
  const homeCompetitionTeamId = (formData.get("homeCompetitionTeamId") as string | null)?.trim() || null;
  const awayCompetitionTeamId = (formData.get("awayCompetitionTeamId") as string | null)?.trim() || null;
  const homeCustom = (formData.get("homeCustom") as string | null)?.trim() || null;
  const awayCustom = (formData.get("awayCustom") as string | null)?.trim() || null;

  if (!competitionId || !venueId || !matchday || !kickoffAt) redirect(`${BASE}?error=missing`);

  try {
    const prisma = getPrismaClient();

    // Fetch the competition to get its seasonId
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { seasonId: true },
    });
    if (!competition) redirect(`${BASE}?error=missing`);

    let homeLabel = homeCustom;
    let awayLabel = awayCustom;

    if (homeCompetitionTeamId) {
      const ct = await prisma.competitionTeam.findUnique({
        where: { id: homeCompetitionTeamId },
        include: { teamSeason: { include: { team: true } } },
      });
      if (ct) homeLabel = ct.teamSeason.team.name;
    }

    if (awayCompetitionTeamId) {
      const ct = await prisma.competitionTeam.findUnique({
        where: { id: awayCompetitionTeamId },
        include: { teamSeason: { include: { team: true } } },
      });
      if (ct) awayLabel = ct.teamSeason.team.name;
    }

    const homeSlugPart = (homeLabel || "team1").toLowerCase().replace(/[^a-z0-9]/g, "-");
    const awaySlugPart = (awayLabel || "team2").toLowerCase().replace(/[^a-z0-9]/g, "-");
    const slug = `${homeSlugPart}-v-${awaySlugPart}-${Date.now().toString(36)}`;

    await prisma.match.create({
      data: {
        seasonId: competition.seasonId,
        competitionId,
        venueId,
        homeCompetitionTeamId: homeCompetitionTeamId || null,
        awayCompetitionTeamId: awayCompetitionTeamId || null,
        homeSourceLabel: homeLabel || "Home Team",
        awaySourceLabel: awayLabel || "Away Team",
        slug,
        matchday,
        kickoffAt: new Date(kickoffAt),
        stage: "GROUP",
        status: "UPCOMING",
        neutralVenue: true,
      },
    });
  } catch (err) {
    if (isNextRedirectError(err)) throw err;
    console.error("Create fixture error:", err);
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  revalidatePath("/fixtures");
  revalidatePath("/fixtures-results");
  revalidatePath("/");
  revalidatePath("/tables");
  revalidatePath("/competitions");
  revalidatePath(`/competitions/${competitionId}`);
  redirect(`${BASE}?created=1`);
}

// â”€â”€â”€ Update Fixture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function updateFixture(matchId: string, formData: FormData) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const competitionId = (formData.get("competitionId") as string | null)?.trim();
  const matchday = (formData.get("matchday") as string | null)?.trim();
  const kickoffAt = (formData.get("kickoffAt") as string | null)?.trim();
  const venueId = (formData.get("venueId") as string | null)?.trim();
  const homeCompetitionTeamId = (formData.get("homeCompetitionTeamId") as string | null)?.trim() || null;
  const awayCompetitionTeamId = (formData.get("awayCompetitionTeamId") as string | null)?.trim() || null;

  if (!competitionId || !venueId || !matchday || !kickoffAt) {
    redirect(`${BASE}?error=missing`);
  }

  let previousCompetitionId: string | null = null;
  let matchSlug: string | null = null;

  try {
    const prisma = getPrismaClient();

    const [currentMatch, competition, homeEntry, awayEntry] = await Promise.all([
      prisma.match.findUnique({
        where: { id: matchId },
        select: {
          slug: true,
          competitionId: true,
        },
      }),
      prisma.competition.findUnique({
        where: { id: competitionId },
        select: { seasonId: true },
      }),
      homeCompetitionTeamId
        ? prisma.competitionTeam.findUnique({
            where: { id: homeCompetitionTeamId },
            include: { teamSeason: { include: { team: true } } },
          })
        : Promise.resolve(null),
      awayCompetitionTeamId
        ? prisma.competitionTeam.findUnique({
            where: { id: awayCompetitionTeamId },
            include: { teamSeason: { include: { team: true } } },
          })
        : Promise.resolve(null),
    ]);

    if (!currentMatch || !competition) redirect(`${BASE}?error=missing`);
    if (
      (homeEntry && homeEntry.competitionId !== competitionId) ||
      (awayEntry && awayEntry.competitionId !== competitionId) ||
      (homeCompetitionTeamId && !homeEntry) ||
      (awayCompetitionTeamId && !awayEntry)
    ) {
      redirect(`${BASE}?error=team_mismatch`);
    }

    previousCompetitionId = currentMatch.competitionId;
    matchSlug = currentMatch.slug;

    await prisma.match.update({
      where: { id: matchId },
      data: {
        seasonId: competition.seasonId,
        competitionId,
        venueId,
        matchday,
        kickoffAt: new Date(kickoffAt),
        homeCompetitionTeamId,
        awayCompetitionTeamId,
        homeSourceLabel: homeEntry?.teamSeason.team.name ?? "Home Team",
        awaySourceLabel: awayEntry?.teamSeason.team.name ?? "Away Team",
      },
    });

    const competitionsToRecalculate = new Set(
      [previousCompetitionId, competitionId].filter(Boolean) as string[],
    );
    for (const id of competitionsToRecalculate) {
      await recalculateAllLeagueTablesAndStats(id);
    }
  } catch (err) {
    if (isNextRedirectError(err)) throw err;
    console.error("Update fixture error:", err);
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  revalidatePath("/fixtures");
  revalidatePath("/fixtures-results");
  revalidatePath("/");
  revalidatePath("/tables");
  revalidatePath("/statistics");
  revalidatePath("/competitions");
  if (matchSlug) revalidatePath(`/matches/${matchSlug}`);
  if (previousCompetitionId) revalidatePath(`/competitions/${previousCompetitionId}`);
  if (competitionId) revalidatePath(`/competitions/${competitionId}`);
  redirect(`${BASE}?updated=1`);
}

// â”€â”€â”€ Delete Fixture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function deleteFixture(matchId: string) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  try {
    const prisma = getPrismaClient();

    const currentMatch = await prisma.match.findUnique({
      where: { id: matchId },
      select: { competitionId: true },
    });

    await prisma.match.delete({
      where: { id: matchId },
    });

    if (currentMatch?.competitionId) {
      await recalculateAllLeagueTablesAndStats(currentMatch.competitionId);
    }
  } catch (err) {
    console.error("Delete fixture error:", err);
    redirect(`${BASE}?error=delete`);
  }

  revalidatePath(BASE);
  revalidatePath("/fixtures");
  revalidatePath("/fixtures-results");
  revalidatePath("/");
  revalidatePath("/tables");
  revalidatePath("/statistics");
  revalidatePath("/competitions");
  redirect(`${BASE}?deleted=1`);
}
