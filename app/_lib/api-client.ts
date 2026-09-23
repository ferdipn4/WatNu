import { headers } from "next/headers";
import type { ApiEvent, ApiOrganizer } from "./types";

/**
 * Server Components fetch our own route handlers over HTTP, so they need an
 * absolute URL. Build it from the incoming request headers.
 */
async function getBaseUrl(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  if (host) return `${protocol}://${host}`;
  return process.env.WATNU_BASE_URL ?? "http://localhost:3000";
}

async function fetchJson<T>(path: string): Promise<T> {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `Request to ${path} failed with status ${response.status}.`;
    throw new Error(message);
  }

  return body as T;
}

/** The filters GET /api/events understands; every screen asks for the slice it shows, never the whole table. */
export type EventsQuery = {
  /** ISO instant: events starting at or after it */
  from?: string;
  /** ISO instant: events starting at or before it */
  to?: string;
  organizer?: string;
  /** up to 100 event ids (a phone's saved events) */
  ids?: string[];
  /** free text: title, description, place or organizer name */
  q?: string;
};

export function eventsQueryString(query: EventsQuery): string {
  const params = new URLSearchParams();
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.organizer) params.set("organizer", query.organizer);
  if (query.ids && query.ids.length > 0) params.set("ids", query.ids.join(","));
  if (query.q) params.set("q", query.q);
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export async function fetchEvents(query: EventsQuery = {}): Promise<ApiEvent[]> {
  const data = await fetchJson<{ events: ApiEvent[] }>(`/api/events${eventsQueryString(query)}`);
  return data.events;
}

/** One event via GET /api/events/[id]; null when there is none. */
export async function fetchEvent(id: string): Promise<ApiEvent | null> {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/events/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (response.status === 404) return null;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body ? String((body as { error: unknown }).error) : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }
  return (body as { event: ApiEvent }).event;
}

export async function fetchOrganizers(): Promise<ApiOrganizer[]> {
  const data = await fetchJson<{ organizers: ApiOrganizer[] }>(
    "/api/organizers",
  );
  return data.organizers;
}

/** The organizer plus their upcoming events, or null when there is no such organizer. */
export async function fetchOrganizer(slug: string): Promise<{
  organizer: ApiOrganizer;
  upcoming_events: ApiEvent[];
} | null> {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/organizers/${encodeURIComponent(slug)}`, { cache: "no-store" });
  if (response.status === 404) return null;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body ? String((body as { error: unknown }).error) : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }
  return body as { organizer: ApiOrganizer; upcoming_events: ApiEvent[] };
}
