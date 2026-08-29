export type MatchPeriod =
  | "FIRST_HALF"
  | "HALF_TIME"
  | "SECOND_HALF"
  | "EXTRA_TIME"
  | "PENALTIES"
  | "FULL_TIME";

export type MatchTimerState = {
  status: string;
  minuteLabel: string;
  displayTime: string;
  heroTime: string;
  clockTime: string;
  isLive: boolean;
  isPaused: boolean;
  totalSeconds: number;
  period: MatchPeriod;
};

export type MatchTimestampData = {
  status: string;
  minuteLabel?: string | null;
  currentPeriod?: string | null;
  firstHalfStartedAt?: string | Date | null;
  firstHalfEndedAt?: string | Date | null;
  secondHalfStartedAt?: string | Date | null;
  secondHalfEndedAt?: string | Date | null;
  extraTimeStartedAt?: string | Date | null;
  extraTimeEndedAt?: string | Date | null;
  stoppageTimeFirstHalf?: number | null;
  stoppageTimeSecondHalf?: number | null;
};

function toMillis(value?: string | Date | null) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function parseMinuteLabel(label?: string | null) {
  const clean = (label || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/\u2019/g, "'")
    .replace(/`/g, "'");

  const exactClockMatch = clean.match(/^(\d{1,3})(?:\+(\d{1,2}))?:(\d{1,2})$/);
  if (exactClockMatch) {
    const minute = Number(exactClockMatch[1]);
    const stoppage = exactClockMatch[2] ? Number(exactClockMatch[2]) : null;
    const seconds = Number(exactClockMatch[3]);
    if (!Number.isFinite(minute) || minute < 0 || !Number.isFinite(seconds) || seconds < 0 || seconds > 59) {
      return null;
    }

    const safeSeconds = seconds.toString().padStart(2, "0");
    const totalMinutes = minute + (stoppage ?? 0);

    return {
      minute,
      stoppage,
      seconds,
      totalSeconds: totalMinutes * 60 + seconds,
      label: `${minute}${stoppage ? `+${stoppage}` : ""}:${safeSeconds}`,
    };
  }

  const match = clean.match(/^(\d{1,3})(?:\+(\d{1,2}))?'?$/);
  if (!match) return null;

  const minute = Number(match[1]);
  const stoppage = match[2] ? Number(match[2]) : null;
  if (!Number.isFinite(minute) || minute < 0) return null;

  return {
    minute,
    stoppage,
    seconds: null,
    totalSeconds: (minute + (stoppage ?? 0)) * 60,
    label: `${minute}${stoppage ? `+${stoppage}` : ""}'`,
  };
}

