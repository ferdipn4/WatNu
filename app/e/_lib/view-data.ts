/**
 * The read model behind My WatNu and Event detail. Tries the real API
 * (`/api/events`, `/api/organizers`) first; if it isn't configured yet (or
 * the request fails) falls back to `lib/fixtures.ts` so both screens still
 * render the full design — end time, "Translated from Dutch", walking
 * distance, promos — none of which the current API columns carry yet.
 *
 * Server-only: it calls `app/_lib/api-client.ts`, which reads request
 * headers. Call it from a Server Component page and pass the plain
 * `ViewEvent` / `ViewOrganizer` results down as props.
 */
import { fetchEvents, fetchOrganizer, fetchOrganizers } from "@/app/_lib/api-client";
import type { ApiEvent, ApiOrganizer } from "@/app/_lib/types";
import {
  FIXTURE_EVENTS,
  FIXTURE_ORGANIZERS,
  fixtureOrganizerById,
  type FixtureEvent,
  type FixtureOrganizer,
} from "@/lib/fixtures";
import { getPromoForOrganizer } from "@/lib/promos";
import type { OrganizerType } from "@/lib/schemas";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/types";
import { demoPosterMarker } from "./demo-posters";

export type ViewPromo = { label: string; code: string };

export type ViewEvent = {
  id: string;
  title: string;
  description: string;
  /** ISO instant */
  start: string;
  /** ISO instant, when known */
  end?: string;
  location: string;
  address?: string;
  walkFromStation?: string;
  category: EventCategory;
  price: number;
  newcomers: boolean;
  /** an image url, or a `demoPosterMarker(...)` value for fixture events — see demo-posters.tsx */
  image?: string;
  organizerSlug: string | null;
  organizerName: string;
  organizerType: OrganizerType;
  sourceLanguage: "nl" | "en";
  promo?: ViewPromo;
};

export type ViewOrganizer = {
  slug: string;
  name: string;
  type: OrganizerType;
  category: EventCategory;
  instagram?: string;
  description?: string;
  address?: string;
  logo?: string;
  upcomingCount: number;
};

const CATEGORY_SET = new Set<string>(EVENT_CATEGORIES);
function asCategory(value: string | null | undefined): EventCategory {
  return value && CATEGORY_SET.has(value) ? (value as EventCategory) : "Social";
}

const ORG_TYPE_SET = new Set<OrganizerType>(["association", "cafe", "club", "venue"]);
function asOrgType(value: string | null | undefined): OrganizerType {
  return value && ORG_TYPE_SET.has(value as OrganizerType) ? (value as OrganizerType) : "association";
}

function promoFor(slug: string | null): ViewPromo | undefined {
  const promo = getPromoForOrganizer(slug);
  return promo ? { label: promo.text, code: promo.code } : undefined;
}

function mapApiEvent(event: ApiEvent, organizersBySlug: Map<string, ApiOrganizer>): ViewEvent {
  const organizer = event.organizer_slug ? organizersBySlug.get(event.organizer_slug) : undefined;
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? "",
    start: event.start,
    location: event.location_name ?? event.address ?? "Location to be announced",
    address: event.address ?? undefined,
    category: asCategory(event.category),
    price: Number(event.price_eur ?? 0),
    newcomers: event.newcomer_friendly,
    image: event.image_file ?? undefined,
    organizerSlug: event.organizer_slug,
    organizerName: event.organizer_name ?? organizer?.name ?? "Organizer",
    organizerType: asOrgType(organizer?.type),
    // The API doesn't carry the poster's original language yet, so there is
    // nothing to translate a caption from — see design/README.md's AI
    // provenance rule: never show a note the data can't back up.
    sourceLanguage: "en",
    promo: promoFor(event.organizer_slug),
  };
}

function mapApiOrganizer(organizer: ApiOrganizer, upcomingCount: number): ViewOrganizer {
  return {
    slug: organizer.slug,
    name: organizer.name,
    type: asOrgType(organizer.type),
    category: asCategory(organizer.category),
    instagram: organizer.instagram_handle ?? undefined,
    description: organizer.description ?? undefined,
    address: organizer.address ?? undefined,
    logo: organizer.logo_file ?? undefined,
    upcomingCount,
  };
}

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
    promo: promoFor(organizer?.slug ?? null),
  };
}

function fixtureUpcomingCount(organizer: FixtureOrganizer, now: number): number {
  return FIXTURE_EVENTS.filter(
    (e) => e.organizerId === organizer.id && fixtureEventDates(e).start.getTime() > now,
  ).length;
}

function mapFixtureOrganizer(organizer: FixtureOrganizer, now: number): ViewOrganizer {
  return {
    slug: organizer.slug,
    name: organizer.name,
    type: organizer.type,
    category: organizer.category,
    instagram: organizer.instagram,
    description: organizer.description,
    upcomingCount: fixtureUpcomingCount(organizer, now),
  };
}

/** All events, real API first, `lib/fixtures.ts` as the fallback. */
export async function getViewEvents(): Promise<ViewEvent[]> {
  try {
    const [events, organizers] = await Promise.all([fetchEvents(), fetchOrganizers()]);
    if (events.length === 0) throw new Error("No events from the API yet.");
    const bySlug = new Map(organizers.map((o) => [o.slug, o] as const));
    return events.map((e) => mapApiEvent(e, bySlug));
  } catch {
    return FIXTURE_EVENTS.map(mapFixtureEvent);
  }
}

/** One organizer's upcoming events in date order — the profile's "Upcoming" list. */
export function upcomingEventsFor(events: ViewEvent[], organizerSlug: string): ViewEvent[] {
  const now = Date.now();
  return events
    .filter((event) => event.organizerSlug === organizerSlug && new Date(event.start).getTime() >= now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export async function getViewEventById(id: string): Promise<ViewEvent | null> {
  const events = await getViewEvents();
  return events.find((e) => e.id === id) ?? null;
}

/** All organizers with their upcoming-event count, real API first, fixtures as the fallback. */
export async function getViewOrganizers(): Promise<ViewOrganizer[]> {
  try {
    const [organizers, events] = await Promise.all([fetchOrganizers(), fetchEvents()]);
    if (organizers.length === 0) throw new Error("No organizers from the API yet.");
    const now = Date.now();
    return organizers.map((o) => {
      const upcomingCount = events.filter(
        (e) => e.organizer_slug === o.slug && new Date(e.start).getTime() > now,
      ).length;
      return mapApiOrganizer(o, upcomingCount);
    });
  } catch {
    const now = Date.now();
    return FIXTURE_ORGANIZERS.map((o) => mapFixtureOrganizer(o, now));
  }
}

export async function getViewOrganizerBySlug(slug: string): Promise<ViewOrganizer | null> {
  try {
    const { organizer, upcoming_events } = await fetchOrganizer(slug);
    return mapApiOrganizer(organizer, upcoming_events.length);
  } catch {
    const organizer = FIXTURE_ORGANIZERS.find((o) => o.slug === slug);
    if (!organizer) return null;
    return mapFixtureOrganizer(organizer, Date.now());
  }
}
