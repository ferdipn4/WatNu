/**
 * Recurring events. A row with `recurrence` is a series: `start` (and `end`) describe its first
 * occurrence, `repeat_until` the last day it happens (null = open-ended). The API expands a series
 * into occurrences inside the window a screen asks for, each an ordinary event row with the same
 * id and a shifted start/end. Shifts happen on the Europe/Amsterdam calendar, so a 20:00 event
 * stays at 20:00 across the DST switch. A date the organizer skipped (`skipped_dates`) still
 * comes back, flagged `cancelled`, so a saved run says "cancelled this week" instead of vanishing.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDaysToDateKey, amsterdamInstant, amsterdamParts } from "@/lib/datetime";

export const RECURRENCES = ["weekly", "biweekly", "monthly"] as const;
export type Recurrence = (typeof RECURRENCES)[number];

/** At most this many occurrences per series come back (and without a `to`, the window is this long). */
const MAX_OCCURRENCES = 60;
const DEFAULT_HORIZON_DAYS = 56;
const DAY_MS = 86_400_000;

export type OccurrenceRow = {
  start: string;
  end: string | null;
  recurrence: Recurrence | null;
  repeat_until: string | null;
  /** `YYYY-MM-DD` dates the organizer skipped; those occurrences are returned with `cancelled: true` */
  skipped_dates?: string[] | null;
};

/** One occurrence of a row: the row with that occurrence's start/end, and whether the organizer skipped it. */
export type Occurrence<T> = T & { cancelled: boolean };

function dateKeyToUtcDay(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** How many steps of `recurrence` fit between two dates — the fast-forward to a window that starts long after the series did. */
function stepsBetween(fromKey: string, toKey: string, recurrence: Recurrence): number {
  if (recurrence === "monthly") {
    const [fy, fm] = fromKey.split("-").map(Number);
    const [ty, tm] = toKey.split("-").map(Number);
    return (ty - fy) * 12 + (tm - fm);
  }
  const days = Math.round((dateKeyToUtcDay(toKey) - dateKeyToUtcDay(fromKey)) / DAY_MS);
  return Math.floor(days / (recurrence === "weekly" ? 7 : 14));
}

/** `key` plus `months` calendar months, clamped to the last day of the target month (31 Jan → 28 Feb). */
function addMonthsToDateKey(key: string, months: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shiftDateKey(key: string, recurrence: Recurrence, steps: number): string {
  if (recurrence === "monthly") return addMonthsToDateKey(key, steps);
  return addDaysToDateKey(key, steps * (recurrence === "weekly" ? 7 : 14));
}

/**
 * The occurrences of `row` that start inside [from, to]. A one-off row is returned as is when it
 * fits the window. Without `to`, the horizon is eight weeks after `from` (or after the series start).
 */
export function expandOccurrences<T extends OccurrenceRow>(row: T, from: Date | null, to: Date | null): Occurrence<T>[] {
  const start = new Date(row.start);
  if (!row.recurrence) {
    if (from && start < from) return [];
    if (to && start > to) return [];
    return [{ ...row, cancelled: false }];
  }

  const { dateKey, hour, minute } = amsterdamParts(start);
  const durationMs = row.end ? new Date(row.end).getTime() - start.getTime() : null;
  const windowFrom = from ?? start;
  const windowTo = to ?? new Date(windowFrom.getTime() + DEFAULT_HORIZON_DAYS * DAY_MS);
  // The last day counts as a whole: an event on repeat_until itself still happens.
  const lastStart = row.repeat_until ? amsterdamInstant(addDaysToDateKey(row.repeat_until, 1)).getTime() - 1 : null;

  const skipped = new Set(row.skipped_dates ?? []);
  const occurrences: Occurrence<T>[] = [];
  // Start one step before the window (a series can be years old); the cap counts what is returned, not what is skipped.
  let step = Math.max(0, stepsBetween(dateKey, amsterdamParts(windowFrom).dateKey, row.recurrence) - 1);
  while (occurrences.length < MAX_OCCURRENCES) {
    const occurrenceKey = shiftDateKey(dateKey, row.recurrence, step);
    const occurrenceStart = amsterdamInstant(occurrenceKey, hour, minute);
    step += 1;
    if (occurrenceStart > windowTo) break;
    if (lastStart !== null && occurrenceStart.getTime() > lastStart) break;
    if (occurrenceStart < windowFrom) continue;
    occurrences.push({
      ...row,
      start: occurrenceStart.toISOString(),
      end: durationMs === null ? null : new Date(occurrenceStart.getTime() + durationMs).toISOString(),
      cancelled: skipped.has(occurrenceKey),
    });
  }
  return occurrences;
}

export type OccurrenceQuery = {
  from?: Date;
  to?: Date;
  category?: string;
  free?: boolean;
  organizer?: string;
  ids?: string[];
};

/**
 * The event occurrences matching `query`, in start order: one-off events by their start, series
 * by every occurrence in the window. `columns` is the select list (EVENT_COLUMNS or the joined one).
 */
export async function queryOccurrences<T extends OccurrenceRow>(
  supabase: SupabaseClient,
  columns: string,
  query: OccurrenceQuery,
): Promise<{ rows: Occurrence<T>[]; error: { message: string } | null }> {
  let request = supabase.from("events").select(columns).order("start", { ascending: true });

  if (query.from) {
    // A series that began before `from` may still have occurrences after it: keep every series
    // that has not ended yet, and one-off events from `from` on.
    const fromIso = query.from.toISOString();
    const fromDay = amsterdamParts(query.from).dateKey;
    request = request.or(`start.gte.${fromIso},and(recurrence.not.is.null,or(repeat_until.is.null,repeat_until.gte.${fromDay}))`);
  }
  if (query.to) request = request.lte("start", query.to.toISOString());
  if (query.category) request = request.eq("category", query.category);
  if (query.free) request = request.eq("price_eur", 0);
  if (query.organizer) request = request.eq("organizer_slug", query.organizer);
  if (query.ids) request = request.in("id", query.ids);

  const { data, error } = await request;
  if (error) return { rows: [], error };

  const rows = ((data ?? []) as unknown as T[])
    .flatMap((row) => expandOccurrences(row, query.from ?? null, query.to ?? null))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return { rows, error: null };
}
