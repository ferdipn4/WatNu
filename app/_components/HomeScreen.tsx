"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EventCard, type Category } from "@/components/ui/EventCard";
import { resolveEventImage } from "@/components/ui/EventPoster";
import { Icon } from "@/components/ui/Icon";
import { Toast } from "@/components/ui/Toast";
import { isOff, isSoon } from "@/lib/features";
import { EVENT_CATEGORIES } from "@/lib/types";
import { getSavedEventIds, toggleSavedEvent } from "@/app/_lib/store";
import { PUBLISHED_TOAST, useToast } from "@/app/_lib/use-toast";
import { DayHeader } from "./DayHeader";
import { ScreenHeader } from "./ScreenHeader";
import { TabScreen } from "./TabScreen";

export interface HomeEvent {
  id: string;
  title: string;
  /** yyyy-mm-dd, Europe/Amsterdam */
  date: string;
  /** "HH:mm", Europe/Amsterdam */
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

const AMSTERDAM_TZ = "Europe/Amsterdam";
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* Every date below is a yyyy-mm-dd key in Europe/Amsterdam; the Date objects are UTC-noon anchors used only for arithmetic. */

function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: AMSTERDAM_TZ }).format(new Date());
}

function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

function dateToKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(key: string, days: number): string {
  const date = keyToDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return dateToKey(date);
}

function mondayOf(key: string): string {
  const date = keyToDate(key);
  return addDays(key, -((date.getUTCDay() + 6) % 7));
}

function weeksBetween(fromMondayKey: string, toMondayKey: string): number {
  return Math.round((keyToDate(toMondayKey).getTime() - keyToDate(fromMondayKey).getTime()) / (7 * 86_400_000));
}

/** "Mon 21 Sep" — the app's date format (design/README.md → Voice and content). */
function shortDate(key: string): string {
  const date = keyToDate(key);
  return `${WEEKDAY_SHORT[date.getUTCDay()]} ${date.getUTCDate()} ${MONTH_SHORT[date.getUTCMonth()]}`;
}

/** "25 Sep" — beside a day header that already names the weekday. */
function dayOnly(key: string): string {
  const date = keyToDate(key);
  return `${date.getUTCDate()} ${MONTH_SHORT[date.getUTCMonth()]}`;
}

/** "Mon 21 – Sun 27 Sep", or "Mon 28 Sep – Sun 4 Oct" across a month boundary. */
function weekRange(mondayKey: string, sundayKey: string): string {
  const monday = keyToDate(mondayKey);
  const sunday = keyToDate(sundayKey);
  const start = `${WEEKDAY_SHORT[monday.getUTCDay()]} ${monday.getUTCDate()}`;
  const startMonth = monday.getUTCMonth() === sunday.getUTCMonth() ? "" : ` ${MONTH_SHORT[monday.getUTCMonth()]}`;
  return `${start}${startMonth} – ${shortDate(sundayKey)}`;
}

function dayHeader(key: string, today: string, tomorrow: string): { name: string; date: string } {
  if (key === today) return { name: "Today", date: shortDate(key) };
  if (key === tomorrow) return { name: "Tomorrow", date: shortDate(key) };
  return { name: WEEKDAY_LONG[keyToDate(key).getUTCDay()], date: dayOnly(key) };
}

function eventCount(count: number): string {
  return count === 1 ? "1 event" : `${count} events`;
}

function weekTitle(offset: number): string {
  if (offset <= 0) return "This week";
  if (offset === 1) return "Next week";
  return `In ${offset} weeks`;
}

