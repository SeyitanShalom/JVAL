"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { MatchEventType, MatchStatus } from "@prisma/client";
import { recalculateAllLeagueTablesAndStats } from "@/lib/standings-engine";

// ─── 1. STATUS UPDATE ─────────────────────────────────────────────────────────

export async function updateMatchLiveStatusAction(
  matchId: string,
  status: string,
  minuteLabel?: string
) {
  if (!hasDatabaseConfig()) return;

  try {
    const prisma = getPrismaClient();
    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: status as MatchStatus,
        minuteLabel: minuteLabel || null,
      },
    });

    if (status === "FULLTIME") {
      await recalculateAllLeagueTablesAndStats(updated.competitionId);
    }
  } catch (e) {
    console.error("Failed to update match status:", e);
  }

  revalidatePath(`/admin/fixtures/${matchId}/live`);
  revalidatePath("/admin/fixtures");
  revalidatePath("/tables");
  revalidatePath("/statistics");
  revalidatePath("/");
  revalidatePath("/fixtures");
}

// ─── 2. LOG GOAL EVENT ────────────────────────────────────────────────────────

export async function logGoalEventAction(formData: FormData) {
  const matchId = (formData.get("matchId") as string | null)?.trim();
  const competitionTeamId = (formData.get("competitionTeamId") as string | null)?.trim();
  const playerId = (formData.get("playerId") as string | null)?.trim() || null;
  const assistPlayerId = (formData.get("assistPlayerId") as string | null)?.trim() || null;
  const minute = parseInt((formData.get("minute") as string) || "0", 10);
  const goalType = ((formData.get("goalType") as string) || "GOAL") as MatchEventType;
  const note = (formData.get("note") as string | null)?.trim() || null;

  if (!matchId || !competitionTeamId) {
    redirect(`/admin/fixtures/${matchId}/live?error=missing`);
  }

  if (!hasDatabaseConfig()) {
    redirect(`/admin/fixtures/${matchId}/live?error=database`);
  }

  try {
    const prisma = getPrismaClient();
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        homeCompetitionTeamId: true,
        awayCompetitionTeamId: true,
        homeScore: true,
        awayScore: true,
      },
    });

    if (!match) {
      redirect(`/admin/fixtures/${matchId}/live?error=missing`);
    }

    const isHome = competitionTeamId === match.homeCompetitionTeamId;
    const isOwnGoal = goalType === "OWN_GOAL";

    // For own goals, the opposing team gets the score
    const scoreForHome = isOwnGoal ? !isHome : isHome;

    const newHomeScore = scoreForHome ? (match.homeScore ?? 0) + 1 : (match.homeScore ?? 0);
    const newAwayScore = !scoreForHome ? (match.awayScore ?? 0) + 1 : (match.awayScore ?? 0);

    await prisma.$transaction([
      prisma.matchEvent.create({
        data: {
          matchId,
          competitionTeamId,
          type: goalType,
          minute,
          minuteLabel: `${minute}'`,
          playerId,
          assistPlayerId: isOwnGoal ? null : assistPlayerId,
          note,
        },
      }),
      prisma.match.update({
        where: { id: matchId },
        data: {
          homeScore: newHomeScore,
          awayScore: newAwayScore,
          status: "LIVE", // Ensure match is marked live when a goal is recorded
        },
      }),
    ]);
  } catch (e) {
    console.error("Failed to log goal event:", e);
    redirect(`/admin/fixtures/${matchId}/live?error=event_save`);
  }

  revalidatePath(`/admin/fixtures/${matchId}/live`);
  revalidatePath("/admin/fixtures");
  revalidatePath("/");
  revalidatePath("/fixtures");
  redirect(`/admin/fixtures/${matchId}/live?event_added=1`);
}

// ─── 3. LOG CARD EVENT ────────────────────────────────────────────────────────

