"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { MatchEventType, MatchStatus } from "@prisma/client";
import { recalculateAllLeagueTablesAndStats } from "@/lib/standings-engine";
import { validateMatchTransition, validateSubstitution } from "@/lib/match-state-machine";

async function revalidateAllMatchPaths(matchId: string, slug?: string | null, compId?: string | null) {
  revalidatePath(`/admin/fixtures/${matchId}/live`);
  revalidatePath("/admin/fixtures");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/fixtures");
  revalidatePath("/tables");
  revalidatePath("/statistics");
  revalidatePath("/competitions");
  if (slug) {
    revalidatePath(`/matches/${slug}`);
    revalidatePath(`/matches/${slug}/team-sheet`);
  }
  if (compId) {
    revalidatePath(`/competitions/${compId}`);
  }
}

// â”€â”€â”€ 1. STATUS & PERIOD TRANSITIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function updateMatchLiveStatusAction(
  matchId: string,
  targetStatus: string,
  minuteLabel?: string
) {
  if (!hasDatabaseConfig()) return;

  let matchSlug: string | null = null;
  let competitionId: string | null = null;

  try {
    const prisma = getPrismaClient();
    const existing = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!existing) return;

    matchSlug = existing.slug;
    competitionId = existing.competitionId;

    let finalMinuteLabel = minuteLabel || null;
    if (targetStatus === "LIVE") {
      if (!finalMinuteLabel) {
        finalMinuteLabel = existing.status === "HALFTIME" ? "45'" : "1'";
      }
    } else if (targetStatus === "HALFTIME") {
      finalMinuteLabel = "HT";
    } else if (targetStatus === "FULLTIME") {
      finalMinuteLabel = "FT";
    } else if (targetStatus === "PENALTIES") {
      finalMinuteLabel = "PENS";
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: targetStatus as MatchStatus,
        minuteLabel: finalMinuteLabel,
      },
    });

    if (targetStatus === "FULLTIME") {
      await recalculateAllLeagueTablesAndStats(updated.competitionId);
    }
  } catch (e) {
    console.error("Failed to update match status:", e);
  }

  await revalidateAllMatchPaths(matchId, matchSlug, competitionId);
}

// â”€â”€â”€ 2. LOG GOAL EVENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  let matchSlug: string | null = null;

  try {
    const prisma = getPrismaClient();
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        slug: true,
        competitionId: true,
        homeCompetitionTeamId: true,
        awayCompetitionTeamId: true,
        homeScore: true,
        awayScore: true,
      },
    });

    if (!match) {
      redirect(`/admin/fixtures/${matchId}/live?error=missing`);
    }

    matchSlug = match.slug;
    const isHome = competitionTeamId === match.homeCompetitionTeamId;
    const isOwnGoal = goalType === "OWN_GOAL";
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
          status: "LIVE",
        },
      }),
    ]);
  } catch (e) {
    console.error("Failed to log goal event:", e);
    redirect(`/admin/fixtures/${matchId}/live?error=event_save`);
  }

  await revalidateAllMatchPaths(matchId, matchSlug);
  redirect(`/admin/fixtures/${matchId}/live?event_added=1`);
}

// â”€â”€â”€ 3. LOG DISALLOWED GOAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function logDisallowedGoalAction(formData: FormData) {
  const matchId = (formData.get("matchId") as string | null)?.trim();
  const competitionTeamId = (formData.get("competitionTeamId") as string | null)?.trim();
  const playerId = (formData.get("playerId") as string | null)?.trim() || null;
  const minute = parseInt((formData.get("minute") as string) || "0", 10);
  const reason = (formData.get("reason") as string | null)?.trim() || "Offside";
  const note = (formData.get("note") as string | null)?.trim() || null;

  if (!matchId || !competitionTeamId) {
    redirect(`/admin/fixtures/${matchId}/live?error=missing`);
  }

  if (!hasDatabaseConfig()) {
    redirect(`/admin/fixtures/${matchId}/live?error=database`);
  }

  let matchSlug: string | null = null;

  try {
    const prisma = getPrismaClient();
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { slug: true },
    });
    matchSlug = match?.slug ?? null;

    // Disallowed goals do NOT increment score
    await prisma.matchEvent.create({
      data: {
        matchId,
        competitionTeamId,
        type: "NOTE",
        minute,
        minuteLabel: `${minute}'`,
        playerId,
        note: `Disallowed Goal (${reason})${note ? ` - ${note}` : ""}`,
      },
    });
  } catch (e) {
    console.error("Failed to log disallowed goal:", e);
    redirect(`/admin/fixtures/${matchId}/live?error=event_save`);
  }

  await revalidateAllMatchPaths(matchId, matchSlug);
  redirect(`/admin/fixtures/${matchId}/live?event_added=1`);
}

