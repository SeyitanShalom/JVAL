"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { calculateMatchTimerState } from "@/lib/match-timer-utils";
import { recalculateAllLeagueTablesAndStats } from "@/lib/standings-engine";
import { scoreFinishedPredictions } from "@/lib/prediction-service";
import { validateSubstitution } from "@/lib/match-state-machine";
import type {
  LineupRole,
  MatchEventType,
  MatchPeriod,
  MatchStatus,
} from "@prisma/client";

type MatchTimerPatch = {
  status: MatchStatus;
  minuteLabel: string | null;
  currentPeriod: MatchPeriod;
  firstHalfStartedAt?: Date | null;
  firstHalfEndedAt?: Date | null;
  secondHalfStartedAt?: Date | null;
  secondHalfEndedAt?: Date | null;
  extraTimeStartedAt?: Date | null;
  extraTimeEndedAt?: Date | null;
  stoppageTimeFirstHalf?: number | null;
  stoppageTimeSecondHalf?: number | null;
};

type MatchClockSnapshot = {
  status: string;
  minuteLabel: string | null;
  currentPeriod: MatchPeriod | string | null;
  firstHalfStartedAt: Date | null;
  secondHalfStartedAt: Date | null;
};

async function revalidateAllMatchPaths(matchId: string, slug?: string | null, compId?: string | null) {
  revalidatePath(`/admin/fixtures/${matchId}/live`);
  revalidatePath("/admin/fixtures");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/fixtures");
  revalidatePath("/fixtures-results");
  revalidatePath("/predict");
  revalidatePath("/tables");
  revalidatePath("/statistics");
  revalidatePath("/profile");
  revalidatePath("/competitions");
  if (slug) {
    revalidatePath(`/matches/${slug}`);
    revalidatePath(`/matches/${slug}/team-sheet`);
  }
  if (compId) {
    revalidatePath(`/competitions/${compId}`);
  }
}

function cleanMinute(minute: number) {
  return Number.isFinite(minute) && minute > 0 ? minute : 1;
}

function minuteLabelFromNumber(minute: number) {
  const safeMinute = cleanMinute(minute);
  if (safeMinute > 90) return `90+${safeMinute - 90}'`;
  if (safeMinute > 45 && safeMinute < 46) return `45+${safeMinute - 45}'`;
  return `${safeMinute}'`;
}

function matchTimeFromForm(formData: FormData) {
  const minute = cleanMinute(parseInt((formData.get("minute") as string) || "0", 10));

  return {
    minute,
    minuteLabel: minuteLabelFromNumber(minute),
    sortOrder: minute * 60,
  };
}

function maxEventMinuteForMatch(match: MatchClockSnapshot) {
  const timerState = calculateMatchTimerState({
    status: match.status,
    minuteLabel: match.minuteLabel,
    currentPeriod: match.currentPeriod,
    firstHalfStartedAt: match.firstHalfStartedAt,
    secondHalfStartedAt: match.secondHalfStartedAt,
  });
  const normalizedStatus = timerState.status.toUpperCase();
  if (normalizedStatus === "UPCOMING" || normalizedStatus === "POSTPONED") return 0;

  const elapsedMinutes = Math.floor(Math.max(0, timerState.totalSeconds) / 60);
  const hasStarted = timerState.totalSeconds > 0 || normalizedStatus === "HALFTIME" || normalizedStatus === "FULLTIME";
  return Math.min(120, Math.max(hasStarted ? 1 : 0, elapsedMinutes));
}

function isNextRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

function periodForMinute(minute: number): MatchPeriod {
  return cleanMinute(minute) >= 46 ? "SECOND_HALF" : "FIRST_HALF";
}

async function syncFinishedMatchDerivedData(
  competitionId: string | null,
  matchIds: string[],
  resetUnfinished = false,
) {
  if (competitionId) {
    await recalculateAllLeagueTablesAndStats(competitionId);
  }

  await scoreFinishedPredictions(undefined, {
    matchIds,
    resetUnfinished,
  });
}

function statusAfterTimedEvent(currentStatus: string): MatchStatus {
  return currentStatus === "FULLTIME"
    ? ("FULLTIME" as MatchStatus)
    : ("LIVE" as MatchStatus);
}

