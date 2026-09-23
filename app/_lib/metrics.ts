import type { MetricKind } from "@/lib/schemas";

/**
 * Counts a view, save or follow for the organizer's stats (POST /api/metrics). Fire and forget:
 * a lost count must never get in the way of what the student was doing, so nothing is awaited
 * and every failure is swallowed. Students have no account, so this is anonymous by design.
 */
export function recordMetric(kind: MetricKind, id: string): void {
  if (typeof window === "undefined") return;
  try {
    void fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id }),
      // Survives the page being left right after a tap (a bookmark, then straight on to the next screen).
      keepalive: true,
    }).catch(() => {});
  } catch {
    // fetch itself can throw in odd environments; the count is not worth a crash.
  }
}
