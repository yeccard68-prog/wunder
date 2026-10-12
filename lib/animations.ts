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
  renderer: "svg-scene" | "three"; // drawn as 2D SVG (components/anim/scenes.tsx) or as a 3D scene (components/three/scenes)
  scene: string; // key in SCENES or SCENES_3D
  fallback_scene?: string | null; // SVG scene shown where 3D is not available
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
  renderer: AnimationRow["renderer"];
  fallback: string | null;
  title: string;
  summary: string;
  goal: string;
  labels: string[];
  steps: { text: string; seconds: number }[]; // seconds: paced duration actually played
  seconds: number;
  sources: { name: string; url: string }[];
  quizId: string | null;
  verification: AnimationRow["verification_status"];
}

export const animationRows = animationsJson as unknown as AnimationRow[];

/**
 * One place for the pacing of all animations (presentation speed, not physics):
 *  - pace: factor on the authored step durations. 0.7 = the whole library runs 30 % faster than first written.
 *  - minStep: no step is shorter than this, so its caption can at least be taken in (seconds).
 *  - motion: factor on the running time that drives ongoing movement (flowing dots, spinning helix, orbits).
 *  - camera / appear: how long a camera move or an object fading in takes inside a 3D scene (seconds).
 * Scenes never state real-world durations; where a process is sped up or exaggerated the caption says so.
 */
export const TIMING = { pace: 0.7, minStep: 3.6, motion: 1.35, camera: 0.8, appear: 0.5 };
const paced = (seconds: number | undefined) => Math.round(Math.max(TIMING.minStep, (seconds ?? 6) * TIMING.pace) * 10) / 10;

/** Published animations for one learner: right language (fallback: original), right age level. */
export function animationsFor(locale: string, band: AgeBand | null): Animation[] {
  return animationRows
    .filter((a) => a.status === "published" && a.verification_status !== "unverified")
    .map((a) => {
      const tr = a.translations[locale];
      const steps = a.steps.map((s, i) => ({ seconds: paced(s.seconds), text: tr?.steps[i] ?? s.text }));
      return {
        id: a.id, categoryId: a.category_id, minAge: a.min_age, difficulty: a.difficulty, scene: a.scene, renderer: a.renderer, fallback: a.fallback_scene ?? null,
        title: tr?.title ?? a.title, summary: tr?.summary ?? a.summary, goal: tr?.goal ?? a.goal, labels: tr?.labels ?? a.labels,
        steps, seconds: Math.round(steps.reduce((n, s) => n + s.seconds, 0)), sources: a.sources, quizId: a.quiz_question_id, verification: a.verification_status,
      };
    })
    .filter((a) => fitsAge(a, band));
}
