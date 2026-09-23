import { z } from "zod";
import { SUPPORTED_IMAGE_MEDIA_TYPES } from "@/lib/ai";
import { EVENT_CATEGORIES } from "@/lib/types";

export { EVENT_CATEGORIES };

export const eventCategorySchema = z.enum(EVENT_CATEGORIES);
export type ApiEventCategory = z.infer<typeof eventCategorySchema>;

const isoDateTime = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Expected an ISO 8601 date-time string.",
  });

/**
 * The AI must never guess a date. It reports an unresolved date as `null`
 * (an empty string is treated the same way); we normalise that to `""` here
 * so `DraftEvent.start` stays a plain `string` for every caller, same as
 * before this field could go missing.
 */
const nullableIsoDateTime = z
  .string()
  .nullable()
  .transform((value) => (value && value.trim() !== "" ? value.trim() : null))
  .refine((value) => value === null || !Number.isNaN(Date.parse(value)), {
    message: "Expected an ISO 8601 date-time string or null.",
  })
  .transform((value) => value ?? "");

/**
 * An ISO date-time or `null` — never required. Used for the end of an event, which posters
 * often leave out; nobody guesses it.
 */
const optionalIsoDateTime = z
  .string()
  .nullish()
  .transform((value) => (value && value.trim() !== "" ? value.trim() : null))
  .refine((value) => value === null || !Number.isNaN(Date.parse(value)), {
    message: "Expected an ISO 8601 date-time string or null.",
  });

/** `end`, when given, must come after `start`; the client already pushes a midnight-crossing end to the next day. */
function endAfterStart(value: { start?: string; end?: string | null }): boolean {
  if (!value.start || !value.end) return true;
  return new Date(value.end).getTime() > new Date(value.start).getTime();
}

const END_AFTER_START = { message: "End must be after start.", path: ["end"] };

const optionalText = z
  .string()
  .nullish()
  .transform((value) => (value && value.trim() !== "" ? value.trim() : null));

/** A public http(s) URL or `null`: images live in Supabase Storage, never as `data:` URLs inside a row. */
const optionalHttpUrl = z
  .string()
  .nullish()
  .transform((value) => (value && value.trim() !== "" ? value.trim() : null))
  .refine((value) => value === null || /^https?:\/\/\S+$/i.test(value), {
    message: "Expected an http(s) URL or null (upload the image to Storage first).",
  });

/** A URL when present, `null` when absent — never required, never invented. */
const optionalUrl = z
  .string()
  .nullish()
  .transform((value) => (value && value.trim() !== "" ? value.trim() : null))
  .refine((value) => value === null || z.string().url().safeParse(value).success, {
    message: "Expected a URL or null.",
  });

/** One event as extracted by the AI. Never persisted directly. */
export const draftEventSchema = z
  .object({
    title: z.string().min(1),
    start: nullableIsoDateTime,
    end: optionalIsoDateTime.default(null),
    location_name: optionalText,
    address: optionalText,
    category: eventCategorySchema,
    price_eur: z.coerce.number().min(0).default(0),
    description: z.string().min(1),
    original_language: z.string().min(1).default("unknown"),
    organizer_slug: optionalText,
    signup_url: optionalUrl,
    newcomer_friendly: z.boolean().default(false),
    missing_fields: z.array(z.string()).default([]),
    confidence: z.coerce.number().min(0).max(1).default(0.5),
  })
  .transform((rawDraft) => {
    // `end` and `signup_url` are optional by design: the model still tends to list them, which
    // would turn every poster without an end time amber for the wrong reason.
    const draft = { ...rawDraft, missing_fields: rawDraft.missing_fields.filter((field) => field !== "end" && field !== "signup_url") };
    // Defense in depth: enforce the "never guess a date" rule even if the
    // model forgets to flag it itself.
    if (!draft.start) {
      return {
        ...draft,
        missing_fields: draft.missing_fields.includes("start")
          ? draft.missing_fields
          : [...draft.missing_fields, "start"],
        confidence: Math.min(draft.confidence, 0.5),
      };
    }
    // Same for a known date with a placeholder (20:00) time.
    if (draft.missing_fields.includes("time")) {
      return { ...draft, confidence: Math.min(draft.confidence, 0.7) };
    }
    return draft;
  });

export type DraftEvent = z.infer<typeof draftEventSchema>;

export const extractionResultSchema = z.object({
  events: z.array(draftEventSchema),
});

const MAX_INGEST_IMAGES = 3;

const imageInputSchema = z.object({
  imageBase64: z.string().min(1),
  mediaType: z.enum(SUPPORTED_IMAGE_MEDIA_TYPES).optional(),
});

