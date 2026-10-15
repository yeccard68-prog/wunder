// Book links to a shop – only once the operator has their own partner account. The partner tag is
// public by nature (it is part of every link), so a NEXT_PUBLIC variable is fine. Without a tag the app
// shows no shop link at all. The app loads nothing from the shop: no images, prices, scripts or
// trackers – the shop only sees a visit when someone taps the link.
import type { AgeBand } from "./types";

const TAG = process.env.NEXT_PUBLIC_AMAZON_PARTNER_TAG?.trim() ?? "";
const DOMAIN = process.env.NEXT_PUBLIC_AMAZON_DOMAIN?.trim() || "amazon.de";

/** A search for the book in the shop's book department, with the partner tag. No ISBNs are guessed. */
export function shopUrl(book: { title: string; author: string }, tag: string, domain = "amazon.de"): string | null {
  if (!/^[\w-]{3,40}$/.test(tag) || !/^amazon\.[a-z.]{2,6}$/.test(domain)) return null;
  const query = `${book.title} ${book.author}`;
  return `https://www.${domain}/s?k=${encodeURIComponent(query)}&i=stripbooks&tag=${encodeURIComponent(tag)}`;
}

/** Advertising is shown to adults only (the app is 16+; this also holds if younger age levels open later). */
export const showsAffiliate = (band: AgeBand | null) => !!shopUrl({ title: "x", author: "x" }, TAG, DOMAIN) && (band === null || band === "16+");

export const bookShopUrl = (book: { title: string; author: string }) => shopUrl(book, TAG, DOMAIN);
