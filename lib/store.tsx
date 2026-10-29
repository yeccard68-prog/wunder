"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { evaluate, type FormatResponse } from "./formats";
import type { AgeBand, AnswerContext, AnswerRecord, AnswerResult, Item, LogEntry, UserState } from "./types";
import { forAudience, type Clip, type Content } from "./content";
import { detectLocale, translate } from "./i18n";
import { XP, applyActivity, dueAt, isDue, levelInfo, newAchievements, today, weekKey, BOX_MS } from "./gamification";
import * as api from "./supabase";
import { deviceRegion } from "./region";
import { mergeBookState } from "./books";
import { setApprovals } from "./reviews";
import { recordView, type EntryKind } from "./engagement";
import { recordSeen, SEEN_MIN_SECONDS } from "./seen";

// Two separate worlds: "demo" (no backend, local sample data) and "live" (Supabase).
// They never share storage, and live mode never falls back to bundled content.
const MODE: "demo" | "live" = api.isLive ? "live" : "demo";
const STATE_KEY = `wunder.${MODE}.state.v3`;
/** Generated cards kept on the device at most (older portions make room for new ones). */
const GENERATED_MAX = 600;
const AGE_OF: Record<AgeBand, number> = { "6-9": 6, "10-12": 10, "13-15": 13, "16+": 16 };
const CONTENT_KEY = "wunder.live.content.v1";

const blank = (): UserState => ({
  onboarded: false,
  username: "",
  interests: [],
  goalMinutes: 5,
  motivation: "discover",
  ageBand: null,
  xp: 0,
  week: { key: weekKey(), xp: 0 },
  answers: {},
  clipStats: {},
  comments: {},
  books: { read: [], saved: [] },
  likes: [],
  saves: [],
  hidden: [],
  reported: [],
  blocked: [],
  following: [],
  daily: { date: "", count: 0 },
  streak: { current: 0, best: 0, lastDate: null },
  dailyChallenge: { date: "", score: null },
  challenges: [],
  achievements: [],
  log: [],
  settings: { theme: "system", privateProfile: false, muted: true, captions: true, locale: "de" },
});

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked – keep working in memory */
  }
}

/** Server stats → the matching fields of the local state. */
const fromStats = (st: api.ServerStats): Partial<UserState> => ({
  xp: st.xp,
  week: { key: st.week_start, xp: st.week_xp },
  streak: { current: st.streak_current, best: st.streak_best, lastDate: st.streak_last_date },
  daily: { date: st.today, count: st.today_answered },
  dailyChallenge: { date: st.challenge_date ?? "", score: st.challenge_score },
});

/** Full restore from the server. Device-only preferences (theme, sound, demo community) are kept. */
function fromServer(local: UserState, s: api.ServerState): UserState {
  const answers: Record<string, AnswerRecord> = {};
  for (const p of s.progress)
    answers[p.question_id] = { correct: p.last_correct, at: p.updated_at, categoryId: p.category_id, difficulty: p.difficulty, box: p.review_box, due: p.review_due, reviews: p.successful_reviews, correctIndex: p.correct_index, explanation: p.explanation };
  const all = [...s.question_reactions.map((r) => ({ id: r.question_id, ...r })), ...s.video_progress.map((v) => ({ id: v.video_id, ...v }))];
  const ids = (flag: "liked" | "saved" | "hidden" | "reported") => all.filter((r) => r[flag]).map((r) => r.id);
  return {
    ...local,
    ...fromStats(s.stats),
    onboarded: s.profile.onboarded,
    username: s.profile.display_name,
    interests: s.profile.interests,
    goalMinutes: s.profile.goal_minutes,
    motivation: (s.profile.motivation as UserState["motivation"]) ?? "discover",
    ageBand: s.profile.age_band,
    // a brand-new guest keeps the language detected on the device until onboarding saves it
    settings: { ...local.settings, privateProfile: s.profile.is_private, locale: s.profile.onboarded ? s.profile.locale : local.settings.locale },
    answers,
    likes: ids("liked"),
    saves: ids("saved"),
    hidden: ids("hidden"),
    reported: ids("reported"),
    clipStats: Object.fromEntries(s.video_progress.map((v) => [v.video_id, { plays: v.plays, completed: v.completions }])),
  };
}

