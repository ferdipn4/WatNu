"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EventCard, type Category } from "@/components/ui/EventCard";
import { resolveEventImage } from "@/components/ui/EventPoster";
import { Icon, cx } from "@/components/ui/Icon";
import { Toast } from "@/components/ui/Toast";
import { isOff, isSoon } from "@/lib/features";
import { EVENT_CATEGORIES } from "@/lib/types";
import { capitalize, dateNames, dayOnlyFromParts, shortDateFromParts, useT, type Locale } from "@/app/_lib/i18n";
import { getSavedEventIds, toggleSavedEvent } from "@/app/_lib/store";
import { useToast } from "@/app/_lib/use-toast";
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
type View = "list" | "calendar";

const AMSTERDAM_TZ = "Europe/Amsterdam";
/** localStorage: the list/calendar choice survives a trip to a detail screen and back. */
const VIEW_KEY = "watnu:home-view";

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

/** Friday, Saturday or Sunday. */
function isWeekend(key: string): boolean {
  const day = keyToDate(key).getUTCDay();
  return day === 5 || day === 6 || day === 0;
}

/** "2026-09" of a day key. */
function monthOf(key: string): string {
  return key.slice(0, 7);
}

function addMonths(month: string, count: number): string {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + count, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** "Mon 21 Sep" — the app's date format (design/README.md → Voice and content). */
function shortDate(key: string, locale: Locale): string {
  const date = keyToDate(key);
  return shortDateFromParts(locale, date.getUTCDay(), date.getUTCDate(), date.getUTCMonth());
}

/** "25 Sep" — beside a day header that already names the weekday. */
function dayOnly(key: string, locale: Locale): string {
  const date = keyToDate(key);
  return dayOnlyFromParts(locale, date.getUTCDate(), date.getUTCMonth());
}

/** "Mon 21 – Sun 27 Sep", or "Mon 28 Sep – Sun 4 Oct" across a month boundary. */
function weekRange(mondayKey: string, sundayKey: string, locale: Locale): string {
  const names = dateNames(locale);
  const monday = keyToDate(mondayKey);
  const sunday = keyToDate(sundayKey);
  const start = `${names.weekdayShort[monday.getUTCDay()]} ${monday.getUTCDate()}`;
  const startMonth = monday.getUTCMonth() === sunday.getUTCMonth() ? "" : ` ${names.monthShort[monday.getUTCMonth()]}`;
  return `${start}${startMonth} – ${shortDate(sundayKey, locale)}`;
}

/** "September 2026" */
function monthLabel(month: string, locale: Locale): string {
  const [y, m] = month.split("-").map(Number);
  return `${capitalize(dateNames(locale).monthLong[m - 1])} ${y}`;
}

function dayHeader(key: string, today: string, tomorrow: string, locale: Locale): { name: string; date: string } {
  const names = dateNames(locale);
  if (key === today) return { name: names.today, date: shortDate(key, locale) };
  if (key === tomorrow) return { name: names.tomorrow, date: shortDate(key, locale) };
  return { name: names.weekdayLong[keyToDate(key).getUTCDay()], date: dayOnly(key, locale) };
}

/** Groups events (already sorted by date and time) into days. */
function groupByDay(events: HomeEvent[]): { date: string; events: HomeEvent[] }[] {
  const groups: { date: string; events: HomeEvent[] }[] = [];
  for (const event of events) {
    const last = groups[groups.length - 1];
    if (last?.date === event.date) last.events.push(event);
    else groups.push({ date: event.date, events: [event] });
  }
  return groups;
}

export function HomeScreen({ events }: { events: HomeEvent[] }) {
  const router = useRouter();
  const t = useT();
  const locale = t.locale;
  const { toast, show, showSoon } = useToast();

  const [view, setView] = useState<View>("list");
  const [quick, setQuick] = useState<Set<QuickFilter>>(() => new Set());
  const [categories, setCategories] = useState<Set<Category>>(() => new Set());
  const [weekOffset, setWeekOffset] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(() => monthOf(todayKey()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [publishedId, setPublishedId] = useState<string | null>(null);

  const todayK = todayKey();
  const tomorrowK = addDays(todayK, 1);
  const thisMonday = mondayOf(todayK);
  const thisMonth = monthOf(todayK);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration of client-only state after mount */
    setSavedIds(new Set(getSavedEventIds()));
    try {
      if (localStorage.getItem(VIEW_KEY) === "calendar") setView("calendar");
    } catch {
      // Storage unavailable — the list it is.
    }

    // The create flow lands here after publishing with ?published=<id>: the one done toast, the
    // event's week, and the list scrolled to its card (design/screens.md §3).
    const id = new URLSearchParams(window.location.search).get("published");
    if (id) {
      const published = events.find((event) => event.id === id);
      if (published) setWeekOffset(weeksBetween(mondayOf(todayKey()), mondayOf(published.date)));
      setView("list");
      setQuick(new Set());
      setCategories(new Set());
      setPublishedId(id);
      show(t("toast.published"), "done");
      window.history.replaceState(null, "", window.location.pathname);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [events, show, t]);

  useEffect(() => {
    if (!publishedId) return;
    document.getElementById(`event-${publishedId}`)?.scrollIntoView({ block: "center" });
  }, [publishedId, weekOffset]);

  function switchView(next: View) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Storage unavailable — the choice still holds until the page reloads.
    }
  }

  const weekMondayKey = addDays(thisMonday, weekOffset * 7);
  const weekSundayKey = addDays(weekMondayKey, 6);

  // Quick filters narrow the days shown; categories are OR-ed (design/screens.md §1).
  const passesFilters = (event: HomeEvent) => {
    if (categories.size > 0 && !categories.has(event.category)) return false;
    if (quick.has("free") && event.price > 0) return false;
    if (quick.has("today") && event.date !== todayK) return false;
    if (quick.has("weekend") && !isWeekend(event.date)) return false;
    return true;
  };
  const byDateAndTime = (a: HomeEvent, b: HomeEvent) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date));

  // List view: one week. Calendar view: one month, optionally narrowed to a tapped day.
  const eventsInWeek = events.filter((event) => event.date >= weekMondayKey && event.date <= weekSundayKey);
  const eventsInMonth = events.filter((event) => monthOf(event.date) === calendarMonth);
  const shown =
    view === "list"
      ? eventsInWeek.filter(passesFilters).sort(byDateAndTime)
      : eventsInMonth.filter(passesFilters).filter((event) => !selectedDate || event.date === selectedDate).sort(byDateAndTime);
  const groups = groupByDay(shown);

  // Days with something on (after the chip filters), for the calendar's dots.
  const busyDays = new Set(eventsInMonth.filter(passesFilters).map((event) => event.date));

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

  function showMonth(month: string) {
    setCalendarMonth(month);
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

  // features.save: local = the bookmark works, soon = it stays and shows the toast, off = no bookmark.
  const saveOff = isOff("save");
  const saveSoon = isSoon("save");
  function onSaveFor(id: string) {
    if (saveOff) return null;
    if (saveSoon) return () => showSoon();
    return (saved: boolean) => handleSave(id, saved);
  }

  const weekTitle = weekOffset <= 0 ? t("home.thisWeek") : weekOffset === 1 ? t("home.nextWeek") : t("home.inWeeks", { count: weekOffset });
  const title = view === "list" ? weekTitle : monthLabel(calendarMonth, locale);
  const meta = view === "list" ? `${weekRange(weekMondayKey, weekSundayKey, locale)} · ${t.n("events", eventsInWeek.length)}` : t.n("events", eventsInMonth.length);

  const empty =
    view === "calendar" && selectedDate
      ? { heading: t("home.empty.day.title"), body: t("home.empty.day.body"), action: t("home.calendar.allDays"), onAction: () => setSelectedDate(null) }
      : filtersActive
        ? { heading: t("home.empty.filters.title"), body: t("home.empty.filters.body"), action: t("home.empty.filters.action"), onAction: clearFilters }
        : view === "calendar"
          ? { heading: t("home.empty.month.title"), body: t("home.empty.body"), action: t("home.calendar.next"), onAction: () => showMonth(addMonths(calendarMonth, 1)) }
          : weekOffset > 0
            ? { heading: t("home.empty.next.title"), body: t("home.empty.body"), action: t("home.empty.next.action"), onAction: () => setWeekOffset(0) }
            : { heading: t("home.empty.this.title"), body: t("home.empty.body"), action: t("home.empty.this.action"), onAction: () => setWeekOffset(1) };

  return (
    <TabScreen active="week">
      <ScreenHeader title={title} meta={meta} right={<Chip size="sm" icon="pin" label={t("common.maastricht")} />} />

      <div className="flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip icon="text" label={t("home.view.list")} selected={view === "list"} onClick={() => switchView("list")} />
        <Chip icon="calendar" label={t("home.view.calendar")} selected={view === "calendar"} onClick={() => switchView("calendar")} />
        <span className="mx-1 h-[22px] w-px flex-none bg-line" aria-hidden="true" />
        <Chip label={dateNames(locale).today} selected={quick.has("today")} onClick={() => toggleQuick("today")} />
        <Chip label={t("home.weekend")} selected={quick.has("weekend")} onClick={() => toggleQuick("weekend")} />
        <Chip label={t("common.free")} selected={quick.has("free")} onClick={() => toggleQuick("free")} />
        <span className="mx-1 h-[22px] w-px flex-none bg-line" aria-hidden="true" />
        {EVENT_CATEGORIES.map((category) => (
          <Chip key={category} label={t.category(category)} selected={categories.has(category)} onClick={() => toggleCategory(category)} />
        ))}
      </div>

      {view === "calendar" ? (
        <div className="px-4 pt-4">
          <MonthCalendar
            month={calendarMonth}
            todayKey={todayK}
            selectedDate={selectedDate}
            busyDays={busyDays}
            locale={locale}
            canGoBack={calendarMonth > thisMonth}
            onPrevious={() => showMonth(addMonths(calendarMonth, -1))}
            onNext={() => showMonth(addMonths(calendarMonth, 1))}
            onSelect={(key) => setSelectedDate((current) => (current === key ? null : key))}
            labels={{ previous: t("home.calendar.previous"), next: t("home.calendar.next") }}
          />
        </div>
      ) : null}

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
          const header = dayHeader(group.date, todayK, tomorrowK, locale);
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

      {view === "list" ? (
        <div className="flex items-center gap-4 px-4 pt-6">
          {weekOffset > 0 ? (
            <button type="button" onClick={() => setWeekOffset(0)} className="t-meta text-maas">
              {t("home.thisWeek")}
            </button>
          ) : null}
          <button type="button" onClick={() => setWeekOffset((offset) => offset + 1)} className="t-meta text-maas">
            {t("home.nextWeek")}
          </button>
        </div>
      ) : selectedDate && groups.length > 0 ? (
        <div className="px-4 pt-6">
          <button type="button" onClick={() => setSelectedDate(null)} className="t-meta text-maas">
            {t("home.calendar.allDays")}
          </button>
        </div>
      ) : null}

      {toast ? <Toast tone={toast.tone}>{toast.text}</Toast> : null}
    </TabScreen>
  );
}

