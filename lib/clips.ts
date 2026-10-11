import type { Clip } from "./content";
import type { UserState } from "./types";
import { hash, today } from "./gamification";

export type { Clip };

/**
 * Lightweight clip ranking. Watch time alone is not treated as value:
 * finishing, replaying, saving and getting the quiz right count; a missed quiz
 * brings related clips back, "not interested" removes them.
 */
export function rankClips(clips: Clip[], s: UserState): Clip[] {
  const byCat: Record<string, number> = {};
  const add = (cat: string, v: number) => (byCat[cat] = (byCat[cat] ?? 0) + v);
  for (const c of clips) {
    const st = s.clipStats[c.id];
    if (st) add(c.categoryId, st.completed > 0 ? 1 + Math.min(2, st.completed - 1) * 0.5 : -0.5); // completion, replays, early skip
    if (s.likes.includes(c.id)) add(c.categoryId, 1);
    if (s.saves.includes(c.id)) add(c.categoryId, 1.5);
    const quiz = c.quiz && s.answers[c.quiz.id];
    if (quiz) add(c.categoryId, quiz.correct ? 0.5 : 1.5); // knowledge gap → more of this topic
    if (s.hidden.includes(c.id)) add(c.categoryId, -3);
  }
  const day = today();
  const score = (c: Clip) => {
    const ageDays = c.publishedAt ? (Date.now() - Date.parse(c.publishedAt)) / 86_400_000 : 30;
    return (
      (s.interests.includes(c.categoryId) ? 4 : -2) +
      Math.max(-3, Math.min(3, byCat[c.categoryId] ?? 0)) +
      3 * Math.exp(-ageDays / 10) +
      Math.min(1, c.popularity / 100) +
      (s.clipStats[c.id]?.completed ? -10 : 0) + // already seen → after everything new
      (hash(c.id + day) % 100) / 100
    );
  };
  return clips.filter((c) => !s.hidden.includes(c.id)).sort((a, b) => score(b) - score(a));
}
