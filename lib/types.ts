import type { AnswerKey } from "./formats";
export type Difficulty = 1 | 2 | 3;

export interface Category {
  id: string;
  name: string;
  color: string; // CSS color (design token)
}

export interface Source {
  name: string;
  url?: string;
  publishedAt?: string;
}

/**
 * One knowledge item: a multiple-choice question, or a "fact" = true/false claim card.
 * With the backend, `correctIndex` and `explanation` are NOT part of the public content –
 * they arrive only after the user has answered (see AnswerResult / AnswerRecord).
 * In demo mode they are filled from the local dataset.
 */
export interface Item {
  id: string;
  kind: "question" | "fact" | "order" | "estimate" | "blank"; // the last three: see lib/formats.ts
  answerKey?: AnswerKey; // only where answers are known locally (demo mode)
  categoryId: string;
  question: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
  source: Source;
  difficulty: Difficulty;
  imageUrl?: string;
  createdAt: string;
  popularity: number; // like count
  verification: "unverified" | "ai_checked" | "verified";
  minAge: number; // 6, 10, 13 or 16
  maxAge: number | null; // set for cards written only for children
  hints?: string[]; // riddles: revealed one after another before answering
  /** Other languages keyed by locale; the base fields hold the original language. */
  translations?: Record<string, { question: string; options: string[]; explanation?: string; hints?: string[] }>;
}

/** Where an answer was given – stored with every attempt. */
export type AnswerContext = "feed" | "quiz" | "daily" | "review" | "challenge" | "video";

/** What the app learns after submitting an answer. */
export interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  explanation: string;
  xp: number;
  answer?: AnswerKey; // the solution of an order / estimate / blank question
}

export interface AnswerRecord {
  correct: boolean; // result of the latest attempt
  at: string;
  categoryId: string;
  difficulty: Difficulty;
  box: number | null; // spaced-repetition box, null = nothing scheduled
  due: string | null; // ISO time of next review
  reviews: number; // successful reviews
  correctIndex: number; // revealed answer
  explanation: string;
}

export interface LogEntry {
  type: "level" | "badge" | "daily" | "challenge";
  text: string;
  at: string;
}

export interface ChallengeResult {
  opponentId: string;
  date: string;
  mine: number;
  theirs: number;
}

export type Motivation = "discover" | "improve" | "compete";
export const HEARD_FROM = ["friends", "tiktok", "instagram", "youtube", "store", "press", "school", "other"] as const;
export type HeardFrom = (typeof HEARD_FROM)[number];
export type Theme = "system" | "light" | "dark";
/** Age level chosen by the user. Only this band is stored – never a birth date. */
export type AgeBand = "6-9" | "10-12" | "13-15" | "16+";

/** Spaced repetition of one book idea. level = successful recalls in a row; due = day (YYYY-MM-DD) of the next repetition. */
export interface RecallRecord {
  level: number;
  due: string;
  tries: number;
  known: number;
}

export interface UserState {
  onboarded: boolean;
  username: string;
  interests: string[];
  goalMinutes: 3 | 5 | 10;
  motivation: Motivation;
  ageBand: AgeBand | null; // null = not asked yet → treated as 16+
  xp: number;
  week: { key: string; xp: number };
  answers: Record<string, AnswerRecord>;
  clipStats: Record<string, { plays: number; completed: number }>; // watch signals for ranking
  comments: Record<string, string[]>; // own comments per clip (device only)
  // book ideas: learned / saved, and for each idea recalled from memory when it is due again
  books: { read: string[]; saved: string[]; recall?: Record<string, RecallRecord> };
  visuals?: string[]; // interactive visualisations already tried (prediction made) – they move to the back of the feed
  facts?: { wow: string[]; known: string[] }; // reactions to "Did you know?" cards
  signals?: import("./engagement").Signals; // what the feed learns from viewing behaviour – stays on this device
  heardFrom?: HeardFrom; // optional answer in the onboarding: where they heard of the app
  puzzles?: import("./puzzles").PuzzleState; // grid puzzles: today’s three before the feed, feed puzzles solved – stays on this device
  seen?: import("./seen").Seen; // when each entry was last on screen, so the feed repeats as late as possible – stays on this device
  likes: string[];
  saves: string[];
  hidden: string[];
  reported: string[];
  blocked: string[];
  following: string[];
  daily: { date: string; count: number };
  streak: { current: number; best: number; lastDate: string | null };
  dailyChallenge: { date: string; score: number | null };
  challenges: ChallengeResult[];
  achievements: string[];
  log: LogEntry[];
  settings: { theme: Theme; privateProfile: boolean; muted: boolean; captions: boolean; locale: string; analytics?: boolean; dailyPuzzles?: boolean }; // analytics: consent to usage events, off unless switched on · dailyPuzzles: false = no "Rätsel des Tages" before the feed
}