export async function logCardEventAction(formData: FormData) {
  const matchId = (formData.get("matchId") as string | null)?.trim();
  const competitionTeamId = (formData.get("competitionTeamId") as string | null)?.trim();
  const playerId = (formData.get("playerId") as string | null)?.trim() || null;
  const minute = parseInt((formData.get("minute") as string) || "0", 10);
  const cardType = ((formData.get("cardType") as string) || "YELLOW_CARD") as MatchEventType;
  const note = (formData.get("note") as string | null)?.trim() || null;

  if (!matchId || !competitionTeamId || !playerId) {
    redirect(`/admin/fixtures/${matchId}/live?error=missing`);
  }

  if (!hasDatabaseConfig()) {
    redirect(`/admin/fixtures/${matchId}/live?error=database`);
  }

  try {
    const prisma = getPrismaClient();
    await prisma.matchEvent.create({
      data: {
        matchId,
        competitionTeamId,
        type: cardType,
        minute,
        minuteLabel: `${minute}'`,
        playerId,
        note,
      },
    });
  } catch (e) {
    console.error("Failed to log card event:", e);
    redirect(`/admin/fixtures/${matchId}/live?error=event_save`);
  }

  revalidatePath(`/admin/fixtures/${matchId}/live`);
  revalidatePath("/admin/fixtures");
  redirect(`/admin/fixtures/${matchId}/live?event_added=1`);
}

// ─── 4. LOG SUBSTITUTION EVENT ────────────────────────────────────────────────

export async function logSubstitutionEventAction(formData: FormData) {
  const matchId = (formData.get("matchId") as string | null)?.trim();
  const competitionTeamId = (formData.get("competitionTeamId") as string | null)?.trim();
  const playerOutId = (formData.get("playerOutId") as string | null)?.trim() || null;
  const playerInId = (formData.get("playerInId") as string | null)?.trim() || null;
  const minute = parseInt((formData.get("minute") as string) || "0", 10);
  const note = (formData.get("note") as string | null)?.trim() || null;

  if (!matchId || !competitionTeamId || !playerOutId || !playerInId) {
    redirect(`/admin/fixtures/${matchId}/live?error=missing`);
  }

  if (!hasDatabaseConfig()) {
    redirect(`/admin/fixtures/${matchId}/live?error=database`);
  }

  try {
    const prisma = getPrismaClient();
    await prisma.matchEvent.create({
      data: {
        matchId,
        competitionTeamId,
        type: "SUBSTITUTION",
        minute,
        minuteLabel: `${minute}'`,
        playerOutId,
        playerInId,
        note,
      },
    });
  } catch (e) {
    console.error("Failed to log sub event:", e);
    redirect(`/admin/fixtures/${matchId}/live?error=event_save`);
  }

  revalidatePath(`/admin/fixtures/${matchId}/live`);
  revalidatePath("/admin/fixtures");
  redirect(`/admin/fixtures/${matchId}/live?event_added=1`);
}

// ─── 5. LOG PENALTY SHOOTOUT ATTEMPT ──────────────────────────────────────────

export async function logPenaltyAttemptAction(formData: FormData) {
  const matchId = (formData.get("matchId") as string | null)?.trim();
  const competitionTeamId = (formData.get("competitionTeamId") as string | null)?.trim();
  const takerId = (formData.get("takerId") as string | null)?.trim();
  const round = parseInt((formData.get("round") as string) || "1", 10);
  const scored = formData.get("scored") === "true";
  const note = (formData.get("note") as string | null)?.trim() || null;

  if (!matchId || !competitionTeamId || !takerId) {
    redirect(`/admin/fixtures/${matchId}/live?error=missing`);
  }

  if (!hasDatabaseConfig()) {
    redirect(`/admin/fixtures/${matchId}/live?error=database`);
  }

  try {
    const prisma = getPrismaClient();

    // Find current attempt count for sequence
    const count = await prisma.penaltyAttempt.count({ where: { matchId } });

    await prisma.penaltyAttempt.create({
      data: {
        matchId,
        competitionTeamId,
        takerId,
        sequence: count + 1,
        round,
        scored,
        note,
      },
    });

    // Recalculate shootout scores
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { penaltyAttempts: true },
    });

    if (match) {
      const homePenalties = match.penaltyAttempts.filter(
        (p) => p.competitionTeamId === match.homeCompetitionTeamId && p.scored
      ).length;
      const awayPenalties = match.penaltyAttempts.filter(
        (p) => p.competitionTeamId === match.awayCompetitionTeamId && p.scored
      ).length;

      await prisma.match.update({
        where: { id: matchId },
        data: {
          homePenaltyScore: homePenalties,
          awayPenaltyScore: awayPenalties,
          status: "LIVE",
          minuteLabel: "PEN",
        },
      });
    }
  } catch (e) {
    console.error("Failed to log penalty attempt:", e);
    redirect(`/admin/fixtures/${matchId}/live?error=event_save`);
  }

  revalidatePath(`/admin/fixtures/${matchId}/live`);
  revalidatePath("/admin/fixtures");
  revalidatePath("/fixtures");
  redirect(`/admin/fixtures/${matchId}/live?penalty_added=1`);
}

