import type { Category } from "./types";

// Data-driven: add a row here (and in the Supabase `categories` table) to launch a new topic.
// Fourteen broad topics (space, animals, music and art since 05.11.2026) keep onboarding and progress views readable.
// economy = how markets and money work; business = how companies work.
export const CATEGORIES: Category[] = [
  { id: "science", name: "Wissenschaft", color: "var(--science)" },
  { id: "technology", name: "Technologie & KI", color: "var(--tech)" },
  { id: "history", name: "Geschichte", color: "var(--history)" },
  { id: "earth", name: "Erde & Natur", color: "var(--earth)" },
  { id: "economy", name: "Wirtschaft & Geld", color: "var(--economy)" },
  { id: "business", name: "Business", color: "var(--business)" },
  { id: "culture", name: "Kultur & Gesellschaft", color: "var(--culture)" },
  { id: "math", name: "Mathe & Logik", color: "var(--math)" },
  { id: "language", name: "Sprache", color: "var(--language)" },
  { id: "sport", name: "Sport", color: "var(--sport)" },
  { id: "space", name: "Weltraum", color: "var(--space)" },
  { id: "animals", name: "Tiere", color: "var(--animals)" },
  { id: "music", name: "Musik", color: "var(--music)" },
  { id: "art", name: "Kunst", color: "var(--art)" },
];

export const categoryById = (id: string): Category => CATEGORIES.find((c) => c.id === id) ?? { id, name: id, color: "var(--muted)" };

// Space, animals, music and art became topics of their own on 05.11.2026; until then their cards belonged to science,
// earth and culture. Whoever likes one of those keeps getting the cards that moved out of it – nothing stored changes.
export const SUBTOPICS: Record<string, string[]> = { science: ["space"], earth: ["animals"], culture: ["music", "art"] };
export const withSubtopics = (interests: string[]): string[] => [...new Set(interests.flatMap((c) => [c, ...(SUBTOPICS[c] ?? [])]))];
