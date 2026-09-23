import { describe, expect, it } from "vitest";
import { en, type MessageKey } from "@/app/_lib/i18n/en";
import { nl } from "@/app/_lib/i18n/nl";
import { createT } from "@/app/_lib/i18n/translate";

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

describe("the two dictionaries", () => {
  it("carry the same placeholders per key, so a Dutch string never loses a {name}", () => {
    for (const key of Object.keys(en) as MessageKey[]) {
      expect(placeholders(nl[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it("pair every _one with an _other", () => {
    for (const key of Object.keys(en)) {
      if (key.endsWith("_one")) expect(en, key).toHaveProperty(key.replace(/_one$/, "_other"));
      if (key.endsWith("_other")) expect(en, key).toHaveProperty(key.replace(/_other$/, "_one"));
    }
  });

  it("have no empty strings", () => {
    for (const key of Object.keys(en) as MessageKey[]) {
      expect(en[key].trim(), key).not.toBe("");
      expect(nl[key].trim(), key).not.toBe("");
    }
  });
});

describe("createT", () => {
  it("fills placeholders and picks the plural form", () => {
    const t = createT("en");
    expect(t.n("events", 1)).toBe("1 event");
    expect(t.n("events", 3)).toBe("3 events");
    expect(t("event.cancelled.title", { date: "Thu 1 Oct" })).toBe("Cancelled on Thu 1 Oct");
    expect(createT("nl")("event.repeats.until", { date: "1 okt" })).toBe("Tot en met 1 okt");
  });

  it("names languages the AI reports, and passes unknown ones through", () => {
    const t = createT("en");
    expect(t.language("Dutch")).toBe(t("lang.nl"));
    expect(t.language("Klingon")).toBe("Klingon");
  });
});
