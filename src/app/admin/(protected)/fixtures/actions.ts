"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { recalculateAllLeagueTablesAndStats } from "@/lib/standings-engine";

const BASE = "/admin/fixtures";

// ─── Create Fixture ───────────────────────────────────────────────────────────

export async function createFixture(formData: FormData) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const competitionId = (formData.get("competitionId") as string | null)?.trim();
  const venueId = (formData.get("venueId") as string | null)?.trim();
  const matchday = (formData.get("matchday") as string | null)?.trim();
  const kickoffAt = (formData.get("kickoffAt") as string | null)?.trim();

  if (!competitionId || !venueId || !matchday || !kickoffAt) redirect(`${BASE}?error=missing`);

  try {
    const prisma = getPrismaClient();

    // Fetch the competition to get its seasonId
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { seasonId: true },
    });
    if (!competition) redirect(`${BASE}?error=missing`);

    const slug = `match-${Date.now().toString(36)}`;

    await prisma.match.create({
      data: {
        seasonId: competition!.seasonId,
        competitionId: competitionId!,
        venueId: venueId!,
        slug,
        matchday: matchday!,
        kickoffAt: new Date(kickoffAt!),
        stage: "GROUP",
        status: "UPCOMING",
        neutralVenue: true,
      },
    });
  } catch {
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?created=1`);
}

// ─── Update Fixture ───────────────────────────────────────────────────────────

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
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: status as "UPCOMING" | "LIVE" | "HALFTIME" | "FULLTIME" | "POSTPONED",
        matchday: matchday ?? undefined,
        kickoffAt: kickoffAt ? new Date(kickoffAt) : undefined,
        venueId: venueId || undefined,
        homeScore,
        awayScore,
        homePenaltyScore,
        awayPenaltyScore,
        referee,
      },
    });

    if (status === "FULLTIME" || (homeScore !== null && awayScore !== null)) {
      await recalculateAllLeagueTablesAndStats(updatedMatch.competitionId);
    }
  } catch {
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  revalidatePath("/tables");
  revalidatePath("/statistics");
  revalidatePath("/");
  redirect(`${BASE}?updated=1`);
}

// ─── Delete Fixture ───────────────────────────────────────────────────────────

export async function deleteFixture(matchId: string) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  try {
    const prisma = getPrismaClient();
    await prisma.match.delete({ where: { id: matchId } });
  } catch {
    redirect(`${BASE}?error=delete`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?deleted=1`);
}

// ─── Live match event ─────────────────────────────────────────────────────────

export async function setMatchStatus(matchId: string, status: "LIVE" | "HALFTIME" | "FULLTIME") {
  if (!hasDatabaseConfig()) return;

  try {
    const prisma = getPrismaClient();
    await prisma.match.update({
      where: { id: matchId },
      data: { status },
    });
  } catch {
    // silently fail — live controls will show feedback later
  }

  revalidatePath(BASE);
}