export const ingestRequestSchema = z
  .object({
    text: z.string().trim().min(1).optional(),
    /** @deprecated Use `images` instead. Still accepted for one image. */
    imageBase64: z.string().min(1).optional(),
    mediaType: z.enum(SUPPORTED_IMAGE_MEDIA_TYPES).optional(),
    images: z.array(imageInputSchema).max(MAX_INGEST_IMAGES).optional(),
  })
  .refine(
    (value) => Boolean(value.text || value.imageBase64 || value.images?.length),
    {
      message: "Provide `text`, `imageBase64`, or `images`.",
      path: ["text"],
    },
  )
  .refine(
    (value) =>
      (value.imageBase64 ? 1 : 0) + (value.images?.length ?? 0) <=
      MAX_INGEST_IMAGES,
    {
      message: `Send at most ${MAX_INGEST_IMAGES} images per request.`,
      path: ["images"],
    },
  );

export type IngestRequest = z.infer<typeof ingestRequestSchema>;

/** Body accepted by POST /api/events. */
export const createEventSchema = z
  .object({
    title: z.string().trim().min(1),
    start: isoDateTime,
    end: optionalIsoDateTime.default(null),
    location_name: optionalText,
    address: optionalText,
    category: eventCategorySchema,
    price_eur: z.coerce.number().min(0).default(0),
    description: optionalText,
    source_url: z.string().url().nullish().default(null),
    organizer_slug: optionalText,
    newcomer_friendly: z.boolean().default(false),
    image_file: optionalHttpUrl,
  })
  .refine(endAfterStart, END_AFTER_START);

export type CreateEventInput = z.infer<typeof createEventSchema>;

/**
 * Body accepted by PATCH /api/events/[id]. Every field is optional, but a
 * request must set at least one. Fields left out of the request body stay
 * out of the parsed result entirely (not `undefined`-valued but genuinely
 * absent), so `{...parsed.data}` only ever touches the columns the caller
 * actually sent — unlike `createEventSchema.partial()`, which would apply
 * defaults (`price_eur: 0`, `newcomer_friendly: false`, ...) to every field
 * the caller left out.
 */
export const updateEventSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    start: isoDateTime.optional(),
    end: optionalIsoDateTime.optional(),
    location_name: optionalText.optional(),
    address: optionalText.optional(),
    category: eventCategorySchema.optional(),
    price_eur: z.coerce.number().min(0).optional(),
    description: optionalText.optional(),
    source_url: optionalUrl.optional(),
    organizer_slug: optionalText.optional(),
    newcomer_friendly: z.boolean().optional(),
    image_file: optionalHttpUrl.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  })
  .refine(endAfterStart, END_AFTER_START);

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

/** Body accepted by POST /api/events/check. */
export const checkEventSchema = z.object({
  id: z.string().uuid().nullish().default(null),
  title: z.string().trim().min(1),
  start: isoDateTime,
  category: eventCategorySchema.nullish().default(null),
});

export type CheckEventInput = z.infer<typeof checkEventSchema>;

export const eventQuerySchema = z.object({
  category: eventCategorySchema.optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  free: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  organizer: z.string().trim().min(1).optional(),
});

/**
 * The four organizer types from `supabase/schema.sql`. No `OrganizerType`
 * union exists in `lib/types.ts` yet, so it's defined here rather than
 * invented a second time or bolted onto a file this task must not touch.
 */
export const ORGANIZER_TYPES = ["association", "cafe", "club", "venue"] as const;
export const organizerTypeSchema = z.enum(ORGANIZER_TYPES);
export type OrganizerType = z.infer<typeof organizerTypeSchema>;

/**
 * Body accepted by PATCH /api/organizers/[slug]. Same "at least one field,
 * absent keys stay absent" shape as {@link updateEventSchema}. `category`
 * reuses `eventCategorySchema`: an organizer's category is one of the six
 * event categories (e.g. "Student association · Party").
 */
export const updateOrganizerSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    type: organizerTypeSchema.optional(),
    category: eventCategorySchema.optional(),
    description: optionalText.optional(),
    instagram_handle: optionalText.optional(),
    address: optionalText.optional(),
    logo_file: optionalHttpUrl.optional(),
    /** whether everyone may see the organizer's stats (views, saves, followers); members always do */
    stats_public: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export type UpdateOrganizerInput = z.infer<typeof updateOrganizerSchema>;

/** The five things the app counts (POST /api/metrics). Views and saves are per event, follows per organizer. */
export const METRIC_KINDS = [
  "event_view",
  "event_save",
  "event_unsave",
  "organizer_follow",
  "organizer_unfollow",
] as const;
export type MetricKind = (typeof METRIC_KINDS)[number];

/** Body accepted by POST /api/metrics: `id` is an event uuid or an organizer slug, depending on `kind`. */
export const metricSchema = z.object({
  kind: z.enum(METRIC_KINDS),
  id: z.string().trim().min(1).max(200),
});

/** Shape returned to clients for validation failures. */
export function validationError(error: z.ZodError) {
  const flat = error.flatten();
  return {
    error: "Validation failed.",
    fieldErrors: flat.fieldErrors,
    formErrors: flat.formErrors,
  };
}
