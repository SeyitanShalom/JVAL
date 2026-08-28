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
  displayTime: string; // e.g. "23'", "45+2'", "HT", "67'", "90+4'", "PENS", "FT"
  heroTime: string; // e.g. "23:45", "45+2:10", "HALF-TIME Â· HT", "FT"
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

/**
 * Calculates current match timer state from authoritative timestamps.
 * Does NOT rely on client keeping track from 0. Late joiners get exact minute.
 */
export function calculateMatchTimerState(
  data: MatchTimestampData,
  referenceDate: Date = new Date()
): MatchTimerState {
  const normStatus = (data.status || "UPCOMING").toUpperCase();
  const minLabel = (data.minuteLabel || "").trim();

  // Full-time or Finished
  if (normStatus === "FULLTIME" || normStatus === "FINISHED" || minLabel === "FT") {
    return {
      status: "FULLTIME",
      minuteLabel: "FT",
      displayTime: "FT",
      heroTime: "Full Time Â· FT",
      isLive: false,
      isPaused: true,
      totalSeconds: 90 * 60,
      period: "FULL_TIME",
    };
  }

  // Penalties
  if (normStatus === "PENALTIES" || minLabel === "PEN" || minLabel === "PENS") {
    return {
      status: "PENALTIES",
      minuteLabel: "PENS",
      displayTime: "PENS",
      heroTime: "SHOOTOUT Â· PENS",
      isLive: true,
      isPaused: true,
      totalSeconds: 90 * 60,
      period: "PENALTIES",
    };
  }

  // Half-Time
  if (normStatus === "HALFTIME" || minLabel === "HT" || minLabel === "Half-time") {
    return {
      status: "HALFTIME",
      minuteLabel: "HT",
      displayTime: "HT",
      heroTime: "HALF-TIME Â· HT",
      isLive: true,
      isPaused: true,
      totalSeconds: 45 * 60,
      period: "HALF_TIME",
    };
  }

  // Upcoming
  if (normStatus === "UPCOMING" || normStatus === "SCHEDULED" || !normStatus) {
    return {
      status: "UPCOMING",
      minuteLabel: "",
      displayTime: "Upcoming",
      heroTime: "Upcoming",
      isLive: false,
      isPaused: true,
      totalSeconds: 0,
      period: "FIRST_HALF",
    };
  }

  // â”€â”€ LIVE MATCH TIMESTAMP CALCULATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const nowMs = referenceDate.getTime();

  // Second Half
  if (data.secondHalfStartedAt) {
    const startMs = new Date(data.secondHalfStartedAt).getTime();
    const elapsedSecSinceSecondHalf = Math.max(0, Math.floor((nowMs - startMs) / 1000));
    const totalSeconds = (45 * 60) + elapsedSecSinceSecondHalf;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    let displayTime = `${Math.min(90, Math.max(45, totalMinutes))}'`;
    let heroTime = `${totalMinutes}:${secs.toString().padStart(2, "0")}`;

    if (totalMinutes >= 90) {
      const extra = totalMinutes - 90;
      displayTime = extra > 0 ? `90+${extra}'` : "90'";
      heroTime = `90+${extra}:${secs.toString().padStart(2, "0")}`;
    }

    return {
      status: "LIVE",
      minuteLabel: displayTime,
      displayTime,
      heroTime,
      isLive: true,
      isPaused: false,
      totalSeconds,
      period: "SECOND_HALF",
    };
  }

  // First Half
  if (data.firstHalfStartedAt) {
    const startMs = new Date(data.firstHalfStartedAt).getTime();
    const elapsedSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
    // Match starts from 1'
    const totalSeconds = Math.max(60, elapsedSec + 60);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    let displayTime = `${Math.min(45, Math.max(1, totalMinutes))}'`;
    let heroTime = `${totalMinutes}:${secs.toString().padStart(2, "0")}`;

    if (totalMinutes >= 45) {
      const extra = totalMinutes - 45;
      displayTime = extra > 0 ? `45+${extra}'` : "45'";
      heroTime = `45+${extra}:${secs.toString().padStart(2, "0")}`;
    }

    return {
      status: "LIVE",
      minuteLabel: displayTime,
      displayTime,
      heroTime,
      isLive: true,
      isPaused: false,
      totalSeconds,
      period: "FIRST_HALF",
    };
  }

  // Fallback if timestamps are not yet populated: parse minuteLabel
  let baseMinutes = 1;
  const parsedNum = parseInt((minLabel || "").replace(/[^0-9]/g, ""), 10);
  if (!isNaN(parsedNum)) {
    baseMinutes = parsedNum;
  }

  const isSecondHalf = baseMinutes >= 45;
  const isStoppageFirst = baseMinutes > 45 && minLabel.includes("+");

  let displayTime = `${baseMinutes}'`;
  if (isStoppageFirst) {
    displayTime = minLabel;
  } else if (baseMinutes >= 90 && minLabel.includes("+")) {
    displayTime = minLabel;
  }

  return {
    status: "LIVE",
    minuteLabel: displayTime,
    displayTime,
    heroTime: `${baseMinutes}:00`,
    isLive: true,
    isPaused: false,
    totalSeconds: baseMinutes * 60,
    period: isSecondHalf ? "SECOND_HALF" : "FIRST_HALF",
  };
}