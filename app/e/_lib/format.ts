/**
 * Date/time formatting shared by My WatNu (day groups), the organizer profile and Event detail
 * (the `.wn-fact` clock row). All comparisons use the local calendar day (via `Date`'s local
 * getters), consistently for "now" and for every event — see design/screens.md §4–5 for the exact
 * copy this produces. Names come from app/_lib/i18n/dates.ts in the UI language.
 */
import { dateNames, dayOnlyFromParts, shortDateFromParts, type Locale } from "@/app/_lib/i18n";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatTime(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** "Mon 21 Sep" — weekday, day, short month, no year, per design/README.md. */
export function formatShortDate(d: Date, locale: Locale): string {
  return shortDateFromParts(locale, d.getDay(), d.getDate(), d.getMonth());
}

/** "21 Sep" — no weekday, used beside a day header that already names the weekday. */
export function formatDayOnly(d: Date, locale: Locale): string {
  return dayOnlyFromParts(locale, d.getDate(), d.getMonth());
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

/** Whether the day of `d` is over: a saved event from yesterday is past, tonight's is not. */
export function isPastDay(d: Date, now: Date = new Date()): boolean {
  return dayKey(d) < dayKey(now);
}

/** Day-group header: "Today" / "Tomorrow", then the weekday name — each with the short date beside it. */
export function dayHeaderLabel(d: Date, locale: Locale, now: Date = new Date()): { name: string; date: string } {
  const names = dateNames(locale);
  const diff = diffCalendarDays(d, now);
  if (diff === 0) return { name: names.today, date: formatShortDate(d, locale) };
  if (diff === 1) return { name: names.tomorrow, date: formatShortDate(d, locale) };
  return { name: names.weekdayLong[d.getDay()], date: formatDayOnly(d, locale) };
}

/**
 * The event detail clock fact: "Tonight, Mon 21 Sep · 20:00–23:00". "Tonight" ("Today" before
 * 17:00) / "Tomorrow" is prefixed within 48 hours (design/screens.md §5); further out the short
 * date already names the weekday: "Thu 24 Sep · 19:00".
 */
export function factClockText(start: Date, end: Date | null, locale: Locale, now: Date = new Date()): string {
  const names = dateNames(locale);
  const diff = diffCalendarDays(start, now);
  const prefix = diff === 0 ? `${start.getHours() >= 17 ? names.tonight : names.today}, ` : diff === 1 ? `${names.tomorrow}, ` : "";
  const timeRange = end ? `${formatTime(start)}–${formatTime(end)}` : formatTime(start);
  return `${prefix}${formatShortDate(start, locale)} · ${timeRange}`;
}
