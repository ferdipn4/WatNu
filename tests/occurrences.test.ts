import { describe, expect, it } from "vitest";
import { expandOccurrences } from "@/lib/occurrences";

/** Thursday 24 Sep 2026, 19:00–21:00 Amsterdam (CEST, so 17:00Z). */
const weekly = {
  start: "2026-09-24T17:00:00.000Z",
  end: "2026-09-24T19:00:00.000Z",
  recurrence: "weekly" as const,
  repeat_until: null,
  skipped_dates: [] as string[],
};

const day = (iso: string) => iso.slice(0, 10);
const at = (iso: string) => new Date(iso);

describe("expandOccurrences", () => {
  it("returns a one-off as is inside the window, nothing outside it", () => {
    const oneOff = { ...weekly, recurrence: null };
    const inside = expandOccurrences(oneOff, at("2026-09-24T00:00:00Z"), at("2026-09-25T00:00:00Z"));
    expect(inside).toHaveLength(1);
    expect(inside[0].cancelled).toBe(false);
    expect(inside[0].start).toBe(weekly.start);
    expect(expandOccurrences(oneOff, at("2026-09-25T00:00:00Z"), null)).toEqual([]);
    expect(expandOccurrences(oneOff, null, at("2026-09-24T00:00:00Z"))).toEqual([]);
  });

  it("repeats weekly at 19:00 Amsterdam across the switch to winter time, keeping the duration", () => {
    const rows = expandOccurrences(weekly, at("2026-10-20T00:00:00Z"), at("2026-11-05T00:00:00Z"));
    // 22 Oct is still CEST (17:00Z); 29 Oct is CET (18:00Z); 5 Nov 18:00Z falls after the window.
    expect(rows.map((row) => row.start)).toEqual(["2026-10-22T17:00:00.000Z", "2026-10-29T18:00:00.000Z"]);
    expect(rows[1].end).toBe("2026-10-29T20:00:00.000Z");
  });

  it("stops at repeat_until, counting that day as a whole", () => {
    const rows = expandOccurrences({ ...weekly, repeat_until: "2026-10-08" }, at("2026-09-01T00:00:00Z"), at("2026-12-01T00:00:00Z"));
    expect(rows.map((row) => day(row.start))).toEqual(["2026-09-24", "2026-10-01", "2026-10-08"]);
  });

  it("keeps a skipped date in the list, flagged cancelled", () => {
    const rows = expandOccurrences({ ...weekly, skipped_dates: ["2026-10-01"] }, at("2026-09-20T00:00:00Z"), at("2026-10-10T00:00:00Z"));
    expect(rows.map((row) => [day(row.start), row.cancelled])).toEqual([
      ["2026-09-24", false],
      ["2026-10-01", true],
      ["2026-10-08", false],
    ]);
  });

  it("does every other week, and monthly clamped to the month's last day", () => {
    const biweekly = expandOccurrences({ ...weekly, recurrence: "biweekly" }, at("2026-09-20T00:00:00Z"), at("2026-10-25T00:00:00Z"));
    expect(biweekly.map((row) => day(row.start))).toEqual(["2026-09-24", "2026-10-08", "2026-10-22"]);

    // 31 Jan 20:00 CET; February has no 31st, March does again.
    const monthly = expandOccurrences(
      { start: "2026-01-31T19:00:00.000Z", end: null, recurrence: "monthly" as const, repeat_until: null, skipped_dates: [] },
      at("2026-01-01T00:00:00Z"),
      at("2026-04-30T00:00:00Z"),
    );
    expect(monthly.map((row) => day(row.start))).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
    expect(monthly.every((row) => row.end === null)).toBe(true);
  });

  it("fast-forwards to the window for a series that began years ago", () => {
    // Thursday 4 Jan 2024, 19:00 CET.
    const old = { ...weekly, start: "2024-01-04T18:00:00.000Z", end: null };
    const rows = expandOccurrences(old, at("2026-09-20T00:00:00Z"), at("2026-10-10T00:00:00Z"));
    expect(rows.map((row) => day(row.start))).toEqual(["2026-09-24", "2026-10-01", "2026-10-08"]);
    expect(rows[0].start).toBe("2026-09-24T17:00:00.000Z");
  });

  it("returns at most 60 occurrences, and eight weeks when no end is asked for", () => {
    expect(expandOccurrences(weekly, at("2026-09-20T00:00:00Z"), at("2030-01-01T00:00:00Z"))).toHaveLength(60);
    // 20 Sep + 56 days = 15 Nov: Thursdays 24 Sep … 12 Nov.
    expect(expandOccurrences(weekly, at("2026-09-20T00:00:00Z"), null)).toHaveLength(8);
  });
});
