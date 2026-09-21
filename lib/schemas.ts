import { z } from "zod";
import { SUPPORTED_IMAGE_MEDIA_TYPES } from "@/lib/ai";

/**
 * Category vocabulary used by the API. This is intentionally separate from the
 * legacy `EventCategory` union in `lib/types.ts`, which the public feed still
 * uses.
 */
export const EVENT_CATEGORIES = [
  "Sport",
  "Party",
  "Café & Food",
  "Culture",
  "Study & Career",
  "Social",
] as const;

export const eventCategorySchema = z.enum(EVENT_CATEGORIES);
export type ApiEventCategory = z.infer<typeof eventCategorySchema>;

const isoDateTime = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Expected an ISO 8601 date-time string.",
  });

const optionalText = z
  .string()
  .nullish()
  .transform((value) => (value && value.trim() !== "" ? value.trim() : null));

/** One event as extracted by the AI. Never persisted directly. */
export const draftEventSchema = z.object({
  title: z.string().min(1),
  start: isoDateTime,
  location_name: optionalText,
  address: optionalText,
  category: eventCategorySchema,
  price_eur: z.coerce.number().min(0).default(0),
  description: z.string().min(1),
  original_language: z.string().min(1).default("unknown"),
  organizer_slug: optionalText,
  newcomer_friendly: z.boolean().default(false),
  missing_fields: z.array(z.string()).default([]),
  confidence: z.coerce.number().min(0).max(1).default(0.5),
});

export type DraftEvent = z.infer<typeof draftEventSchema>;

export const extractionResultSchema = z.object({
  events: z.array(draftEventSchema),
});

export const ingestRequestSchema = z
  .object({
    text: z.string().trim().min(1).optional(),
    imageBase64: z.string().min(1).optional(),
    mediaType: z.enum(SUPPORTED_IMAGE_MEDIA_TYPES).optional(),
  })
  .refine((value) => Boolean(value.text || value.imageBase64), {
    message: "Provide either `text` or `imageBase64`.",
    path: ["text"],
  });

export type IngestRequest = z.infer<typeof ingestRequestSchema>;

/** Body accepted by POST /api/events. */
export const createEventSchema = z.object({
  title: z.string().trim().min(1),
  start: isoDateTime,
  location_name: optionalText,
  address: optionalText,
  category: eventCategorySchema,
  price_eur: z.coerce.number().min(0).default(0),
  description: optionalText,
  source_url: z.string().url().nullish().default(null),
  organizer_slug: optionalText,
  newcomer_friendly: z.boolean().default(false),
  image_file: optionalText,
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

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

/** Shape returned to clients for validation failures. */
export function validationError(error: z.ZodError) {
  const flat = error.flatten();
  return {
    error: "Validation failed.",
    fieldErrors: flat.fieldErrors,
    formErrors: flat.formErrors,
  };
}
