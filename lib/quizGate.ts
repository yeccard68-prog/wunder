// While a check question is open, the answer must not be on screen next to it. Clips and animations explain the
// answer, so: a clip hides its key message (and a title that gives the answer away) until its quiz is answered, and an
// animation steps aside while its question is asked – both come back right after answering.
"use client";

import { useState } from "react";
import leaks from "@/content/quiz-leaks.json";
import type { Item, UserState } from "@/lib/types";

/** Does this clip's title give away its quiz answer? (precomputed by scripts/content/quiz-leaks.mjs) */
export const titleGivesAway = (clipId: string, locale: string) => ((leaks as Record<string, string[]>)[locale] ?? leaks.de).includes(clipId);

/** True from the moment the question is shown until it is answered in this view (answers from earlier views don't count). */
export function useAsking(quiz: Item | undefined, shown: boolean, state: Pick<UserState, "answers">) {
  return useQuizView(quiz, shown, state).asking;
}

/**
 * asking: as useAsking. solved: answered correctly in this view – the question can then make way, so the learner
 * has the animation to themselves and can play with it (a wrong answer keeps its explanation on screen).
 */
export function useQuizView(quiz: Item | undefined, shown: boolean, state: Pick<UserState, "answers">) {
  const [before] = useState(() => (quiz ? state.answers[quiz.id]?.at : undefined));
  const record = quiz ? state.answers[quiz.id] : undefined;
  const answeredHere = !!record && record.at !== before;
  return { asking: !!quiz && shown && !answeredHere, solved: answeredHere && !!record?.correct };
}
