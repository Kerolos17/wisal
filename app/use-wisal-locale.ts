"use client";

import { useEffect, useState } from "react";

export type Locale = "ar" | "en";

// Date/time locale rule (D-Phase 6): Arabic language with Latin digits so
// dates read naturally (Arabic month names) while staying tabular and
// consistent with stats, tables, and countdown digits.
export const AR_DATE_LOCALE = "ar-EG-u-nu-latn";
export const EN_DATE_LOCALE = "en-GB";

export function dateLocale(locale: Locale): string {
  return locale === "ar" ? AR_DATE_LOCALE : EN_DATE_LOCALE;
}

const DEFAULT_LOCALE: Locale = "en";
// Version the preference so legacy Arabic-first sessions restart from the new English default.
const STORAGE_KEY = "wisal-locale-v3";

function isLocale(value: string | null): value is Locale {
  return value === "ar" || value === "en";
}

export function useWisalLocale(queryParameter?: string) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [preferenceReady, setPreferenceReady] = useState(false);

  useEffect(() => {
    const preferenceTimer = window.setTimeout(() => {
      const requested = queryParameter ? new URLSearchParams(window.location.search).get(queryParameter) : null;
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(requested)) setLocale(requested);
      else if (isLocale(saved)) setLocale(saved);
      setPreferenceReady(true);
    }, 0);
    return () => window.clearTimeout(preferenceTimer);
  }, [queryParameter]);

  useEffect(() => {
    if (!preferenceReady) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale, preferenceReady]);

  return [locale, setLocale] as const;
}
