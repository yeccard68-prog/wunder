// Duels, like Quizduell: three rounds of three questions, the players take turns choosing the topic.
// The live rules are enforced by the database (supabase/migrations/20261023100000_duels.sql); this module
// holds the shared types, the same turn order (nextStep) and a local practice duel against a simple
// opponent for demo mode, built from the bundled questions.
import { localizeItem } from "./content";
import type { Item } from "./types";

export type Role = "a" | "b";
export type DuelAction = "pick" | "answer" | "join" | "done";
export type DuelStatus = "open" | "active" | "finished" | "expired" | "declined";
export type DuelResult = "win" | "loss" | "draw";
export interface DuelNext { round: number | null; role: Role | null; action: DuelAction; mine: boolean }
export interface DuelAnswer { idx: number; selected: number | null; correct: boolean }
export interface DuelQuestion { id: string; question: string; options: string[] }
export interface DuelRound {
  round: number;
  category: string | null;
  offered: string[] | null; // only while it is your turn to choose
  questions: DuelQuestion[] | null; // only once you may answer them
  mine: DuelAnswer[];
  theirs: DuelAnswer[] | null; // only after you have played the round yourself
  theirsDone: boolean;
}
export interface DuelView {
  id: string;
  code: string;
  kind: "invite" | "random" | "practice";
  status: DuelStatus;
  role: Role;
  opponent: { name: string | null; joined: boolean };
  next: DuelNext;
  rounds: DuelRound[];
  score: { mine: number; theirs: number }; // theirs: only rounds you can already see
  result: DuelResult | null;
  forfeit: "me" | "them" | null;
  updatedAt: string;
}
export type DuelSummary = Pick<DuelView, "id" | "code" | "kind" | "status" | "opponent" | "next" | "score" | "result" | "updatedAt">;
export interface DuelAnswerResult { correct: boolean; correctIndex: number; explanation: string }

export const ROUNDS = 3;
export const PER_ROUND = 3;
export const SECONDS_PER_QUESTION = 20;
export const PRACTICE_ACCURACY = 0.6; // the practice opponent answers about 60 % correctly

// A picks round 1, both answer; B picks round 2; A picks round 3 – each round the picker plays first
const STEPS: [number, Role, "pick" | "answer"][] = [
  [1, "a", "pick"], [1, "a", "answer"], [1, "b", "answer"],
  [2, "b", "pick"], [2, "b", "answer"], [2, "a", "answer"],
  [3, "a", "pick"], [3, "a", "answer"], [3, "b", "answer"],
];

/** The next move. picked[r]: topic of round r+1 chosen; done.a[r]: A has answered all of round r+1. */
export function nextStep(s: { picked: boolean[]; done: Record<Role, boolean[]>; joined: boolean }): Omit<DuelNext, "mine"> {
  for (const [round, role, action] of STEPS) {
    const waiting = role === "b" && !s.joined;
    const done = !waiting && (action === "pick" ? s.picked[round - 1] : s.done[role][round - 1]);
    if (!done) return { round, role, action: waiting ? "join" : action };
  }
  return { round: null, role: null, action: "done" };
}

// ---------- practice duel (local, demo mode) ----------

export interface PracticeDuel {
  id: string;
  createdAt: string;
  updatedAt: string;
  rounds: { offered: string[]; category: string | null; questionIds: string[] | null }[];
  answers: Record<Role, (number | null)[][]>; // [round][question] → selected option, null = time ran out
  resigned: boolean;
}
type Rng = () => number;

/** Questions a duel can use: plain multiple choice with a known answer, no riddles. */
export const duelPool = (items: Item[]) => items.filter((i) => i.kind === "question" && !i.hints?.length && i.options.length >= 2 && i.options.length <= 4 && typeof i.correctIndex === "number");

const shuffle = <T,>(list: T[], rng: Rng) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
const usedIds = (d: PracticeDuel) => new Set(d.rounds.flatMap((r) => r.questionIds ?? []));
function offer(d: PracticeDuel, pool: Item[], rng: Rng): string[] {
  const used = usedIds(d);
  const counts = new Map<string, number>();
  for (const i of pool) if (!used.has(i.id)) counts.set(i.categoryId, (counts.get(i.categoryId) ?? 0) + 1);
  return shuffle([...counts].filter(([, n]) => n >= PER_ROUND).map(([c]) => c), rng).slice(0, 3);
}
const touch = (d: PracticeDuel): PracticeDuel => ({ ...d, updatedAt: new Date().toISOString() });

export function createPractice(pool: Item[], rng: Rng = Math.random): PracticeDuel {
  const now = new Date().toISOString();
  const d: PracticeDuel = { id: "p" + Date.now().toString(36) + Math.floor(rng() * 1e6).toString(36), createdAt: now, updatedAt: now, rounds: [], answers: { a: [[], [], []], b: [[], [], []] }, resigned: false };
  d.rounds.push({ offered: offer(d, pool, rng), category: null, questionIds: null });
  return d;
}

function practiceStep(d: PracticeDuel) {
  return nextStep({
    picked: [0, 1, 2].map((r) => !!d.rounds[r]?.category),
    done: { a: [0, 1, 2].map((r) => d.answers.a[r].length === PER_ROUND), b: [0, 1, 2].map((r) => d.answers.b[r].length === PER_ROUND) },
    joined: true,
  });
}

