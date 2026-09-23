import { NextResponse } from "next/server";
import {
  SUPPORTED_IMAGE_MEDIA_TYPES,
  askForJson,
  type AskJsonImage,
  type ImageMediaType,
} from "@/lib/ai";
import { HttpError, handleRouteError, readJsonBody, requireUser } from "@/lib/api";
import { describeToday } from "@/lib/datetime";
import {
  EVENT_CATEGORIES,
  extractionResultSchema,
  ingestRequestSchema,
  validationError,
  type DraftEvent,
} from "@/lib/schemas";
import { getSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

/** Vercel caps request bodies at 4.5 MB; keep each decoded image below 4 MB. */
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
/** Slides from the same carousel post; kept in sync with `lib/schemas.ts`. */
const MAX_IMAGES = 3;

type OrganizerHint = {
  slug: string;
  name: string;
  instagram_handle: string | null;
  address: string | null;
};

type RawImageInput = { imageBase64: string; mediaType?: ImageMediaType };

const DATA_URL_PREFIX = /^data:([^;]+);base64,/;

function isSupportedMediaType(value: string): value is ImageMediaType {
  return (SUPPORTED_IMAGE_MEDIA_TYPES as readonly string[]).includes(value);
}

function decodedBase64Bytes(value: string): number {
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return Math.floor((value.length * 3) / 4) - padding;
}

/** Strips a `data:` prefix, whitespace, and enforces the per-image size cap. */
function normalizeImage(input: RawImageInput, index: number): AskJsonImage {
  let base64 = input.imageBase64;
  let mediaType = input.mediaType;

  const dataUrlMatch = base64.match(DATA_URL_PREFIX);
  if (dataUrlMatch) {
    const declared = dataUrlMatch[1];
    if (!mediaType && isSupportedMediaType(declared)) mediaType = declared;
    base64 = base64.replace(DATA_URL_PREFIX, "");
  }
  base64 = base64.replace(/\s/g, "");

  const bytes = decodedBase64Bytes(base64);
  if (bytes > MAX_IMAGE_BYTES) {
    throw new HttpError(
      413,
      `Image ${index + 1} is ${(bytes / 1024 / 1024).toFixed(1)} MB after decoding; the limit is 4 MB per image. Resize or re-compress it before uploading.`,
    );
  }

  return { base64, mediaType: mediaType ?? "image/jpeg" };
}

async function loadOrganizerHints(): Promise<OrganizerHint[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("organizers")
    .select("slug, name, instagram_handle, address")
    .order("name", { ascending: true });

  // A missing table or unreachable database should not block extraction; the
  // model simply gets no organizer candidates to match against.
  if (error || !data) return [];
  return data as OrganizerHint[];
}

/**
 * When the model matches a known organizer, trust that organizer's own
 * venue name and address over a blank or unclear poster field.
 */
function backfillFromOrganizer(
  draft: DraftEvent,
  organizers: OrganizerHint[],
): DraftEvent {
  if (!draft.organizer_slug) return draft;
  const organizer = organizers.find((o) => o.slug === draft.organizer_slug);
  if (!organizer) return draft;

  let location_name = draft.location_name;
  let address = draft.address;
  let missing_fields = draft.missing_fields;

  if (!location_name && organizer.name) {
    location_name = organizer.name;
    missing_fields = missing_fields.filter((field) => field !== "location_name");
  }
  if (!address && organizer.address) {
    address = organizer.address;
    missing_fields = missing_fields.filter((field) => field !== "address");
  }

  return { ...draft, location_name, address, missing_fields };
}

function buildPrompt(
  organizers: OrganizerHint[],
  text: string | undefined,
  imageCount: number,
) {
  const organizerList = organizers.length
    ? organizers
        .map(
          (organizer) =>
            `- ${organizer.slug} — ${organizer.name}${
              organizer.instagram_handle ? ` (@${organizer.instagram_handle})` : ""
            }`,
        )
        .join("\n")
    : "(no organizers are known yet)";

  const carouselNote =
    imageCount > 1
      ? [
          "",
          `The ${imageCount} attached images are slides from the same social`,
          "media post or carousel, in order. Treat them as one combined source:",
          "merge details for the same event across slides instead of duplicating",
          "it, and only return separate events when the slides clearly advertise",
          "genuinely different events.",
        ].join("\n")
      : "";

  return [
    "Extract every event advertised in the material below.",
    "A single poster or post can announce several events; return all of them.",
    carouselNote,
    "",
    `Today is ${describeToday()} in the Europe/Amsterdam timezone. Use this only`,
    'to resolve a relative or partial date, such as "next Friday" or "Wed 23",',
    "into a full date.",
    "Never invent a date. If no date is stated anywhere in the material, set",
    '`start` to `null` and list "start" in `missing_fields` — do not guess.',
    "When a date is known, return `start` as a full ISO 8601 timestamp with the",
    "Europe/Amsterdam offset (+01:00 in winter, +02:00 in summer).",
    "Never invent a time either. If the date is known but no start time is",
    'stated anywhere, keep that date and set the time to 20:00 as an explicit',
    'placeholder, list "time" in `missing_fields`, and cap `confidence` at 0.7.',
    "Set `end` only when an end time is actually stated (\"20:00–23:00\",",
    '"tot 23:00", "doors 22:00, close 04:00"); "until late" is not a time.',
    "An end before the start time (23:00–04:00) means the next day. When no",
    "end is stated, `end` is `null` — it is optional and never a missing field.",
    "",
    "Known organizers (match on name, handle or venue; use the slug verbatim):",
    organizerList,
    "",
    `Allowed categories (pick exactly one): ${EVENT_CATEGORIES.join(", ")}.`,
    "",
    "Return this JSON shape:",
    `{
  "events": [
    {
      "title": "string",
      "start": "ISO 8601 timestamp, or null if no date is stated",
      "end": "ISO 8601 timestamp when an end time is stated, else null",
      "location_name": "string or null",
      "address": "string or null",
      "category": "one of the allowed categories",
      "price_eur": 0,
      "description": "1-3 sentences in English",
      "original_language": "language of the source material, e.g. Dutch",
      "organizer_slug": "slug from the list above, or null",
      "signup_url": "a URL, or null",
      "newcomer_friendly": true,
      "missing_fields": ["field names you could not find"],
      "confidence": 0.0
    }
  ]
}`,
    "",
    "Rules: `price_eur` is 0 when the event is free. Translate the description",
    "into English when the source is Dutch or another language, and record the",
    "source language in `original_language`. `description` must mention every",
    "act, DJ, or speaker named in the material, and any time range stated",
    "(e.g. doors/start/end times). `newcomer_friendly` is true when the event",
    "is open to newcomers or internationals without prior membership.",
    "List every field you had to guess or leave empty in `missing_fields`.",
    "",
    "`signup_url` is for a registration or sign-up link, separate from",
    "`organizer_slug`. Only set it when a concrete URL is visible, or the",
    'material gives a clear, specific sign-up instruction (e.g. "sign up via',
    'the link in bio", a visible registration form URL, or a specific email/',
    "contact address used for registration). Never invent or guess a URL.",
    "A generic mention of an Instagram handle or bio, with no concrete link or",
    "explicit instruction to register through it, is not enough — leave",
    "`signup_url` as `null` in that case. Do not treat `signup_url` as a",
    "missing field: it is optional, and its absence must never be listed in",
    "`missing_fields` or lower `confidence`.",
    "",
    text ? `Source text:\n${text}` : "The material is the attached image(s).",
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    // Every call costs an AI request, so only signed-in organizers may extract.
    await requireUser(request);

    const body = await readJsonBody(request);
    const parsed = ingestRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const rawImages: RawImageInput[] = [];
    if (parsed.data.imageBase64) {
      rawImages.push({
        imageBase64: parsed.data.imageBase64,
        mediaType: parsed.data.mediaType,
      });
    }
    if (parsed.data.images) rawImages.push(...parsed.data.images);

    if (rawImages.length > MAX_IMAGES) {
      throw new HttpError(400, `Send at most ${MAX_IMAGES} images per request.`);
    }

    const images = rawImages.map((input, index) => normalizeImage(input, index));

    const organizers = await loadOrganizerHints();

    const raw = await askForJson({
      system:
        "You extract structured event data from posters and social media posts for Maastricht, the Netherlands.",
      prompt: buildPrompt(organizers, parsed.data.text, images.length),
      images,
    });

    const extracted = extractionResultSchema.safeParse(raw);
    if (!extracted.success) {
      return NextResponse.json(
        {
          ...validationError(extracted.error),
          error: "The model returned data that does not match the event schema.",
          raw,
        },
        { status: 502 },
      );
    }

    const events = extracted.data.events.map((draft) =>
      backfillFromOrganizer(draft, organizers),
    );

    // Drafts only: an organizer reviews these before anything is stored.
    return NextResponse.json({ saved: false, events });
  } catch (error) {
    return handleRouteError(error);
  }
}
