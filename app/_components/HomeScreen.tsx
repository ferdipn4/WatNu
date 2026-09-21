"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EventCard, type Category } from "@/components/ui/EventCard";
import { Icon } from "@/components/ui/Icon";
import { TabBar, type TabBarProps } from "@/components/ui/TabBar";
import { EVENT_CATEGORIES } from "@/lib/types";
import { getSavedEventIds, toggleSavedEvent } from "@/app/_lib/store";
import { resolveEventImage } from "@/components/ui/EventPoster";

export interface HomeEvent {
  id: string;
  title: string;
  /** yyyy-mm-dd */
  date: string;
  /** "HH:mm" */
  time: string;
  endTime?: string;
  location: string;
  organizer: string;
  category: Category;
  price: number;
  newcomers: boolean;
  /** a real uploaded photo url, when the organizer set one */
  image?: string;
}

type QuickFilter = "today" | "weekend" | "free";
type ViewMode = "list" | "calendar";

const AMSTERDAM_TZ = "Europe/Amsterdam";

function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: AMSTERDAM_TZ }).format(new Date());
}

/** Monday of the week containing this yyyy-mm-dd key, as a UTC-noon-anchored Date (dodges DST edges). */
function mondayOf(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const daysFromMonday = (anchor.getUTCDay() + 6) % 7;
  anchor.setUTCDate(anchor.getUTCDate() - daysFromMonday);
  return anchor;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shortWeekday(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(date);
}

function shortMonth(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(date);
}

function formatWeekRange(monday: Date, sunday: Date): string {
  return `${shortWeekday(monday)} ${monday.getUTCDate()} – ${shortWeekday(sunday)} ${sunday.getUTCDate()} ${shortMonth(sunday)}`;
}

function formatDayMeta(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return `${shortWeekday(date)} ${date.getUTCDate()} ${shortMonth(date)}`;
}

function dayHeading(dateKey: string, todayK: string, tomorrowK: string): string {
  if (dateKey === todayK) return "Today";
  if (dateKey === tomorrowK) return "Tomorrow";
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(date);
}

function isFree(event: HomeEvent): boolean {
  return !event.price;
}

function eventCountLabel(count: number): string {
  return count === 1 ? "1 event" : `${count} events`;
}

export function HomeScreen({ events }: { events: HomeEvent[] }) {
  const router = useRouter();

  const [quick, setQuick] = useState<Set<QuickFilter>>(() => new Set());
  const [categories, setCategories] = useState<Set<Category>>(() => new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    // One-time hydration of client-only localStorage state after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedIds(new Set(getSavedEventIds()));
  }, []);

  const todayK = todayKey();
  const tomorrowKey = toKey(addDays(new Date(`${todayK}T12:00:00Z`), 1));

  const weekMonday = addDays(mondayOf(todayK), weekOffset * 7);
  const weekSunday = addDays(weekMonday, 6);
  const weekMondayKey = toKey(weekMonday);
  const weekSundayKey = toKey(weekSunday);
  const weekendKeys = new Set([toKey(addDays(weekMonday, 4)), toKey(addDays(weekMonday, 5)), toKey(addDays(weekMonday, 6))]);

  // These lists never exceed a few dozen fixture events, so plain recomputation
  // on every render is cheap — no need for manual useMemo bookkeeping here.
  const eventsInWeek = events.filter((e) => e.date >= weekMondayKey && e.date <= weekSundayKey);

  const filtered = eventsInWeek
    .filter((e) => {
      if (categories.size > 0 && !categories.has(e.category)) return false;
      if (quick.has("free") && !isFree(e)) return false;
      if (quick.has("today") && e.date !== todayK) return false;
      if (quick.has("weekend") && !weekendKeys.has(e.date)) return false;
      if (viewMode === "calendar" && selectedDate && e.date !== selectedDate) return false;
      return true;
    })
    .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));

  const groups: { date: string; events: HomeEvent[] }[] = [];
  for (const event of filtered) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.date === event.date) lastGroup.events.push(event);
    else groups.push({ date: event.date, events: [event] });
  }

  function toggleQuick(filter: QuickFilter) {
    setQuick((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  }

  function toggleCategory(category: Category) {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function clearFilters() {
    setQuick(new Set());
    setCategories(new Set());
    setSelectedDate(null);
  }

  function handleSave(id: string, saved: boolean) {
    toggleSavedEvent(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleTabChange(tab: Parameters<NonNullable<TabBarProps["onChange"]>>[0]) {
    const routes: Record<string, string> = { week: "/", organizers: "/organizers", create: "/new", mine: "/mine" };
    router.push(routes[tab] ?? "/");
  }

  const isNextWeek = weekOffset > 0;

  return (
    <>
      <div className="flex h-dvh flex-col overflow-y-auto px-4 pt-8 pb-24">
        <div className="mb-1 flex items-center justify-between">
          <span className="t-heading flex items-center gap-1.5 text-[18px] leading-none text-accent">
            <Icon name="star" size={16} />
            WatNu
          </span>
          <Chip size="sm" icon="pin" label="Maastricht" />
        </div>
        <h1 className="t-display mt-1 text-ink">This week</h1>
        <p className="t-meta mt-1 text-ink-muted">
          {formatWeekRange(weekMonday, weekSunday)} · {eventCountLabel(eventsInWeek.length)}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <Chip size="md" icon="text" label="List" selected={viewMode === "list"} onClick={() => setViewMode("list")} />
          <Chip size="md" icon="calendar" label="Calendar" selected={viewMode === "calendar"} onClick={() => setViewMode("calendar")} />
        </div>

        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip label="Today" selected={quick.has("today")} onClick={() => toggleQuick("today")} />
          <Chip label="Weekend" selected={quick.has("weekend")} onClick={() => toggleQuick("weekend")} />
          <Chip label="Free" selected={quick.has("free")} onClick={() => toggleQuick("free")} />
          <span className="mx-1 h-[34px] w-px flex-none self-center bg-line" aria-hidden="true" />
          {EVENT_CATEGORIES.map((category) => (
            <Chip key={category} label={category} selected={categories.has(category)} onClick={() => toggleCategory(category)} />
          ))}
        </div>

        {viewMode === "calendar" ? (
          <div className="mt-5">
            <MonthCalendar events={events} todayKey={todayK} selectedDate={selectedDate} onSelect={setSelectedDate} />
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-6">
          {groups.length === 0 ? (
            <EmptyState
              heading={isNextWeek ? "Nothing on for next week yet" : "Nothing on for these filters"}
              body={
                isNextWeek
                  ? "Fixture data only covers this week for now."
                  : "Try clearing them to see what's on this week."
              }
              actionLabel={isNextWeek ? "Back to this week" : "Clear filters"}
              onAction={isNextWeek ? () => setWeekOffset(0) : clearFilters}
            />
          ) : (
            groups.map((group) => (
              <div key={group.date} className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="t-heading text-ink">{dayHeading(group.date, todayK, tomorrowKey)}</h2>
                  <span className="t-meta text-ink-muted">{formatDayMeta(group.date)}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {group.events.map((event) => (
                    <EventCard
                      key={event.id}
                      title={event.title}
                      time={event.time}
                      endTime={event.endTime}
                      location={event.location}
                      organizer={event.organizer}
                      category={event.category}
                      price={event.price}
                      newcomers={event.newcomers}
                      image={resolveEventImage(event.image, event.category, event.title)}
                      saved={savedIds.has(event.id)}
                      onSave={(saved) => handleSave(event.id, saved)}
                      onClick={() => router.push(`/e/${event.id}`)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}

          {!isNextWeek ? (
            <button type="button" onClick={() => setWeekOffset(1)} className="t-meta self-start text-maas underline-offset-2 hover:underline">
              Next week
            </button>
          ) : null}
        </div>
      </div>
      <TabBar active="week" onChange={handleTabChange} />
    </>
  );
}

function EmptyState({
  heading,
  body,
  actionLabel,
  onAction,
}: {
  heading: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-accent-soft text-accent">
        <Icon name="bookmark" size={28} />
      </div>
      <h2 className="t-heading text-ink">{heading}</h2>
      <p className="t-body max-w-[280px] text-ink-muted">{body}</p>
      <Button onClick={onAction}>{actionLabel}</Button>
    </div>
  );
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function MonthCalendar({
  events,
  todayKey: todayK,
  selectedDate,
  onSelect,
}: {
  events: HomeEvent[];
  todayKey: string;
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
}) {
  const [year, month] = todayK.split("-").map(Number);
  const monthIndex0 = month - 1;
  const total = daysInMonth(year, monthIndex0);
  const firstWeekday = (new Date(Date.UTC(year, monthIndex0, 1)).getUTCDay() + 6) % 7; // Mon=0..Sun=6

  const countsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of events) {
      map.set(event.date, (map.get(event.date) ?? 0) + 1);
    }
    return map;
  }, [events]);

  const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, monthIndex0, 1)),
  );

  const cells: Array<{ day: number; dateKey: string } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= total; day++) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, dateKey });
  }

  return (
    <Card tone="sunken" tight>
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="t-meta text-ink-muted">{monthLabel}</span>
        {selectedDate ? (
          <button type="button" onClick={() => onSelect(null)} className="t-meta text-maas">
            Clear day
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-7 gap-1 px-1 pb-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((label) => (
          <span key={label} className="t-caption text-center text-ink-muted">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 px-1">
        {cells.map((cell, index) => {
          if (!cell) return <span key={`blank-${index}`} />;
          const isToday = cell.dateKey === todayK;
          const isSelected = cell.dateKey === selectedDate;
          const count = countsByDate.get(cell.dateKey) ?? 0;
          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => onSelect(isSelected ? null : cell.dateKey)}
              className={[
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-[13px] font-semibold",
                isSelected ? "bg-accent text-on-accent" : isToday ? "text-accent" : "text-ink",
              ].join(" ")}
            >
              <span>{cell.day}</span>
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  count > 0 ? (isSelected ? "bg-on-accent" : "bg-accent") : "bg-transparent",
                ].join(" ")}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </Card>
  );
}
