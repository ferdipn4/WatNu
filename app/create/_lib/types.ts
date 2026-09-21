import type { EventCategory } from "@/lib/types";

/** Editable state for the create-event preview form. */
export type FormState = {
  title: string;
  start: string;
  location_name: string;
  address: string;
  category: EventCategory;
  price_eur: string;
  description: string;
  organizer_slug: string;
  newcomer_friendly: boolean;
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

/** Response shape of POST /api/events/check. */
export type CheckResponse = {
  conflicts: Conflict[];
  possible_duplicates: PossibleDuplicate[];
  suggestion: Suggestion;
};
