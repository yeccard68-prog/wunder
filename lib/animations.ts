// Explainer animations: short, step-by-step visual explanations drawn by the app itself.
// The texts and metadata live in content/animations.json, the drawings in components/anim/scenes.tsx.
import animationsJson from "@/content/animations.json";
import { fitsAge } from "@/lib/content";
import type { AgeBand } from "@/lib/types";

interface Texts {
  title: string;
  summary: string; // one sentence for the overview
  goal: string; // what the learner can explain afterwards
  labels: string[]; // words inside the drawing, in the order the scene expects
  steps: string[];
}
export interface AnimationRow extends Omit<Texts, "steps"> {
  id: string;
  category_id: string;
  min_age: number;
  difficulty: 1 | 2 | 3;
  language: string;
  renderer: "svg-scene"; // how it is drawn; further renderers (video, lottie) can be added here
  scene: string; // key in SCENES
  steps: { text: string; seconds?: number }[];
  sources: { name: string; url: string }[];
  quiz_question_id: string | null;
  verification_status: "unverified" | "ai_checked" | "verified";
  status: "draft" | "published" | "archived";
  created_at: string;
  translations: Record<string, Texts>;
}
export interface Animation {
  id: string;
  categoryId: string;
  minAge: number;
  difficulty: number;
  scene: string;
  title: string;
  summary: string;
  goal: string;
  labels: string[];
  steps: { text: string; seconds?: number }[];
  seconds: number;
  sources: { name: string; url: string }[];
  quizId: string | null;
  verification: AnimationRow["verification_status"];
}

export const animationRows = animationsJson as unknown as AnimationRow[];

/** Published animations for one learner: right language (fallback: original), right age level. */
export function animationsFor(locale: string, band: AgeBand | null): Animation[] {
  return animationRows
    .filter((a) => a.status === "published" && a.verification_status !== "unverified")
    .map((a) => {
      const tr = a.translations[locale];
      const steps = a.steps.map((s, i) => ({ ...s, text: tr?.steps[i] ?? s.text }));
      return {
        id: a.id, categoryId: a.category_id, minAge: a.min_age, difficulty: a.difficulty, scene: a.scene,
        title: tr?.title ?? a.title, summary: tr?.summary ?? a.summary, goal: tr?.goal ?? a.goal, labels: tr?.labels ?? a.labels,
        steps, seconds: steps.reduce((n, s) => n + (s.seconds ?? 6), 0), sources: a.sources, quizId: a.quiz_question_id, verification: a.verification_status,
      };
    })
    .filter((a) => fitsAge(a, band));
}
