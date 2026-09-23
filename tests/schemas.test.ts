import { describe, expect, it } from "vitest";
import {
  createEventSchema,
  createOrganizerSchema,
  draftEventSchema,
  eventQuerySchema,
  organizerRequestSchema,
  pushSubscribeSchema,
  updateEventSchema,
} from "@/lib/schemas";

const uuid = () => crypto.randomUUID();

describe("draftEventSchema (what the AI returns)", () => {
  it("never lets an optional field count as missing, and flags a null start", () => {
    const draft = draftEventSchema.parse({
      title: "Salsa night",
      start: null,
      category: "Social",
      description: "Dancing.",
      missing_fields: ["end", "signup_url", "recurrence", "repeat_until"],
      confidence: 0.9,
    });
    expect(draft.start).toBe("");
    expect(draft.missing_fields).toEqual(["start"]);
    expect(draft.confidence).toBe(0.5);
  });

  it("caps confidence when the time was a placeholder", () => {
    const draft = draftEventSchema.parse({
      title: "Salsa night",
      start: "2026-10-01T20:00:00+02:00",
      category: "Social",
      description: "Dancing.",
      missing_fields: ["time"],
      confidence: 0.95,
    });
    expect(draft.confidence).toBe(0.7);
    expect(draft.recurrence).toBeNull();
  });
});

describe("createEventSchema", () => {
  const base = { title: "Neon Night", start: "2026-10-03T22:00:00+02:00", category: "Party" };

  it("refuses an end before the start", () => {
    expect(createEventSchema.safeParse({ ...base, end: "2026-10-03T21:00:00+02:00" }).success).toBe(false);
    expect(createEventSchema.safeParse({ ...base, end: "2026-10-04T03:00:00+02:00" }).success).toBe(true);
  });

  it("refuses a data: URL as the poster (images live in Storage)", () => {
    expect(createEventSchema.safeParse({ ...base, image_file: "data:image/png;base64,AAAA" }).success).toBe(false);
    expect(createEventSchema.safeParse({ ...base, image_file: "https://x.supabase.co/storage/v1/object/public/media/posters/a.jpg" }).success).toBe(true);
  });

  it("accepts a weekly series with a last day", () => {
    const parsed = createEventSchema.parse({ ...base, recurrence: "weekly", repeat_until: "2026-12-31" });
    expect(parsed.recurrence).toBe("weekly");
    expect(parsed.repeat_until).toBe("2026-12-31");
    expect(createEventSchema.safeParse({ ...base, recurrence: "daily" }).success).toBe(false);
    expect(createEventSchema.safeParse({ ...base, repeat_until: "31-12-2026" }).success).toBe(false);
  });
});

describe("updateEventSchema", () => {
  it("needs at least one field, and leaves out what was not sent", () => {
    expect(updateEventSchema.safeParse({}).success).toBe(false);
    const parsed = updateEventSchema.parse({ title: "New" });
    expect(Object.keys(parsed)).toEqual(["title"]);
  });

  it("dedupes and sorts the skipped dates", () => {
    const parsed = updateEventSchema.parse({ skipped_dates: ["2026-10-08", "2026-10-01", "2026-10-08"] });
    expect(parsed.skipped_dates).toEqual(["2026-10-01", "2026-10-08"]);
  });
});

describe("eventQuerySchema (GET /api/events)", () => {
  it("splits ids, trims q, and drops an empty q", () => {
    const a = uuid();
    const b = uuid();
    const parsed = eventQuerySchema.parse({ ids: `${a}, ${b}`, q: "  run ", free: "true" });
    expect(parsed.ids).toEqual([a, b]);
    expect(parsed.q).toBe("run");
    expect(parsed.free).toBe(true);
    expect(eventQuerySchema.parse({ q: "   " }).q).toBeUndefined();
  });

  it("refuses more than 100 ids, or a non-uuid", () => {
    expect(eventQuerySchema.safeParse({ ids: Array.from({ length: 101 }, uuid).join(",") }).success).toBe(false);
    expect(eventQuerySchema.safeParse({ ids: "not-a-uuid" }).success).toBe(false);
  });
});

describe("organizerRequestSchema", () => {
  it("normalises what people type", () => {
    const parsed = organizerRequestSchema.parse({
      organization: " Salsa Society ",
      contact_name: "Ana",
      email: "Ana@Example.COM",
      instagram_handle: "@salsa_maastricht",
      message: "x".repeat(700),
    });
    expect(parsed.organization).toBe("Salsa Society");
    expect(parsed.email).toBe("ana@example.com");
    expect(parsed.instagram_handle).toBe("salsa_maastricht");
    expect(parsed.message).toHaveLength(600);
  });

  it("refuses a bad email", () => {
    expect(organizerRequestSchema.safeParse({ organization: "Salsa", contact_name: "Ana", email: "nope" }).success).toBe(false);
  });
});

describe("createOrganizerSchema", () => {
  it("wants a url-safe slug and lowercases it", () => {
    expect(createOrganizerSchema.parse({ slug: "Salsa-Society", name: "Salsa Society", type: "association", category: "Social" }).slug).toBe("salsa-society");
    expect(createOrganizerSchema.safeParse({ slug: "salsa society", name: "Salsa Society", type: "association", category: "Social" }).success).toBe(false);
    expect(createOrganizerSchema.safeParse({ slug: "salsa", name: "Salsa", type: "band", category: "Social" }).success).toBe(false);
  });
});

describe("pushSubscribeSchema", () => {
  it("dedupes the saved ids and refuses a bad endpoint", () => {
    const id = uuid();
    const parsed = pushSubscribeSchema.parse({
      token: uuid(),
      subscription: { endpoint: "https://push.example.com/abc", keys: { p256dh: "k", auth: "a" } },
      event_ids: [id, id],
    });
    expect(parsed.event_ids).toEqual([id]);
    expect(pushSubscribeSchema.safeParse({ token: uuid(), subscription: { endpoint: "nope", keys: { p256dh: "k", auth: "a" } } }).success).toBe(false);
  });
});
