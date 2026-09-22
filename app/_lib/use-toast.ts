"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastState = { tone: "info" | "done"; text: string };

/** What a `soon` control says when tapped (design/README.md → Feature states). */
export const SOON_TOAST = "Not in this version yet — coming soon";
/** The one `done` toast after publishing (design/README.md → States and feedback). */
export const PUBLISHED_TOAST = "Published — it's live for everyone in Maastricht";
/** The `done` toast after an organizer saved their profile. */
export const PROFILE_UPDATED_TOAST = "Profile updated";

const TOAST_MS = 4000;

/** One toast at a time, 4 seconds, then gone; render `toast` with `<Toast>` (design/components/Toast/README.md). */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string, tone: ToastState["tone"] = "info") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ tone, text });
    timer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const showSoon = useCallback(() => show(SOON_TOAST, "info"), [show]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { toast, show, showSoon };
}
