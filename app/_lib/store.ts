/**
 * Tiny localStorage-backed helpers for client-only "My WatNu" state
 * (followed organizers, saved events). These are plain synchronous
 * functions, not hooks — call them from `useEffect`/event handlers and
 * keep your own React state for reactivity.
 */

const FOLLOWED_ORGANIZERS_KEY = "watnu:followed-organizers";
const SAVED_EVENTS_KEY = "watnu:saved-events";

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Ignore write failures (e.g. Safari private mode, quota exceeded).
  }
}

function toggleInList(key: string, value: string): boolean {
  const list = readList(key);
  const isPresent = list.includes(value);
  const next = isPresent
    ? list.filter((item) => item !== value)
    : [...list, value];
  writeList(key, next);
  return !isPresent;
}

export function getFollowedOrganizers(): string[] {
  return readList(FOLLOWED_ORGANIZERS_KEY);
}

export function isFollowingOrganizer(slug: string): boolean {
  return readList(FOLLOWED_ORGANIZERS_KEY).includes(slug);
}

export function toggleFollowOrganizer(slug: string): boolean {
  return toggleInList(FOLLOWED_ORGANIZERS_KEY, slug);
}

export function getSavedEventIds(): string[] {
  return readList(SAVED_EVENTS_KEY);
}

export function isEventSaved(id: string): boolean {
  return readList(SAVED_EVENTS_KEY).includes(id);
}

export function toggleSavedEvent(id: string): boolean {
  return toggleInList(SAVED_EVENTS_KEY, id);
}