function formatClock(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function firstHalfMinute(elapsedSeconds: number) {
  const displayedMinute = Math.floor(Math.max(0, elapsedSeconds) / 60) + 1;
  if (displayedMinute <= 45) return `${displayedMinute}'`;
  return `45+${displayedMinute - 45}'`;
}

function secondHalfMinute(elapsedSeconds: number) {
  const displayedMinute = Math.floor(Math.max(0, elapsedSeconds) / 60) + 46;
  if (displayedMinute <= 90) return `${displayedMinute}'`;
  return `90+${displayedMinute - 90}'`;
}

function periodFromMinute(minute: number, fallback: MatchPeriod): MatchPeriod {
  if (minute >= 46) return "SECOND_HALF";
  return fallback;
}

function normalizePeriod(period?: string | null): MatchPeriod {
  const value = (period || "").toUpperCase();
  if (value === "HALF_TIME" || value === "HALFTIME") return "HALF_TIME";
  if (value === "SECOND_HALF") return "SECOND_HALF";
  if (value === "PENALTIES" || value === "PENS" || value === "PEN") return "PENALTIES";
  if (value === "FULL_TIME" || value === "FULLTIME" || value === "FINISHED") return "FULL_TIME";
  return "FIRST_HALF";
}

/**
 * Calculates a football-style match clock from stored match state.
 * Public labels stay familiar: 12', 45+2', HT, 90+4', FT, or PEN.
 */
export function calculateMatchTimerState(
  data: MatchTimestampData,
  referenceDate: Date = new Date()
): MatchTimerState {
  const status = (data.status || "UPCOMING").toUpperCase();
  const rawMinute = (data.minuteLabel || "").trim();
  const rawMinuteUpper = rawMinute.toUpperCase();
  const period = normalizePeriod(data.currentPeriod);

  if (
    status === "FULLTIME" ||
    status === "FINISHED" ||
    rawMinuteUpper === "FT" ||
    period === "FULL_TIME"
  ) {
    return {
      status: "FULLTIME",
      minuteLabel: "FT",
      displayTime: "FT",
      heroTime: "FT",
      clockTime: "90:00",
      isLive: false,
      isPaused: true,
      totalSeconds: 90 * 60,
      period: "FULL_TIME",
    };
  }

  if (
    status === "PENALTIES" ||
    rawMinuteUpper === "PEN" ||
    rawMinuteUpper === "PENS" ||
    rawMinuteUpper === "PENALTIES" ||
    period === "PENALTIES"
  ) {
    return {
      status: "PENALTIES",
      minuteLabel: "PEN",
      displayTime: "PEN",
      heroTime: "PEN",
      clockTime: "PEN",
      isLive: true,
      isPaused: true,
      totalSeconds: 90 * 60,
      period: "PENALTIES",
    };
  }

  if (
    status === "HALFTIME" ||
    rawMinuteUpper === "HT" ||
    rawMinuteUpper === "HALF-TIME" ||
    period === "HALF_TIME"
  ) {
    return {
      status: "HALFTIME",
      minuteLabel: "HT",
      displayTime: "HT",
      heroTime: "HT",
      clockTime: "45:00",
      isLive: true,
      isPaused: true,
      totalSeconds: 45 * 60,
      period: "HALF_TIME",
    };
  }

  if (status === "POSTPONED") {
    return {
      status: "POSTPONED",
      minuteLabel: "PPD",
      displayTime: "PPD",
      heroTime: "Postponed",
      clockTime: "PPD",
      isLive: false,
      isPaused: true,
      totalSeconds: 0,
      period,
    };
  }

  if (status === "UPCOMING" || status === "SCHEDULED" || !status) {
    return {
      status: "UPCOMING",
      minuteLabel: "",
      displayTime: "KO",
      heroTime: "KO",
      clockTime: "0:00",
      isLive: false,
      isPaused: true,
      totalSeconds: 0,
      period: "FIRST_HALF",
    };
  }

  const nowMs = referenceDate.getTime();
  const secondHalfStartMs = toMillis(data.secondHalfStartedAt);
  if (secondHalfStartMs !== null) {
    const elapsedSeconds = Math.max(0, Math.floor((nowMs - secondHalfStartMs) / 1000));
    const totalSeconds = 45 * 60 + elapsedSeconds;
    const displayTime = secondHalfMinute(elapsedSeconds);

    return {
      status: "LIVE",
      minuteLabel: displayTime,
      displayTime,
      heroTime: displayTime,
      clockTime: formatClock(totalSeconds),
      isLive: true,
      isPaused: false,
      totalSeconds,
      period: "SECOND_HALF",
    };
  }

  const firstHalfStartMs = toMillis(data.firstHalfStartedAt);
  if (firstHalfStartMs !== null && period !== "SECOND_HALF") {
    const elapsedSeconds = Math.max(0, Math.floor((nowMs - firstHalfStartMs) / 1000));
    const displayTime = firstHalfMinute(elapsedSeconds);

    return {
      status: "LIVE",
      minuteLabel: displayTime,
      displayTime,
      heroTime: displayTime,
      clockTime: formatClock(elapsedSeconds),
      isLive: true,
      isPaused: false,
      totalSeconds: elapsedSeconds,
      period: "FIRST_HALF",
    };
  }

  const parsed = parseMinuteLabel(rawMinute);
  const displayTime =
    parsed?.label ||
    (period === "SECOND_HALF" ? "46'" : "1'");
  const totalSeconds = parsed
    ? parsed.totalSeconds
    : period === "SECOND_HALF"
    ? 45 * 60
    : 0;

  return {
    status: "LIVE",
    minuteLabel: displayTime,
    displayTime,
    heroTime: displayTime,
    clockTime: formatClock(totalSeconds),
    isLive: true,
    isPaused: true,
    totalSeconds,
    period: parsed ? periodFromMinute(parsed.minute, period) : period,
  };
}
