export type MatchStatusType =
  | "UPCOMING"
  | "LIVE"
  | "HALFTIME"
  | "PENALTIES"
  | "FULLTIME"
  | "POSTPONED";

export type MatchEventType =
  | "GOAL"
  | "OWN_GOAL"
  | "DISALLOWED_GOAL"
  | "YELLOW_CARD"
  | "SECOND_YELLOW"
  | "RED_CARD"
  | "SUBSTITUTION"
  | "PENALTY_AWARDED"
  | "PENALTY_SCORED"
  | "PENALTY_MISSED"
  | "VAR_REVIEW"
  | "VAR_GOAL_OVERTURNED"
  | "PERIOD_START"
  | "HALF_TIME"
  | "SECOND_HALF_START"
  | "FULL_TIME"
  | "NOTE";

export interface StateTransitionResult {
  valid: boolean;
  error?: string;
  nextStatus?: MatchStatusType;
  nextPeriod?: string;
  recordTimestampField?: string;
}

/**
 * Validates legal match state transitions.
 * Prevents invalid jumps (e.g. UPCOMING -> FULLTIME).
 */
export function validateMatchTransition(
  currentStatus: string,
  targetAction:
    | "START_MATCH"
    | "HALF_TIME"
    | "START_SECOND_HALF"
    | "START_EXTRA_TIME"
    | "START_PENALTIES"
    | "FULL_TIME"
    | "POSTPONE"
    | "RESET"
): StateTransitionResult {
  const normCurrent = (currentStatus || "UPCOMING").toUpperCase();

  switch (targetAction) {
    case "START_MATCH":
      if (normCurrent !== "UPCOMING" && normCurrent !== "POSTPONED") {
        return { valid: false, error: `Cannot start match from status '${normCurrent}'.` };
      }
      return {
        valid: true,
        nextStatus: "LIVE",
        nextPeriod: "FIRST_HALF",
        recordTimestampField: "firstHalfStartedAt",
      };

    case "HALF_TIME":
      if (normCurrent !== "LIVE") {
        return { valid: false, error: `Can only trigger half-time when match is LIVE.` };
      }
      return {
        valid: true,
        nextStatus: "HALFTIME",
        nextPeriod: "HALF_TIME",
        recordTimestampField: "firstHalfEndedAt",
      };

    case "START_SECOND_HALF":
      if (normCurrent !== "HALFTIME") {
        return { valid: false, error: `Can only start second half from HALFTIME.` };
      }
      return {
        valid: true,
        nextStatus: "LIVE",
        nextPeriod: "SECOND_HALF",
        recordTimestampField: "secondHalfStartedAt",
      };

    case "START_PENALTIES":
      if (normCurrent !== "LIVE" && normCurrent !== "HALFTIME") {
        return { valid: false, error: `Can only start penalty shootout during or after live play.` };
      }
      return {
        valid: true,
        nextStatus: "PENALTIES",
        nextPeriod: "PENALTIES",
      };

    case "FULL_TIME":
      if (normCurrent !== "LIVE" && normCurrent !== "PENALTIES" && normCurrent !== "HALFTIME") {
        return { valid: false, error: `Cannot end match that has not started.` };
      }
      return {
        valid: true,
        nextStatus: "FULLTIME",
        nextPeriod: "FULL_TIME",
        recordTimestampField: "secondHalfEndedAt",
      };

    case "POSTPONE":
      return {
        valid: true,
        nextStatus: "POSTPONED",
      };

    case "RESET":
      return {
        valid: true,
        nextStatus: "UPCOMING",
        nextPeriod: "FIRST_HALF",
      };

    default:
      return { valid: false, error: "Unknown action" };
  }
}

/**
 * Validates substitution rules (Player In must not be sent off, Player Out must be on pitch).
 */
export function validateSubstitution(
  playerOutId: string,
  playerInId: string,
  redCardedPlayerIds: string[] = []
): { valid: boolean; error?: string } {
  if (!playerOutId || !playerInId) {
    return { valid: false, error: "Both Player Out and Player In are required." };
  }
  if (playerOutId === playerInId) {
    return { valid: false, error: "Player Out and Player In cannot be the same player." };
  }
  if (redCardedPlayerIds.includes(playerInId)) {
    return { valid: false, error: "Cannot substitute a player who received a Red Card." };
  }
  if (redCardedPlayerIds.includes(playerOutId)) {
    return { valid: false, error: "A sent-off player cannot be substituted." };
  }
  return { valid: true };
}