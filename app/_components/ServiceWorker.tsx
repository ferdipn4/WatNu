"use client";

import { useEffect } from "react";

/** Registers public/sw.js in production builds only — in `next dev` a cache would fight hot reloading. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {
      // No service worker means no offline copy; the app itself is unaffected.
    });
  }, []);
  return null;
}
