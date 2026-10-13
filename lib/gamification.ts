import type { Difficulty, Item, UserState } from "./types";
import { CATEGORIES } from "./categories";

// ---------- XP & levels ----------
// XP rewards accuracy, difficulty and retention – never plain volume:
// every question pays out once, reviews only when they are due, bonuses once per day.
export const XP = {
  first: (correct: boolean, d: Difficulty) => (correct ? 10 * d : 0),
  claim: 5, // true/false card judged correctly (half of an easy question: 50 % guess chance)
  review: 5,
  dailyPerCorrect: 4, // completion bonus scales with accuracy
  dailyPerfect: 10,
  challengeWin: 15,
};

const THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500];
/**
 * What has actually stuck – as opposed to what was merely looked at:
 *  recalled = questions answered correctly again after a pause (a successful review) ·
 *  gaps = questions last answered wrong and scheduled to come back · due = of those, due now ·
 *  clipsWatched / clipsUnderstood = clips seen to the end / clips whose question was answered correctly.
 */
export function retention(state: Pick<UserState, "answers" | "clipStats">, clipQuiz: Record<string, string | undefined>, now = Date.now()) {
  const answers = Object.values(state.answers);
  const watched = Object.entries(state.clipStats).filter(([, s]) => s.completed > 0).map(([id]) => id);
  return {
    recalled: answers.filter((a) => a.reviews > 0).length,
    gaps: answers.filter((a) => a.box !== null && !a.correct).length,
    due: answers.filter((a) => a.due !== null && Date.parse(a.due) <= now).length,
    clipsWatched: watched.length,
    clipsUnderstood: watched.filter((id) => { const q = clipQuiz[id]; return !!q && state.answers[q]?.correct; }).length,
  };
}

export function levelThreshold(level: number): number {
  if (level <= THRESHOLDS.length) return THRESHOLDS[level - 1];
  return THRESHOLDS[THRESHOLDS.length - 1] + (level - THRESHOLDS.length) * 600;
}
export function levelInfo(xp: number) {
  let level = 1;
  while (xp >= levelThreshold(level + 1)) level++;
  const start = levelThreshold(level);
  const next = levelThreshold(level + 1);
  return { level, current: xp - start, needed: next - start, progress: (xp - start) / (next - start) };
}
export const leagueFor = (xp: number) => {
  const l = levelInfo(xp).level;
  return l >= 6 ? "Gold-Liga" : l >= 3 ? "Silber-Liga" : "Bronze-Liga";
};

// ---------- time ----------
export const today = () => new Date().toLocaleDateString("sv"); // YYYY-MM-DD local
export function weekKey(d = new Date()) {
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return monday.toLocaleDateString("sv");
}
export const daysLeftInWeek = () => 7 - ((new Date().getDay() + 6) % 7);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

// ---------- daily goal & streak ----------
export const goalQuestions = (minutes: 3 | 5 | 10) => ({ 3: 5, 5: 10, 10: 15 })[minutes];
export const dailyCount = (s: UserState) => (s.daily.date === today() ? s.daily.count : 0);

export function applyActivity(state: UserState): Pick<UserState, "streak" | "daily"> {
  const d = today();
  const daily = { date: d, count: dailyCount(state) + 1 };
  let { current, best, lastDate } = state.streak;
  if (lastDate !== d) {
    current = lastDate && daysBetween(lastDate, d) === 1 ? current + 1 : 1;
    lastDate = d;
  }
  return { daily, streak: { current, best: Math.max(best, current), lastDate } };
}
export function liveStreak(state: UserState) {
  const { lastDate, current } = state.streak;
  return lastDate && daysBetween(lastDate, today()) <= 1 ? current : 0;
}