function playableMinuteOrDefault(label?: string | null) {
  const value = (label || "").trim();
  return /^\d{1,3}(\+\d{1,2})?'?$/.test(value) || /^\d{1,3}(\+\d{1,2})?:[0-5]?\d$/.test(value)
    ? value
    : "1'";
}

function createStatusPatch(
  targetStatus: string,
  minuteLabel: string | undefined,
  existing: {
    status: string;
    minuteLabel: string | null;
    currentPeriod: MatchPeriod;
    firstHalfStartedAt: Date | null;
    firstHalfEndedAt: Date | null;
    secondHalfStartedAt: Date | null;
    secondHalfEndedAt: Date | null;
  }
): MatchTimerPatch {
  const now = new Date();
  const normalizedStatus = targetStatus.toUpperCase();
  const requestedMinute = (minuteLabel || "").trim();

  if (normalizedStatus === "LIVE") {
    const startsSecondHalf =
      requestedMinute === "46'" ||
      requestedMinute === "45'" ||
      existing.status === "HALFTIME" ||
      existing.currentPeriod === "HALF_TIME";

    if (startsSecondHalf) {
      return {
        status: "LIVE" as MatchStatus,
        minuteLabel: "46'",
        currentPeriod: "SECOND_HALF",
        firstHalfEndedAt: existing.firstHalfEndedAt ?? now,
        secondHalfStartedAt: existing.secondHalfStartedAt ?? now,
      };
    }

    return {
      status: "LIVE" as MatchStatus,
      minuteLabel: requestedMinute || playableMinuteOrDefault(existing.minuteLabel),
      currentPeriod: "FIRST_HALF",
      firstHalfStartedAt: existing.firstHalfStartedAt ?? now,
    };
  }

  if (normalizedStatus === "HALFTIME") {
    return {
      status: "HALFTIME" as MatchStatus,
      minuteLabel: "HT",
      currentPeriod: "HALF_TIME",
      firstHalfEndedAt: existing.firstHalfEndedAt ?? now,
    };
  }

  if (normalizedStatus === "PENALTIES") {
    return {
      status: "PENALTIES" as MatchStatus,
      minuteLabel: "PEN",
      currentPeriod: "PENALTIES",
    };
  }

  if (normalizedStatus === "FULLTIME") {
    return {
      status: "FULLTIME" as MatchStatus,
      minuteLabel: "FT",
      currentPeriod: "FULL_TIME",
      secondHalfEndedAt: existing.secondHalfEndedAt ?? now,
    };
  }

  if (normalizedStatus === "POSTPONED") {
    return {
      status: "POSTPONED" as MatchStatus,
      minuteLabel: null,
      currentPeriod: existing.currentPeriod || "FIRST_HALF",
    };
  }

  return {
    status: "UPCOMING" as MatchStatus,
    minuteLabel: null,
    currentPeriod: "FIRST_HALF",
    firstHalfStartedAt: null,
    firstHalfEndedAt: null,
    secondHalfStartedAt: null,
    secondHalfEndedAt: null,
    extraTimeStartedAt: null,
    extraTimeEndedAt: null,
    stoppageTimeFirstHalf: null,
    stoppageTimeSecondHalf: null,
  };
}

async function syncMatchMinuteAfterEventDelete(
  prisma: ReturnType<typeof getPrismaClient>,
  matchId: string,
  status: string
) {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === "FULLTIME") {
    await prisma.match.update({ where: { id: matchId }, data: { minuteLabel: "FT" } });
    return;
  }
  if (normalizedStatus === "HALFTIME") {
    await prisma.match.update({ where: { id: matchId }, data: { minuteLabel: "HT" } });
    return;
  }
  if (normalizedStatus === "PENALTIES") {
    await prisma.match.update({ where: { id: matchId }, data: { minuteLabel: "PEN" } });
    return;
  }
  if (normalizedStatus !== "LIVE") return;

  const latestEvent = await prisma.matchEvent.findFirst({
    where: { matchId },
    orderBy: [{ minute: "desc" }, { sortOrder: "desc" }, { createdAt: "desc" }],
    select: { minute: true, minuteLabel: true },
  });
  const latestMinute = cleanMinute(latestEvent?.minute ?? 1);

  await prisma.match.update({
    where: { id: matchId },
    data: {
      minuteLabel: latestEvent?.minuteLabel || minuteLabelFromNumber(latestMinute),
      currentPeriod: periodForMinute(latestMinute),
    },
  });
}

