/**
 * Tiny localStorage-backed helpers for client-only "My WatNu" state
 * (followed organizers, saved events). These are plain synchronous
 * functions, not hooks — call them from `useEffect`/event handlers and
 * keep your own React state for reactivity. Saves and follows also feed
 * the organizer's stats (app/_lib/metrics.ts), anonymously.
 */
import { recordMetric } from "./metrics";

const FOLLOWED_ORGANIZERS_KEY = "watnu:followed-organizers";
const SAVED_EVENTS_KEY = "watnu:saved-events";
/** The student's display name on the profile page — a label for this phone, never sent anywhere. */
const DISPLAY_NAME_KEY = "watnu:display-name";

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
  const following = toggleInList(FOLLOWED_ORGANIZERS_KEY, slug);
  recordMetric(following ? "organizer_follow" : "organizer_unfollow", slug);
  return following;
}

export function getSavedEventIds(): string[] {
  return readList(SAVED_EVENTS_KEY);
}

export function isEventSaved(id: string): boolean {
  return readList(SAVED_EVENTS_KEY).includes(id);
}

export function toggleSavedEvent(id: string): boolean {
  const saved = toggleInList(SAVED_EVENTS_KEY, id);
  recordMetric(saved ? "event_save" : "event_unsave", id);
  return saved;
}

export function getDisplayName(): string {
  if (typeof window === "undefined") return "";
  try {
    return (localStorage.getItem(DISPLAY_NAME_KEY) ?? "").trim();
  } catch {
    return "";
  }
}

export function setDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = name.trim();
    if (trimmed) localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
    else localStorage.removeItem(DISPLAY_NAME_KEY);
  } catch {
    // Ignore write failures (e.g. Safari private mode, quota exceeded).
  }
}

/** "Clear saved events and follows" on the profile page. The name, theme, language and organizer tokens stay. */
export function clearSavedAndFollowed(): void {
  writeList(SAVED_EVENTS_KEY, []);
  writeList(FOLLOWED_ORGANIZERS_KEY, []);
}
