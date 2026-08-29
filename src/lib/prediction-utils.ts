import type { Match } from "@/lib/league-data";

export const PREDICTION_POINTS = {
  exactScore: 5,
  perfectWeekBonus: 10,
} as const;

const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type PredictionWeek = {
  weekKey: string;
  title: string;
  startsAt: string;
  endsAt: string;
  matches: Match[];
};

export function calculatePredictionPoints({
  predictedHomeScore,
  predictedAwayScore,
  actualHomeScore,
  actualAwayScore,
}: {
  predictedHomeScore: number;
  predictedAwayScore: number;
  actualHomeScore: number;
  actualAwayScore: number;
}) {
  const exactScore =
    predictedHomeScore === actualHomeScore &&
    predictedAwayScore === actualAwayScore;

  return {
    awardedPoints: exactScore ? PREDICTION_POINTS.exactScore : 0,
    exactScore,
  };
}

export type CompletedPredictionWeek = {
  weekKey: string;
  matchIds: string[];
};

export type WeeklyBonusPrediction = {
  matchId: string;
  weekKey: string;
  exactScore: boolean;
};

export type WeeklyBonusMatch = {
  id: string;
  kickoffAt: Date | string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
};

export function getCompletedPredictionWeeks(
  matches: WeeklyBonusMatch[],
): CompletedPredictionWeek[] {
  const weeks = new Map<
    string,
    { matchIds: string[]; hasUnfinishedMatch: boolean }
  >();

  for (const match of matches) {
    if (match.status === "POSTPONED" || match.status === "postponed") {
      continue;
    }

    const weekKey = getPredictionWeekKey(match.kickoffAt);
    const week = weeks.get(weekKey) ?? {
      matchIds: [],
      hasUnfinishedMatch: false,
    };

    week.matchIds.push(match.id);

    if (
      match.status !== "FULLTIME" ||
      typeof match.homeScore !== "number" ||
      typeof match.awayScore !== "number"
    ) {
      week.hasUnfinishedMatch = true;
    }

    weeks.set(weekKey, week);
  }

  return Array.from(weeks.entries())
    .filter(([, week]) => week.matchIds.length > 0 && !week.hasUnfinishedMatch)
    .map(([weekKey, week]) => ({
      weekKey,
      matchIds: week.matchIds,
    }));
}

export function calculateWeeklyBonusPoints(
  predictions: WeeklyBonusPrediction[],
  completedWeeks: CompletedPredictionWeek[],
) {
  const predictionsByWeek = new Map<string, Set<string>>();

  for (const prediction of predictions) {
    if (!prediction.exactScore) {
      continue;
    }

    const week = predictionsByWeek.get(prediction.weekKey) ?? new Set<string>();
    week.add(prediction.matchId);
    predictionsByWeek.set(prediction.weekKey, week);
  }

  const perfectWeeks = completedWeeks.filter((week) => {
    const exactMatchIds = predictionsByWeek.get(week.weekKey);

    if (!exactMatchIds) {
      return false;
    }

    return week.matchIds.every((matchId) => exactMatchIds.has(matchId));
  });

  return {
    perfectWeeks: perfectWeeks.length,
    bonusPoints: perfectWeeks.length * PREDICTION_POINTS.perfectWeekBonus,
    weekKeys: perfectWeeks.map((week) => week.weekKey),
  };
}

export function getPredictionWeekKey(dateInput: Date | string) {
  const { start } = getPredictionWeekBounds(dateInput);
  const lagosStart = new Date(start.getTime() + LAGOS_OFFSET_MS);

  return [
    lagosStart.getUTCFullYear(),
    pad(lagosStart.getUTCMonth() + 1),
    pad(lagosStart.getUTCDate()),
  ].join("-");
}

export function getPredictionWeekBounds(dateInput: Date | string) {
  const date =
    typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput);
  const lagosDate = new Date(date.getTime() + LAGOS_OFFSET_MS);
  const day = lagosDate.getUTCDay();
  const daysFromMonday = (day + 6) % 7;
  const startAsLagosUtc = Date.UTC(
    lagosDate.getUTCFullYear(),
    lagosDate.getUTCMonth(),
    lagosDate.getUTCDate() - daysFromMonday,
  );
  const start = new Date(startAsLagosUtc - LAGOS_OFFSET_MS);
  const end = new Date(start.getTime() + 7 * ONE_DAY_MS);

  return { start, end };
}

export function getPredictionWeekForMatches(
  matches: Match[],
  now = new Date(),
): PredictionWeek {
  const orderedMatches = [...matches].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const currentWeek = getPredictionWeekBounds(now);
  const currentWeekHasOpenMatch = orderedMatches.some(
    (match) =>
      match.status === "upcoming" &&
      new Date(match.date).getTime() > now.getTime() &&
      isWithinWeek(match.date, currentWeek),
  );
  const nextUpcomingMatch = orderedMatches.find(
    (match) =>
      match.status === "upcoming" &&
      new Date(match.date).getTime() > now.getTime(),
  );
  const targetDate = currentWeekHasOpenMatch
    ? now
    : nextUpcomingMatch?.date ?? orderedMatches[0]?.date ?? now;
  const bounds = getPredictionWeekBounds(targetDate);
  const weekMatches = orderedMatches.filter((match) =>
    isWithinWeek(match.date, bounds),
  );

  return {
    weekKey: getPredictionWeekKey(bounds.start),
    title: formatPredictionWeekLabel(bounds.start, bounds.end),
    startsAt: bounds.start.toISOString(),
    endsAt: bounds.end.toISOString(),
    matches: weekMatches,
  };
}

export function isPredictionLocked(dateInput: Date | string, now = new Date()) {
  const date =
    typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput);

  return date.getTime() <= now.getTime();
}

function isWithinWeek(
  dateInput: Date | string,
  bounds: { start: Date; end: Date },
) {
  const time =
    typeof dateInput === "string"
      ? new Date(dateInput).getTime()
      : dateInput.getTime();

  return time >= bounds.start.getTime() && time < bounds.end.getTime();
}

function formatPredictionWeekLabel(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Lagos",
  });
  const endInclusive = new Date(end.getTime() - ONE_DAY_MS);

  return `${formatter.format(start)} - ${formatter.format(endInclusive)}`;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}