/** One month, Monday first: a dot under every day with something on, the tapped day filled in accent. */
function MonthCalendar({
  month,
  todayKey: todayK,
  selectedDate,
  busyDays,
  locale,
  canGoBack,
  onPrevious,
  onNext,
  onSelect,
  labels,
}: {
  month: string;
  todayKey: string;
  selectedDate: string | null;
  busyDays: Set<string>;
  locale: Locale;
  canGoBack: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSelect: (key: string) => void;
  labels: { previous: string; next: string };
}) {
  const names = dateNames(locale);
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstWeekday = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday = 0
  const columns = [1, 2, 3, 4, 5, 6, 0].map((day) => names.weekdayMin[day]);

  const cells: (string | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${month}-${String(day).padStart(2, "0")}`);
  }

  return (
    <Card tone="sunken" tight>
      <div className="mb-2 flex items-center justify-between">
        <Button iconOnly round size="sm" variant="secondary" aria-label={labels.previous} disabled={!canGoBack} onClick={onPrevious} icon={<Icon name="chevron-right" size={16} className="rotate-180" />} />
        <span className="t-label text-ink">{monthLabel(month, locale)}</span>
        <Button iconOnly round size="sm" variant="secondary" aria-label={labels.next} onClick={onNext} icon={<Icon name="chevron-right" size={16} />} />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {columns.map((label, index) => (
          <span key={index} className="t-caption pb-1 text-center text-ink-muted">
            {label}
          </span>
        ))}
        {cells.map((key, index) => {
          if (!key) return <span key={`blank-${index}`} aria-hidden="true" />;
          const isSelected = key === selectedDate;
          const isToday = key === todayK;
          const isPast = key < todayK;
          const busy = busyDays.has(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isSelected}
              aria-label={shortDate(key, locale)}
              onClick={() => onSelect(key)}
              className={cx(
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-[13px] font-semibold transition-colors focus-visible:shadow-ring focus-visible:outline-none",
                isSelected ? "bg-accent text-on-accent" : isToday ? "text-accent" : isPast ? "text-ink-muted" : "text-ink",
              )}
            >
              <span className="tabular-nums">{Number(key.slice(-2))}</span>
              <span
                aria-hidden="true"
                className={cx("h-1.5 w-1.5 rounded-full", busy ? (isSelected ? "bg-on-accent" : isPast ? "bg-ink-muted" : "bg-accent") : "bg-transparent")}
              />
            </button>
          );
        })}
      </div>
    </Card>
  );
}
