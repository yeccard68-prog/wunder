import type { Category } from "./types";

// Data-driven: add a row here (and in the Supabase `categories` table) to launch a new topic.
// Six broad topics keep onboarding and progress views readable.
export const CATEGORIES: Category[] = [
  { id: "science", name: "Wissenschaft", color: "var(--science)" },
  { id: "technology", name: "Technologie & KI", color: "var(--tech)" },
  { id: "history", name: "Geschichte", color: "var(--history)" },
  { id: "earth", name: "Erde & Natur", color: "var(--earth)" },
  { id: "economy", name: "Wirtschaft & Geld", color: "var(--economy)" },
  { id: "culture", name: "Kultur & Gesellschaft", color: "var(--culture)" },
];

export const categoryById = (id: string): Category => CATEGORIES.find((c) => c.id === id) ?? { id, name: id, color: "var(--muted)" };
