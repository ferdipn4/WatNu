/**
 * The local "profile" card on My WatNu — not part of the design handoff,
 * explicitly approved as an addition. There is no login: this is just a
 * display name for this browser, stored in localStorage next to the
 * followed-organizers / saved-events state in `app/_lib/store.ts`.
 */
import { readLocalStorageValue, writeLocalStorageValue } from "@/app/_lib/use-local-storage-value";

const DISPLAY_NAME_KEY = "watnu:display-name";

export function getDisplayName(): string {
  return (readLocalStorageValue(DISPLAY_NAME_KEY) ?? "").trim();
}

export function setDisplayName(name: string): void {
  writeLocalStorageValue(DISPLAY_NAME_KEY, name.trim());
}
