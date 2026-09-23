import { amsterdamParts } from "@/lib/datetime";
import { shortDateFromParts, type Locale } from "@/app/_lib/i18n";

const pad = (value: number) => String(value).padStart(2, "0");

/** `YYYY-MM-DD` for an `<input type="date">`, in the browser's local time zone. */
export function toDateInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `HH:mm` for an `<input type="time">`, in the browser's local time zone. */
export function toTimeInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Combines a date-input and time-input value into an ISO instant, or `""` if either is incomplete. */
export function combineDateTime(date: string, time: string): string {
  if (!date || !time) return "";
  const parsed = new Date(`${date}T${time}`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

/**
 * The end as an ISO instant on the start's day; an end at or before the start time crosses
 * midnight (21:00–00:00, 23:00–04:00) and lands on the next day. `""` when any part is missing.
 */
export function combineEndDateTime(date: string, startTime: string, endTime: string): string {
  if (!date || !startTime || !endTime) return "";
  const start = new Date(`${date}T${startTime}`);
  const end = new Date(`${date}T${endTime}`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  if (end.getTime() <= start.getTime()) end.setDate(end.getDate() + 1);
  return end.toISOString();
}

/** "Thu 24 Sep" — the app's short date format, Europe/Amsterdam, in the UI language. */
export function formatShortDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const [year, month, day] = amsterdamParts(date).dateKey.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return shortDateFromParts(locale, weekday, day, month - 1);
}

/** "19:30" — 24-hour time, Europe/Amsterdam. */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** The full English weekday name ("Thursday"), Europe/Amsterdam — matches `lib/datetime`'s `Weekday` and the check API. Display it via `localizeEnglishWeekday`. */
export function weekdayName(iso: string): string {
  return amsterdamParts(iso).weekday;
}
