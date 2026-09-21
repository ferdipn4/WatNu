import type { DraftEvent } from "@/lib/schemas";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "./datetime";
import type { FormState } from "./types";

export function draftToForm(draft: DraftEvent): FormState {
  return {
    title: draft.title,
    start: toDatetimeLocalValue(draft.start),
    location_name: draft.location_name ?? "",
    address: draft.address ?? "",
    category: draft.category,
    price_eur: String(draft.price_eur ?? 0),
    description: draft.description,
    organizer_slug: draft.organizer_slug ?? "",
    newcomer_friendly: draft.newcomer_friendly,
  };
}

/** Body for POST /api/events/check. */
export function formToCheckPayload(form: FormState) {
  return {
    title: form.title,
    start: fromDatetimeLocalValue(form.start),
    category: form.category,
  };
}

/** Body for POST /api/events. */
export function formToCreatePayload(form: FormState) {
  return {
    title: form.title,
    start: fromDatetimeLocalValue(form.start),
    location_name: form.location_name.trim() || null,
    address: form.address.trim() || null,
    category: form.category,
    price_eur: Number(form.price_eur) || 0,
    description: form.description.trim() || null,
    organizer_slug: form.organizer_slug.trim() || null,
    newcomer_friendly: form.newcomer_friendly,
  };
}
