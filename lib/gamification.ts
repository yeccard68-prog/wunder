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

// ---------- hash and challenge questions ----------
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
/** Small deterministic random generator (mulberry32): the same seed gives the same sequence on every device. */
export function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Same five questions for everyone with the same interests on a given day (used for challenges against friends). */
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
  /** how far along: [current, target] – shown as a ring around a locked badge */
  progress: (s: UserState) => [number, number];
  icon: AchievementIcon;
  color: string; // CSS colour of the medal
}
export type AchievementIcon = "spark" | "brain" | "book" | "star" | "film" | "comeback" | "flame" | "calendar" | "globe" | "people" | "swords" | "rise";
const answers = (s: UserState) => Object.values(s.answers);
const clipsDone = (s: UserState) => Object.values(s.clipStats).filter((c) => c.completed > 0).length;
const topicsAnswered = (s: UserState) => CATEGORIES.filter((c) => answers(s).some((a) => a.categoryId === c.id)).length;

/** The locked badge that is closest to being earned (largest share done), or null when all are earned. */
export function nextAchievement(s: UserState): { achievement: Achievement; current: number; target: number } | null {
  const open = ACHIEVEMENTS.filter((a) => !s.achievements.includes(a.id) && !a.check(s)).map((a) => {
    const [current, target] = a.progress(s);
    return { achievement: a, current: Math.min(current, target), target };
  });
  return open.sort((x, y) => y.current / y.target - x.current / x.target)[0] ?? null;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first", name: "Erster Funke", description: "Erste Frage beantwortet", icon: "spark", color: "#ff6d48", check: (s) => answers(s).length >= 1, progress: (s) => [Math.min(1, answers(s).length), 1] },
  { id: "correct10", name: "Schlaukopf", description: "10 Fragen richtig", icon: "brain", color: "#41c7b4", check: (s) => stats(s).correct >= 10, progress: (s) => [stats(s).correct, 10] },
  { id: "answered25", name: "Wissensdurst", description: "25 Fragen beantwortet", icon: "book", color: "#6db3f2", check: (s) => answers(s).length >= 25, progress: (s) => [answers(s).length, 25] },
  { id: "wow10", name: "Staunender Blick", description: "10 Fakten mit „Wow!“ markiert", icon: "star", color: "#e2ab4f", check: (s) => (s.facts?.wow.length ?? 0) >= 10, progress: (s) => [s.facts?.wow.length ?? 0, 10] },
  { id: "clips5", name: "Dranbleiber im Kino", description: "5 Clips bis zum Ende geschaut", icon: "film", color: "#9794ff", check: (s) => clipsDone(s) >= 5, progress: (s) => [clipsDone(s), 5] },
  { id: "comeback", name: "Comeback", description: "Eine Wissenslücke geschlossen", icon: "comeback", color: "#7fc66a", check: (s) => answers(s).some((a) => a.reviews > 0), progress: (s) => [answers(s).some((a) => a.reviews > 0) ? 1 : 0, 1] },
  { id: "streak3", name: "Dranbleiber", description: "3 Tage in Folge gelernt", icon: "flame", color: "#f09a6e", check: (s) => s.streak.best >= 3, progress: (s) => [s.streak.best, 3] },
  { id: "streak7", name: "Wochenheld", description: "7 Tage in Folge gelernt", icon: "calendar", color: "#ff6d48", check: (s) => s.streak.best >= 7, progress: (s) => [s.streak.best, 7] },
  { id: "allround", name: "Allrounder", description: "In jedem Thema geantwortet", icon: "globe", color: "#6ccbdc", check: (s) => topicsAnswered(s) >= CATEGORIES.length, progress: (s) => [topicsAnswered(s), CATEGORIES.length] },
  { id: "social", name: "Gut vernetzt", description: "3 Leuten gefolgt", icon: "people", color: "#e58bb8", check: (s) => s.following.length >= 3, progress: (s) => [s.following.length, 3] },
  { id: "duel", name: "Duellant", description: "Eine Challenge gewonnen", icon: "swords", color: "#f08a6c", check: (s) => s.challenges.some((c) => c.mine > c.theirs), progress: (s) => [s.challenges.some((c) => c.mine > c.theirs) ? 1 : 0, 1] },
  { id: "level5", name: "Aufsteiger", description: "Level 5 erreicht", icon: "rise", color: "#d6c35a", check: (s) => levelInfo(s.xp).level >= 5, progress: (s) => [levelInfo(s.xp).level, 5] },
];

export const newAchievements = (s: UserState) => ACHIEVEMENTS.filter((a) => !s.achievements.includes(a.id) && a.check(s));
