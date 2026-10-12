// Book insights: the most useful ideas of influential non-fiction books as short learning units.
// Data: content/books.json (built and validated by scripts/content/build-books.mjs from a batch).
// All texts are original explanations – no excerpts, no covers. See docs/BACKEND.md, "Bücher".
import booksJson from "@/content/books.json";
import { fitsAge } from "@/lib/content";
import type { AgeBand, UserState } from "@/lib/types";

export type Visual =
  | { type: "loop"; nodes: string[]; note?: string } // a cycle, e.g. cue → routine → reward
  | { type: "compare"; left: string[]; right: string[] } // [heading, ...points] on each side
  | { type: "scenario"; prompt: string; options: [string, string][]; insight: string } // decide first, then learn why
  | { type: "growth"; unit: string; perMonth: number; rate: number; label: string; hint: string }; // compound growth with a slider

export interface Idea {
  id: string;
  title: string;
  text: string;
  example: string;
  visual: Visual | null;
}
interface BookTexts {
  thesis: string;
  ideas: Omit<Idea, "id">[];
  limits: string;
  reflect: string;
  year_label: string | null;
}
export interface BookRow extends Omit<BookTexts, "ideas"> {
  id: string;
  category: string;
  topic_id: string; // app topic – decides the colour
  title: string; // original title
  title_de: string;
  author: string;
  year: number;
  min_age: number;
  language: string;
  minutes: number;
  ideas: Idea[];
  related: string[];
  quiz_question_id: string | null;
  sources: { name: string; url: string }[];
  license: string;
  verification_status: "unverified" | "ai_checked" | "verified";
  status: "draft" | "published" | "archived";
  created_at: string;
  translations: Record<string, BookTexts>;
}
export interface Book {
  id: string;
  category: string;
  topicId: string;
  title: string;
  original: string | null; // original title where the shown one is a translation
  author: string;
  year: string;
  minAge: number;
  minutes: number;
  thesis: string;
  ideas: Idea[];
  limits: string;
  reflect: string;
  related: string[];
  quizId: string | null;
  sources: { name: string; url: string }[];
  verification: BookRow["verification_status"];
}
export interface Insight {
  book: Book;
  idea: Idea;
}

export const bookRows = booksJson as unknown as BookRow[];

/** Shelf sections. The German name is also the translation key. */
export const BOOK_CATEGORIES = [
  { id: "thinking", name: "Denken & Entscheiden" },
  { id: "psychology", name: "Psychologie" },
  { id: "habits", name: "Gewohnheiten & Fokus" },
  { id: "learning", name: "Lernen" },
  { id: "business", name: "Business & Strategie" },
  { id: "money", name: "Geld" },
  { id: "science", name: "Naturwissenschaft" },
  { id: "history", name: "Geschichte & Gesellschaft" },
  { id: "philosophy", name: "Philosophie" },
  { id: "communication", name: "Kommunikation" },
];

/** Published books for one learner: right language (fallback: German), right age level. */
export function booksFor(locale: string, band: AgeBand | null): Book[] {
  return bookRows
    .filter((b) => b.status === "published" && b.verification_status !== "unverified")
    .map((b) => {
      const tr = b.translations[locale];
      const german = locale === "de";
      return {
        id: b.id, category: b.category, topicId: b.topic_id,
        title: german ? b.title_de : b.title, original: german && b.title_de !== b.title ? b.title : null,
        author: b.author, year: (tr ? tr.year_label : b.year_label) ?? String(b.year), minAge: b.min_age, minutes: b.minutes,
        thesis: tr?.thesis ?? b.thesis, limits: tr?.limits ?? b.limits, reflect: tr?.reflect ?? b.reflect,
        ideas: b.ideas.map((idea, i) => ({ ...idea, ...(tr?.ideas[i] ?? {}), id: idea.id })),
        related: b.related, quizId: b.quiz_question_id, sources: b.sources, verification: b.verification_status,
      };
    })
    .filter((b) => fitsAge(b, band));
}

/**
 * Single ideas for the feed. Unread ones first; within those, the first idea of every book before
 * anyone's second – so the feed samples many books instead of finishing one. Books on the
 * learner's topics come first.
 */
export function insightQueue(books: Book[], state: Pick<UserState, "interests" | "books">): Insight[] {
  const read = new Set(state.books?.read ?? []);
  const all = books.flatMap((book) => book.ideas.map((idea, i) => ({ book, idea, i })));
  const rank = (x: (typeof all)[number]) => (read.has(x.idea.id) ? 1000 : 0) + x.i * 10 + (state.interests.includes(x.book.topicId) ? 0 : 5);
  return all.sort((a, b) => rank(a) - rank(b)).map(({ book, idea }) => ({ book, idea }));
}

export const bookProgress = (book: Book, state: Pick<UserState, "books">) => book.ideas.filter((i) => state.books?.read.includes(i.id)).length;
