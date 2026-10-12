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
  kind: "question" | "fact";
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
  /** Other languages keyed by locale; the base fields hold the original language. */
  translations?: Record<string, { question: string; options: string[]; explanation?: string }>;
}

/** Where an answer was given – stored with every attempt. */
export type AnswerContext = "feed" | "quiz" | "daily" | "review" | "challenge" | "video";

/** What the app learns after submitting an answer. */
export interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  explanation: string;
  xp: number;
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
export type Theme = "system" | "light" | "dark";
/** Age level chosen by the user. Only this band is stored – never a birth date. */
export type AgeBand = "6-9" | "10-12" | "13-15" | "16+";

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
  books: { read: string[]; saved: string[] }; // book ideas marked as learned / saved (device only for now)
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
  settings: { theme: Theme; privateProfile: boolean; muted: boolean; captions: boolean; locale: string };
}
