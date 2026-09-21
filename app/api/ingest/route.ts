import { NextResponse } from "next/server";
import {
  SUPPORTED_IMAGE_MEDIA_TYPES,
  askForJson,
  type ImageMediaType,
} from "@/lib/ai";
import { HttpError, handleRouteError, readJsonBody } from "@/lib/api";
import { describeToday } from "@/lib/datetime";
import {
  EVENT_CATEGORIES,
  extractionResultSchema,
  ingestRequestSchema,
  validationError,
} from "@/lib/schemas";
import { getSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

/** Vercel caps request bodies at 4.5 MB; keep the decoded image below 4 MB. */
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

type OrganizerHint = {
  slug: string;
  name: string;
  instagram_handle: string | null;
};

const DATA_URL_PREFIX = /^data:([^;]+);base64,/;

function isSupportedMediaType(value: string): value is ImageMediaType {
  return (SUPPORTED_IMAGE_MEDIA_TYPES as readonly string[]).includes(value);
}

function decodedBase64Bytes(value: string): number {
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return Math.floor((value.length * 3) / 4) - padding;
}

async function loadOrganizerHints(): Promise<OrganizerHint[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("organizers")
    .select("slug, name, instagram_handle")
    .order("name", { ascending: true });

  // A missing table or unreachable database should not block extraction; the
  // model simply gets no organizer candidates to match against.
  if (error || !data) return [];
  return data as OrganizerHint[];
}

function buildPrompt(organizers: OrganizerHint[], text: string | undefined) {
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

  return [
    "Extract every event advertised in the material below.",
    "A single poster or post can announce several events; return all of them.",
    "",
    `Today is ${describeToday()} in the Europe/Amsterdam timezone.`,
    "Resolve relative or year-less dates against that date, and always return",
    "`start` as a full ISO 8601 timestamp with the Europe/Amsterdam offset",
    "(+01:00 in winter, +02:00 in summer).",
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
      "start": "ISO 8601 timestamp",
      "location_name": "string or null",
      "address": "string or null",
      "category": "one of the allowed categories",
      "price_eur": 0,
      "description": "1-2 sentences in English",
      "original_language": "language of the source material, e.g. Dutch",
      "organizer_slug": "slug from the list above, or null",
      "newcomer_friendly": true,
      "missing_fields": ["field names you could not find"],
      "confidence": 0.0
    }
  ]
}`,
    "",
    "Rules: `price_eur` is 0 when the event is free. Translate the description",
    "into English when the source is Dutch or another language, and record the",
    "source language in `original_language`. `newcomer_friendly` is true when",
    "the event is open to newcomers or internationals without prior membership.",
    "List every field you had to guess or leave empty in `missing_fields`.",
    "",
    text ? `Source text:\n${text}` : "The material is the attached image.",
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const parsed = ingestRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    let imageBase64 = parsed.data.imageBase64;
    let mediaType = parsed.data.mediaType;

    if (imageBase64) {
      const dataUrlMatch = imageBase64.match(DATA_URL_PREFIX);
      if (dataUrlMatch) {
        const declared = dataUrlMatch[1];
        if (!mediaType && isSupportedMediaType(declared)) mediaType = declared;
        imageBase64 = imageBase64.replace(DATA_URL_PREFIX, "");
      }
      imageBase64 = imageBase64.replace(/\s/g, "");

      const bytes = decodedBase64Bytes(imageBase64);
      if (bytes > MAX_IMAGE_BYTES) {
        throw new HttpError(
          413,
          `Image is ${(bytes / 1024 / 1024).toFixed(1)} MB after decoding; the limit is 4 MB. Resize or re-compress it before uploading.`,
        );
      }
    }

    const organizers = await loadOrganizerHints();

    const raw = await askForJson({
      system:
        "You extract structured event data from posters and social media posts for Maastricht, the Netherlands.",
      prompt: buildPrompt(organizers, parsed.data.text),
      imageBase64,
      mediaType,
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

    // Drafts only: an organizer reviews these before anything is stored.
    return NextResponse.json({ saved: false, events: extracted.data.events });
  } catch (error) {
    return handleRouteError(error);
  }
}
