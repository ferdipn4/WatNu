"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "./locale";
import { createT, type Translate } from "./translate";

type LocaleContextValue = { locale: Locale; setLocale: (next: Locale) => void };

const LocaleContext = createContext<LocaleContextValue | null>(null);

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Wraps the app in app/layout.tsx with the locale the server read from the cookie. */
export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
      document.documentElement.lang = next;
      // Server-rendered strings (a not-found page, say) follow on the next render.
      router.refresh();
    },
    [router],
  );

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside <LocaleProvider>.");
  return context;
}

/** The translator for the current UI language: `t("key")`, `t.n("events", 3)`, `t.category(...)`. */
export function useT(): Translate {
  const { locale } = useLocale();
  return useMemo(() => createT(locale), [locale]);
}
