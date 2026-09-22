/**
 * Date/time formatting shared by My WatNu (day groups) and Event detail (the
 * `.wn-fact` clock row), kept dependency-free so both routes can import it
 * without pulling in `Intl` locale quirks. All comparisons use the local
 * calendar day (via `Date`'s local getters), consistently for "now" and for
 * every event — see design/screens.md §4–5 for the exact copy this produces.
 */
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatTime(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** "Mon 21 Sep" — weekday, day, short month, no year, per design/README.md. */
export function formatShortDate(d: Date): string {
  return `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

/** "21 Sep" — no weekday, used beside a day header that already names the weekday. */
export function formatDayOnly(d: Date): string {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Whole calendar days between `a` and `b` (positive when `a` is later), ignoring time of day. */
export function diffCalendarDays(a: Date, b: Date): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_PER_DAY);
}

/** Stable per-day grouping key, local calendar date. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Day-group header: "Today" / "Tomorrow", then the weekday name — each with the short date beside it. */
export function dayHeaderLabel(d: Date, now: Date = new Date()): { name: string; date: string } {
  const diff = diffCalendarDays(d, now);
  if (diff === 0) return { name: "Today", date: formatShortDate(d) };
  if (diff === 1) return { name: "Tomorrow", date: formatShortDate(d) };
  return { name: WEEKDAY_LONG[d.getDay()], date: formatDayOnly(d) };
}

/**
 * The event detail clock fact: "Tonight, Mon 21 Sep · 20:00–23:00". "Tonight" ("Today" before
 * 17:00) / "Tomorrow" is prefixed within 48 hours (design/screens.md §5); further out the short
 * date already names the weekday: "Thu 24 Sep · 19:00".
 */
export function factClockText(start: Date, end: Date | null, now: Date = new Date()): string {
  const diff = diffCalendarDays(start, now);
  const prefix = diff === 0 ? (start.getHours() >= 17 ? "Tonight, " : "Today, ") : diff === 1 ? "Tomorrow, " : "";
  const timeRange = end ? `${formatTime(start)}–${formatTime(end)}` : formatTime(start);
  return `${prefix}${formatShortDate(start)} · ${timeRange}`;
}

/**
 * The promo sheet's context line: "Salsa Sociëteit at Café Mestreech ·
 * tonight until 23:00" (design/screens.md §5).
 */
export function promoSheetContext(
  organizerName: string,
  location: string,
  start: Date,
  end: Date | null,
  now: Date = new Date(),
): string {
  const diff = diffCalendarDays(start, now);
  const dayWord = diff === 0 ? "tonight" : diff === 1 ? "tomorrow" : formatShortDate(start);
  const when = end ? `${dayWord} until ${formatTime(end)}` : `${dayWord} from ${formatTime(start)}`;
  return `${organizerName} at ${location} · ${when}`;
}
