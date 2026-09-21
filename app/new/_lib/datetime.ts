import { amsterdamParts } from "@/lib/datetime";

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

/** "Thu 24 Sep" — the app's short date format, Europe/Amsterdam. */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
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

/** The full weekday name ("Thursday"), Europe/Amsterdam — matches `lib/datetime`'s `Weekday`. */
export function weekdayName(iso: string): string {
  return amsterdamParts(iso).weekday;
}