export async function updateMatchLiveStatusAction(
  matchId: string,
  targetStatus: string,
  minuteLabel?: string
) {
  await requireAdminPermission("manageMatchOperations");

  if (!hasDatabaseConfig()) return;

  let matchSlug: string | null = null;
  let competitionId: string | null = null;

  try {
    const prisma = getPrismaClient();
    const existing = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        slug: true,
        competitionId: true,
        status: true,
        minuteLabel: true,
        currentPeriod: true,
        firstHalfStartedAt: true,
        firstHalfEndedAt: true,
        secondHalfStartedAt: true,
        secondHalfEndedAt: true,
        homeScore: true,
        awayScore: true,
      },
    });

    if (!existing) return;

    matchSlug = existing.slug;
    competitionId = existing.competitionId;

    const patch = createStatusPatch(targetStatus, minuteLabel, existing);
    const shouldSetScore =
      patch.status === "LIVE" ||
      patch.status === ("PENALTIES" as MatchStatus) ||
      patch.status === ("FULLTIME" as MatchStatus);
    const touchesFinishedResult =
      existing.status === "FULLTIME" || patch.status === ("FULLTIME" as MatchStatus);

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        ...patch,
        ...(shouldSetScore && existing.homeScore === null ? { homeScore: 0 } : {}),
        ...(shouldSetScore && existing.awayScore === null ? { awayScore: 0 } : {}),
      },
    });

    if (touchesFinishedResult) {
      await syncFinishedMatchDerivedData(
        updated.competitionId,
        [updated.id],
        patch.status !== ("FULLTIME" as MatchStatus),
      );
    }
  } catch (e) {
    console.error("Failed to update match status:", e);
  }

  await revalidateAllMatchPaths(matchId, matchSlug, competitionId);
}

