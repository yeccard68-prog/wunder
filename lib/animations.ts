// Explainer animations: short, step-by-step visual explanations drawn by the app itself.
// The texts and metadata live in content/animations.json, the drawings in components/anim/scenes.tsx.
import animationsJson from "@/content/animations.json";
import { fitsAge } from "@/lib/content";
import { reviewedStatus } from "@/lib/reviews";
import type { AgeBand } from "@/lib/types";

interface Texts {
  title: string;
  summary: string; // one sentence for the overview
  goal: string; // what the learner can explain afterwards
  labels: string[]; // words inside the drawing, in the order the scene expects
  steps: string[];
  predict?: { question: string; options: string[] };
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
  timing?: { pace?: number; motion?: number }; // this animation's own pacing; missing values fall back to TIMING
  predict?: { step: number; question: string; options: string[]; correct: number }; // asked before step `step` begins
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
  motion: number; // factor on the running time that drives the movement
  predict: { step: number; question: string; options: string[]; correct: number } | null;
  sources: { name: string; url: string }[];
  quizId: string | null;
  verification: AnimationRow["verification_status"];
  compare?: { shape: "square" | "peak" | "disc"; values: number[] }; // size comparisons (lib/compare.ts): what the scene draws to scale
  countries?: string[]; // ISO codes the animation is about (size comparisons)
}

/** 3D scenes built on third-party models (public/models): credit shown with the animation, details on the credits page. */
export const MODEL_CREDITS: Record<string, string> = { arm: "Z-Anatomy, BodyParts3D (CC BY-SA)", heart: "Z-Anatomy, BodyParts3D (CC BY-SA)", lungs: "Z-Anatomy, BodyParts3D (CC BY-SA)", eye: "Z-Anatomy, BodyParts3D (CC BY-SA)", knee: "Z-Anatomy, BodyParts3D (CC BY-SA)", brain: "Z-Anatomy, BodyParts3D (CC BY-SA)", mouth: "Z-Anatomy, BodyParts3D (CC BY-SA)" };

export const animationRows = animationsJson as unknown as AnimationRow[];

/**
 * Pacing of the animations (presentation speed, not physics). pace and motion are the defaults;
 * every animation sets its own in content/animations.json ("timing"), because a caption of forty
 * words needs more time than one of sixteen.
 *  - pace: factor on the authored step durations (1 = as first written).
 *  - minStep: no step is shorter than this, so its caption can at least be taken in (seconds).
 *  - motion: factor on the running time that drives ongoing movement (flowing dots, spinning helix, orbits).
 *  - camera / appear: how long a camera move or an object fading in takes inside a 3D scene (seconds).
 * Scenes never state real-world durations; where a process is sped up or exaggerated the caption says so.
 */
export const TIMING = { pace: 0.7, minStep: 3.6, motion: 1.35, camera: 0.8, appear: 0.5 };
const paced = (seconds: number | undefined, pace: number) => Math.round(Math.max(TIMING.minStep, (seconds ?? 6) * pace) * 10) / 10;

/** Published animations for one learner: right language (fallback: original), right age level. */
export function animationsFor(locale: string, band: AgeBand | null): Animation[] {
  return animationRows
    .filter((a) => a.status === "published" && a.verification_status !== "unverified")
    .map((a) => {
      const tr = a.translations[locale];
      const steps = a.steps.map((s, i) => ({ seconds: paced(s.seconds, a.timing?.pace ?? TIMING.pace), text: tr?.steps[i] ?? s.text }));
      return {
        id: a.id, categoryId: a.category_id, minAge: a.min_age, difficulty: a.difficulty, scene: a.scene, renderer: a.renderer, fallback: a.fallback_scene ?? null,
        title: tr?.title ?? a.title, summary: tr?.summary ?? a.summary, goal: tr?.goal ?? a.goal, labels: tr?.labels ?? a.labels,
        steps, seconds: Math.round(steps.reduce((n, s) => n + s.seconds, 0)), sources: a.sources, quizId: a.quiz_question_id, verification: reviewedStatus("animation", a),
        motion: a.timing?.motion ?? TIMING.motion, predict: a.predict ? { ...a.predict, ...(tr?.predict ?? {}) } : null,
      };
    })
    .filter((a) => fitsAge(a, band));
}
