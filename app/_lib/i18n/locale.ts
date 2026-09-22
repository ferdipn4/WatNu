/** The UI languages. English is the product's language (design/README.md); Dutch is a per-phone choice on the profile page. */
export const LOCALES = ["en", "nl"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** The cookie that carries the choice, so the server renders the right language straight away (no flash). */
export const LOCALE_COOKIE = "watnu-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
