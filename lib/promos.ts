/**
 * Hardcoded demo promos. This is a mock feature: no database table backs
 * this, and there are no API routes for it. Redemption counts and stats are
 * illustrative only.
 */
export type Promo = {
  organizerSlug: string;
  text: string;
  redeemedCount: number;
};

export const PROMOS: Promo[] = [
  {
    organizerSlug: "complex-maastricht",
    text: "€2 off entry with WatNu",
    redeemedCount: 14,
  },
  {
    organizerSlug: "muziekgieterij",
    text: "Free drink with WatNu",
    redeemedCount: 23,
  },
];

export function getPromoForOrganizer(
  slug: string | null | undefined,
): Promo | null {
  if (!slug) return null;
  return PROMOS.find((promo) => promo.organizerSlug === slug) ?? null;
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