export function HomeScreen({ events }: { events: HomeEvent[] }) {
  const router = useRouter();
  const { toast, show, showSoon } = useToast();

  const [quick, setQuick] = useState<Set<QuickFilter>>(() => new Set());
  const [categories, setCategories] = useState<Set<Category>>(() => new Set());
  const [weekOffset, setWeekOffset] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [publishedId, setPublishedId] = useState<string | null>(null);

  const todayK = todayKey();
  const tomorrowK = addDays(todayK, 1);
  const thisMonday = mondayOf(todayK);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration of client-only state after mount */
    setSavedIds(new Set(getSavedEventIds()));

    // The create flow lands here after publishing with ?published=<id>: the one done toast, the
    // event's week, and the list scrolled to its card (design/screens.md §3).
    const id = new URLSearchParams(window.location.search).get("published");
    if (id) {
      const published = events.find((event) => event.id === id);
      if (published) setWeekOffset(weeksBetween(mondayOf(todayKey()), mondayOf(published.date)));
      setQuick(new Set());
      setCategories(new Set());
      setPublishedId(id);
      show(PUBLISHED_TOAST, "done");
      window.history.replaceState(null, "", window.location.pathname);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [events, show]);

  useEffect(() => {
    if (!publishedId) return;
    document.getElementById(`event-${publishedId}`)?.scrollIntoView({ block: "center" });
  }, [publishedId, weekOffset]);

  const weekMondayKey = addDays(thisMonday, weekOffset * 7);
  const weekSundayKey = addDays(weekMondayKey, 6);
  const weekendKeys = new Set([4, 5, 6].map((offset) => addDays(weekMondayKey, offset)));

  const eventsInWeek = events.filter((event) => event.date >= weekMondayKey && event.date <= weekSundayKey);

  // Quick filters narrow the days shown; categories are OR-ed (design/screens.md §1).
  const filtered = eventsInWeek
    .filter((event) => {
      if (categories.size > 0 && !categories.has(event.category)) return false;
      if (quick.has("free") && event.price > 0) return false;
      if (quick.has("today") && event.date !== todayK) return false;
      if (quick.has("weekend") && !weekendKeys.has(event.date)) return false;
      return true;
    })
    .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));

  const groups: { date: string; events: HomeEvent[] }[] = [];
  for (const event of filtered) {
    const last = groups[groups.length - 1];
    if (last?.date === event.date) last.events.push(event);
    else groups.push({ date: event.date, events: [event] });
  }

  const filtersActive = quick.size > 0 || categories.size > 0;

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

  // features.save: local = the bookmark works, soon = it stays and shows the toast, off = no bookmark.
  const saveOff = isOff("save");
  const saveSoon = isSoon("save");
  function onSaveFor(id: string) {
    if (saveOff) return null;
    if (saveSoon) return () => showSoon();
    return (saved: boolean) => handleSave(id, saved);
  }

  const empty = filtersActive
    ? { heading: "Nothing on for these filters", body: "Try clearing them to see everything on this week.", action: "Clear filters", onAction: clearFilters }
    : weekOffset > 0
      ? { heading: "Nothing on next week yet", body: "Organizers add events all week — check back soon.", action: "Back to this week", onAction: () => setWeekOffset(0) }
      : { heading: "Nothing on this week yet", body: "Organizers add events all week — check back soon.", action: "Next week", onAction: () => setWeekOffset(1) };

  return (
    <TabScreen active="week">
      <ScreenHeader
        title={weekTitle(weekOffset)}
        meta={`${weekRange(weekMondayKey, weekSundayKey)} · ${eventCount(eventsInWeek.length)}`}
        right={<Chip size="sm" icon="pin" label="Maastricht" />}
      />

      <div className="flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip label="Today" selected={quick.has("today")} onClick={() => toggleQuick("today")} />
        <Chip label="Weekend" selected={quick.has("weekend")} onClick={() => toggleQuick("weekend")} />
        <Chip label="Free" selected={quick.has("free")} onClick={() => toggleQuick("free")} />
        <span className="mx-1 h-[22px] w-px flex-none bg-line" aria-hidden="true" />
        {EVENT_CATEGORIES.map((category) => (
          <Chip key={category} label={category} selected={categories.has(category)} onClick={() => toggleCategory(category)} />
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name="calendar" size={32} />
          </span>
          <h2 className="t-heading text-ink">{empty.heading}</h2>
          <p className="t-body text-ink-muted">{empty.body}</p>
          <Button className="mt-2" onClick={empty.onAction}>
            {empty.action}
          </Button>
        </div>
      ) : (
        groups.map((group) => {
          const header = dayHeader(group.date, todayK, tomorrowK);
          return (
            <section key={group.date}>
              <DayHeader name={header.name} date={header.date} />
              <div className="flex flex-col gap-3 px-4">
                {group.events.map((event) => (
                  <div key={event.id} id={`event-${event.id}`}>
                    <EventCard
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
                      onSave={onSaveFor(event.id)}
                      onClick={() => router.push(`/e/${event.id}`)}
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}

      <div className="flex items-center gap-4 px-4 pt-6">
        {weekOffset > 0 ? (
          <button type="button" onClick={() => setWeekOffset(0)} className="t-meta text-maas">
            This week
          </button>
        ) : null}
        <button type="button" onClick={() => setWeekOffset((offset) => offset + 1)} className="t-meta text-maas">
          Next week
        </button>
      </div>

      {toast ? <Toast tone={toast.tone}>{toast.text}</Toast> : null}
    </TabScreen>
  );
}
