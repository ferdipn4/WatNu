"use client";

import { useSyncExternalStore } from "react";

/**
 * `storage` events only fire in *other* tabs/windows, not the one that made
 * the write. We dispatch this custom event ourselves so same-tab subscribers
 * (e.g. a toggle and the stats card it controls) stay in sync too.
 */
const LOCAL_CHANGE_EVENT = "watnu:local-storage";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LOCAL_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LOCAL_CHANGE_EVENT, onStoreChange);
  };
}

export function readLocalStorageValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocalStorageValue(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage may be unavailable (private mode, etc.) — not critical
    // for this demo feature.
  }
  window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT));
}

/**
 * Reads a localStorage key and re-renders when it changes, including
 * changes made by this same tab via `writeLocalStorageValue`. Returns
 * `null` on the server and until the client has mounted, so the initial
 * client render matches SSR and no hydration mismatch occurs.
 */
export function useLocalStorageValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readLocalStorageValue(key),
    () => null,
  );
}
