import type { DraftEvent } from "@/lib/schemas";
import { EVENT_CATEGORIES } from "@/lib/types";
import { combineDateTime, combineEndDateTime, toDateInputValue, toTimeInputValue } from "./datetime";
import type { FormState } from "./types";

export function draftToForm(draft: DraftEvent): FormState {
  return {
    title: draft.title,
    date: draft.start ? toDateInputValue(draft.start) : "",
    startTime: draft.start ? toTimeInputValue(draft.start) : "",
    endTime: draft.end ? toTimeInputValue(draft.end) : "",
    location_name: draft.location_name ?? "",
    address: draft.address ?? "",
    category: draft.category,
    price_eur: String(draft.price_eur ?? 0),
    newcomer_friendly: draft.newcomer_friendly,
    signup_url: draft.signup_url ?? "",
    description: draft.description,
  };
}

/** The blank form behind "Create manually" — no draft, no AI, no missing-field amber. */
export function blankForm(): FormState {
  return {
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    location_name: "",
    address: "",
    category: EVENT_CATEGORIES[0],
    price_eur: "0",
    newcomer_friendly: false,
    signup_url: "",
    description: "",
  };
}

/** Body for the real `POST /api/events/check`. */
export function formToCheckPayload(form: FormState) {
  return {
    id: null as string | null,
    title: form.title.trim(),
    start: combineDateTime(form.date, form.startTime),
    category: form.category,
  };
}

/** Body for `POST /api/events` (`createEventSchema`). */
export function formToCreatePayload(
  form: FormState,
  organizerSlug: string | null,
  imageDataUrl: string | null,
) {
  return {
    title: form.title.trim(),
    start: combineDateTime(form.date, form.startTime),
    end: combineEndDateTime(form.date, form.startTime, form.endTime) || null,
    location_name: form.location_name.trim() || null,
    address: form.address.trim() || null,
    category: form.category,
    price_eur: Number(form.price_eur) || 0,
    description: form.description.trim() || null,
    // There is no dedicated image-upload endpoint yet; the resized image is
    // small enough to store as a data URL directly in the `image_file` text
    // column, which every reader already renders with a plain `<img src>`.
    source_url: form.signup_url.trim() || null,
    organizer_slug: organizerSlug,
    newcomer_friendly: form.newcomer_friendly,
    image_file: imageDataUrl || null,
  };
}

export function isRequiredFilled(form: FormState): boolean {
  return Boolean(
    form.title.trim() && form.date && form.startTime && form.location_name.trim(),
  );
}

export function isValidOptionalUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}
