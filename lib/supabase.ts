// Data-access layer for the Supabase backend. UI code never talks to Supabase directly.
// Without the two public env vars the app runs in clearly labelled demo mode instead.
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { AnswerKey, FormatResponse } from "./formats";
import { buildContent, toItem, type QuestionRow, type VideoRow } from "./content";
import type { Item } from "./types";
import type { ChatList, ChatMessage, ChatReason, ChatPlace } from "./chat";
import type { BotLevel, DuelAnswerResult, DuelQuestion, DuelSummary, DuelView } from "./duel";
import type { GroupState, GroupSummary } from "./groups";
import { linkOrigin } from "./native";
import type { AgeBand, UserState } from "./types";

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
const PAGE_SIZE = 500;
/** Loads every row of a query page by page – the API returns at most a limited number of rows per request. */
async function allRows<T>(page: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const chunk = (data ?? []) as T[];
    rows.push(...chunk);
    if (chunk.length < PAGE_SIZE) return rows;
  }
}

const QUESTION_COLUMNS = "id, kind, category_id, question, options, difficulty, source_name, source_url, verification_status, show_in_feed, created_at, like_count, min_age, max_age, translations, hints, countries, image_url, image_credit, image_source";

/** The hand-made cards and clips – loaded in full at app start. Generated cards come in portions (fetchGenerated). */
export async function fetchContent() {
  const [questions, videos] = await Promise.all([
    allRows<QuestionRow>((from, to) => db().from("questions").select(QUESTION_COLUMNS).eq("status", "published").eq("origin", "editorial").order("created_at", { ascending: false }).order("id").range(from, to)),
    allRows<VideoRow>((from, to) => db().from("videos").select("id, category_id, title, hook, description, video_url, thumbnail_url, duration_seconds, has_audio, captions, creator_name, sources, published_at, tags, quiz_question_id, verification_status, like_count, min_age, start_seconds, end_seconds, license, translations").eq("status", "published").order("published_at", { ascending: false }).order("id").range(from, to)),
  ]);
  return buildContent(questions, videos);
}

/**
 * A random portion of generated cards (e.g. from Wikidata) for the feed: the learner's topics first, cards about their
 * country more often, none of the ids already on the device. Answers stay on the server as for every card.
 */
export async function fetchGenerated(p: { categories: string[]; region: string | null; age: number; exclude: string[]; limit?: number }): Promise<Item[]> {
  const { data, error } = await db().rpc("sample_generated", { p_categories: p.categories, p_region: p.region, p_age: p.age, p_exclude: p.exclude, p_limit: p.limit ?? 80 });
  if (error) throw error;
  return ((data ?? []) as QuestionRow[]).map((r) => ({ ...toItem(r), generated: true }));
}

// ---------- session ----------
/** Returns the signed-in user; creates a guest (anonymous) account on first launch. */
export async function ensureUser(): Promise<User> {
  const { data, error } = await db().auth.getSession();
  if (error) throw error;
  if (data.session) return data.session.user;
  // Only one guest account per device: if the page reloads while the first launch is still creating
  // its account (it happened in the Android app on first start), the second load waits for that
  // account instead of creating another one.
  const LOCK = "wunder.guest.creating";
  const store = (() => {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  })();
  if (Date.now() - Number(store?.getItem(LOCK) ?? 0) < 10_000) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const again = await db().auth.getSession();
      if (again.data.session) return again.data.session.user;
    }
  }
  store?.setItem(LOCK, String(Date.now()));
  const guest = await db().auth.signInAnonymously().finally(() => store?.removeItem(LOCK));
  if (guest.error || !guest.data.user) throw guest.error ?? new Error("Gast-Anmeldung fehlgeschlagen");
  return guest.data.user;
}

/** Guest → permanent account. The user id stays the same, so all progress is kept. */
export async function linkEmail(email: string) {
  const { error } = await db().auth.updateUser({ email }, { emailRedirectTo: linkOrigin() });
  if (error) throw error;
}

