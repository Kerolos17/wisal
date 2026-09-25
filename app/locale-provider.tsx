"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Locale = "ar" | "en";

const STORAGE_KEY = "wisal-locale-v3";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function isLocale(value: string | null | undefined): value is Locale {
  return value === "ar" || value === "en";
}

function persist(locale: Locale) {
  window.localStorage.setItem(STORAGE_KEY, locale);
  document.cookie = `wisal-locale=${locale}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`;
}

const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void } | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Deep links (?lang=) override once and persist through the cookie so the
    // next server render matches without a direction flash.
    const requested = new URLSearchParams(window.location.search).get("lang");
    if (isLocale(requested) && requested !== locale) {
      setLocaleState(requested);
      persist(requested);
      document.documentElement.lang = requested;
      document.documentElement.dir = requested === "ar" ? "rtl" : "ltr";
    } else {
      persist(locale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({
    locale,
    setLocale: (next: Locale) => {
      setLocaleState(next);
      persist(next);
      document.documentElement.lang = next;
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    },
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocaleContext() {
  return useContext(LocaleContext);
}
