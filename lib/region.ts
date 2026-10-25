// The learner's country, for a feed that prefers cards about it. Read from the device's language settings only
// (e.g. "de-AT" → "AT"); never asked for, never stored, never sent anywhere.
const FALLBACK: Record<string, string> = { de: "DE" }; // a bare language without region – its most likely country

export function regionFrom(languages: readonly string[]): string | null {
  for (const l of languages) {
    const region = l.split("-")[1];
    if (region && /^[A-Za-z]{2}$/.test(region)) return region.toUpperCase();
  }
  return FALLBACK[languages[0]?.split("-")[0] ?? ""] ?? null;
}

export const deviceRegion = () => (typeof navigator === "undefined" ? null : regionFrom(navigator.languages?.length ? navigator.languages : [navigator.language]));