export function practicePick(d: PracticeDuel, category: string, pool: Item[], rng: Rng = Math.random): PracticeDuel {
  const step = practiceStep(d);
  const r = (step.round ?? 0) - 1;
  if (step.action !== "pick" || !d.rounds[r]?.offered.includes(category)) throw new Error("not your turn");
  const used = usedIds(d);
  const ids = shuffle(pool.filter((i) => i.categoryId === category && !used.has(i.id)), rng).slice(0, PER_ROUND).map((i) => i.id);
  const rounds = d.rounds.map((x, k) => (k === r ? { ...x, category, questionIds: ids } : x));
  return touch({ ...d, rounds });
}

export function practiceAnswer(d: PracticeDuel, role: Role, round: number, idx: number, selected: number | null, pool: Item[], locale = "de"): { duel: PracticeDuel; result: DuelAnswerResult } {
  const step = practiceStep(d);
  if (step.action !== "answer" || step.role !== role || step.round !== round || d.answers[role][round - 1].length !== idx) throw new Error("not your turn");
  const item = pool.find((i) => i.id === d.rounds[round - 1].questionIds?.[idx]);
  if (!item) throw new Error("question not found");
  const answers = { ...d.answers, [role]: d.answers[role].map((list, k) => (k === round - 1 ? [...list, selected] : list)) };
  let duel = touch({ ...d, answers });
  // the next topic choice is prepared as soon as it is due
  const after = practiceStep(duel);
  if (after.action === "pick" && after.round && !duel.rounds[after.round - 1]) duel = { ...duel, rounds: [...duel.rounds, { offered: offer(duel, pool, Math.random), category: null, questionIds: null }] };
  return { duel, result: { correct: selected === item.correctIndex, correctIndex: item.correctIndex!, explanation: localizeItem(item, locale).explanation ?? "" } };
}

/** The practice opponent (B) makes all its moves until it is A's turn again. */
export function practiceBot(d: PracticeDuel, pool: Item[], rng: Rng = Math.random): PracticeDuel {
  let duel = d;
  for (let guard = 0; guard < 20 && !duel.resigned; guard++) {
    const step = practiceStep(duel);
    if (step.role !== "b" || step.action === "done") break;
    const r = step.round! - 1;
    if (step.action === "pick") duel = practicePick(duel, duel.rounds[r].offered[Math.floor(rng() * duel.rounds[r].offered.length)], pool, rng);
    else {
      const idx = duel.answers.b[r].length;
      const item = pool.find((i) => i.id === duel.rounds[r].questionIds![idx])!;
      const wrong = item.options.map((_, k) => k).filter((k) => k !== item.correctIndex);
      const pick = rng() < PRACTICE_ACCURACY ? item.correctIndex! : wrong[Math.floor(rng() * wrong.length)];
      duel = practiceAnswer(duel, "b", step.round!, idx, pick, pool).duel;
    }
  }
  return duel;
}

/** What the player (always A) sees – the same rules as the server's duel_state. */
export function practiceView(d: PracticeDuel, pool: Item[], locale: string): DuelView {
  const step = practiceStep(d);
  const closed = d.resigned || step.action === "done";
  const byId = new Map(pool.map((i) => [i.id, i]));
  const mark = (role: Role, r: number): DuelAnswer[] =>
    d.answers[role][r].map((selected, idx) => ({ idx, selected, correct: selected !== null && selected === byId.get(d.rounds[r].questionIds![idx])?.correctIndex }));
  const rounds: DuelRound[] = [0, 1, 2].map((r) => {
    const row = d.rounds[r];
    const mine = row?.questionIds ? mark("a", r) : [];
    const myTurnHere = !closed && step.role === "a" && step.round === r + 1;
    const visible = !!row?.questionIds && (mine.length > 0 || closed || (myTurnHere && step.action === "answer"));
    return {
      round: r + 1,
      category: row?.category ?? null,
      offered: myTurnHere && step.action === "pick" ? row?.offered ?? null : null,
      questions: visible ? row!.questionIds!.map((id) => {
        const item = localizeItem(byId.get(id)!, locale);
        return { id, question: item.question, options: item.options };
      }) : null,
      mine,
      theirs: mine.length === PER_ROUND || closed ? (row?.questionIds ? mark("b", r) : []) : null,
      theirsDone: d.answers.b[r].length === PER_ROUND,
    };
  });
  const total = (role: Role) => [0, 1, 2].reduce((n, r) => n + (d.rounds[r]?.questionIds ? mark(role, r).filter((a) => a.correct).length : 0), 0);
  const mine = total("a");
  const theirsAll = total("b");
  const theirsSeen = rounds.reduce((n, r) => n + (r.theirs?.filter((a) => a.correct).length ?? 0), 0);
  const result: DuelResult | null = d.resigned ? "loss" : step.action === "done" ? (mine > theirsAll ? "win" : mine < theirsAll ? "loss" : "draw") : null;
  return {
    id: d.id, code: "", kind: "practice", status: closed ? "finished" : "active", role: "a",
    opponent: { name: null, joined: true },
    next: { ...step, mine: !closed && step.role === "a" && (step.action === "pick" || step.action === "answer") },
    rounds, score: { mine, theirs: closed ? theirsAll : theirsSeen }, result, forfeit: d.resigned ? "me" : null, updatedAt: d.updatedAt,
  };
}

/** Wins, draws and losses of finished duels. */
export function duelRecord(list: { result: DuelResult | null }[]) {
  return { win: list.filter((d) => d.result === "win").length, draw: list.filter((d) => d.result === "draw").length, loss: list.filter((d) => d.result === "loss").length };
}
