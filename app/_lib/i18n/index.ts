// Client-side entry point. Server Components import from "./server" (cookie) and "./translate" instead.
export { LocaleProvider, useLocale, useT } from "./provider";
export { createT, type Translate } from "./translate";
export { LOCALES, type Locale } from "./locale";
export { capitalize, dateNames, dayOnlyFromParts, localizeEnglishWeekday, shortDateFromParts } from "./dates";
