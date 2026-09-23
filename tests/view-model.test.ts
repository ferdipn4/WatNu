import { describe, expect, it } from "vitest";
import type { ApiEvent } from "@/app/_lib/types";
import { eventHref, mapApiEvent } from "@/app/_lib/view-model";

const row: ApiEvent = {
  id: "0c1e6a4a-4a2d-4d8c-9c2a-2f8c9b1d5e01",
  title: "Weekly Social Run",
  organizer_slug: "social-run-club",
  start: "2026-09-24T17:00:00.000Z",
  end: null,
  recurrence: "weekly",
  repeat_until: null,
  skipped_dates: ["2026-10-01"],
  cancelled: false,
  location_name: null,
  address: "Plein 1992",
  category: "Sport",
  price_eur: "0",
  description: null,
  source_url: null,
  newcomer_friendly: true,
  image_file: null,
  created_at: "2026-09-01T00:00:00.000Z",
  organizer_name: "Social Run Club",
  organizer_type: "association",
};

describe("mapApiEvent", () => {
  it("maps a series row, falling back sensibly for what is missing", () => {
    const view = mapApiEvent(row);
    expect(view.location).toBe("Plein 1992");
    expect(view.price).toBe(0);
    expect(view.recurrence).toBe("weekly");
    expect(view.skippedDates).toEqual(["2026-10-01"]);
    expect(view.cancelled).toBeUndefined();
    expect(view.organizerName).toBe("Social Run Club");
    expect(view.organizerType).toBe("association");
    expect(view.description).toBe("");
  });

  it("guards the category and the organizer type against unknown values", () => {
    const view = mapApiEvent({ ...row, category: "Bingo", organizer_type: "circus", recurrence: null });
    expect(view.category).toBe("Social");
    expect(view.organizerType).toBe("association");
    expect(view.skippedDates).toBeUndefined();
  });

  it("prefers the organizer passed in over the joined columns", () => {
    const view = mapApiEvent(row, { name: "Complex Maastricht", type: "venue" });
    expect(view.organizerName).toBe("Complex Maastricht");
    expect(view.organizerType).toBe("venue");
  });
});

describe("eventHref", () => {
  it("names the occurrence's Amsterdam date for a series, and just the id otherwise", () => {
    expect(eventHref({ id: row.id, start: row.start, recurrence: "weekly" })).toBe(`/e/${row.id}?on=2026-09-24`);
    expect(eventHref({ id: row.id, start: "2026-09-23T22:30:00.000Z", recurrence: "weekly" })).toBe(`/e/${row.id}?on=2026-09-24`);
    expect(eventHref({ id: row.id, start: row.start, recurrence: undefined })).toBe(`/e/${row.id}`);
  });
});
