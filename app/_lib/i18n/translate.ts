import type { Category } from "@/components/ui/EventCard";
import type { OrganizerType } from "@/components/ui/OrgLogo";
import { en, type MessageKey } from "./en";
import { nl } from "./nl";
import type { Locale } from "./locale";

const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, nl };

type Params = Record<string, string | number>;

/** The base of every `_one` / `_other` pair, e.g. "events" for "events_one" + "events_other". */
export type PluralKey = { [K in MessageKey]: K extends `${infer Base}_other` ? Base : never }[MessageKey];

export interface Translate {
  (key: MessageKey, params?: Params): string;
  /** picks `${key}_one` for 1 and `${key}_other` otherwise, with `{count}` filled in */
  n: (key: PluralKey, count: number, params?: Params) => string;
  category: (category: Category) => string;
  orgType: (type: OrganizerType) => string;
  /** "nl" → "Dutch"; anything the AI reports that isn't a known code passes through as written */
  language: (code: string) => string;
  locale: Locale;
}

function fill(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

const KNOWN_LANGUAGES: Record<string, MessageKey> = {
  nl: "lang.nl",
  dutch: "lang.nl",
  nederlands: "lang.nl",
  en: "lang.en",
  english: "lang.en",
  de: "lang.de",
  german: "lang.de",
  fr: "lang.fr",
  french: "lang.fr",
};

/** A translator for one locale; usable on the server and the client (the hook `useT` wraps it). */
export function createT(locale: Locale): Translate {
  const messages = MESSAGES[locale];
  const t = ((key: MessageKey, params?: Params) => fill(messages[key] ?? en[key] ?? key, params)) as Translate;
  t.n = (key, count, params) => t(`${key}_${count === 1 ? "one" : "other"}` as MessageKey, { count, ...params });
  t.category = (category) => t(`category.${category}` as MessageKey);
  t.orgType = (type) => t(`orgType.${type}` as MessageKey);
  t.language = (code) => {
    const key = KNOWN_LANGUAGES[code.trim().toLowerCase()];
    return key ? t(key) : code;
  };
  t.locale = locale;
  return t;
}
