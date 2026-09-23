import { describe, expect, it } from "vitest";
import { addDaysToDateKey, amsterdamInstant, amsterdamParts, amsterdamWeekRange, weekdayForDateKey } from "@/lib/datetime";

describe("lib/datetime (Europe/Amsterdam)", () => {
  it("turns a local wall-clock time into the right instant in summer and winter", () => {
    expect(amsterdamInstant("2026-07-01", 20, 0).toISOString()).toBe("2026-07-01T18:00:00.000Z");
    expect(amsterdamInstant("2026-12-01", 20, 0).toISOString()).toBe("2026-12-01T19:00:00.000Z");
  });

  it("reads an instant back as local parts", () => {
    const parts = amsterdamParts("2026-09-24T17:00:00.000Z");
    expect(parts).toEqual({ dateKey: "2026-09-24", weekday: "Thursday", hour: 19, minute: 0 });
    // Midnight renders as 0, never 24.
    expect(amsterdamParts("2026-09-23T22:00:00.000Z").hour).toBe(0);
  });

  it("frames the week from Monday 00:00 to the next Monday", () => {
    const week = amsterdamWeekRange("2026-09-24T10:00:00.000Z");
    expect(week.start.toISOString()).toBe("2026-09-20T22:00:00.000Z");
    expect(week.end.toISOString()).toBe("2026-09-27T22:00:00.000Z");
    expect(week.dayKeys).toEqual(["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27"]);
  });

  it("adds days across a month end and names the weekday of a key", () => {
    expect(addDaysToDateKey("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDaysToDateKey("2026-01-01", -1)).toBe("2025-12-31");
    expect(weekdayForDateKey("2026-09-24")).toBe("Thursday");
  });
});
