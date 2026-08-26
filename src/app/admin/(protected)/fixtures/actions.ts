"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { recalculateAllLeagueTablesAndStats } from "@/lib/standings-engine";

const BASE = "/admin/fixtures";

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
    console.error("Create fixture error:", err);
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  revalidatePath("/fixtures");
  revalidatePath("/");
  revalidatePath("/tables");
  redirect(`${BASE}?created=1`);
}

// â”€â”€â”€ Update Fixture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function updateFixture(matchId: string, formData: FormData) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const status = (formData.get("status") as string | null) ?? "UPCOMING";
  const matchday = (formData.get("matchday") as string | null)?.trim();
  const kickoffAt = (formData.get("kickoffAt") as string | null)?.trim();
  const venueId = (formData.get("venueId") as string | null)?.trim();
  const homeScoreRaw = formData.get("homeScore") as string | null;
  const awayScoreRaw = formData.get("awayScore") as string | null;
  const homePenaltyRaw = formData.get("homePenalty") as string | null;
  const awayPenaltyRaw = formData.get("awayPenalty") as string | null;
  const referee = (formData.get("referee") as string | null)?.trim() || null;

  const homeScore = homeScoreRaw !== null && homeScoreRaw !== "" ? parseInt(homeScoreRaw, 10) : null;
  const awayScore = awayScoreRaw !== null && awayScoreRaw !== "" ? parseInt(awayScoreRaw, 10) : null;
  const homePenaltyScore = homePenaltyRaw !== null && homePenaltyRaw !== "" ? parseInt(homePenaltyRaw, 10) : null;
  const awayPenaltyScore = awayPenaltyRaw !== null && awayPenaltyRaw !== "" ? parseInt(awayPenaltyRaw, 10) : null;

  try {
    const prisma = getPrismaClient();

    const currentMatch = await prisma.match.findUnique({
      where: { id: matchId },
      select: { competitionId: true },
    });

    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: status as any,
        ...(matchday ? { matchday } : {}),
        ...(kickoffAt ? { kickoffAt: new Date(kickoffAt) } : {}),
        ...(venueId ? { venueId } : {}),
        homeScore: isNaN(homeScore as number) ? null : homeScore,
        awayScore: isNaN(awayScore as number) ? null : awayScore,
        homePenaltyScore: isNaN(homePenaltyScore as number) ? null : homePenaltyScore,
        awayPenaltyScore: isNaN(awayPenaltyScore as number) ? null : awayPenaltyScore,
        referee,
      },
    });

    if (currentMatch?.competitionId) {
      await recalculateAllLeagueTablesAndStats(currentMatch.competitionId);
    }
  } catch (err) {
    console.error("Update fixture error:", err);
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  revalidatePath("/fixtures");
  revalidatePath("/");
  revalidatePath("/tables");
  revalidatePath("/statistics");
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
  revalidatePath("/");
  revalidatePath("/tables");
  revalidatePath("/statistics");
  redirect(`${BASE}?deleted=1`);
}