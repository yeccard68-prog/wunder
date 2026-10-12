"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Bookmark, Check } from "lucide-react";
import BookVisual from "@/components/books/Visual";
import type { Book, Idea } from "@/lib/books";
import { categoryById } from "@/lib/categories";
import { useStore, useT } from "@/lib/store";

/** Marks ideas as learned and keeps the learner's saved ideas (stored with the profile on this device). */
export function useBookState() {
  const { state, update } = useStore();
  const books = state.books ?? { read: [], saved: [] };
  const flip = (list: "read" | "saved", id: string) => update({ books: { ...books, [list]: books[list].includes(id) ? books[list].filter((x) => x !== id) : [...books[list], id] } });
  return { read: books.read, saved: books.saved, toggleRead: (id: string) => flip("read", id), toggleSaved: (id: string) => flip("saved", id) };
}

/** Our own cover: typography on the topic colour. No publisher artwork is used anywhere. */
export function BookCover({ book, size = "md" }: { book: Book; size?: "sm" | "md" | "lg" }) {
  const color = categoryById(book.topicId).color;
  const dims = size === "lg" ? "h-44 w-32 p-3.5" : size === "md" ? "h-28 w-20 p-2.5" : "h-11 w-8 p-1";
  return (
    <span aria-hidden className={`relative flex shrink-0 flex-col justify-between overflow-hidden rounded-lg text-white shadow-md ${dims}`} style={{ background: color }}>
      <span className="absolute inset-y-0 left-0 w-1.5 bg-black/20" />
      {size !== "sm" && (
        <>
          <span className={`font-display font-semibold leading-[1.1] ${size === "lg" ? "text-[17px]" : "text-[11px]"}`}>{book.title}</span>
          <span className={`font-semibold uppercase tracking-wide opacity-80 ${size === "lg" ? "text-[10px]" : "text-[7px]"}`}>{book.author.split(/[,(]/)[0]}</span>
        </>
      )}
    </span>
  );
}

/**
 * One idea from a book: explanation, example and – where it helps – an interactive illustration.
 * `standalone` (feed, search, saved): shows which book it comes from and links there.
 */
export default function InsightCard({ book, idea, standalone, index }: { book: Book; idea: Idea; standalone?: boolean; index?: number }) {
  const t = useT();
  const { read, saved, toggleRead, toggleSaved } = useBookState();
  const color = categoryById(book.topicId).color;
  const done = read.includes(idea.id);
  const isSaved = saved.includes(idea.id);
  return (
    <article className="card overflow-hidden" data-testid="insight-card">
      <div className="space-y-3 p-5">
        {standalone ? (
          <Link href={`/books/?b=${book.id}`} className="press flex items-center gap-3">
            <BookCover book={book} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color }}>
                <BookOpen size={14} /> {t("Buch-Idee")}
              </span>
              <span className="block truncate text-xs text-muted">{book.author.split(/[,(]/)[0]} · {book.title}</span>
            </span>
          </Link>
        ) : (
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{t("Idee {n}", { n: (index ?? 0) + 1 })}</p>
        )}
        <h2 className="font-display text-xl font-semibold leading-snug">{idea.title}</h2>
        <p className="text-[15px] leading-relaxed">{idea.text}</p>
        {idea.visual && <BookVisual visual={idea.visual} color={color} />}
        <p className="rounded-2xl border border-line px-4 py-3 text-sm leading-relaxed">
          <span className="mb-0.5 block text-xs font-bold uppercase tracking-wider text-muted">{t("Beispiel")}</span>
          {idea.example}
        </p>
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-3">
        <button onClick={() => toggleRead(idea.id)} aria-pressed={done} className={`press flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${done ? "bg-raised text-good" : "bg-ink text-bg"}`}>
          <Check size={16} /> {done ? t("Gelernt") : t("Verstanden")}
        </button>
        <button onClick={() => toggleSaved(idea.id)} aria-label={isSaved ? t("Nicht mehr merken") : t("Merken")} aria-pressed={isSaved} className="press flex h-10 w-10 items-center justify-center rounded-full text-muted">
          <Bookmark size={19} fill={isSaved ? "currentColor" : "none"} />
        </button>
        <span className="flex-1" />
        {standalone && (
          <Link href={`/books/?b=${book.id}`} className="press flex items-center gap-1 text-sm font-semibold text-muted">
            {t("Zum Buch")} <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </article>
  );
}