export async function saveMatchLineupAction(formData: FormData) {
  await requireAdminPermission("manageMatchOperations");

  const matchId = (formData.get("matchId") as string | null)?.trim();
  const competitionTeamId = (
    formData.get("competitionTeamId") as string | null
  )?.trim();
  const formation = (formData.get("formation") as string | null)?.trim() || null;
  const captainId = (formData.get("captainId") as string | null)?.trim() || null;
  const goalkeeperId =
    (formData.get("goalkeeperId") as string | null)?.trim() || null;

  if (!matchId || !competitionTeamId) {
    redirect(`/admin/fixtures/${matchId || ""}/live?error=missing`);
  }

  if (!hasDatabaseConfig()) {
    redirect(`/admin/fixtures/${matchId}/live?error=database`);
  }

  let matchSlug: string | null = null;
  let competitionId: string | null = null;

  try {
    const prisma = getPrismaClient();
    const [match, competitionTeam] = await Promise.all([
      prisma.match.findUnique({
        where: { id: matchId },
        select: {
          slug: true,
          competitionId: true,
          homeCompetitionTeamId: true,
          awayCompetitionTeamId: true,
        },
      }),
      prisma.competitionTeam.findUnique({
        where: { id: competitionTeamId },
        include: {
          teamSeason: {
            include: {
              squadPlayers: { orderBy: { squadNumber: "asc" } },
            },
          },
        },
      }),
    ]);

    if (!match || !competitionTeam) {
      redirect(`/admin/fixtures/${matchId}/live?error=missing`);
    }

    matchSlug = match.slug;
    competitionId = match.competitionId;

    if (
      competitionTeamId !== match.homeCompetitionTeamId &&
      competitionTeamId !== match.awayCompetitionTeamId
    ) {
      redirect(`/admin/fixtures/${matchId}/live?error=lineup_team`);
    }

    const validSquadIds = new Set(
      competitionTeam.teamSeason.squadPlayers.map((player) => player.id),
    );
    const squadOrder = new Map(
      competitionTeam.teamSeason.squadPlayers.map((player, index) => [
        player.id,
        index + 1,
      ]),
    );
    const selectedPlayerIds = (formData.getAll("squadPlayerIds") as string[])
      .map((value) => value.trim())
      .filter((value) => validSquadIds.has(value));
    const lineupPlayers = selectedPlayerIds
      .map((squadPlayerId) => {
        const rawRole = (formData.get(`role:${squadPlayerId}`) as string | null)
          ?.trim()
          .toUpperCase();
        if (rawRole !== "STARTER" && rawRole !== "SUBSTITUTE") return null;

        return {
          squadPlayerId,
          role: rawRole as LineupRole,
          sortOrder: squadOrder.get(squadPlayerId) ?? 999,
          isCaptain: squadPlayerId === captainId,
          isGoalkeeper: squadPlayerId === goalkeeperId,
        };
      })
      .filter(
        (
          player,
        ): player is {
          squadPlayerId: string;
          role: LineupRole;
          sortOrder: number;
          isCaptain: boolean;
          isGoalkeeper: boolean;
        } => Boolean(player),
      );
    const selectedLineupIds = new Set(
      lineupPlayers.map((player) => player.squadPlayerId),
    );
    const cleanCaptainId =
      captainId && selectedLineupIds.has(captainId) ? captainId : null;
    const cleanGoalkeeperId =
      goalkeeperId && selectedLineupIds.has(goalkeeperId) ? goalkeeperId : null;

    await prisma.$transaction(async (tx) => {
      const lineup = await tx.matchLineup.upsert({
        where: {
          matchId_competitionTeamId: {
            matchId,
            competitionTeamId,
          },
        },
        create: {
          matchId,
          competitionTeamId,
          formation,
          captainId: cleanCaptainId,
          goalkeeperId: cleanGoalkeeperId,
        },
        update: {
          formation,
          captainId: cleanCaptainId,
          goalkeeperId: cleanGoalkeeperId,
        },
      });

      await tx.matchLineupPlayer.deleteMany({
        where: { lineupId: lineup.id },
      });

      if (lineupPlayers.length > 0) {
        await tx.matchLineupPlayer.createMany({
          data: lineupPlayers.map((player) => ({
            lineupId: lineup.id,
            squadPlayerId: player.squadPlayerId,
            role: player.role,
            shirtNumber:
              competitionTeam.teamSeason.squadPlayers.find(
                (squadPlayer) => squadPlayer.id === player.squadPlayerId,
              )?.squadNumber ?? null,
            position:
              competitionTeam.teamSeason.squadPlayers.find(
                (squadPlayer) => squadPlayer.id === player.squadPlayerId,
              )?.detailedPosition ?? null,
            sortOrder: player.sortOrder,
            isCaptain: player.squadPlayerId === cleanCaptainId,
            isGoalkeeper: player.squadPlayerId === cleanGoalkeeperId,
          })),
        });
      }
    });

    if (competitionId) {
      await recalculateAllLeagueTablesAndStats(competitionId);
    }
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    console.error("Failed to save lineup:", e);
    redirect(`/admin/fixtures/${matchId}/live?error=lineup_save`);
  }

  await revalidateAllMatchPaths(matchId, matchSlug, competitionId);
  redirect(`/admin/fixtures/${matchId}/live?lineup_saved=1`);
}

