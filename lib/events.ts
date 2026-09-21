import mockEvents from "@/data/mock-events.json";
import { getSupabaseClient } from "@/lib/supabase";
import type { Event, EventCategory } from "@/lib/types";

const CATEGORIES: EventCategory[] = [
  "party",
  "sport",
  "food",
  "culture",
  "society",
];

type EventRow = {
  id: string;
  title: string;
  start: string;
  location_name: string | null;
  address: string | null;
  category: string | null;
  price_eur: number | string | null;
  description: string | null;
  source_url: string | null;
  image_file: string | null;
};

const SELECT_COLUMNS =
  "id, title, start, location_name, address, category, price_eur, description, source_url, image_file";

function toCategory(value: string | null): EventCategory {
  const normalised = value?.toLowerCase() ?? "";
  return CATEGORIES.includes(normalised as EventCategory)
    ? (normalised as EventCategory)
    : "culture";
}

function toEvent(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    datetime: row.start,
    location_name: row.location_name ?? row.address ?? "",
    // The events table has no coordinates yet; geocoding fills these in later.
    lat: 0,
    lng: 0,
    category: toCategory(row.category),
    price: Number(row.price_eur ?? 0),
    source: row.source_url ?? "",
    image_url: row.image_file ?? "",
    description: row.description ?? "",
  };
}

function getMockEvents(): Event[] {
  return (mockEvents as Event[])
    .slice()
    .sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
    );
}

export async function getEvents(): Promise<Event[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return getMockEvents();

  const { data, error } = await supabase
    .from("events")
    .select(SELECT_COLUMNS)
    .order("start", { ascending: true });

  if (error) {
    console.warn(`[events] Supabase query failed, using mock data: ${error.message}`);
    return getMockEvents();
  }

  if (!data || data.length === 0) {
    return getMockEvents();
  }

  return (data as EventRow[]).map(toEvent);
}
