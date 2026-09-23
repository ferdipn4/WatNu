"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EventCard } from "@/components/ui/EventCard";
import { resolveEventImage } from "@/components/ui/EventPoster";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { OrganizerCard } from "@/components/ui/OrganizerCard";
import { amsterdamDateKey, amsterdamInstant } from "@/lib/datetime";
import { isOff, isSoon } from "@/lib/features";
import { DayHeader } from "@/app/_components/DayHeader";
import { TopBar } from "@/app/_components/TopBar";
import { getJson } from "@/app/_lib/http";
import { useT } from "@/app/_lib/i18n";
import { getSavedEventIds, toggleSavedEvent } from "@/app/_lib/store";
import type { ApiEvent } from "@/app/_lib/types";
import { eventHref, mapApiEvent, type ViewEvent, type ViewOrganizer } from "@/app/_lib/view-model";
import { dayHeaderLabel, dayKey, formatTime } from "@/app/e/_lib/format";

/** Fewer letters than this match too much to be useful ("a"). */
const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;
/** Organizers are matched on the phone (the directory is small); the list stays short so events keep the screen. */
const MAX_ORGANIZERS = 6;
const FIELD_ID = "search-query";

type DayGroup = { date: Date; events: ViewEvent[] };
type SearchResult = { term: string; events: ViewEvent[]; failed: boolean };

/** Groups an already sorted list by local calendar day, keeping the order. */
function groupByDay(events: ViewEvent[]): DayGroup[] {
  const byKey = new Map<string, DayGroup>();
  for (const event of events) {
    const date = new Date(event.start);
    const key = dayKey(date);
    const group = byKey.get(key);
    if (group) group.events.push(event);
    else byKey.set(key, { date, events: [event] });
  }
  return Array.from(byKey.values());
}

/**
 * Search: upcoming events by title, description, place or organizer name (GET /api/events?q=,
 * as you type, debounced) and organizers by name or category (matched here, from the directory
 * the page loaded). The term lives in the URL, so a refresh or a shared link lands on the results.
 */
export function SearchScreen({ organizers }: { organizers: ViewOrganizer[] }) {
  const router = useRouter();
  const t = useT();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const requestId = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of client-only state after mount
    setSavedIds(getSavedEventIds());
    document.getElementById(FIELD_ID)?.focus();
  }, []);

  const term = query.trim();
  const active = term.length >= MIN_QUERY;

  // Ask the API a moment after the last keystroke; a reply for an older term is dropped.
  useEffect(() => {
    window.history.replaceState(null, "", term ? `/search?q=${encodeURIComponent(term)}` : "/search");
    if (!active) return;
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const from = amsterdamInstant(amsterdamDateKey(new Date())).toISOString();
        const params = new URLSearchParams({ q: term, from });
        const { events: rows } = await getJson<{ events: ApiEvent[] }>(`/api/events?${params.toString()}`);
        // A series is one result, shown at its next date — not one row per week.
        const seen = new Set<string>();
        const unique = rows.filter((row) => !seen.has(row.id) && seen.add(row.id));
        if (id === requestId.current) setResult({ term, events: unique.map((row) => mapApiEvent(row)), failed: false });
      } catch {
        if (id === requestId.current) setResult({ term, events: [], failed: true });
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term, active]);

  const current = active && result?.term === term ? result : null;
  const searching = active && current === null;
  const eventCount = current?.events.length ?? 0;
  const failed = current?.failed ?? false;

  const matchedOrganizers = useMemo(() => {
    if (!active) return [];
    const q = term.toLowerCase();
    return organizers
      .filter(
        (organizer) =>
          organizer.name.toLowerCase().includes(q) ||
          organizer.category.toLowerCase().includes(q) ||
          t.category(organizer.category).toLowerCase().includes(q),
      )
      .slice(0, MAX_ORGANIZERS);
  }, [organizers, term, active, t]);

  const groups = useMemo(() => groupByDay(current?.events ?? []), [current]);

  const saveOff = isOff("save");
  const saveSoon = isSoon("save");
  const nothing = active && !searching && !failed && eventCount === 0 && matchedOrganizers.length === 0;

  function handleToggleSave(id: string, next: boolean) {
    setSavedIds((prev) => (next ? [...prev, id] : prev.filter((existing) => existing !== id)));
    toggleSavedEvent(id);
  }

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  const status = !active
    ? t("search.hint")
    : searching
      ? t("search.searching")
      : failed
        ? t("search.failed")
        : `${t.n("events", eventCount)} · ${t.n("search.organizerCount", matchedOrganizers.length)}`;

  return (
    <div className="flex min-h-dvh flex-col pb-10">
      <TopBar title={t("search.title")} close onBack={goBack} />

      <div className="px-4 pt-1">
        {/* Enter (the keyboard's "search" key) only puts the keyboard away; results are already there. */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            (document.activeElement as HTMLElement | null)?.blur();
          }}
        >
          <Field id={FIELD_ID} kind="search" placeholder={t("search.placeholder")} value={query} onChange={setQuery} />
        </form>
        <p className="t-meta mt-2 text-ink-muted" aria-live="polite">
          {status}
        </p>
      </div>

      {matchedOrganizers.length > 0 ? (
        <section className="mt-4">
          <h2 className="t-heading px-4 text-ink">{t("search.organizers")}</h2>
          <div className="mt-2 flex flex-col gap-3 px-4">
            {matchedOrganizers.map((organizer) => (
              <OrganizerCard
                key={organizer.slug}
                name={organizer.name}
                type={organizer.type}
                category={organizer.category}
                logo={organizer.logo}
                onFollow={null}
                onClick={() => router.push(`/organizers/${organizer.slug}`)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {groups.length > 0 ? (
        <section className="mt-4">
          <h2 className="t-heading px-4 text-ink">{t("search.events")}</h2>
          {groups.map((group) => {
            const header = dayHeaderLabel(group.date, t.locale);
            return (
              <section key={dayKey(group.date)}>
                <DayHeader name={header.name} date={header.date} />
                <div className="flex flex-col gap-3 px-4">
                  {group.events.map((event) => {
                    const start = new Date(event.start);
                    const end = event.end ? new Date(event.end) : null;
                    return (
                      <EventCard
                        key={`${event.id}-${event.start}`}
                        title={event.title}
                        time={formatTime(start)}
                        endTime={end ? formatTime(end) : undefined}
                        location={event.location}
                        organizer={event.organizerName}
                        category={event.category}
                        price={event.price}
                        image={resolveEventImage(event.image, event.category, event.title)}
                        newcomers={event.newcomers}
                        repeats={event.recurrence}
                        cancelled={event.cancelled}
                        saved={savedIds.includes(event.id)}
                        onSave={saveOff ? null : saveSoon ? () => undefined : (next) => handleToggleSave(event.id, next)}
                        onClick={() => router.push(eventHref(event))}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </section>
      ) : null}

      {nothing ? (
        <div className="flex flex-col items-center gap-3 px-6 pt-16 text-center">
          <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name="search" size={32} />
          </span>
          <h2 className="t-heading text-ink">{t("search.empty.title", { q: term })}</h2>
          <p className="t-body text-ink-muted">{t("search.empty.body")}</p>
          <Button className="mt-2" variant="secondary" href="/">
            {t("search.empty.action")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