export async function logGoalEventAction(formData: FormData) {
  await requireAdminPermission("manageMatchOperations");

  const matchId = (formData.get("matchId") as string | null)?.trim();
  const competitionTeamId = (formData.get("competitionTeamId") as string | null)?.trim();
  const playerId = (formData.get("playerId") as string | null)?.trim() || null;
  const assistPlayerId = (formData.get("assistPlayerId") as string | null)?.trim() || null;
  const matchTime = matchTimeFromForm(formData);
  const { minute, minuteLabel } = matchTime;
  const goalType = ((formData.get("goalType") as string) || "GOAL") as MatchEventType;
  const note = (formData.get("note") as string | null)?.trim() || null;

  if (!matchId || !competitionTeamId) {
    redirect(`/admin/fixtures/${matchId}/live?error=missing`);
  }

  if (!hasDatabaseConfig()) {
    redirect(`/admin/fixtures/${matchId}/live?error=database`);
  }

  let matchSlug: string | null = null;
  let competitionId: string | null = null;

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
        status: true,
        minuteLabel: true,
        currentPeriod: true,
        firstHalfStartedAt: true,
        secondHalfStartedAt: true,
      },
    });

    if (!match) {
      redirect(`/admin/fixtures/${matchId}/live?error=missing`);
    }

    matchSlug = match.slug;
    competitionId = match.competitionId;

    if (minute > maxEventMinuteForMatch(match)) {
      redirect(`/admin/fixtures/${matchId}/live?error=future_time`);
    }

    const isHome = competitionTeamId === match.homeCompetitionTeamId;
    const isOwnGoal = goalType === "OWN_GOAL";
    const scoreForHome = isOwnGoal ? !isHome : isHome;

    const newHomeScore = scoreForHome ? (match.homeScore ?? 0) + 1 : (match.homeScore ?? 0);
    const newAwayScore = !scoreForHome ? (match.awayScore ?? 0) + 1 : (match.awayScore ?? 0);
    const nextStatus = statusAfterTimedEvent(match.status);

    await prisma.$transaction([
      prisma.matchEvent.create({
        data: {
          matchId,
          competitionTeamId,
          type: goalType,
          period: periodForMinute(minute),
          minute,
          minuteLabel,
          sortOrder: matchTime.sortOrder,
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
          status: nextStatus,
          minuteLabel,
          currentPeriod: periodForMinute(minute),
        },
      }),
    ]);

    if (nextStatus === ("FULLTIME" as MatchStatus)) {
      await syncFinishedMatchDerivedData(competitionId, [matchId]);
    }
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    console.error("Failed to log goal event:", e);
    redirect(`/admin/fixtures/${matchId}/live?error=event_save`);
  }

  await revalidateAllMatchPaths(matchId, matchSlug, competitionId);
  redirect(`/admin/fixtures/${matchId}/live?event_added=1`);
}

export async function logDisallowedGoalAction(formData: FormData) {
  await requireAdminPermission("manageMatchOperations");

  const matchId = (formData.get("matchId") as string | null)?.trim();
  const competitionTeamId = (formData.get("competitionTeamId") as string | null)?.trim();
  const playerId = (formData.get("playerId") as string | null)?.trim() || null;
  const matchTime = matchTimeFromForm(formData);
  const { minute, minuteLabel } = matchTime;
  const reason = (formData.get("reason") as string | null)?.trim() || "Offside";
  const note = (formData.get("note") as string | null)?.trim() || null;

  if (!matchId || !competitionTeamId) {
    redirect(`/admin/fixtures/${matchId}/live?error=missing`);
  }

  if (!hasDatabaseConfig()) {
    redirect(`/admin/fixtures/${matchId}/live?error=database`);
  }

  let matchSlug: string | null = null;
  let competitionId: string | null = null;

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
        status: true,
        minuteLabel: true,
        currentPeriod: true,
        firstHalfStartedAt: true,
        secondHalfStartedAt: true,
      },
    });
    matchSlug = match?.slug ?? null;
    competitionId = match?.competitionId ?? null;
    if (!match) {
      redirect(`/admin/fixtures/${matchId}/live?error=missing`);
    }

    if (minute > maxEventMinuteForMatch(match)) {
      redirect(`/admin/fixtures/${matchId}/live?error=future_time`);
    }

    const isHome = competitionTeamId === match.homeCompetitionTeamId;
    const isAway = competitionTeamId === match.awayCompetitionTeamId;
    const newHomeScore = isHome ? Math.max(0, (match.homeScore ?? 0) - 1) : match.homeScore ?? 0;
    const newAwayScore = isAway ? Math.max(0, (match.awayScore ?? 0) - 1) : match.awayScore ?? 0;
    const nextStatus = statusAfterTimedEvent(match.status);

    await prisma.$transaction([
      prisma.matchEvent.create({
        data: {
          matchId,
          competitionTeamId,
          type: "NOTE",
          period: periodForMinute(minute),
          minute,
          minuteLabel,
          sortOrder: matchTime.sortOrder,
          playerId,
          note: `Disallowed Goal (${reason})${note ? ` - ${note}` : ""}`,
        },
      }),
      prisma.match.update({
        where: { id: matchId },
        data: {
          homeScore: newHomeScore,
          awayScore: newAwayScore,
          status: nextStatus,
          minuteLabel,
          currentPeriod: periodForMinute(minute),
        },
      }),
    ]);

    if (nextStatus === ("FULLTIME" as MatchStatus)) {
      await syncFinishedMatchDerivedData(competitionId, [matchId]);
    }
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    console.error("Failed to log disallowed goal:", e);
    redirect(`/admin/fixtures/${matchId}/live?error=event_save`);
  }

  await revalidateAllMatchPaths(matchId, matchSlug, competitionId);
  redirect(`/admin/fixtures/${matchId}/live?event_added=1`);
}

