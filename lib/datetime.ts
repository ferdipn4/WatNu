export const TIME_ZONE = "Europe/Amsterdam";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "long",
  hour12: false,
});

type ZonedParts = {
  dateKey: string;
  weekday: Weekday;
  hour: number;
  minute: number;
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function amsterdamParts(value: Date | string): ZonedParts {
  const parts = partsFormatter.formatToParts(toDate(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  // `hour12: false` can render midnight as "24" in some ICU versions.
  const hour = Number(get("hour")) % 24;

  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: get("weekday") as Weekday,
    hour,
    minute: Number(get("minute")),
  };
}

export function amsterdamDateKey(value: Date | string): string {
  return amsterdamParts(value).dateKey;
}

/** Offset of Europe/Amsterdam relative to UTC at the given instant, in ms. */
function zoneOffsetMs(instant: Date): number {
  const zoned = new Date(instant.toLocaleString("en-US", { timeZone: TIME_ZONE }));
  const utc = new Date(instant.toLocaleString("en-US", { timeZone: "UTC" }));
  return zoned.getTime() - utc.getTime();
}

/** The instant matching `YYYY-MM-DD` at the given local wall-clock time. */
export function amsterdamInstant(dateKey: string, hour = 0, minute = 0): Date {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  const guess = new Date(`${dateKey}T${hh}:${mm}:00Z`);
  return new Date(guess.getTime() - zoneOffsetMs(guess));
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const base = new Date(`${dateKey}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** Monday 00:00 through the following Monday 00:00, Amsterdam local time. */
export function amsterdamWeekRange(value: Date | string): {
  start: Date;
  end: Date;
  dayKeys: string[];
} {
  const { dateKey, weekday } = amsterdamParts(value);
  const index = WEEKDAYS.indexOf(weekday);
  const mondayKey = addDaysToDateKey(dateKey, -(index === -1 ? 0 : index));
  const dayKeys = WEEKDAYS.map((_, offset) =>
    addDaysToDateKey(mondayKey, offset),
  );

  return {
    start: amsterdamInstant(mondayKey),
    end: amsterdamInstant(addDaysToDateKey(mondayKey, 7)),
    dayKeys,
  };
}

export function weekdayForDateKey(dateKey: string): Weekday {
  return amsterdamParts(amsterdamInstant(dateKey, 12)).weekday;
}

/** Human-readable "today" used to resolve relative dates in AI prompts. */
export function describeToday(now: Date = new Date()): string {
  const { dateKey, weekday } = amsterdamParts(now);
  return `${weekday}, ${dateKey}`;
}
