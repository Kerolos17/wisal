"use client";

import { useLocaleContext } from "./locale-provider";

export type Locale = "ar" | "en";

// Date/time locale rule (D-Phase 6): Arabic language with Latin digits so
// dates read naturally (Arabic month names) while staying tabular and
// consistent with stats, tables, and countdown digits.
export const AR_DATE_LOCALE = "ar-EG-u-nu-latn";
export const EN_DATE_LOCALE = "en-GB";

export function dateLocale(locale: Locale): string {
  return locale === "ar" ? AR_DATE_LOCALE : EN_DATE_LOCALE;
}

export function useWisalLocale() {
  const context = useLocaleContext();
  if (!context) {
    throw new Error("useWisalLocale must be used inside <LocaleProvider> (server-rendered locale).");
  }
  return [context.locale, context.setLocale] as const;
}