// â”€â”€â”€ 4. LOG CARD EVENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  let matchSlug: string | null = null;

  try {
    const prisma = getPrismaClient();
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { slug: true },
    });
    matchSlug = match?.slug ?? null;

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

  await revalidateAllMatchPaths(matchId, matchSlug);
  redirect(`/admin/fixtures/${matchId}/live?event_added=1`);
}

// â”€â”€â”€ 5. LOG SUBSTITUTION EVENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  let matchSlug: string | null = null;

  try {
    const prisma = getPrismaClient();
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { slug: true },
    });
    matchSlug = match?.slug ?? null;

    // Check for red carded players
    const redCards = await prisma.matchEvent.findMany({
      where: {
        matchId,
        type: "RED_CARD",
      },
      select: { playerId: true },
    });
    const redCardIds = redCards.map((r) => r.playerId).filter(Boolean) as string[];

    const validation = validateSubstitution(playerOutId, playerInId, redCardIds);
    if (!validation.valid) {
      redirect(`/admin/fixtures/${matchId}/live?error=sub_invalid`);
    }

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

  await revalidateAllMatchPaths(matchId, matchSlug);
  redirect(`/admin/fixtures/${matchId}/live?event_added=1`);
}

// â”€â”€â”€ 6. LOG PENALTY SHOOTOUT ATTEMPT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  let matchSlug: string | null = null;

  try {
    const prisma = getPrismaClient();
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

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { penaltyAttempts: true },
    });

    if (match) {
      matchSlug = match.slug;
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
        },
      });
    }
  } catch (e) {
    console.error("Failed to log penalty attempt:", e);
    redirect(`/admin/fixtures/${matchId}/live?error=event_save`);
  }

  await revalidateAllMatchPaths(matchId, matchSlug);
  redirect(`/admin/fixtures/${matchId}/live?event_added=1`);
}

// â”€â”€â”€ 7. DELETE / UNDO MATCH EVENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function deleteMatchEventAction(eventId: string, matchId: string) {
  if (!hasDatabaseConfig()) return;

  let matchSlug: string | null = null;
  let compId: string | null = null;

  try {
    const prisma = getPrismaClient();
    const event = await prisma.matchEvent.findUnique({
      where: { id: eventId },
      include: { match: true },
    });

    if (!event) return;
    matchSlug = event.match.slug;
    compId = event.match.competitionId;

    if (event.type === "GOAL" || event.type === "PENALTY_SCORED" || event.type === "OWN_GOAL") {
      const isHome = event.competitionTeamId === event.match.homeCompetitionTeamId;
      const isOwnGoal = event.type === "OWN_GOAL";
      const wasForHome = isOwnGoal ? !isHome : isHome;

      const newHome = wasForHome ? Math.max(0, (event.match.homeScore ?? 1) - 1) : event.match.homeScore;
      const newAway = !wasForHome ? Math.max(0, (event.match.awayScore ?? 1) - 1) : event.match.awayScore;

      await prisma.$transaction([
        prisma.matchEvent.delete({ where: { id: eventId } }),
        prisma.match.update({
          where: { id: matchId },
          data: {
            homeScore: newHome,
            awayScore: newAway,
          },
        }),
      ]);

      if (event.match.status === "FULLTIME") {
        await recalculateAllLeagueTablesAndStats(compId);
      }
    } else {
      await prisma.matchEvent.delete({ where: { id: eventId } });
    }
  } catch (e) {
    console.error("Failed to delete event:", e);
  }

  await revalidateAllMatchPaths(matchId, matchSlug, compId);
}

// â”€â”€â”€ 8. DELETE PENALTY ATTEMPT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function deletePenaltyAttemptAction(attemptId: string, matchId: string) {
  if (!hasDatabaseConfig()) return;

  let matchSlug: string | null = null;

  try {
    const prisma = getPrismaClient();
    await prisma.penaltyAttempt.delete({ where: { id: attemptId } });

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { penaltyAttempts: true },
    });

    if (match) {
      matchSlug = match.slug;
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
        },
      });
    }
  } catch (e) {
    console.error("Failed to delete penalty attempt:", e);
  }

  await revalidateAllMatchPaths(matchId, matchSlug);
}