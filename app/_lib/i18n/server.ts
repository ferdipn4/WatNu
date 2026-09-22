import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./locale";
import { createT, type Translate } from "./translate";

/** The UI language for this request (Server Components only). Reading the cookie makes the route dynamic, which every page here already is. */
export async function getServerLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getServerT(): Promise<Translate> {
  return createT(await getServerLocale());
}
