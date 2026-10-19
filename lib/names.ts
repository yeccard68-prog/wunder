// Display names are seen by others (duels), so offensive ones are filtered – here for a hint while typing,
// and the same list in the database (migration 20261024110000_name_filter.sql), which replaces such a name.
// Kept short and specific on purpose: a long list blocks harmless names ("Dickens"); reports catch the rest.

/** Found anywhere in the name (long enough not to hit harmless words). */
export const BLOCK_ANYWHERE = [
  "arschloch", "fotze", "wichser", "hurensohn", "schlampe", "missgeburt", "schwuchtel", "kanake", "judensau",
  "nigger", "nigga", "neger", "zigeuner", "hitler", "heilhitler", "siegheil",
  "fuck", "bitch", "cunt", "whore", "faggot", "retard", "motherf",
];
/** Only as a whole word (short words that are parts of harmless names otherwise). */
export const BLOCK_WORD = ["arsch", "fick", "ficken", "nutte", "hure", "spast", "spasti", "shit", "dick", "cock", "slut", "rape", "porn", "porno", "sex", "nazi", "nazis"];

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s", "€": "e" };

/** Lower case, look-alike digits as letters, umlauts kept; words split on everything else. */
export function nameWords(name: string): { joined: string; words: string[] } {
  const plain = name.toLowerCase().replace(/[0-9@$€]/g, (c) => LEET[c] ?? c).normalize("NFC");
  const words = plain.split(/[^a-zäöüß]+/).filter(Boolean);
  return { joined: words.join(""), words };
}

export function nameAllowed(name: string): boolean {
  const { joined, words } = nameWords(name);
  return !BLOCK_ANYWHERE.some((w) => joined.includes(w)) && !words.some((w) => BLOCK_WORD.includes(w));
}