// ─── 6. DELETE MATCH EVENT (WITH SCORE ROLLBACK) ──────────────────────────────

export async function deleteMatchEventAction(eventId: string, matchId: string) {
  if (!hasDatabaseConfig()) return;

  try {
    const prisma = getPrismaClient();
    const event = await prisma.matchEvent.findUnique({
      where: { id: eventId },
      include: { match: true },
    });

    if (!event) return;

    const isGoal =
      event.type === "GOAL" ||
      event.type === "PENALTY_SCORED" ||
      event.type === "OWN_GOAL";

    if (isGoal && event.match) {
      const isHome = event.competitionTeamId === event.match.homeCompetitionTeamId;
      const isOwnGoal = event.type === "OWN_GOAL";
      const scoreForHome = isOwnGoal ? !isHome : isHome;

      const newHomeScore = scoreForHome
        ? Math.max(0, (event.match.homeScore ?? 0) - 1)
        : (event.match.homeScore ?? 0);
      const newAwayScore = !scoreForHome
        ? Math.max(0, (event.match.awayScore ?? 0) - 1)
        : (event.match.awayScore ?? 0);

      await prisma.$transaction([
        prisma.matchEvent.delete({ where: { id: eventId } }),
        prisma.match.update({
          where: { id: matchId },
          data: {
            homeScore: newHomeScore,
            awayScore: newAwayScore,
          },
        }),
      ]);
    } else {
      await prisma.matchEvent.delete({ where: { id: eventId } });
    }
  } catch (e) {
    console.error("Failed to delete event:", e);
  }

  revalidatePath(`/admin/fixtures/${matchId}/live`);
  revalidatePath("/admin/fixtures");
  revalidatePath("/");
  revalidatePath("/fixtures");
}

// ─── 7. DELETE PENALTY ATTEMPT ────────────────────────────────────────────────

export async function deletePenaltyAttemptAction(attemptId: string, matchId: string) {
  if (!hasDatabaseConfig()) return;

  try {
    const prisma = getPrismaClient();
    await prisma.penaltyAttempt.delete({ where: { id: attemptId } });

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { penaltyAttempts: true },
    });

    if (match) {
      const homePenalties = match.penaltyAttempts.filter(
        (p) => p.competitionTeamId === match.homeCompetitionTeamId && p.scored
      ).length;
      const awayPenalties = match.penaltyAttempts.filter(
        (p) => p.competitionTeamId === match.awayCompetitionTeamId && p.scored
      ).length;

      await prisma.match.update({
        where: { id: matchId },
        data: {
          homePenaltyScore: match.penaltyAttempts.length > 0 ? homePenalties : null,
          awayPenaltyScore: match.penaltyAttempts.length > 0 ? awayPenalties : null,
        },
      });
    }
  } catch (e) {
    console.error("Failed to delete penalty attempt:", e);
  }

  revalidatePath(`/admin/fixtures/${matchId}/live`);
  revalidatePath("/admin/fixtures");
}
