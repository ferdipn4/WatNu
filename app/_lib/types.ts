/**
 * Shapes returned by our own API routes. These mirror the DB columns picked
 * by `EVENT_COLUMNS` / `ORGANIZER_COLUMNS` in `lib/api.ts`, not the frontend
 * `Event` type in `lib/types.ts`.
 */
export type ApiEvent = {
  id: string;
  title: string;
  organizer_slug: string | null;
  start: string;
  end: string | null;
  /** weekly / biweekly / monthly for a series: the row's `start` is its first occurrence, and the list routes return one copy per occurrence */
  recurrence: "weekly" | "biweekly" | "monthly" | null;
  /** the last day of a series, `YYYY-MM-DD`, or null when open-ended */
  repeat_until: string | null;
  location_name: string | null;
  address: string | null;
  category: string | null;
  price_eur: number | string | null;
  description: string | null;
  source_url: string | null;
  newcomer_friendly: boolean;
  image_file: string | null;
  created_at: string;
  /** joined from `organizers` by GET /api/events and GET /api/events/[id]; absent on an organizer's own event list */
  organizer_name?: string | null;
  organizer_type?: string | null;
};

export type ApiOrganizer = {
  id: string;
  slug: string;
  name: string;
  type: string | null;
  category: string | null;
  description: string | null;
  instagram_handle: string | null;
  address: string | null;
  logo_file: string | null;
  stats_public: boolean;
  created_at: string;
};
