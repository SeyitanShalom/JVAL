import type { Match } from "@/lib/league-data";
import {
  LAGOS_OFFSET_MS,
  createLagosDateTime,
  getLagosDateTimeParts,
  parseLagosDateTimeLocal,
} from "@/lib/lagos-time";

export const PREDICTION_POINTS = {
  exactScore: 5,
  perfectWeekBonus: 10,
} as const;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type PredictionWeek = {
  weekKey: string;
  title: string;
  startsAt: string;
  endsAt: string;
  matches: Match[];
};

export type PredictionWeekOption = Omit<PredictionWeek, "matches"> & {
  matchCount: number;
  isActive: boolean;
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
  const lagosDate = getLagosDateTimeParts(date);
  const daysFromMonday = (lagosDate.weekday + 6) % 7;
  const start = createLagosDateTime({
    year: lagosDate.year,
    month: lagosDate.month,
    day: lagosDate.day - daysFromMonday,
  });
  const end = new Date(start.getTime() + 7 * ONE_DAY_MS);

  return { start, end };
}

export function getPredictionWeekBoundsForKey(weekKey: string) {
  const date = parseLagosDateTimeLocal(weekKey);

  if (!date) {
    return null;
  }

  const bounds = getPredictionWeekBounds(date);

  if (getPredictionWeekKey(bounds.start) !== weekKey) {
    return null;
  }

  return bounds;
}

export function getActivePredictionWeekBounds(now = new Date()) {
  const lagosDay = getLagosDateTimeParts(now).weekday;
  const targetDate =
    lagosDay === 0 ? new Date(now.getTime() + ONE_DAY_MS) : now;

  return getPredictionWeekBounds(targetDate);
}

export function getActivePredictionWeekKey(now = new Date()) {
  const { start } = getActivePredictionWeekBounds(now);

  return getPredictionWeekKey(start);
}

export function getPredictionMonthKey(dateInput: Date | string) {
  const date =
    typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput);
  const lagosDate = getLagosDateTimeParts(date);

  return [lagosDate.year, pad(lagosDate.month)].join("-");
}

export function getActivePredictionMonthKey(now = new Date()) {
  return getPredictionMonthKey(now);
}

export function getPredictionWeekForMatches(
  matches: Match[],
  now = new Date(),
  requestedWeekKey?: string,
): PredictionWeek {
  const orderedMatches = [...matches].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const requestedBounds = requestedWeekKey
    ? getPredictionWeekBoundsForKey(requestedWeekKey)
    : null;
  const bounds = requestedBounds ?? getActivePredictionWeekBounds(now);
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

export function getPredictionWeekOptions(
  matches: Match[],
  now = new Date(),
): PredictionWeekOption[] {
  const activeWeekKey = getActivePredictionWeekKey(now);
  const options = new Map<
    string,
    { bounds: { start: Date; end: Date }; matchCount: number }
  >();

  for (const match of matches) {
    const bounds = getPredictionWeekBounds(match.date);
    const weekKey = getPredictionWeekKey(bounds.start);
    const current = options.get(weekKey);

    options.set(weekKey, {
      bounds,
      matchCount: (current?.matchCount ?? 0) + 1,
    });
  }

  for (const bounds of [
    getPredictionWeekBounds(now),
    getActivePredictionWeekBounds(now),
  ]) {
    const weekKey = getPredictionWeekKey(bounds.start);

    if (!options.has(weekKey)) {
      options.set(weekKey, { bounds, matchCount: 0 });
    }
  }

  return Array.from(options.entries())
    .sort(([, a], [, b]) => a.bounds.start.getTime() - b.bounds.start.getTime())
    .map(([weekKey, option]) => ({
      weekKey,
      title: formatPredictionWeekLabel(option.bounds.start, option.bounds.end),
      startsAt: option.bounds.start.toISOString(),
      endsAt: option.bounds.end.toISOString(),
      matchCount: option.matchCount,
      isActive: weekKey === activeWeekKey,
    }));
}

export function isPredictionLocked(dateInput: Date | string, now = new Date()) {
  const date =
    typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput);

  return date.getTime() <= now.getTime();
}

export function canPredictFixture(
  match: { kickoffAt: Date | string; status: string },
  now = new Date(),
) {
  return (
    isPredictionStatusOpen(match.status) &&
    getPredictionWeekKey(match.kickoffAt) === getActivePredictionWeekKey(now) &&
    !isPredictionLocked(match.kickoffAt, now)
  );
}

export function isPredictionStatusOpen(status: string) {
  const normalized = status.toLowerCase();

  return normalized === "upcoming" || normalized === "postponed";
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
