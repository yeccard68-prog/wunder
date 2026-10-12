// Question formats beyond multiple choice and true/false: put in order, estimate a number, fill the gap.
// The server decides whether a response is right (public.submit_response); evaluate() applies the very
// same rules in demo mode and in tests. Keep the two in step.
import type { Item } from "./types";

/** The private answer key of a question (question_answers.answer). */
export interface AnswerKey {
  order?: number[]; // order: indices of the options in the correct sequence
  value?: number; // estimate: the true value …
  abs?: number; // … accepted within ± abs
  rel?: number; // … or within ± rel × value (e.g. 0.15 = 15 %)
  accept?: string[]; // blank: accepted answers, lower case
  show?: string; // blank: the spelling shown as the solution
}
export type FormatResponse = { order: number[] } | { value: number } | { text: string };

export const FORMAT_KINDS = ["order", "estimate", "blank"] as const;
export const isFormat = (kind: Item["kind"]) => (FORMAT_KINDS as readonly string[]).includes(kind);

/** Same normalisation as the database: lower case, single spaces, no surrounding blanks or . ! ? */
export const normalizeText = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/^[ .!?]+|[ .!?]+$/g, "");

export const tolerance = (key: AnswerKey) => key.abs ?? (key.rel != null && key.value != null ? Math.abs(key.value) * key.rel : 0);

export function evaluate(kind: Item["kind"], key: AnswerKey | undefined, response: FormatResponse): boolean {
  if (!key) return false;
  if (kind === "order" && "order" in response) return JSON.stringify(response.order) === JSON.stringify(key.order);
  if (kind === "estimate" && "value" in response && key.value != null) return Math.abs(response.value - key.value) <= tolerance(key);
  if (kind === "blank" && "text" in response) return (key.accept ?? []).includes(normalizeText(response.text));
  return false;
}

/** Slider settings of an estimate question: options = [min, max, unit, step]. */
export const estimateRange = (options: string[]) => ({ min: Number(options[0]), max: Number(options[1]), unit: options[2] ?? "", step: Number(options[3] ?? 1) });
