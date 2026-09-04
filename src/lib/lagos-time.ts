export const LAGOS_TIME_ZONE = "Africa/Lagos";
export const LAGOS_OFFSET_MS = 60 * 60 * 1000;

export type LagosDateTimeParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
  second: number;
};

export function getLagosDateTimeParts(dateInput: Date | string): LagosDateTimeParts {
  const date =
    typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput);
  const lagosDate = new Date(date.getTime() + LAGOS_OFFSET_MS);

  return {
    year: lagosDate.getUTCFullYear(),
    month: lagosDate.getUTCMonth() + 1,
    day: lagosDate.getUTCDate(),
    weekday: lagosDate.getUTCDay(),
    hour: lagosDate.getUTCHours(),
    minute: lagosDate.getUTCMinutes(),
    second: lagosDate.getUTCSeconds(),
  };
}

export function createLagosDateTime({
  year,
  month,
  day,
  hour = 0,
  minute = 0,
  second = 0,
}: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
}) {
  return new Date(
    Date.UTC(year, month - 1, day, hour, minute, second) - LAGOS_OFFSET_MS,
  );
}

export function parseLagosDateTimeLocal(value: string) {
  const match = value
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/);

  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match;
  const parts = {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
    hour: hourText ? Number(hourText) : 0,
    minute: minuteText ? Number(minuteText) : 0,
    second: secondText ? Number(secondText) : 0,
  };

  if (
    !Number.isInteger(parts.year) ||
    !Number.isInteger(parts.month) ||
    !Number.isInteger(parts.day) ||
    !Number.isInteger(parts.hour) ||
    !Number.isInteger(parts.minute) ||
    !Number.isInteger(parts.second) ||
    parts.month < 1 ||
    parts.month > 12 ||
    parts.day < 1 ||
    parts.day > 31 ||
    parts.hour < 0 ||
    parts.hour > 23 ||
    parts.minute < 0 ||
    parts.minute > 59 ||
    parts.second < 0 ||
    parts.second > 59
  ) {
    return null;
  }

  const date = createLagosDateTime(parts);
  const normalized = getLagosDateTimeParts(date);

  if (
    normalized.year !== parts.year ||
    normalized.month !== parts.month ||
    normalized.day !== parts.day ||
    normalized.hour !== parts.hour ||
    normalized.minute !== parts.minute ||
    normalized.second !== parts.second
  ) {
    return null;
  }

  return date;
}

export function formatLagosDateTimeLocalInput(dateInput: Date | string) {
  const parts = getLagosDateTimeParts(dateInput);

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(
    parts.hour,
  )}:${pad(parts.minute)}`;
}

export function startOfLagosDay(dateInput: Date | string) {
  const parts = getLagosDateTimeParts(dateInput);

  return createLagosDateTime({
    year: parts.year,
    month: parts.month,
    day: parts.day,
  });
}

export function addLagosDays(dateInput: Date | string, days: number) {
  const parts = getLagosDateTimeParts(dateInput);

  return createLagosDateTime({
    year: parts.year,
    month: parts.month,
    day: parts.day + days,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  });
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}
