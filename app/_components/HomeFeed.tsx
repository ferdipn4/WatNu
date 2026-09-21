"use client";

import { useMemo, useState } from "react";
import { EventCard } from "@/components/EventCard";
import { Chip } from "@/components/Chip";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/types";
import type { ApiEvent } from "@/app/_lib/types";

function dayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(
    new Date(iso),
  );
}

function dayLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));
}

function groupByDay(
  events: ApiEvent[],
): { key: string; label: string; events: ApiEvent[] }[] {
  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  const groups: { key: string; label: string; events: ApiEvent[] }[] = [];
  for (const event of sorted) {
    const key = dayKey(event.start);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.key === key) {
      lastGroup.events.push(event);
    } else {
      groups.push({ key, label: dayLabel(event.start), events: [event] });
    }
  }
  return groups;
}

/** `dayKey` for "now", in Europe/Amsterdam. */
function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(
    new Date(),
  );
}

/**
 * `dayKey`s for the Friday, Saturday, and Sunday of the current
 * Europe/Amsterdam week — "current" meaning the weekend we're either in
 * (if today is Fri/Sat/Sun) or heading into (if today is Mon–Thu).
 */
function currentWeekendKeys(): Set<string> {
  const [year, month, day] = todayKey().split("-").map(Number);
  // Anchor at noon UTC so the Amsterdam calendar date always matches the
  // UTC calendar date, regardless of CET/CEST offset or DST transitions.
  const anchor = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  // getUTCDay(): Sun=0..Sat=6. Rebase to Mon=0..Sun=6 so Friday is always 4.
  const daysFromMonday = (anchor.getUTCDay() + 6) % 7;
  const offsetToFriday = 4 - daysFromMonday;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
  });
  const keys = new Set<string>();
  for (let offset = 0; offset < 3; offset++) {
    const date = new Date(anchor.getTime());
    date.setUTCDate(date.getUTCDate() + offsetToFriday + offset);
    keys.add(formatter.format(date));
  }
  return keys;
}

function isFreeEvent(event: ApiEvent): boolean {
  return Number(event.price_eur ?? 0) === 0;
}

type ToggleFilter = "today" | "weekend" | "free";

export function HomeFeed({ events }: { events: ApiEvent[] }) {
  const [category, setCategory] = useState<EventCategory | null>(null);
  const [activeToggles, setActiveToggles] = useState<Set<ToggleFilter>>(
    () => new Set(),
  );

  function toggleFilter(filter: ToggleFilter) {
    setActiveToggles((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  }

  const filtered = useMemo(() => {
    const wantToday = activeToggles.has("today");
    const wantWeekend = activeToggles.has("weekend");
    const wantFree = activeToggles.has("free");

    const today = wantToday ? todayKey() : null;
    const weekendKeys = wantWeekend ? currentWeekendKeys() : null;

    return events.filter((event) => {
      if (category && event.category !== category) return false;
      if (wantFree && !isFreeEvent(event)) return false;
      if (today && dayKey(event.start) !== today) return false;
      if (weekendKeys && !weekendKeys.has(dayKey(event.start))) return false;
      return true;
    });
  }, [events, category, activeToggles]);

  const groups = useMemo(
    () => groupByDay(filtered).filter((group) => group.events.length > 0),
    [filtered],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button type="button" onClick={() => setCategory(null)} className="shrink-0">
          <Chip label="All" active={category === null} />
        </button>
        <button
          type="button"
          onClick={() => toggleFilter("today")}
          className="shrink-0"
        >
          <Chip label="Today" active={activeToggles.has("today")} />
        </button>
        <button
          type="button"
          onClick={() => toggleFilter("weekend")}
          className="shrink-0"
        >
          <Chip label="Weekend" active={activeToggles.has("weekend")} />
        </button>
        <button
          type="button"
          onClick={() => toggleFilter("free")}
          className="shrink-0"
        >
          <Chip label="Free" active={activeToggles.has("free")} />
        </button>
        {EVENT_CATEGORIES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            className="shrink-0"
          >
            <Chip label={value} active={category === value} />
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted">No events match, try another filter</p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.key} className="flex flex-col gap-3">
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted">
                {group.label}
              </h2>
              <ul className="flex flex-col gap-3">
                {group.events.map((event) => (
                  <li key={event.id}>
                    <EventCard event={event} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
