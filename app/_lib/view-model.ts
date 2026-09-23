/**
 * The shapes the screens render, and the mapping from our API rows to them. No server-only
 * imports here, so client components can map a row they fetched themselves (My WatNu's saved
 * past events); the server pages use app/e/_lib/view-data.ts on top of this.
 */
import { getDemoPromoForEvent } from "@/lib/promos";
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
