import type { Locale } from "./locale";

/**
 * Date words per language. English follows design/README.md ("Thu 24 Sep", day headers Today /
 * Tomorrow / Wednesday); Dutch keeps its lowercase names ("do 24 sep", "donderdag"). Index 0 is
 * Sunday, as in `Date#getDay`.
 */
const NAMES: Record<
  Locale,
  {
    weekdayShort: string[];
    weekdayLong: string[];
    /** two letters for the calendar's column heads */
    weekdayMin: string[];
    monthShort: string[];
    monthLong: string[];
    today: string;
    tomorrow: string;
    tonight: string;
  }
> = {
  en: {
    weekdayShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    weekdayLong: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    weekdayMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    monthShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    monthLong: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    today: "Today",
    tomorrow: "Tomorrow",
    tonight: "Tonight",
  },
  nl: {
    weekdayShort: ["zo", "ma", "di", "wo", "do", "vr", "za"],
    weekdayLong: ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"],
    weekdayMin: ["zo", "ma", "di", "wo", "do", "vr", "za"],
    monthShort: ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
    monthLong: ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
    today: "Vandaag",
    tomorrow: "Morgen",
    tonight: "Vanavond",
  },
};

export function dateNames(locale: Locale) {
  return NAMES[locale];
}

/** "Thu 24 Sep" from its parts (weekday 0 = Sunday, month 0 = January). */
export function shortDateFromParts(locale: Locale, weekday: number, day: number, month: number): string {
  const names = NAMES[locale];
  return `${names.weekdayShort[weekday]} ${day} ${names.monthShort[month]}`;
}

/** "24 Sep" — beside a day header that already names the weekday. */
export function dayOnlyFromParts(locale: Locale, day: number, month: number): string {
  return `${day} ${NAMES[locale].monthShort[month]}`;
}

/**
 * The backend names days in English ("Wednesday", from lib/datetime's `Weekday`); this turns one
 * into the locale's long name for display. Unknown input passes through.
 */
export function localizeEnglishWeekday(englishName: string, locale: Locale): string {
  const index = NAMES.en.weekdayLong.indexOf(englishName);
  return index === -1 ? englishName : NAMES[locale].weekdayLong[index];
}

/** Sentence-start capital for the lowercase Dutch day names ("woensdag is rustiger" → "Woensdag …"). */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
