/**
 * The shapes the screens render, and the mapping from our API rows to them. No server-only
 * imports here, so client components can map a row they fetched themselves (My WatNu's saved
 * past events); the server pages use app/e/_lib/view-data.ts on top of this.
 */
import { amsterdamDateKey } from "@/lib/datetime";
import { getDemoPromoForEvent } from "@/lib/promos";
import type { Recurrence } from "@/lib/occurrences";
import type { OrganizerType } from "@/lib/schemas";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/types";
import type { ApiEvent, ApiOrganizer } from "./types";

export type ViewPromo = { label: string; code: string };

export type ViewEvent = {
  id: string;
  title: string;
  description: string;
  /** ISO instant */
  start: string;
  /** ISO instant, when known */
  end?: string;
  /** set on a recurring series; `start` and `end` are then one occurrence of it */
  recurrence?: Recurrence;
  /** the last day of the series, `YYYY-MM-DD`, when the organizer set one */
  repeatUntil?: string;
  /** the `YYYY-MM-DD` dates the organizer skipped, on a series */
  skippedDates?: string[];
  /** this occurrence is one the organizer skipped ("cancelled this week") */
  cancelled?: boolean;
  location: string;
  address?: string;
  walkFromStation?: string;
  category: EventCategory;
  price: number;
  newcomers: boolean;
  /** an image url, or a `demoPosterMarker(...)` value for fixture events — see app/e/_lib/demo-posters.tsx */
  image?: string;
  /** the registration link (`source_url`), when the organizer set one */
  signupUrl?: string;
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
  /** whether the organizer shows their stats (views, saves, followers) to everyone */
  statsPublic: boolean;
  /** known when the organizer was loaded with their events (the profile, the detail screen's organizer row) */
  upcomingCount?: number;
};

const CATEGORY_SET = new Set<string>(EVENT_CATEGORIES);
export function asCategory(value: string | null | undefined): EventCategory {
  return value && CATEGORY_SET.has(value) ? (value as EventCategory) : "Social";
}

const ORG_TYPE_SET = new Set<OrganizerType>(["association", "cafe", "club", "venue"]);
export function asOrgType(value: string | null | undefined): OrganizerType {
  return value && ORG_TYPE_SET.has(value as OrganizerType) ? (value as OrganizerType) : "association";
}

/** An organizer's own event list (GET /api/organizers/[slug]) carries no join; pass the organizer instead. */
export function mapApiEvent(event: ApiEvent, organizer?: { name: string; type: string | null }): ViewEvent {
  const organizerName = organizer?.name ?? event.organizer_name ?? "Organizer";
  const organizerType = asOrgType(organizer?.type ?? event.organizer_type);
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? "",
    start: event.start,
    end: event.end ?? undefined,
    recurrence: event.recurrence ?? undefined,
    repeatUntil: event.repeat_until ?? undefined,
    skippedDates: event.recurrence ? (event.skipped_dates ?? []) : undefined,
    cancelled: event.cancelled === true || undefined,
    location: event.location_name ?? event.address ?? "Location to be announced",
    address: event.address ?? undefined,
    category: asCategory(event.category),
    price: Number(event.price_eur ?? 0),
    newcomers: event.newcomer_friendly,
    image: event.image_file ?? undefined,
    signupUrl: event.source_url ?? undefined,
    organizerSlug: event.organizer_slug,
    organizerName,
    organizerType,
    // The API doesn't carry the poster's original language yet, so there is
    // nothing to translate a caption from — see design/README.md's AI
    // provenance rule: never show a note the data can't back up.
    sourceLanguage: "en",
    promo: getDemoPromoForEvent(event.id) ?? undefined,
  };
}

/** The detail URL; an occurrence of a series names its date, so the detail shows that one and not the next. */
export function eventHref(event: Pick<ViewEvent, "id" | "start" | "recurrence">): string {
  return event.recurrence ? `/e/${event.id}?on=${amsterdamDateKey(event.start)}` : `/e/${event.id}`;
}

export function mapApiOrganizer(organizer: ApiOrganizer, upcomingCount?: number): ViewOrganizer {
  return {
    slug: organizer.slug,
    name: organizer.name,
    type: asOrgType(organizer.type),
    category: asCategory(organizer.category),
    instagram: organizer.instagram_handle ?? undefined,
    description: organizer.description ?? undefined,
    address: organizer.address ?? undefined,
    logo: organizer.logo_file ?? undefined,
    statsPublic: organizer.stats_public === true,
    upcomingCount,
  };
}
