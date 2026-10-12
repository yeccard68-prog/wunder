// Data-access layer for the Supabase backend. UI code never talks to Supabase directly.
// Without the two public env vars the app runs in clearly labelled demo mode instead.
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { buildContent, type QuestionRow, type VideoRow } from "./content";
import type { AgeBand } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Publishable key only – it is safe in the app bundle because every table is protected by RLS.
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
export const isLive = !!supabase;

const db = () => {
  if (!supabase) throw new Error("Backend ist nicht konfiguriert");
  return supabase;
};

// ---------- public content (answers are never part of these queries) ----------
export async function fetchContent() {
  const [q, v] = await Promise.all([
    db().from("questions").select("id, kind, category_id, question, options, difficulty, source_name, source_url, verification_status, show_in_feed, created_at, like_count, min_age, max_age, translations").eq("status", "published").order("created_at", { ascending: false }).limit(500),
    db().from("videos").select("id, category_id, title, hook, description, video_url, thumbnail_url, duration_seconds, has_audio, captions, creator_name, sources, published_at, tags, quiz_question_id, verification_status, like_count, min_age, start_seconds, end_seconds, license, translations").eq("status", "published").order("published_at", { ascending: false }).limit(100),
  ]);
  if (q.error) throw q.error;
  if (v.error) throw v.error;
  return buildContent(q.data as QuestionRow[], v.data as VideoRow[]);
}

// ---------- session ----------
/** Returns the signed-in user; creates a guest (anonymous) account on first launch. */
export async function ensureUser(): Promise<User> {
  const { data, error } = await db().auth.getSession();
  if (error) throw error;
  if (data.session) return data.session.user;
  const guest = await db().auth.signInAnonymously();
  if (guest.error || !guest.data.user) throw guest.error ?? new Error("Gast-Anmeldung fehlgeschlagen");
  return guest.data.user;
}

/** Guest → permanent account. The user id stays the same, so all progress is kept. */
export async function linkEmail(email: string) {
  const { error } = await db().auth.updateUser({ email }, { emailRedirectTo: window.location.origin });
  if (error) throw error;
}

/** Sign in to an existing account with a one-time email link. */
export async function signInWithEmail(email: string) {
  const { error } = await db().auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: window.location.origin } });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await db().auth.signOut();
  if (error) throw error;
}

export async function deleteAccount() {
  const { error } = await db().rpc("delete_my_account");
  if (error) throw error;
  await db().auth.signOut({ scope: "local" });
}

// ---------- user state (server is the source of truth) ----------
export interface ServerStats {
  xp: number;
  week_xp: number;
  week_start: string;
  streak_current: number;
  streak_best: number;
  streak_last_date: string | null;
  today: string;
  today_answered: number;
  challenge_date: string | null;
  challenge_score: number | null;
}
export interface ServerState {
  profile: { display_name: string; interests: string[]; onboarded: boolean; goal_minutes: 3 | 5 | 10; motivation: string | null; is_private: boolean; locale: string; age_band: AgeBand | null };
  stats: ServerStats;
  progress: { question_id: string; last_correct: boolean; review_box: number | null; review_due: string | null; successful_reviews: number; updated_at: string; category_id: string; difficulty: 1 | 2 | 3; correct_index: number; explanation: string }[];
  question_reactions: { question_id: string; liked: boolean; saved: boolean; hidden: boolean; reported: boolean }[];
  video_progress: { video_id: string; plays: number; completions: number; liked: boolean; saved: boolean; hidden: boolean; reported: boolean }[];
}
export interface ServerAnswer {
  correct: boolean;
  correct_index: number;
  explanation: string;
  xp_earned: number;
  attempt_type: "first" | "review" | "practice";
  last_correct: boolean;
  review_box: number | null;
  review_due: string | null;
  successful_reviews: number;
  stats: ServerStats;
}

export async function fetchMyState(localDate: string, locale: string): Promise<ServerState> {
  const { data, error } = await db().rpc("get_my_state", { p_local_date: localDate, p_locale: locale });
  if (error) throw error;
  return data as ServerState;
}

