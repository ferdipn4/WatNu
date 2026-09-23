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
  location_name: string | null;
  address: string | null;
  category: string | null;
  price_eur: number | string | null;
  description: string | null;
  source_url: string | null;
  newcomer_friendly: boolean;
  image_file: string | null;
  created_at: string;
  organizer_name?: string | null;
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
  created_at: string;
};
