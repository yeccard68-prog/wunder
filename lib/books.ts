// Book insights: the most useful ideas of influential non-fiction books as short learning units.
// Data: content/books.json (built and validated by scripts/content/build-books.mjs from a batch).
// All texts are original explanations – no excerpts, no covers. See docs/BACKEND.md, "Bücher".
import booksJson from "@/content/books.json";
import { fitsAge } from "@/lib/content";
import { reviewedStatus } from "@/lib/reviews";
import type { AgeBand, RecallRecord, UserState } from "@/lib/types";

export type Visual =
  | { type: "loop"; nodes: string[]; note?: string } // a cycle, e.g. cue → routine → reward
  | { type: "compare"; left: string[]; right: string[] } // [heading, ...points] on each side
  | { type: "scenario"; prompt: string; options: [string, string][]; insight: string } // decide first, then learn why
  | { type: "growth"; unit: string; perMonth: number; rate: number; label: string; hint: string }; // compound growth with a slider

export type IdeaFormat = "explain" | "challenge" | "apply" | "remember" | "compare" | "spot" | "model" | "examples";
/** The learning format of an idea; the German label is also the translation key. */
export const FORMAT_NAME: Record<IdeaFormat, string> = {
  explain: "Einfach erklärt", challenge: "Denk noch mal nach", apply: "Wende es an", remember: "Merk dir das",
  compare: "Zwei Sichtweisen", spot: "Finde den Denkfehler", model: "Denkmodell", examples: "Eine Idee, mehrere Beispiele",
};
/** How well an idea is supported – shown on every idea so a thesis is not mistaken for a fact. */
export const EVIDENCE_NAME = { evidence: "Gut belegt", thesis: "These des Autors", debated: "Umstritten" } as const;
export const EVIDENCE_HELP = {
  evidence: "Durch viele Untersuchungen gestützt oder rechnerisch nachvollziehbar.",
  thesis: "Ein Modell oder Rat aus dem Buch – einleuchtend, aber kein gesichertes Forschungsergebnis.",
  debated: "In der Forschung umstritten. Unter „Einordnung“ beim Buch steht, warum.",
} as const;

export interface Idea {
  id: string;
  format: IdeaFormat;
  evidence: keyof typeof EVIDENCE_NAME;
  hook: string; // the question that opens the lesson
  recall: { question: string; answer: string }; // answered from memory before the answer is shown
  transfer: { situation: string; options: [string, string][]; best: number } | null; // apply the idea to a new situation
  takeaway: string; // one sentence to keep
  title: string;
  text: string;
  example: string;
  visual: Visual | null;
}
interface BookTexts {
  goal: string;
  thesis: string;
  ideas: Omit<Idea, "id" | "format" | "evidence">[];
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
  links: BookLink[];
  quiz_question_id: string | null;
  sources: { name: string; url: string }[];
  license: string;
  verification_status: "unverified" | "ai_checked" | "verified";
  status: "draft" | "published" | "archived";
  created_at: string;
  translations: Record<string, BookTexts>;
}
export interface BookLink {
  kind: "question" | "animation" | "clip";
  id: string;
}
export interface Book {
  goal: string; // what the learner can do afterwards
  links: BookLink[]; // matching questions, animations and clips in the app
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
        goal: tr?.goal ?? b.goal, links: b.links, thesis: tr?.thesis ?? b.thesis, limits: tr?.limits ?? b.limits, reflect: tr?.reflect ?? b.reflect,
        ideas: b.ideas.map((idea, i) => ({ ...idea, ...(tr?.ideas[i] ?? {}), id: idea.id }) as Idea),
        related: b.related, quizId: b.quiz_question_id, sources: b.sources, verification: reviewedStatus("book", b),
      };
    })
    .filter((b) => fitsAge(b, band));
}

/**
 * Single ideas for the feed. Unread ones first; within those, the first idea of every book before
 * anyone's second – so the feed samples many books instead of finishing one. Books on the
 * learner's topics come first.
 */
export function insightQueue(books: Book[], state: Pick<UserState, "interests" | "books">, day = today()): Insight[] {
  const read = new Set(state.books?.read ?? []);
  const due = new Set(dueIdeas(state, day));
  const all = books.flatMap((book) => book.ideas.map((idea, i) => ({ book, idea, i })));
  // ideas due for repetition come first, then new ones, then those already learned
  const rank = (x: (typeof all)[number]) => (due.has(x.idea.id) ? -1000 : read.has(x.idea.id) ? 1000 : 0) + x.i * 10 + (state.interests.includes(x.book.topicId) ? 0 : 5);
  return all.sort((a, b) => rank(a) - rank(b)).map(({ book, idea }) => ({ book, idea }));
}

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (day: string, n: number) => new Date(Date.parse(day + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);

/** Days until the next repetition after 1, 2, 3 … successful recalls in a row. */
export const RECALL_INTERVALS = [2, 7, 21, 60];

/**
 * The learner recalled an idea from memory and says whether they knew it. Known: the gap to the
 * next repetition grows. Not known: back to the start, again tomorrow.
 */
export function rateRecall(record: RecallRecord | undefined, known: boolean, day = today()): RecallRecord {
  const level = known ? Math.min((record?.level ?? 0) + 1, RECALL_INTERVALS.length) : 0;
  return { level, due: addDays(day, known ? RECALL_INTERVALS[level - 1] : 1), tries: (record?.tries ?? 0) + 1, known: (record?.known ?? 0) + (known ? 1 : 0) };
}

/** Ideas whose repetition is due (oldest first). */
export function dueIdeas(state: Pick<UserState, "books">, day = today()): string[] {
  return Object.entries(state.books?.recall ?? {}).filter(([, r]) => r.due <= day).sort((a, b) => a[1].due.localeCompare(b[1].due)).map(([id]) => id);
}

/**
 * What the recall records say about learning – not about time spent:
 *  recalled = ideas recalled at least once · retained = known again after a gap of two days or more ·
 *  shaky = last attempt not known.
 */
export function recallStats(state: Pick<UserState, "books">, day = today()) {
  const records = Object.values(state.books?.recall ?? {});
  return { recalled: records.length, retained: records.filter((r) => r.level >= 2).length, shaky: records.filter((r) => r.level === 0).length, due: records.filter((r) => r.due <= day).length };
}

type BookState = UserState["books"];
/**
 * Joins the book state of two devices: nothing learned or saved is lost. For an idea recalled on
 * both, the record with more attempts wins (the later one, since attempts only grow).
 */
export function mergeBookState(a: BookState | null | undefined, b: BookState | null | undefined): BookState {
  const union = (x: string[] = [], y: string[] = []) => [...new Set([...x, ...y])];
  const recall = { ...(a?.recall ?? {}) };
  for (const [id, r] of Object.entries(b?.recall ?? {})) if (!recall[id] || r.tries > recall[id].tries) recall[id] = r;
  return { read: union(a?.read, b?.read), saved: union(a?.saved, b?.saved), recall };
}

export const bookProgress = (book: Book, state: Pick<UserState, "books">) => book.ideas.filter((i) => state.books?.read.includes(i.id)).length;
