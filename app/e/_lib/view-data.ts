/**
 * The read model behind every screen. Each page asks for the slice it shows (Home from this
 * week's Monday, My WatNu from today, a profile for one organizer, the detail screen for one
 * event) so nothing ever loads the whole events table. The real API comes first; when it isn't
 * configured or fails, `lib/fixtures.ts` stands in so every screen still renders the design.
 *
 * Server-only: it calls `app/_lib/api-client.ts`, which reads request headers. Call it from a
 * Server Component page and pass the plain `ViewEvent` / `ViewOrganizer` results down as props.
 */
import { fetchEvent, fetchEvents, fetchOrganizer, fetchOrganizers, type EventsQuery } from "@/app/_lib/api-client";
import { mapApiEvent, mapApiOrganizer, type ViewEvent, type ViewOrganizer } from "@/app/_lib/view-model";
import {
  FIXTURE_EVENTS,
  FIXTURE_ORGANIZERS,
  fixtureOrganizerById,
  type FixtureEvent,
  type FixtureOrganizer,
} from "@/lib/fixtures";
import { demoPosterMarker } from "./demo-posters";

export type { ViewEvent, ViewOrganizer, ViewPromo } from "@/app/_lib/view-model";

function parseLocalDateTime(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
}

function fixtureEventDates(event: FixtureEvent): { start: Date; end: Date | null } {
  const start = parseLocalDateTime(event.date, event.start);
  if (!event.end) return { start, end: null };
  let end = parseLocalDateTime(event.date, event.end);
  if (end.getTime() <= start.getTime()) {
    // e.g. 21:00–00:00 crosses midnight into the next day.
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }
  return { start, end };
}

function mapFixtureEvent(event: FixtureEvent): ViewEvent {
  const organizer = fixtureOrganizerById(event.organizerId);
  const { start, end } = fixtureEventDates(event);
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    start: start.toISOString(),
    end: end ? end.toISOString() : undefined,
    location: event.location,
    address: event.address,
    walkFromStation: event.walkFromStation,
    category: event.category,
    price: event.price,
    newcomers: event.newcomers,
    image: event.image ? demoPosterMarker(event.image) : undefined,
    organizerSlug: organizer?.slug ?? null,
    organizerName: organizer?.name ?? "Organizer",
    organizerType: organizer?.type ?? "association",
    sourceLanguage: event.sourceLanguage,
    promo: event.promo ? { label: event.promo.label, code: event.promo.code } : undefined,
  };
}

/** The same filters as GET /api/events, applied to the fixtures. */
function matchesQuery(query: EventsQuery): (event: ViewEvent) => boolean {
  const from = query.from ? new Date(query.from).getTime() : null;
  const to = query.to ? new Date(query.to).getTime() : null;
  const ids = query.ids ? new Set(query.ids) : null;
  return (event) => {
    const start = new Date(event.start).getTime();
    if (from !== null && start < from) return false;
    if (to !== null && start > to) return false;
    if (query.organizer && event.organizerSlug !== query.organizer) return false;
    if (ids && !ids.has(event.id)) return false;
    return true;
  };
}

function fixtureUpcomingCount(organizer: FixtureOrganizer, now: number): number {
  return FIXTURE_EVENTS.filter(
    (e) => e.organizerId === organizer.id && fixtureEventDates(e).start.getTime() > now,
  ).length;
}

function mapFixtureOrganizer(organizer: FixtureOrganizer, withCount = false): ViewOrganizer {
  return {
    slug: organizer.slug,
    name: organizer.name,
    type: organizer.type,
    category: organizer.category,
    instagram: organizer.instagram,
    description: organizer.description,
    statsPublic: false,
    upcomingCount: withCount ? fixtureUpcomingCount(organizer, Date.now()) : undefined,
  };
}

/** Events matching `query` (by default all of them), in start order. */
export async function getViewEvents(query: EventsQuery = {}): Promise<ViewEvent[]> {
  try {
    return (await fetchEvents(query)).map((event) => mapApiEvent(event));
  } catch {
    return FIXTURE_EVENTS.map(mapFixtureEvent).filter(matchesQuery(query));
  }
}

export async function getViewEventById(id: string): Promise<ViewEvent | null> {
  try {
    const event = await fetchEvent(id);
    return event ? mapApiEvent(event) : null;
  } catch {
    const fixture = FIXTURE_EVENTS.find((e) => e.id === id);
    return fixture ? mapFixtureEvent(fixture) : null;
  }
}

/** The directory: every organizer, without their events. */
export async function getViewOrganizers(): Promise<ViewOrganizer[]> {
  try {
    return (await fetchOrganizers()).map((organizer) => mapApiOrganizer(organizer));
  } catch {
    return FIXTURE_ORGANIZERS.map((organizer) => mapFixtureOrganizer(organizer));
  }
}

/** One organizer with their upcoming events, in start order — the profile's read. */
export async function getViewOrganizerProfile(slug: string): Promise<{ organizer: ViewOrganizer; events: ViewEvent[] } | null> {
  try {
    const result = await fetchOrganizer(slug);
    if (!result) return null;
    const organizer = mapApiOrganizer(result.organizer, result.upcoming_events.length);
    const events = result.upcoming_events.map((event) => mapApiEvent(event, result.organizer));
    return { organizer, events };
  } catch {
    const organizer = FIXTURE_ORGANIZERS.find((o) => o.slug === slug);
    if (!organizer) return null;
    const now = Date.now();
    const events = FIXTURE_EVENTS.filter((e) => e.organizerId === organizer.id && fixtureEventDates(e).start.getTime() > now)
      .map(mapFixtureEvent)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return { organizer: mapFixtureOrganizer(organizer, true), events };
  }
}

export async function getViewOrganizerBySlug(slug: string): Promise<ViewOrganizer | null> {
  return (await getViewOrganizerProfile(slug))?.organizer ?? null;
}
