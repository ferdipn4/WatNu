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

export async function fetchEvents(): Promise<ApiEvent[]> {
  const data = await fetchJson<{ events: ApiEvent[] }>("/api/events");
  return data.events;
}

/** There is no single-event route yet, so find it in the full list. */
export async function fetchEvent(id: string): Promise<ApiEvent | null> {
  const events = await fetchEvents();
  return events.find((event) => event.id === id) ?? null;
}

export async function fetchOrganizers(): Promise<ApiOrganizer[]> {
  const data = await fetchJson<{ organizers: ApiOrganizer[] }>(
    "/api/organizers",
  );
  return data.organizers;
}

export async function fetchOrganizer(slug: string): Promise<{
  organizer: ApiOrganizer;
  upcoming_events: ApiEvent[];
}> {
  return fetchJson(`/api/organizers/${encodeURIComponent(slug)}`);
}
