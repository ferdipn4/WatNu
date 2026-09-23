import type { EventCategory } from "@/lib/types";

/** Editable state for the `/new` review form (step 3). */
export type FormState = {
  title: string;
  /** `YYYY-MM-DD`, local to the browser. */
  date: string;
  /** `HH:mm`, local to the browser. */
  startTime: string;
  /** `HH:mm`, local to the browser; empty when the poster states no end. Sent as `end` on the start's day (or the next, past midnight). */
  endTime: string;
  location_name: string;
  address: string;
  category: EventCategory;
  price_eur: string;
  newcomer_friendly: boolean;
  signup_url: string;
  description: string;
};

export type Conflict = {
  id: string;
  title: string;
  start: string;
  category: string | null;
  same_category: boolean;
  hours_apart: number;
};

export type PossibleDuplicate = {
  id: string;
  title: string;
  start: string;
  similarity: number;
  decided_by: "ai" | "similarity";
  same_event: boolean | null;
  reason: string | null;
};

export type Suggestion = {
  message: string;
  best_day: string;
  suggested_start: string;
  evening_counts: Record<string, number>;
};

/** Response shape of the real, working `POST /api/events/check`. */
export type CheckResponse = {
  conflicts: Conflict[];
  possible_duplicates: PossibleDuplicate[];
  suggestion: Suggestion;
};

export type ImagePayload = { base64: string; mediaType: string };