/** Sign in to an existing account with a one-time email link. */
export async function signInWithEmail(email: string) {
  const { error } = await db().auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: linkOrigin() } });
  if (error) throw error;
}

/**
 * The six-digit code from the e-mail instead of the link – works in the Android app too, where the link would
 * open the browser. Needs {{ .Token }} in the Supabase e-mail templates (Authentication → Email Templates).
 */
export async function verifyEmailCode(email: string, token: string, purpose: "signin" | "register") {
  const { error } = await db().auth.verifyOtp({ email, token, type: purpose === "signin" ? "email" : "email_change" });
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
  answer?: AnswerKey; // only from submit_response
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

/** Order, estimate and blank questions: the response itself is judged on the server. */
export async function submitResponse(questionId: string, response: FormatResponse, context: string, localDate: string, locale: string): Promise<ServerAnswer> {
  const { data, error } = await db().rpc("submit_response", { p_question_id: questionId, p_response: response, p_context: context, p_local_date: localDate, p_locale: locale });
  if (error) throw error;
  return data as ServerAnswer;
}

/** Book learning state of this account (null: nothing stored yet). */
export async function fetchBookState(userId: string): Promise<UserState["books"] | null> {
  const { data, error } = await db().from("book_states").select("data").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return (data?.data as UserState["books"] | undefined) ?? null;
}

export async function saveBookState(userId: string, books: UserState["books"]) {
  const { error } = await db().from("book_states").upsert({ user_id: userId, data: books, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function saveProfile(userId: string, patch: Partial<{ display_name: string; interests: string[]; onboarded: boolean; goal_minutes: number; motivation: string; is_private: boolean; locale: string; age_band: AgeBand | null; heard_from: string }>) {
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

// ---------- duels (turn order, answer key and visibility are decided by the database) ----------
export async function createDuel(kind: "invite" | "random"): Promise<{ id: string; code: string; joined: boolean }> {
  const { data, error } = await db().rpc("duel_create", { p_kind: kind });
  if (error) throw error;
  return data;
}
/** A duel against the computer: it plays its turns on the server right after yours. */
export async function createBotDuel(level: BotLevel): Promise<{ id: string; code: string; joined: boolean }> {
  const { data, error } = await db().rpc("duel_create_bot", { p_level: level });
  if (error) throw error;
  return data;
}
export async function joinDuel(code: string): Promise<string> {
  const { data, error } = await db().rpc("duel_join", { p_code: code });
  if (error) throw error;
  return data as string;
}
export async function fetchDuel(id: string, locale: string): Promise<DuelView> {
  const { data, error } = await db().rpc("duel_state", { p_duel: id, p_locale: locale });
  if (error) throw error;
  return data as DuelView;
}
export async function fetchMyDuels(): Promise<DuelSummary[]> {
  const { data, error } = await db().rpc("my_duels");
  if (error) throw error;
  return (data ?? []) as DuelSummary[];
}
export async function pickDuelTopic(id: string, category: string) {
  const { error } = await db().rpc("duel_pick", { p_duel: id, p_category: category });
  if (error) throw error;
}
/** selected null: the time ran out. */
export async function answerDuel(id: string, round: number, idx: number, selected: number | null, locale: string): Promise<DuelAnswerResult> {
  const { data, error } = await db().rpc("duel_answer", { p_duel: id, p_round: round, p_idx: idx, p_selected: selected, p_locale: locale });
  if (error) throw error;
  return data as DuelAnswerResult;
}
/** Shows the next question of the round; the server notes the moment and counts the 20 seconds from it. */
export async function openDuelQuestion(id: string, round: number, idx: number, locale: string): Promise<{ question: DuelQuestion; secondsLeft: number }> {
  const { data, error } = await db().rpc("duel_question", { p_duel: id, p_round: round, p_idx: idx, p_locale: locale });
  if (error) throw error;
  return data as { question: DuelQuestion; secondsLeft: number };
}
export async function rematchDuel(id: string): Promise<string> {
  const { data, error } = await db().rpc("duel_rematch", { p_duel: id });
  if (error) throw error;
  return data as string;
}
export async function declineDuel(id: string) {
  const { error } = await db().rpc("duel_decline", { p_duel: id });
  if (error) throw error;
}
export async function resignDuel(id: string) {
  const { error } = await db().rpc("duel_resign", { p_duel: id });
  if (error) throw error;
}
export async function reportDuel(id: string, reason: "name" | "cheating" | "other") {
  const { error } = await db().rpc("duel_report", { p_duel: id, p_reason: reason });
  if (error) throw error;
}

export interface DuelReport { reported: string; display_name: string | null; reports: number; reasons: string[]; last_at: string }
/** Editors: players with open reports, most reports first. */
export async function fetchDuelReports(): Promise<DuelReport[]> {
  const { data, error } = await db().rpc("admin_duel_reports");
  if (error) throw error;
  return (data ?? []) as DuelReport[];
}
/** Editors: close a player's reports, resetting the name to "Neugierig" if it was offensive. */
export async function resolveDuelReports(user: string, resetName: boolean) {
  const { error } = await db().rpc("admin_resolve_reports", { p_user: user, p_reset: resetName });
  if (error) throw error;
}

// ---------- groups: members, group rounds with a ranking (rules in the database) ----------
export async function fetchMyGroups(): Promise<GroupSummary[]> {
  const { data, error } = await db().rpc("my_groups");
  if (error) throw error;
  return (data ?? []) as GroupSummary[];
}
export async function createGroup(name: string): Promise<{ id: string; code: string }> {
  const { data, error } = await db().rpc("group_create", { p_name: name });
  if (error) throw error;
  return data;
}
export async function joinGroup(code: string): Promise<string> {
  const { data, error } = await db().rpc("group_join", { p_code: code });
  if (error) throw error;
  return data as string;
}
export async function fetchGroup(id: string): Promise<GroupState> {
  const { data, error } = await db().rpc("group_state", { p_group: id });
  if (error) throw error;
  return data as GroupState;
}
export async function leaveGroup(id: string) {
  const { error } = await db().rpc("group_leave", { p_group: id });
  if (error) throw error;
}
export async function removeGroupMember(id: string, user: string) {
  const { error } = await db().rpc("group_remove_member", { p_group: id, p_user: user });
  if (error) throw error;
}
export async function startGroupRound(id: string, category?: string): Promise<string> {
  const { data, error } = await db().rpc("group_round_start", { p_group: id, p_category: category ?? null });
  if (error) throw error;
  return data as string;
}
export async function openGroupQuestion(round: string, idx: number, locale: string): Promise<{ question: DuelQuestion; secondsLeft: number }> {
  const { data, error } = await db().rpc("group_round_question", { p_round: round, p_idx: idx, p_locale: locale });
  if (error) throw error;
  return data as { question: DuelQuestion; secondsLeft: number };
}
export async function answerGroupQuestion(round: string, idx: number, selected: number | null, locale: string): Promise<DuelAnswerResult> {
  const { data, error } = await db().rpc("group_round_answer", { p_round: round, p_idx: idx, p_selected: selected, p_locale: locale });
  if (error) throw error;
  return data as DuelAnswerResult;
}

// ---------- chat in duels and groups (16+, filter, rate limit and reports in the database) ----------
const placeArgs = (p: ChatPlace) => ({ p_duel: p.duel ?? null, p_group: p.group ?? null });
export async function fetchChat(place: ChatPlace, after = 0): Promise<ChatList> {
  const { data, error } = await db().rpc("chat_list", { ...placeArgs(place), p_after: after });
  if (error) throw error;
  return data as ChatList;
}
export async function sendChat(place: ChatPlace, body: string): Promise<ChatMessage> {
  const { data, error } = await db().rpc("chat_send", { ...placeArgs(place), p_body: body });
  if (error) throw error;
  return data as ChatMessage;
}
export async function reportChat(message: number, reason: ChatReason, block: boolean) {
  const { error } = await db().rpc("chat_report", { p_message: message, p_reason: reason, p_block: block });
  if (error) throw error;
}
export interface ChatReport { message_id: number; body: string; author: string; display_name: string | null; reports: number; reasons: string[]; hidden: boolean; last_at: string }
/** Editors: reported chat messages, most reports first. */
export async function fetchChatReports(): Promise<ChatReport[]> {
  const { data, error } = await db().rpc("admin_chat_reports");
  if (error) throw error;
  return (data ?? []) as ChatReport[];
}
/** Editors: delete the message or show it again; its reports close. */
export async function resolveChatReport(message: number, remove: boolean) {
  const { error } = await db().rpc("admin_resolve_chat", { p_message: message, p_remove: remove });
  if (error) throw error;
}

export interface HeardFromRow { heard_from: string; players: number; last_30_days: number }
/** Editors: how many players heard of the app where (answers from the onboarding, totals only). */
export async function fetchHeardFrom(): Promise<HeardFromRow[]> {
  const { data, error } = await db().rpc("admin_heard_from");
  if (error) throw error;
  return (data ?? []) as HeardFromRow[];
}

// ---------- feature switches and overview (editors switch chat/groups on and off) ----------
export async function fetchFlags(): Promise<Partial<{ chat: boolean; groups: boolean }>> {
  const { data, error } = await db().rpc("app_flags");
  if (error) throw error;
  return (data ?? {}) as Partial<{ chat: boolean; groups: boolean }>;
}
export async function setFlag(key: "chat" | "groups", on: boolean) {
  const { error } = await db().rpc("admin_set_flag", { p_key: key, p_on: on });
  if (error) throw error;
}
export interface Overview {
  days: { day: string; active: number; new: number }[];
  players: number; active7: number; active30: number; answers30: number; duels30: number; groups: number;
  openHints: number; openChatReports: number; dbSize: string;
}
export async function fetchOverview(days = 14): Promise<Overview> {
  const { data, error } = await db().rpc("admin_overview", { p_days: days });
  if (error) throw error;
  return data as Overview;
}

// ---------- hints to the editors (not public; filter and daily limit in the database) ----------
export async function sendContentHint(kind: string, id: string, reason: string, note: string, locale: string) {
  const { error } = await db().rpc("content_hint_send", { p_kind: kind, p_id: id, p_reason: reason, p_note: note.trim() || null, p_locale: locale });
  if (error) throw error;
}
export interface ContentHint { kind: string; content_id: string; hints: number; reasons: string[]; notes: string[]; last_at: string }
/** Editors: open hints grouped by card, most first. */
export async function fetchContentHints(): Promise<ContentHint[]> {
  const { data, error } = await db().rpc("admin_content_hints");
  if (error) throw error;
  return (data ?? []) as ContentHint[];
}
/** Editors: close the open hints of a card – corrected or left as it is. */
export async function resolveContentHints(kind: string, id: string, resolution: "fixed" | "kept") {
  const { error } = await db().rpc("admin_resolve_hints", { p_kind: kind, p_id: id, p_resolution: resolution });
  if (error) throw error;
}

// ---------- content review (admins only – enforced by the database, not by the app) ----------
export interface ReviewItem {
  kind: "question" | "video";
  en?: { title: string; options?: string[]; body: string; hints?: string[] }; // the English version, where there is one
  hints?: string[]; // riddles
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
  // all of them, page by page – there are more than the 1,000 rows one request may return
  type Q = { id: string; kind: string; category_id: string; question: string; options: unknown; source_name: string | null; source_url: string | null; verification_status: string; status: string; report_count: number; review_note: string | null; translations: unknown; question_answers: unknown; hints: string[] | null };
  type V = { id: string; category_id: string; title: string; hook: string; description: string; sources: unknown; license: string | null; creator_name: string; verification_status: string; status: string; report_count: number; review_note: string | null; translations: unknown };
  const [qRows, vRows] = await Promise.all([
    allRows<Q>((from, to) => db().from("questions").select("id, kind, category_id, question, options, source_name, source_url, verification_status, status, report_count, review_note, translations, hints, question_answers(correct_index, explanation, translations)").in("status", ["published", "review"]).neq("verification_status", "verified").order("id").range(from, to)),
    allRows<V>((from, to) => db().from("videos").select("id, category_id, title, hook, description, sources, license, creator_name, verification_status, status, report_count, review_note, translations").in("status", ["published", "review"]).neq("verification_status", "verified").order("id").range(from, to)),
  ]);
  const q = { data: qRows };
  const v = { data: vRows };
  type QA = { correct_index: number; explanation: string; translations?: Record<string, { explanation?: string }> };
  type QT = Record<string, { question: string; options: string[]; hints?: string[] }> | null;
  type VT = Record<string, { title: string; hook: string; description?: string }> | null;
  const items: ReviewItem[] = [
    ...(q.data ?? []).map((r) => {
      const a = (Array.isArray(r.question_answers) ? r.question_answers[0] : r.question_answers) as QA | null;
      const en = (r.translations as QT)?.en;
      return { kind: "question" as const, id: r.id, categoryId: r.category_id, title: r.question, options: r.options as string[], correctIndex: a?.correct_index, body: a?.explanation ?? "", sourceName: r.source_name, sourceUrl: r.source_url, verification: r.verification_status, status: r.status, reports: r.report_count, note: r.review_note, hints: r.hints ?? undefined,
        en: en ? { title: en.question, options: en.options, body: a?.translations?.en?.explanation ?? "", hints: en.hints } : undefined };
    }),
    ...(v.data ?? []).map((r) => {
      const src = (r.sources as { name: string; url: string }[])[0];
      const en = (r.translations as VT)?.en;
      return { kind: "video" as const, id: r.id, categoryId: r.category_id, title: r.title, body: [r.hook, r.description, r.creator_name && `© ${r.creator_name}`, r.license].filter(Boolean).join(" · "), sourceName: src?.name ?? null, sourceUrl: src?.url ?? null, verification: r.verification_status, status: r.status, reports: r.report_count, note: r.review_note,
        en: en ? { title: en.title, body: [en.hook, en.description].filter(Boolean).join(" · ") } : undefined };
    }),
  ];
  return items.sort((a, b) => Number(b.status === "review") - Number(a.status === "review") || b.reports - a.reports);
}

export async function adminReview(kind: "question" | "video", id: string, action: "approve" | "withdraw", note?: string) {
  const { error } = await db().rpc("admin_review", { p_kind: kind, p_id: id, p_action: action, p_note: note ?? null });
  if (error) throw error;
}

export type ReviewKind = "question" | "video" | "book" | "animation" | "visual" | "fact";
export interface ContentReview {
  kind: ReviewKind;
  id: string;
  decision: "approved" | "change";
  note: string | null;
  content_hash: string | null;
  reviewed_at: string;
}

/** Which bundled pieces an editor approved, and for which version (public; no notes). */
export async function fetchApprovals(): Promise<{ kind: string; id: string; content_hash: string | null }[]> {
  const { data, error } = await db().from("content_reviews").select("kind, id, content_hash").eq("decision", "approved");
  if (error) throw error;
  return data ?? [];
}

/** All editorial decisions including notes – editors only. */
export async function fetchContentReviews(): Promise<ContentReview[]> {
  const { data, error } = await db().rpc("admin_content_reviews");
  if (error) throw error;
  return (data ?? []) as ContentReview[];
}

/** Records an editorial decision: approve a version, or ask for a change (with a note). */
export async function reviewContent(kind: ReviewKind, id: string, decision: "approved" | "change", note?: string, hash?: string) {
  const { error } = await db().rpc("review_content", { p_kind: kind, p_id: id, p_decision: decision, p_note: note ?? null, p_hash: hash ?? null });
  if (error) throw error;
}
