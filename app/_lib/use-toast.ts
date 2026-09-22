"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "./i18n";

export type ToastState = { tone: "info" | "done"; text: string };

const TOAST_MS = 4000;

/**
 * One toast at a time, 4 seconds, then gone; render `toast` with `<Toast>`
 * (design/components/Toast/README.md). `showSoon` says what a `soon` control says when tapped
 * (design/README.md → Feature states).
 */
export function useToast() {
  const t = useT();
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string, tone: ToastState["tone"] = "info") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ tone, text });
    timer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const showSoon = useCallback(() => show(t("toast.soon"), "info"), [show, t]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { toast, show, showSoon };
}