/** Correctness, XP and streak are decided on the server. */
export async function submitAnswer(questionId: string, selected: number, context: string, localDate: string, locale: string): Promise<ServerAnswer> {
  const { data, error } = await db().rpc("submit_answer", { p_question_id: questionId, p_selected: selected, p_context: context, p_local_date: localDate, p_locale: locale });
  if (error) throw error;
  return data as ServerAnswer;
}

export async function completeDailyChallenge(localDate: string): Promise<{ score: number; bonus_xp: number; stats: ServerStats }> {
  const { data, error } = await db().rpc("complete_daily_challenge", { p_local_date: localDate });
  if (error) throw error;
  return data;
}

export async function saveProfile(userId: string, patch: Partial<{ display_name: string; interests: string[]; onboarded: boolean; goal_minutes: number; motivation: string; is_private: boolean; locale: string; age_band: AgeBand | null }>) {
  const { error } = await db().from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

type Flags = Partial<{ liked: boolean; saved: boolean; hidden: boolean; reported: boolean }>;

export async function setQuestionReaction(userId: string, questionId: string, flags: Flags) {
  const { error } = await db().from("question_reactions").upsert({ user_id: userId, question_id: questionId, ...flags }, { onConflict: "user_id,question_id" });
  if (error) throw error;
}

export async function setVideoProgress(userId: string, videoId: string, row: Flags & Partial<{ plays: number; completions: number }>) {
  const { error } = await db().from("video_progress").upsert({ user_id: userId, video_id: videoId, ...row }, { onConflict: "user_id,video_id" });
  if (error) throw error;
}

// ---------- content review (admins only – enforced by the database, not by the app) ----------
export interface ReviewItem {
  kind: "question" | "video";
  id: string;
  categoryId: string;
  title: string;
  options?: string[];
  correctIndex?: number;
  body: string;
  sourceName: string | null;
  sourceUrl: string | null;
  verification: string;
  status: string;
  reports: number;
  note: string | null;
}

export async function isAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

/** Everything that still needs a human decision: pulled by reports first, then not yet human-verified. */
export async function fetchReviewQueue(): Promise<ReviewItem[]> {
  const [q, v] = await Promise.all([
    db().from("questions").select("id, kind, category_id, question, options, source_name, source_url, verification_status, status, report_count, review_note, question_answers(correct_index, explanation)").in("status", ["published", "review"]).neq("verification_status", "verified").limit(500),
    db().from("videos").select("id, category_id, title, hook, description, sources, license, creator_name, verification_status, status, report_count, review_note").in("status", ["published", "review"]).neq("verification_status", "verified").limit(200),
  ]);
  if (q.error) throw q.error;
  if (v.error) throw v.error;
  type QA = { correct_index: number; explanation: string };
  const items: ReviewItem[] = [
    ...(q.data ?? []).map((r) => {
      const a = (Array.isArray(r.question_answers) ? r.question_answers[0] : r.question_answers) as QA | null;
      return { kind: "question" as const, id: r.id, categoryId: r.category_id, title: r.question, options: r.options as string[], correctIndex: a?.correct_index, body: a?.explanation ?? "", sourceName: r.source_name, sourceUrl: r.source_url, verification: r.verification_status, status: r.status, reports: r.report_count, note: r.review_note };
    }),
    ...(v.data ?? []).map((r) => {
      const src = (r.sources as { name: string; url: string }[])[0];
      return { kind: "video" as const, id: r.id, categoryId: r.category_id, title: r.title, body: [r.hook, r.description, r.creator_name && `© ${r.creator_name}`, r.license].filter(Boolean).join(" · "), sourceName: src?.name ?? null, sourceUrl: src?.url ?? null, verification: r.verification_status, status: r.status, reports: r.report_count, note: r.review_note };
    }),
  ];
  return items.sort((a, b) => Number(b.status === "review") - Number(a.status === "review") || b.reports - a.reports);
}

export async function adminReview(kind: "question" | "video", id: string, action: "approve" | "withdraw") {
  const { error } = await db().rpc("admin_review", { p_kind: kind, p_id: id, p_action: action });
  if (error) throw error;
}
