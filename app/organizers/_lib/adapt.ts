// Adapters from the /api/events and /api/organizers row shapes (app/_lib/types.ts)
// to the props the design-system components expect (components/ui/*).
import { EVENT_CATEGORIES, ORGANIZER_TYPES, type OrganizerType } from "@/lib/schemas";
import type { Category } from "@/components/ui/EventCard";
import type { ApiEvent, ApiOrganizer } from "@/app/_lib/types";

const AMSTERDAM_TZ = "Europe/Amsterdam";

export function toOrganizerType(value: string | null): OrganizerType {
  return (ORGANIZER_TYPES as readonly string[]).includes(value ?? "")
    ? (value as OrganizerType)
    : "association";
}

export function toCategory(value: string | null): Category {
  return (EVENT_CATEGORIES as readonly string[]).includes(value ?? "")
    ? (value as Category)
    : "Social";
}

export function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: AMSTERDAM_TZ }).format(
    new Date(iso),
  );
}

export interface OrganizerEventCardProps {
  id: string;
  title: string;
  time: string;
  location: string;
  organizer: string;
  category: Category;
  price: number;
  newcomers: boolean;
  image?: string;
}

/** Maps an `/api/events` row (already filtered to one organizer) to EventCard props. */
export function toOrganizerEventCard(event: ApiEvent, organizerName: string): OrganizerEventCardProps {
  return {
    id: event.id,
    title: event.title,
    time: formatEventTime(event.start),
    location: event.location_name ?? event.address ?? "",
    organizer: organizerName,
    category: toCategory(event.category),
    price: Number(event.price_eur ?? 0),
    newcomers: event.newcomer_friendly,
    image: event.image_file ?? undefined,
  };
}

export interface DirectoryOrganizer {
  slug: string;
  name: string;
  type: OrganizerType;
  category: Category;
  logo?: string;
}

export function toDirectoryOrganizer(organizer: ApiOrganizer): DirectoryOrganizer {
  return {
    slug: organizer.slug,
    name: organizer.name,
    type: toOrganizerType(organizer.type),
    category: toCategory(organizer.category),
    logo: organizer.logo_file ?? undefined,
  };
}