export async function logCardEventAction(formData: FormData) {
  await requireAdminPermission("manageMatchOperations");

  const matchId = (formData.get("matchId") as string | null)?.trim();
  const competitionTeamId = (formData.get("competitionTeamId") as string | null)?.trim();
  const playerId = (formData.get("playerId") as string | null)?.trim() || null;
  const matchTime = matchTimeFromForm(formData);
  const { minute, minuteLabel } = matchTime;
  const cardType = ((formData.get("cardType") as string) || "YELLOW_CARD") as MatchEventType;
  const note = (formData.get("note") as string | null)?.trim() || null;

  if (!matchId || !competitionTeamId || !playerId) {
    redirect(`/admin/fixtures/${matchId}/live?error=missing`);
  }

  if (!hasDatabaseConfig()) {
    redirect(`/admin/fixtures/${matchId}/live?error=database`);
  }

  let matchSlug: string | null = null;
  let competitionId: string | null = null;

  try {
    const prisma = getPrismaClient();
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        slug: true,
        competitionId: true,
        status: true,
        minuteLabel: true,
        currentPeriod: true,
        firstHalfStartedAt: true,
        secondHalfStartedAt: true,
      },
    });
    matchSlug = match?.slug ?? null;
    competitionId = match?.competitionId ?? null;
    if (!match) {
      redirect(`/admin/fixtures/${matchId}/live?error=missing`);
    }

    if (minute > maxEventMinuteForMatch(match)) {
      redirect(`/admin/fixtures/${matchId}/live?error=future_time`);
    }

    const nextStatus = statusAfterTimedEvent(match.status);

    await prisma.$transaction([
      prisma.matchEvent.create({
        data: {
          matchId,
          competitionTeamId,
          type: cardType,
          period: periodForMinute(minute),
          minute,
          minuteLabel,
          sortOrder: matchTime.sortOrder,
          playerId,
          note,
        },
      }),
      prisma.match.update({
        where: { id: matchId },
        data: {
          status: nextStatus,
          minuteLabel,
          currentPeriod: periodForMinute(minute),
        },
      }),
    ]);

    if (nextStatus === ("FULLTIME" as MatchStatus)) {
      await syncFinishedMatchDerivedData(competitionId, [matchId]);
    }
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    console.error("Failed to log card event:", e);
    redirect(`/admin/fixtures/${matchId}/live?error=event_save`);
  }

  await revalidateAllMatchPaths(matchId, matchSlug, competitionId);
  redirect(`/admin/fixtures/${matchId}/live?event_added=1`);
}

export async function logSubstitutionEventAction(formData: FormData) {
  await requireAdminPermission("manageMatchOperations");

  const matchId = (formData.get("matchId") as string | null)?.trim();
  const competitionTeamId = (formData.get("competitionTeamId") as string | null)?.trim();
  const playerOutId = (formData.get("playerOutId") as string | null)?.trim() || null;
  const playerInId = (formData.get("playerInId") as string | null)?.trim() || null;
  const matchTime = matchTimeFromForm(formData);
  const { minute, minuteLabel } = matchTime;
  const note = (formData.get("note") as string | null)?.trim() || null;

  if (!matchId || !competitionTeamId || !playerOutId || !playerInId) {
    redirect(`/admin/fixtures/${matchId}/live?error=missing`);
  }

  if (!hasDatabaseConfig()) {
    redirect(`/admin/fixtures/${matchId}/live?error=database`);
  }

  let matchSlug: string | null = null;
  let competitionId: string | null = null;

  try {
    const prisma = getPrismaClient();
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        slug: true,
        competitionId: true,
        status: true,
        minuteLabel: true,
        currentPeriod: true,
        firstHalfStartedAt: true,
        secondHalfStartedAt: true,
      },
    });
    matchSlug = match?.slug ?? null;
    competitionId = match?.competitionId ?? null;
    if (!match) {
      redirect(`/admin/fixtures/${matchId}/live?error=missing`);
    }

    if (minute > maxEventMinuteForMatch(match)) {
      redirect(`/admin/fixtures/${matchId}/live?error=future_time`);
    }

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

    const nextStatus = statusAfterTimedEvent(match.status);

    await prisma.$transaction([
      prisma.matchEvent.create({
        data: {
          matchId,
          competitionTeamId,
          type: "SUBSTITUTION",
          period: periodForMinute(minute),
          minute,
          minuteLabel,
          sortOrder: matchTime.sortOrder,
          playerOutId,
          playerInId,
          note,
        },
      }),
      prisma.match.update({
        where: { id: matchId },
        data: {
          status: nextStatus,
          minuteLabel,
          currentPeriod: periodForMinute(minute),
        },
      }),
    ]);

    if (nextStatus === ("FULLTIME" as MatchStatus)) {
      await syncFinishedMatchDerivedData(competitionId, [matchId]);
    }
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    console.error("Failed to log sub event:", e);
    redirect(`/admin/fixtures/${matchId}/live?error=event_save`);
  }

  await revalidateAllMatchPaths(matchId, matchSlug, competitionId);
  redirect(`/admin/fixtures/${matchId}/live?event_added=1`);
}

