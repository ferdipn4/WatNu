/**
 * Hardcoded demo promos. This is a mock feature: no database table backs
 * this, and there are no API routes for it. Redemption counts and stats are
 * illustrative only.
 */
import { FIXTURE_EVENTS, FIXTURE_ORGANIZERS } from "./fixtures";

export type Promo = {
  organizerSlug: string;
  text: string;
  /** short code shown on the QR sheet for the person at the door who prefers to type it */
  code: string;
  redeemedCount: number;
};

export const PROMOS: Promo[] = [
  {
    organizerSlug: "complex-maastricht",
    text: "€2 off entry with WatNu",
    code: "COMPLEX2",
    redeemedCount: 14,
  },
  {
    organizerSlug: "muziekgieterij",
    text: "Free drink with WatNu",
    code: "GIETERIJ",
    redeemedCount: 23,
  },
];

/**
 * Looks up a promo for an organizer, first in the hardcoded demo list above,
 * then (so the fixture organizers used across the rebuilt screens also get a
 * working promo card + QR flow) in `lib/fixtures.ts`'s sample events.
 */
export function getPromoForOrganizer(
  slug: string | null | undefined,
): Promo | null {
  if (!slug) return null;

  const hardcoded = PROMOS.find((promo) => promo.organizerSlug === slug);
  if (hardcoded) return hardcoded;

  const organizer = FIXTURE_ORGANIZERS.find((o) => o.slug === slug);
  if (!organizer) return null;
  const eventWithPromo = FIXTURE_EVENTS.find(
    (e) => e.organizerId === organizer.id && e.promo,
  );
  if (!eventWithPromo?.promo) return null;

  return {
    organizerSlug: slug,
    text: eventWithPromo.promo.label,
    code: eventWithPromo.promo.code,
    redeemedCount: organizer.redemptions,
  };
}

/** localStorage key that /promo/[slug] increments on each mock redemption. */
export function promoRedemptionStorageKey(slug: string): string {
  return `watnu:promo-redemptions:${slug}`;
}

/**
 * Deterministic, slug-derived demo numbers for the organizer stats card.
 * Not real data — just enough variety to make the "Demo data" card feel
 * alive without wiring up any backend.
 */
export function getDemoStats(slug: string): {
  followers: number;
  eventViews: number;
} {
  let hash = 0;
  for (const char of slug) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }
  return {
    followers: 80 + (hash % 400),
    eventViews: 500 + (hash % 3000),
  };
}