const message = (e: unknown) => {
  const m = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e);
  if (/anonymous sign-ins are disabled/i.test(m)) return "Gast-Anmeldung ist im Backend noch nicht aktiviert (Supabase → Authentication → Anonymous sign-ins).";
  if (/failed to fetch|network|load failed/i.test(m)) return "Keine Verbindung zum Server.";
  return m;
};

export interface Toast {
  id: number;
  text: string;
  tone: "xp" | "info";
}
export interface AuthInfo {
  mode: "demo" | "live";
  userId: string | null;
  email: string | null;
  isGuest: boolean;
}
/** A quiz session requested from another screen (home banner, friend profile). */
export type Launch = { mode: "review" } | { mode: "challenge"; opponentId: string };

interface Store {
  status: "loading" | "ready" | "error";
  ready: boolean;
  error: string | null;
  retry: () => void;
  /** true when content or progress comes from the device cache because the server is unreachable */
  stale: boolean;
  auth: AuthInfo;
  items: Item[]; // feed items (video quizzes live on their clip)
  clips: Clip[];
  state: UserState;
  toasts: Toast[];
  launch: Launch | null;
  setLaunch: (l: Launch | null) => void;
  getState: () => UserState;
  toast: (text: string, tone?: Toast["tone"]) => void;
  /** Resolves with the result, or null if the answer could not be saved. */
  /** `response` is given for order / estimate / blank questions; `selected` is ignored then. */
  answer: (item: Item, selected: number, context?: AnswerContext, response?: FormatResponse) => Promise<AnswerResult | null>;
  /** Clip questions: judges a first try without revealing the solution. null = could not be checked. */
  toggle: (list: "likes" | "saves", item: { id: string }) => void;
  hide: (item: { id: string }, report?: boolean) => void;
  trackClip: (id: string, event: "play" | "complete") => void;
  /** How long an entry was on screen in the feed – the feed learns from it (kept on this device only). */
  trackView: (categoryId: string, kind: EntryKind, seconds: number, ids?: string | string[]) => void;
  /** Reaction to a "did you know" fact. */
  reactFact: (id: string, reaction: "wow" | "known") => void;
  addComment: (clipId: string, text: string) => void;
  toggleFollow: (personId: string) => void;
  block: (personId: string) => void;
  recordChallenge: (opponentId: string, mine: number, theirs: number) => void;
  update: (patch: Partial<UserState>) => void;
  share: (text: string) => void;
  registerEmail: (email: string) => Promise<void>;
  signInEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Deletes the account (live) or the local data (demo). */
  reset: () => Promise<void>;
  /** Loads another portion of generated cards (e.g. when the feed runs out). */
  loadMore: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Store["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [auth, setAuth] = useState<AuthInfo>({ mode: MODE, userId: null, email: null, isGuest: true });
  const [content, setContent] = useState<Content>({ items: [], clips: [] });
  const [generated, setGenerated] = useState<Item[]>([]); // generated cards loaded so far (portions, see loadMore)
  const loadingMore = useRef(false);
  const [state, setState] = useState<UserState>(blank);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [launch, setLaunch] = useState<Launch | null>(null);
  const ref = useRef(state);
  const authRef = useRef(auth);
  // what this user sees: their language, their age level
  const { items, clips } = useMemo(() => forAudience({ ...content, items: [...content.items, ...generated] }, state.settings.locale, state.ageBand), [content, generated, state.settings.locale, state.ageBand]);
  const clipsRef = useRef(content.clips);
  const tr = useCallback((key: string, vars?: Record<string, string | number>) => translate(ref.current.settings.locale, key, vars), []);
  const resetting = useRef(false);
  authRef.current = auth;
  clipsRef.current = content.clips;

  const toast = useCallback((text: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  /** Single write path: applies a change, then announces XP, level-ups and badges. */
  const commit = useCallback(
    (fn: (s: UserState) => UserState, opts: { addXp?: number; log?: Omit<LogEntry, "at">; silent?: boolean } = {}) => {
      const prev = ref.current;
      let next = fn(prev);
      const at = new Date().toISOString();
      const log = [...next.log];
      if (opts.log) log.unshift({ ...opts.log, at });
      if (opts.addXp) {
        const wk = weekKey();
        next = { ...next, xp: next.xp + opts.addXp, week: { key: wk, xp: (next.week.key === wk ? next.week.xp : 0) + opts.addXp } };
      }
      const gained = next.xp - prev.xp;
      const lvl = levelInfo(next.xp).level;
      const earned = newAchievements(next);
      if (!opts.silent) {
        if (gained > 0) toast(`+${gained} XP`, "xp");
        const tr = (k: string, v?: Record<string, string | number>) => translate(next.settings.locale, k, v);
        if (lvl > levelInfo(prev.xp).level) {
          toast(tr("Level {n} erreicht", { n: lvl }));
          log.unshift({ type: "level", text: tr("Level {n} erreicht", { n: lvl }), at });
        }
        for (const a of earned) {
          toast(tr("Abzeichen: {name}", { name: tr(a.name) }));
          log.unshift({ type: "badge", text: tr("Abzeichen „{name}“ erhalten", { name: tr(a.name) }), at });
        }
      }
      next = { ...next, achievements: [...next.achievements, ...earned.map((a) => a.id)], log: log.slice(0, 30) };
      ref.current = next;
      setState(next);
      return next;
    },
    [toast]
  );

  // ---------- startup ----------
  const booting = useRef<Promise<void> | null>(null);
  /** Never run two startups at once – a second guest account would be created. */
  const boot = useCallback((): Promise<void> => {
    booting.current ??= start().finally(() => (booting.current = null));
    return booting.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const start = useCallback(async () => {
    setStatus("loading");
    setError(null);
    if (MODE === "demo") {
      // The answer key exists only in demo builds: with a backend URL the bundler drops this branch, so the
      // file is not even published as a chunk someone could download (it would give away duel answers).
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { demoContent } = await import("./demo-content");
        setContent(demoContent());
      }
      const cached = load<{ state: UserState }>(STATE_KEY);
      if (cached) commit(() => ({ ...blank(), ...cached.state, settings: { ...blank().settings, ...cached.state.settings } }), { silent: true });
      else commit((s) => ({ ...s, settings: { ...s.settings, locale: detectLocale() } }), { silent: true });
      setStatus("ready");
      return;
    }
    // live: content must come from the backend; the device cache is only an offline fallback
    let content = load<Content>(CONTENT_KEY);
    let offline = false;
    try {
      content = await api.fetchContent();
      save(CONTENT_KEY, content);
    } catch (e) {
      if (!content) {
        setError(message(e));
        setStatus("error");
        return;
      }
      offline = true;
    }
    setContent(content);
    // which books, animations and visualisations an editor has approved (in exactly this version)
    try {
      setApprovals(await api.fetchApprovals());
    } catch {
      /* offline or not yet set up: everything simply shows its own status */
    }
    const cached = load<{ userId: string; state: UserState }>(STATE_KEY);
    try {
      const user = await api.ensureUser();
      const info: AuthInfo = { mode: "live", userId: user.id, email: user.email ?? null, isGuest: !!user.is_anonymous };
      authRef.current = info;
      setAuth(info);
      const fresh = blank();
      const mine = cached?.userId === user.id ? { ...fresh, ...cached.state, settings: { ...fresh.settings, ...cached.state.settings } } : { ...fresh, settings: { ...fresh.settings, locale: detectLocale() } };
      const server = await api.fetchMyState(today(), mine.settings.locale);
      commit(() => fromServer(mine, server), { silent: true });
      // book learning state: join what this device knows with what the account has stored
      try {
        const stored = await api.fetchBookState(user.id);
        const merged = mergeBookState(ref.current.books, stored);
        commit((s) => ({ ...s, books: merged }), { silent: true });
        if (JSON.stringify(merged) !== JSON.stringify(mergeBookState(stored, null))) await api.saveBookState(user.id, merged);
      } catch (e) {
        console.warn("Sync fehlgeschlagen:", message(e));
      }
    } catch (e) {
      // Known user on this device and server unreachable → continue with the cached copy, clearly marked.
      if (!cached || !/verbindung/i.test(message(e))) {
        setError(message(e));
        setStatus("error");
        return;
      }
      setAuth((a) => ({ ...a, userId: cached.userId }));
      commit(() => ({ ...blank(), ...cached.state }), { silent: true });
      offline = true;
    }
    setStale(offline);
    setStatus("ready");
  }, [commit]);

  useEffect(() => {
    boot();
    if (!api.supabase) return;
    // A different user signed in (email link) or signed out → reload their state.
    const { data } = api.supabase.auth.onAuthStateChange((event, session) => {
      const current = authRef.current;
      if (resetting.current) return; // reset() restarts the app itself
      if (event === "SIGNED_OUT" && current.userId) {
        ref.current = blank();
        setState(ref.current);
        setTimeout(boot, 0);
      } else if (session && current.userId && session.user.id !== current.userId) {
        setTimeout(boot, 0);
      } else if (session && current.userId) {
        setAuth((a) => ({ ...a, email: session.user.email ?? null, isGuest: !!session.user.is_anonymous }));
      }
    });
    return () => data.subscription.unsubscribe();
  }, [boot]);

  useEffect(() => {
    if (status === "ready") save(STATE_KEY, { userId: auth.userId, state });
  }, [state, status, auth.userId]);

  useEffect(() => {
    const t = state.settings.theme;
    if (t === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
  }, [state.settings.theme]);

  /** Background sync for non-score data (likes, saves, watch signals, profile). */
  const sync = useCallback((fn: (userId: string) => Promise<void>) => {
    const uid = authRef.current.userId;
    if (MODE !== "live" || !uid) return;
    fn(uid).catch((e) => console.warn("Sync fehlgeschlagen:", message(e)));
  }, []);
  const isClip = (id: string) => clipsRef.current.some((c) => c.id === id);

  // ---------- answering ----------
  const answer = useCallback(
    async (item: Item, selected: number, context: AnswerContext = "feed", response?: FormatResponse): Promise<AnswerResult | null> => {
      const at = new Date().toISOString();
      if (MODE === "live") {
        try {
          const res = response ? await api.submitResponse(item.id, response, context, today(), ref.current.settings.locale) : await api.submitAnswer(item.id, selected, context, today(), ref.current.settings.locale);
          const rec: AnswerRecord = { correct: res.last_correct, at, categoryId: item.categoryId, difficulty: item.difficulty, box: res.review_box, due: res.review_due, reviews: res.successful_reviews, correctIndex: res.correct_index, explanation: res.explanation };
          commit((s) => ({ ...s, ...fromStats(res.stats), answers: { ...s.answers, [item.id]: rec } }));
          return { correct: res.correct, correctIndex: res.correct_index, explanation: res.explanation, xp: res.xp_earned, answer: res.answer };
        } catch (e) {
          toast(tr("Antwort nicht gespeichert: {reason}", { reason: tr(message(e)) }));
          return null;
        }
      }
      // demo mode: same rules, evaluated locally
      const prev = ref.current.answers[item.id];
      const correctIndex = item.correctIndex ?? -1;
      const explanation = item.explanation ?? "";
      const correct = response ? evaluate(item.kind, item.answerKey, response) : selected === correctIndex;
      const base = { at, categoryId: item.categoryId, difficulty: item.difficulty, correctIndex, explanation };
      let xp = 0;
      let rec: AnswerRecord;
      let counts = true; // counts toward daily goal + streak
      if (!prev) {
        xp = item.kind === "fact" ? (correct ? XP.claim : 0) : XP.first(correct, item.difficulty);
        rec = { ...base, correct, box: correct ? null : 0, due: correct ? null : dueAt(0), reviews: 0 };
      } else if (isDue(prev.due)) {
        const box = (prev.box ?? 0) + 1;
        if (correct) {
          xp = XP.review;
          rec = { ...prev, ...base, correct, reviews: prev.reviews + 1, box: box < BOX_MS.length ? box : null, due: box < BOX_MS.length ? dueAt(box) : null };
        } else rec = { ...prev, ...base, correct, box: 0, due: dueAt(0) };
      } else {
        counts = false; // practice replay: no XP; a miss still schedules a review
        rec = correct ? prev : { ...prev, ...base, correct, box: 0, due: dueAt(0) };
      }
      commit((st) => ({ ...st, answers: { ...st.answers, [item.id]: rec }, ...(counts ? applyActivity(st) : {}) }), { addXp: xp });
      return { correct, correctIndex, explanation, xp, answer: item.answerKey };
    },
    [commit, toast, tr]
  );

  const recordChallenge = useCallback(
    (opponentId: string, mine: number, theirs: number) => {
      const date = today();
      const repeat = ref.current.challenges.some((c) => c.opponentId === opponentId && c.date === date);
      // The community is still simulated: a win bonus exists only in demo mode, the server never awards it.
      const bonus = MODE === "demo" && mine > theirs && !repeat ? XP.challengeWin : 0;
      commit((s) => ({ ...s, challenges: [{ opponentId, date, mine, theirs }, ...s.challenges].slice(0, 20) }), {
        addXp: bonus,
        log: { type: "challenge", text: tr(mine > theirs ? "Challenge gewonnen ({a}:{b})" : mine === theirs ? "Challenge unentschieden ({a}:{b})" : "Challenge verloren ({a}:{b})", { a: mine, b: theirs }) },
      });
    },
    [commit]
  );

  // ---------- reactions & watch signals ----------
  const toggle = useCallback(
    (list: "likes" | "saves", item: { id: string }) => {
      const on = !ref.current[list].includes(item.id);
      commit((s) => ({ ...s, [list]: on ? [...s[list], item.id] : s[list].filter((x) => x !== item.id) }));
      const flags = list === "likes" ? { liked: on } : { saved: on };
      sync((uid) => (isClip(item.id) ? api.setVideoProgress(uid, item.id, flags) : api.setQuestionReaction(uid, item.id, flags)));
      if (list === "saves") toast(tr(on ? "Gemerkt" : "Entfernt"));
    },
    [commit, sync, toast]
  );

  const hide = useCallback(
    (item: { id: string }, report = false) => {
      commit((s) => ({ ...s, hidden: [...s.hidden, item.id], reported: report ? [...s.reported, item.id] : s.reported }));
      const flags = report ? { hidden: true, reported: true } : { hidden: true };
      sync((uid) => (isClip(item.id) ? api.setVideoProgress(uid, item.id, flags) : api.setQuestionReaction(uid, item.id, flags)));
      toast(tr(report ? "Danke – wir prüfen den Inhalt" : "Verstanden, weniger davon"));
    },
    [commit, sync, toast]
  );

  const trackClip = useCallback(
    (id: string, event: "play" | "complete") => {
      const next = commit((s) => {
        const st = s.clipStats[id] ?? { plays: 0, completed: 0 };
        return { ...s, clipStats: { ...s.clipStats, [id]: event === "play" ? { ...st, plays: st.plays + 1 } : { ...st, completed: st.completed + 1 } } };
      });
      const st = next.clipStats[id];
      sync((uid) => api.setVideoProgress(uid, id, { plays: st.plays, completions: st.completed }));
    },
    [commit, sync]
  );

  const trackView = useCallback(
    (categoryId: string, kind: EntryKind, seconds: number, ids?: string | string[]) => {
      if (!categoryId || seconds <= 0) return;
      const list = ids === undefined ? [] : Array.isArray(ids) ? ids : [ids];
      commit((s) => ({ ...s, signals: recordView(s.signals, categoryId, kind, seconds), seen: seconds >= SEEN_MIN_SECONDS ? list.reduce((seen, id) => recordSeen(seen, id), s.seen) : s.seen }), { silent: true });
    },
    [commit]
  );
  const reactFact = useCallback(
    (id: string, reaction: "wow" | "known") =>
      commit((s) => {
        const f = s.facts ?? { wow: [], known: [] };
        const other = reaction === "wow" ? "known" : "wow";
        const on = f[reaction].includes(id);
        return { ...s, facts: { ...f, [reaction]: on ? f[reaction].filter((x) => x !== id) : [...f[reaction], id], [other]: f[other].filter((x) => x !== id) } };
      }),
    [commit]
  );

  const addComment = useCallback(
    (clipId: string, text: string) => commit((s) => ({ ...s, comments: { ...s.comments, [clipId]: [...(s.comments[clipId] ?? []), text] } })),
    [commit]
  );

  const toggleFollow = useCallback(
    (id: string) => commit((s) => ({ ...s, following: s.following.includes(id) ? s.following.filter((x) => x !== id) : [...s.following, id] })),
    [commit]
  );

  const block = useCallback(
    (id: string) => {
      commit((s) => ({ ...s, blocked: [...s.blocked, id], following: s.following.filter((x) => x !== id) }));
      toast(tr("Profil gemeldet und blockiert"));
    },
    [commit, toast]
  );

  // ---------- profile & account ----------
  const bookTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const update = useCallback(
    (patch: Partial<UserState>) => {
      const before = ref.current.settings.locale;
      const next = commit((s) => ({ ...s, ...patch }));
      if ("books" in patch && MODE === "live" && authRef.current.userId) {
        // several taps in a row are written once
        if (bookTimer.current) clearTimeout(bookTimer.current);
        bookTimer.current = setTimeout(() => {
          const uid = authRef.current.userId;
          if (uid) api.saveBookState(uid, ref.current.books).catch((e) => console.warn("Sync fehlgeschlagen:", message(e)));
        }, 1200);
      }
      if ("username" in patch || "interests" in patch || "onboarded" in patch || "goalMinutes" in patch || "motivation" in patch || "settings" in patch || "ageBand" in patch || "heardFrom" in patch) {
        const uid = authRef.current.userId;
        if (MODE === "live" && uid)
          api
            .saveProfile(uid, { display_name: next.username || "Neugierig", interests: next.interests, onboarded: next.onboarded, goal_minutes: next.goalMinutes, motivation: next.motivation, is_private: next.settings.privateProfile, locale: next.settings.locale, age_band: next.ageBand, ...(next.heardFrom ? { heard_from: next.heardFrom } : {}) })
            // explanations of answered cards are stored per language → reload them after a language switch
            .then(async () => {
              if (next.settings.locale === before || !next.onboarded) return;
              const server = await api.fetchMyState(today(), next.settings.locale); // quietly, without a loading screen
              commit((s) => fromServer(s, server), { silent: true });
            })
            .catch((e) => console.warn("Sync fehlgeschlagen:", message(e)));
      }
    },
    [commit]
  );

  const share = useCallback(
    async (text: string) => {
      try {
        if (navigator.share) await navigator.share({ text });
        else {
          await navigator.clipboard.writeText(text);
          toast(tr("In die Zwischenablage kopiert"));
        }
      } catch {
        /* user cancelled */
      }
    },
    [toast]
  );

  const registerEmail = useCallback(async (email: string) => api.linkEmail(email), []);
  const signInEmail = useCallback(async (email: string) => api.signInWithEmail(email), []);
  const signOut = useCallback(async () => {
    localStorage.removeItem(STATE_KEY);
    await api.signOut(); // → SIGNED_OUT event starts a fresh guest session
  }, []);

  const reset = useCallback(async () => {
    resetting.current = true;
    try {
      if (MODE === "live") {
        try {
          await api.deleteAccount();
        } catch (e) {
          toast(tr("Löschen fehlgeschlagen: {reason}", { reason: tr(message(e)) }));
          return;
        }
      }
      localStorage.removeItem(STATE_KEY);
      ref.current = blank();
      setState(ref.current);
      if (MODE === "live") setAuth({ mode: "live", userId: null, email: null, isGuest: true });
      await boot();
    } finally {
      resetting.current = false;
    }
  }, [boot, toast]);

  const getState = useCallback(() => ref.current, []);

  /** One more portion of generated cards (live mode only; at most GENERATED_MAX on the device at a time). */
  const loadMore = useCallback(async () => {
    if (MODE !== "live" || loadingMore.current) return;
    loadingMore.current = true;
    try {
      const s = ref.current;
      const have = new Set(content.items.map((i) => i.id));
      const exclude = [...new Set([...generated.map((i) => i.id), ...Object.keys(s.answers).filter((id) => !have.has(id))])].slice(-1500);
      const more = await api.fetchGenerated({ categories: s.interests, region: deviceRegion(), age: AGE_OF[s.ageBand ?? "16+"], exclude });
      if (more.length) setGenerated((g) => [...g, ...more.filter((m) => !g.some((x) => x.id === m.id))].slice(-GENERATED_MAX));
    } catch (e) {
      console.warn("Weitere Karten konnten nicht geladen werden:", message(e));
    } finally {
      loadingMore.current = false;
    }
  }, [content.items, generated]);
  // the first portion as soon as the hand-made content is there
  useEffect(() => {
    if (status === "ready" && MODE === "live" && !generated.length) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <Ctx.Provider
      value={{ status, ready: status === "ready", error, retry: boot, stale, auth, items, clips, state, toasts, launch, setLaunch, getState, toast, answer, toggle, hide, trackClip, trackView, reactFact, addComment, toggleFollow, block, recordChallenge, update, share, registerEmail, signInEmail, signOut, reset, loadMore }}
    >
      {children}
    </Ctx.Provider>
  );
}

/** Translation function for the user's language: t("Deutscher Text", { n: 3 }). */
export function useT() {
  const locale = useStore().state.settings.locale;
  return useCallback((key: string, vars?: Record<string, string | number>) => translate(locale, key, vars), [locale]);
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
