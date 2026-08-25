"use client";

import { useEffect, useState } from "react";

export type Locale = "ar" | "en";

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
