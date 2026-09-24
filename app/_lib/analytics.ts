"use client";

/**
 * Product events for Vercel Web Analytics (page views are counted by the <Analytics /> component in
 * app/layout.tsx; these are the few actions that say whether the app works: a save, a follow,
 * reminders on, an install, a share). Cookieless, no names, no ids of people; a lost event never
 * gets in the way of what the student was doing.
 */
import { track } from "@vercel/analytics";

export type AppEvent = "event_save" | "organizer_follow" | "reminders_on" | "install" | "event_share";

export function trackEvent(name: AppEvent, props?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined") return;
  try {
    track(name, props);
  } catch {
    // Analytics is never worth an error in the app.
  }
}
