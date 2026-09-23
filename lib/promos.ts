/**
 * Promo codes are `soon` (lib/features.ts): there is no table, no API and no organizer UI for
 * them yet. The one event below carries a hard-coded demo so the promo card, the QR sheet and
 * the redemption page can be shown; every other event has no promo. Redemptions are counted in
 * the scanning phone's localStorage only — illustrative, never real.
 */
export type Promo = {
  /** the promise, as on the card: "€2 off entry with WatNu" */
  label: string;
  /** short code shown on the QR sheet for the person at the door who prefers to type it */
  code: string;
};

/** Event id → demo promo. Swap the id to move the demo to another event. */
const DEMO_PROMOS: Record<string, Promo> = {
  // "Hotline presents Pegassi" at Complex Maastricht
  "b6e76b86-f20e-4ad0-8043-4e79c1102647": { label: "€2 off entry with WatNu", code: "COMPLEX2" },
};

export function getDemoPromoForEvent(eventId: string): Promo | null {
  return DEMO_PROMOS[eventId] ?? null;
}

/** localStorage key that /promo/[id] increments on each demo redemption. */
export function promoRedemptionStorageKey(eventId: string): string {
  return `watnu:promo-redemptions:${eventId}`;
}
