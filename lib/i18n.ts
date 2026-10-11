// Interface languages. German is the source language: the German text itself is the key,
// every other language is a dictionary in lib/locales/<locale>.json (German → translation).
// A missing entry falls back to German, so a new language can be added step by step:
//   1. copy lib/locales/en.json to lib/locales/<locale>.json and translate the values
//   2. register it in LOCALES and DICTIONARIES below
//   3. add content translations for that locale (content/*.json → translations)
import en from "./locales/en.json";

export const LOCALES = [
  { id: "de", name: "Deutsch" },
  { id: "en", name: "English" },
] as const;

const DICTIONARIES: Record<string, Record<string, string>> = { en };

/** Device language if supported, otherwise English (German devices get German). */
export function detectLocale(): string {
  if (typeof navigator === "undefined") return "de";
  const lang = navigator.language.slice(0, 2).toLowerCase();
  return LOCALES.some((l) => l.id === lang) ? lang : "en";
}

/** translate("de", "Noch {n} bis zum Tagesziel", { n: 3 }) */
export function translate(locale: string, key: string, vars?: Record<string, string | number>): string {
  const text = DICTIONARIES[locale]?.[key] ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? "")) : text;
}

/** Locale for dates and numbers. */
export const formatLocale = (locale: string) => (locale === "de" ? "de-DE" : "en-GB");