// ---------- spaced repetition ----------
// A wrong answer enters box 0; each successful review moves it one box up.
export const BOX_MS = [10 * 60_000, 86_400_000, 3 * 86_400_000, 7 * 86_400_000, 21 * 86_400_000];
export const dueAt = (box: number) => new Date(Date.now() + BOX_MS[box]).toISOString();
export const isDue = (due: string | null | undefined) => !!due && Date.parse(due) <= Date.now();
export const dueReviews = (items: Item[], s: UserState) => items.filter((i) => isDue(s.answers[i.id]?.due));
export const scheduledReviews = (s: UserState) => Object.values(s.answers).filter((a) => a.due).length;

// ---------- daily challenge ----------
/** FNV-1a with a final mix: a different date reshuffles the order (a plain polynomial hash only shifts it). */
export function hash(str: string) {
  let h = 2166136261;
  for (const c of str) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return h >>> 0;
}
/** Same five questions for everyone with the same interests on a given day. */
export function dailyItems(items: Item[], interests: string[], date = today()): Item[] {
  const pool = items.filter((i) => i.kind === "question" && (!interests.length || interests.includes(i.categoryId)));
  return [...pool].sort((a, b) => hash(a.id + date) - hash(b.id + date)).slice(0, 5);
}

// ---------- stats ----------
export function stats(state: UserState) {
  const all = Object.values(state.answers);
  const correct = all.filter((a) => a.correct).length;
  return { answered: all.length, correct, accuracy: all.length ? correct / all.length : 0 };
}

/** Category skill 0..1: difficulty-weighted share of the category the user currently knows. */
export function mastery(items: Item[], state: UserState, categoryId: string) {
  const qs = items.filter((i) => i.kind === "question" && i.categoryId === categoryId);
  const total = qs.reduce((n, i) => n + i.difficulty, 0);
  const known = qs.reduce((n, i) => n + (state.answers[i.id]?.correct ? i.difficulty : 0), 0);
  return total ? known / total : 0;
}

// ---------- achievements ----------
export interface Achievement {
  id: string;
  name: string;
  description: string;
  check: (s: UserState) => boolean;
}
const answers = (s: UserState) => Object.values(s.answers);

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first", name: "Erster Funke", description: "Erste Frage beantwortet", check: (s) => answers(s).length >= 1 },
  { id: "correct10", name: "Schlaukopf", description: "10 Fragen richtig", check: (s) => stats(s).correct >= 10 },
  { id: "answered25", name: "Wissensdurst", description: "25 Fragen beantwortet", check: (s) => answers(s).length >= 25 },
  { id: "daily", name: "Tagesform", description: "Daily Challenge abgeschlossen", check: (s) => s.dailyChallenge.score !== null },
  { id: "perfect", name: "Fünf von fünf", description: "Daily Challenge ohne Fehler", check: (s) => s.dailyChallenge.score === 5 },
  { id: "comeback", name: "Comeback", description: "Eine Wissenslücke geschlossen", check: (s) => answers(s).some((a) => a.reviews > 0) },
  { id: "streak3", name: "Dranbleiber", description: "3 Tage in Folge gelernt", check: (s) => s.streak.best >= 3 },
  { id: "streak7", name: "Wochenheld", description: "7 Tage in Folge gelernt", check: (s) => s.streak.best >= 7 },
  { id: "allround", name: "Allrounder", description: "In jedem Thema geantwortet", check: (s) => CATEGORIES.every((c) => answers(s).some((a) => a.categoryId === c.id)) },
  { id: "social", name: "Gut vernetzt", description: "3 Leuten gefolgt", check: (s) => s.following.length >= 3 },
  { id: "duel", name: "Duellant", description: "Eine Challenge gewonnen", check: (s) => s.challenges.some((c) => c.mine > c.theirs) },
  { id: "level5", name: "Aufsteiger", description: "Level 5 erreicht", check: (s) => levelInfo(s.xp).level >= 5 },
];

export const newAchievements = (s: UserState) => ACHIEVEMENTS.filter((a) => !s.achievements.includes(a.id) && a.check(s));
