import { describe, expect, it } from "vitest";
import { dayHeaderLabel, factClockText, isPastDay } from "@/app/e/_lib/format";

// tests/setup.ts pins the zone to Europe/Amsterdam, so these local-time helpers read as on a phone in the city.
const start = new Date("2026-09-24T17:00:00.000Z"); // Thu 24 Sep, 19:00
const end = new Date("2026-09-24T19:00:00.000Z");

describe("factClockText (the detail's clock row)", () => {
  it("says Tonight on the day from 17:00, Today before, Tomorrow the day before", () => {
    expect(factClockText(start, end, "en", new Date("2026-09-24T10:00:00.000Z"))).toBe("Tonight, Thu 24 Sep · 19:00–21:00");
    const morning = new Date("2026-09-24T07:00:00.000Z"); // 09:00 event
    expect(factClockText(morning, null, "en", new Date("2026-09-24T06:00:00.000Z"))).toBe("Today, Thu 24 Sep · 09:00");
    expect(factClockText(start, null, "en", new Date("2026-09-23T10:00:00.000Z"))).toBe("Tomorrow, Thu 24 Sep · 19:00");
  });

  it("drops the prefix further out, and speaks Dutch", () => {
    expect(factClockText(start, end, "en", new Date("2026-09-20T10:00:00.000Z"))).toBe("Thu 24 Sep · 19:00–21:00");
    expect(factClockText(start, null, "nl", new Date("2026-09-24T10:00:00.000Z"))).toMatch(/^Vanavond, do 24 sep · 19:00$/i);
  });
});

describe("day headers and past days", () => {
  it("names today, tomorrow, then the weekday", () => {
    const now = new Date("2026-09-24T10:00:00.000Z");
    expect(dayHeaderLabel(start, "en", now)).toEqual({ name: "Today", date: "Thu 24 Sep" });
    expect(dayHeaderLabel(new Date("2026-09-25T17:00:00.000Z"), "en", now)).toEqual({ name: "Tomorrow", date: "Fri 25 Sep" });
    expect(dayHeaderLabel(new Date("2026-09-27T08:00:00.000Z"), "en", now)).toEqual({ name: "Sunday", date: "27 Sep" });
  });

  it("treats an event as past only once its day is over", () => {
    expect(isPastDay(start, new Date("2026-09-24T21:30:00.000Z"))).toBe(false); // 23:30 the same evening
    expect(isPastDay(start, new Date("2026-09-24T22:30:00.000Z"))).toBe(true); // 00:30 the next day
  });
});
