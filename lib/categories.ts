import type { Category } from "./types";

// Data-driven: add a row here (and in the Supabase `categories` table) to launch a new topic.
// Seven broad topics keep onboarding and progress views readable.
// economy = how markets and money work; business = how companies work.
export const CATEGORIES: Category[] = [
  { id: "science", name: "Wissenschaft", color: "var(--science)" },
  { id: "technology", name: "Technologie & KI", color: "var(--tech)" },
  { id: "history", name: "Geschichte", color: "var(--history)" },
  { id: "earth", name: "Erde & Natur", color: "var(--earth)" },
  { id: "economy", name: "Wirtschaft & Geld", color: "var(--economy)" },
  { id: "business", name: "Business", color: "var(--business)" },
  { id: "culture", name: "Kultur & Gesellschaft", color: "var(--culture)" },
];

export const categoryById = (id: string): Category => CATEGORIES.find((c) => c.id === id) ?? { id, name: id, color: "var(--muted)" };