export async function logPenaltyAttemptAction(formData: FormData) {
  await requireAdminPermission("manageMatchOperations");

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
  let competitionId: string | null = null;

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
      competitionId = match.competitionId;
      const homePenalties = match.penaltyAttempts.filter(
        (p) => p.competitionTeamId === match.homeCompetitionTeamId && p.scored
      ).length;
      const awayPenalties = match.penaltyAttempts.filter(
        (p) => p.competitionTeamId === match.awayCompetitionTeamId && p.scored
      ).length;

      await prisma.match.update({
        where: { id: matchId },
        data: {
          status: "PENALTIES" as MatchStatus,
          minuteLabel: "PEN",
          currentPeriod: "PENALTIES",
          homePenaltyScore: homePenalties,
          awayPenaltyScore: awayPenalties,
        },
      });
    }
  } catch (e) {
    console.error("Failed to log penalty attempt:", e);
    redirect(`/admin/fixtures/${matchId}/live?error=event_save`);
  }

  await revalidateAllMatchPaths(matchId, matchSlug, competitionId);
  redirect(`/admin/fixtures/${matchId}/live?event_added=1`);
}

export async function deleteMatchEventAction(eventId: string, matchId: string) {
  await requireAdminPermission("manageMatchOperations");

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
    } else {
      await prisma.matchEvent.delete({ where: { id: eventId } });
    }

    await syncMatchMinuteAfterEventDelete(prisma, matchId, event.match.status);

    if (event.match.status === "FULLTIME") {
      await syncFinishedMatchDerivedData(compId, [matchId]);
    }
  } catch (e) {
    console.error("Failed to delete event:", e);
  }

  await revalidateAllMatchPaths(matchId, matchSlug, compId);
}

export async function deletePenaltyAttemptAction(attemptId: string, matchId: string) {
  await requireAdminPermission("manageMatchOperations");

  if (!hasDatabaseConfig()) return;

  let matchSlug: string | null = null;
  let compId: string | null = null;

  try {
    const prisma = getPrismaClient();
    await prisma.penaltyAttempt.delete({ where: { id: attemptId } });

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { penaltyAttempts: true },
    });

    if (match) {
      matchSlug = match.slug;
      compId = match.competitionId;
      const homePenalties = match.penaltyAttempts.filter(
        (p) => p.competitionTeamId === match.homeCompetitionTeamId && p.scored
      ).length;
      const awayPenalties = match.penaltyAttempts.filter(
        (p) => p.competitionTeamId === match.awayCompetitionTeamId && p.scored
      ).length;

      await prisma.match.update({
        where: { id: matchId },
        data: {
          minuteLabel: match.penaltyAttempts.length ? "PEN" : match.minuteLabel,
          homePenaltyScore: match.penaltyAttempts.length ? homePenalties : null,
          awayPenaltyScore: match.penaltyAttempts.length ? awayPenalties : null,
        },
      });
    }
  } catch (e) {
    console.error("Failed to delete penalty attempt:", e);
  }

  await revalidateAllMatchPaths(matchId, matchSlug, compId);
}
