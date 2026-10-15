"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bot, Check, Clock, Flag, Link2, RotateCcw, Shuffle, Swords, Trophy, X } from "lucide-react";
import { Avatar, Bar, Button, Empty, Sheet } from "@/components/ui";
import { categoryById } from "@/lib/categories";
import { isChild } from "@/lib/content";
import {
  createPractice, duelPool, duelRecord, PER_ROUND, practiceAnswer, practiceBot, practicePick, practiceView, SECONDS_PER_QUESTION,
  type DuelAnswer, type DuelAnswerResult, type DuelSummary, type DuelView, type PracticeDuel,
} from "@/lib/duel";
import { linkOrigin } from "@/lib/native";
import { useStore, useT } from "@/lib/store";
import * as api from "@/lib/supabase";

type T = ReturnType<typeof useT>;
const LETTERS = ["A", "B", "C", "D"];
const PRACTICE_KEY = "wunder.duel.practice.v1";
const POLL_MS = 10_000;

// practice duels live on the device only
function loadPractice(): PracticeDuel[] {
  try {
    return JSON.parse(window.localStorage.getItem(PRACTICE_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function savePractice(list: PracticeDuel[]) {
  try {
    window.localStorage.setItem(PRACTICE_KEY, JSON.stringify(list.slice(0, 10)));
  } catch {
    /* private mode: the duel still works until the page is closed */
  }
}

/** Server errors in plain words. */
function explain(e: unknown, t: T) {
  const m = String((e as { message?: string })?.message ?? e);
  if (/not available for this age/.test(m)) return t("Duelle gegen andere gibt es ab 13 Jahren.");
  if (/too many open duels/.test(m)) return t("Du hast schon 20 offene Duelle – spiel erst ein paar zu Ende.");
  if (/duel closed|no rematch/.test(m)) return t("Dieses Duell ist schon voll oder beendet.");
  if (/duel not found/.test(m)) return t("Dieses Duell gibt es nicht (mehr). Prüf den Code.");
  if (/not your turn|in order/.test(m)) return t("Gerade ist dein Gegner dran.");
  if (/failed to fetch|network|load failed/i.test(m)) return t("Keine Verbindung zum Server.");
  return t("Das hat nicht geklappt. Bitte versuch es noch einmal.");
}

const colorFor = (name: string | null) => {
  if (!name) return "var(--muted)";
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 45% 48%)`;
};

function opponentName(d: Pick<DuelView, "kind" | "opponent">, t: T) {
  if (d.kind === "practice") return t("Übungsgegner");
  if (d.opponent.name) return d.opponent.name;
  if (!d.opponent.joined) return d.kind === "invite" ? t("Einladung offen") : t("Gegner wird gesucht");
  return t("Gegner");
}

function statusLine(d: DuelSummary, t: T) {
  if (d.status === "expired") return t("Abgelaufen – niemand hat mitgespielt");
  if (d.status === "declined") return t("Abgelehnt");
  if (d.result) return { win: t("Gewonnen"), loss: t("Verloren"), draw: t("Unentschieden") }[d.result];
  if (d.next.mine) return d.next.action === "pick" ? t("Du bist dran: Thema wählen") : t("Du bist dran: Runde {n}", { n: d.next.round ?? 1 });
  if (d.next.action === "join") return d.kind === "invite" ? t("Warte, bis jemand deine Einladung annimmt") : t("Warte auf einen Gegner");
  return t("Dein Gegner ist dran");
}

// ---------- the scoreboard: three rounds, three dots each ----------
function Dots({ answers, hidden }: { answers: DuelAnswer[] | null; hidden?: boolean }) {
  return (
    <span className="flex gap-1">
      {Array.from({ length: PER_ROUND }, (_, i) => {
        const a = answers?.[i];
        const cls = hidden ? "bg-raised text-muted" : !a ? "bg-raised" : a.correct ? "bg-good text-white" : "bg-bad text-white";
        return (
          <span key={i} className={`flex h-5 w-5 items-center justify-center rounded-full ${cls}`}>
            {hidden ? <span className="text-[10px] font-bold">?</span> : a ? a.correct ? <Check size={11} /> : <X size={11} /> : null}
          </span>
        );
      })}
    </span>
  );
}

function Board({ view, t }: { view: DuelView; t: T }) {
  const name = opponentName(view, t);
  return (
    <section className="card p-4" data-testid="duel-board">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={t("Du")} color="var(--accent)" size={34} />
          <span className="truncate font-semibold">{t("Du")}</span>
        </span>
        <span className="tnum font-display text-3xl font-semibold" data-testid="duel-score">
          {view.score.mine} : {view.score.theirs}
        </span>
        <span className="flex min-w-0 items-center justify-end gap-2">
          <span className="truncate text-right font-semibold">{name}</span>
          {view.kind === "practice" ? (
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-raised"><Bot size={18} /></span>
          ) : (
            <Avatar name={view.opponent.name ?? "?"} color={colorFor(view.opponent.name)} size={34} />
          )}
        </span>
      </div>
      <ol className="mt-4 space-y-2">
        {view.rounds.map((r) => (
          <li key={r.round} className="flex items-center justify-between gap-2 text-sm">
            <Dots answers={r.mine} />
            <span className="min-w-0 flex-1 truncate text-center text-xs font-semibold" style={{ color: r.category ? categoryById(r.category).color : undefined }}>
              {r.category ? t(categoryById(r.category).name) : <span className="text-muted">{t("Runde {n}", { n: r.round })}</span>}
            </span>
            <Dots answers={r.theirs} hidden={r.theirs === null && r.theirsDone} />
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---------- one round: three questions against the clock ----------
function Round({ view, round, onAnswer, onDone, t }: { view: DuelView; round: number; onAnswer: (idx: number, selected: number | null) => Promise<DuelAnswerResult>; onDone: () => void | Promise<void>; t: T }) {
  const r = view.rounds[round - 1];
  const [idx, setIdx] = useState(r.mine.length);
  const [finishing, setFinishing] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<DuelAnswerResult | null>(null);
  const [pending, setPending] = useState(false);
  const [left, setLeft] = useState(SECONDS_PER_QUESTION);
  const sent = useRef(false);
  const revealRef = useRef<HTMLDivElement>(null);
  const q = r.questions?.[idx];

  const send = useCallback(
    async (selected: number | null) => {
      if (sent.current) return;
      sent.current = true;
      setPicked(selected);
      setPending(true);
      try {
        setResult(await onAnswer(idx, selected));
      } catch {
        sent.current = false; // let them try again
        setPicked(null);
      } finally {
        setPending(false);
      }
    },
    [idx, onAnswer]
  );
  // on a phone the explanation and the next button sit below the options
  useEffect(() => {
    if (result) revealRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [result]);
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  // the clock: when it runs out, the question counts as not answered
  useEffect(() => {
    if (result || pending) return;
    const end = Date.now() + left * 1000;
    const timer = window.setInterval(() => {
      const rest = Math.max(0, (end - Date.now()) / 1000);
      setLeft(rest);
      if (rest === 0) {
        window.clearInterval(timer);
        void sendRef.current(null);
      }
    }, 100);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, result, pending]);

  if (!q) return null;
  const next = () => {
    if (idx + 1 >= PER_ROUND) {
      setFinishing(true);
      return void onDone();
    }
    sent.current = false;
    setIdx(idx + 1);
    setPicked(null);
    setResult(null);
    setLeft(SECONDS_PER_QUESTION);
  };
  const style = (i: number) => {
    if (!result) return pending ? (i === picked ? "border-ink/50 bg-raised animate-pulse" : "border-line opacity-50") : "border-line bg-surface hover:border-ink/30";
    if (i === result.correctIndex) return "border-good bg-good/10";
    if (i === picked) return "border-bad bg-bad/10 shake";
    return "border-line opacity-50";
  };
  const cat = r.category ? categoryById(r.category) : null;

  return (
    <section className="card p-5" data-testid="duel-question">
      <div className="mb-3 flex items-center justify-between text-xs font-semibold">
        <span className="uppercase tracking-wider" style={{ color: cat?.color }}>{cat ? t(cat.name) : ""}</span>
        <span className="tnum text-muted">{t("Frage {n} von {m}", { n: idx + 1, m: PER_ROUND })}</span>
      </div>
      <div className="mb-4 flex items-center gap-2" aria-label={t("Noch {n} Sekunden", { n: Math.ceil(left) })}>
        <Clock size={14} className={left < 5 && !result ? "text-bad" : "text-muted"} />
        <div className="flex-1"><Bar value={left / SECONDS_PER_QUESTION} color={left < 5 ? "var(--bad)" : "var(--accent)"} /></div>
        <span className="tnum w-6 text-right text-xs font-semibold text-muted">{Math.ceil(left)}</span>
      </div>
      <h2 className="font-display text-[1.35rem] font-semibold leading-[1.2] tracking-tight text-balance">{q.question}</h2>
      <div className="mt-5 space-y-2.5">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => send(i)} disabled={!!result || pending} className={`press flex min-h-[3.25rem] w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left text-[15px] font-medium ${style(i)}`}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${result && i === result.correctIndex ? "bg-good text-white" : result && i === picked ? "bg-bad text-white" : "bg-raised text-muted"}`}>
              {result && i === result.correctIndex ? <Check size={14} /> : result && i === picked ? <X size={14} /> : LETTERS[i]}
            </span>
            {opt}
          </button>
        ))}
      </div>
      {result && (
        <div ref={revealRef} className="rise mt-4 scroll-mb-24 rounded-2xl bg-raised p-4" aria-live="polite">
          <p className={`text-sm font-bold ${result.correct ? "text-good" : "text-bad"}`}>{result.correct ? t("Richtig!") : picked === null ? t("Zeit abgelaufen") : t("Leider falsch")}</p>
          <p className="mt-1 text-[15px] leading-relaxed">{result.explanation}</p>
          <Button className="mt-4 w-full" onClick={next} disabled={finishing}>
            {idx + 1 >= PER_ROUND ? t("Runde beenden") : t("Nächste Frage")}
          </Button>
        </div>
      )}
    </section>
  );
}

// ---------- one duel ----------
interface Actions {
  pick: (category: string) => Promise<void>;
  answer: (round: number, idx: number, selected: number | null) => Promise<DuelAnswerResult>;
  resign: () => Promise<void>;
  decline?: () => Promise<void>;
  report?: (reason: "name" | "cheating" | "other") => Promise<void>;
  rematch: () => Promise<void>;
  refresh: () => Promise<void>;
}

function DuelScreen({ view, actions, onBack, t }: { view: DuelView; actions: Actions; onBack: () => void; t: T }) {
  const { toast, share } = useStore();
  const [playing, setPlaying] = useState<number | null>(null); // the round being played
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  const closed = view.status === "finished" || view.status === "expired" || view.status === "declined";
  const { next } = view;
  const link = view.code ? `${linkOrigin()}/duel/?join=${view.code}` : "";
  const canDecline = !!actions.decline && view.role === "b" && view.status === "active" && view.rounds.every((r) => r.mine.length === 0);

  // waiting for the other player: look again every few seconds
  useEffect(() => {
    if (closed || next.mine || playing !== null || view.kind === "practice") return;
    const timer = window.setInterval(() => document.visibilityState === "visible" && void actions.refresh(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [closed, next.mine, playing, view.kind, actions]);
  const playingRound = playing !== null ? view.rounds[playing - 1] : null;

  const run = async (fn: () => Promise<void>, done?: string) => {
    setBusy(true);
    try {
      await fn();
      if (done) toast(done);
    } catch (e) {
      toast(explain(e, t));
    } finally {
      setBusy(false);
    }
  };
  const invite = () => share(t("Lust auf ein Quiz-Duell? Drei Runden, je drei Fragen: {link}", { link }));

  const round = next.round ? view.rounds[next.round - 1] : null;
  const headline = closed
    ? view.status === "expired" ? t("Abgelaufen") : view.status === "declined" ? t("Abgelehnt") : view.result === "win" ? t("Gewonnen!") : view.result === "loss" ? t("Verloren") : t("Unentschieden")
    : next.mine ? next.action === "pick" ? t("Wähle das Thema für Runde {n}", { n: next.round ?? 1 }) : t("Runde {n}: du bist dran", { n: next.round ?? 1 })
      : next.action === "join" ? view.kind === "invite" ? t("Warte auf deinen Gegner") : t("Gegner wird gesucht") : t("{name} ist dran", { name: opponentName(view, t) });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="press -ml-1 flex items-center gap-1.5 text-sm font-semibold text-muted">
          <ArrowLeft size={18} /> {t("Alle Duelle")}
        </button>
        {!closed && (
          <button onClick={() => setMenu(true)} className="press rounded-full px-3 py-1.5 text-sm font-semibold text-muted">
            {t("Optionen")}
          </button>
        )}
      </div>
      <h1 className="font-display text-2xl font-semibold leading-tight" data-testid="duel-headline">{headline}</h1>

      {playing !== null && playingRound?.questions ? (
        <Round
          view={view}
          round={playing}
          t={t}
          onAnswer={(idx, selected) => actions.answer(playing, idx, selected)}
          onDone={async () => {
            // keep the round on screen until the new state is in – otherwise the old one flashes up with "play round n"
            await actions.refresh();
            setPlaying(null);
          }}
        />
      ) : (
        <>
          <Board view={view} t={t} />

          {view.forfeit && <p className="text-center text-sm text-muted">{view.forfeit === "me" ? t("Du hast aufgegeben oder zu lange nicht gespielt.") : t("Dein Gegner hat aufgegeben oder zu lange nicht gespielt.")}</p>}

          {!closed && next.mine && next.action === "pick" && round?.offered && (
            <section className="space-y-2.5" aria-label={t("Thema wählen")}>
              {round.offered.map((c) => {
                const cat = categoryById(c);
                return (
                  <button key={c} disabled={busy} onClick={() => run(async () => { await actions.pick(c); setPlaying(next.round); })} className="press card flex w-full items-center gap-3 p-4 text-left font-semibold disabled:opacity-50">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: cat.color }} />
                    {t(cat.name)}
                  </button>
                );
              })}
              <p className="text-center text-xs text-muted">{t("Danach beantwortest du drei Fragen, je {n} Sekunden.", { n: SECONDS_PER_QUESTION })}</p>
            </section>
          )}
          {!closed && next.mine && next.action === "answer" && (
            <Button variant="accent" className="w-full" onClick={() => setPlaying(next.round)}>
              <Swords size={18} /> {round?.mine.length ? t("Weiterspielen") : t("Runde {n} spielen", { n: next.round ?? 1 })}
            </Button>
          )}

          {!closed && !view.opponent.joined && view.kind === "invite" && (
            <section className="card space-y-3 p-4">
              <p className="text-sm leading-relaxed">{t("Schick deinem Freund den Link. Mit dem Code kann er auch in der App beitreten.")}</p>
              <p className="tnum rounded-2xl bg-raised py-3 text-center font-display text-2xl font-semibold tracking-[0.25em]" data-testid="duel-code">{view.code}</p>
              <Button variant="secondary" className="w-full" onClick={invite}>
                <Link2 size={17} /> {t("Einladung teilen")}
              </Button>
            </section>
          )}
          {!closed && !next.mine && next.action !== "join" && view.kind !== "practice" && (
            <p className="flex items-center justify-center gap-2 text-sm text-muted"><Clock size={15} /> {t("Wir schauen regelmäßig nach – du kannst die Seite auch verlassen.")}</p>
          )}
          {!closed && next.action === "join" && view.kind === "random" && (
            <p className="text-center text-sm leading-relaxed text-muted">{t("Sobald jemand mitspielt, ist er dran. Findet sich in drei Tagen niemand, läuft das Duell ab.")}</p>
          )}

          {closed && (
            <div className="space-y-2.5">
              {view.status !== "expired" && view.opponent.joined && (
                <Button variant="accent" className="w-full" disabled={busy} onClick={() => run(actions.rematch)}>
                  <RotateCcw size={17} /> {t("Revanche")}
                </Button>
              )}
              <Button variant="secondary" className="w-full" onClick={onBack}>{t("Zur Übersicht")}</Button>
            </div>
          )}
          {closed && actions.report && view.opponent.joined && (
            <button onClick={() => setMenu(true)} className="press mx-auto flex h-10 items-center gap-2 px-3 text-sm text-muted">
              <Flag size={14} /> {t("Gegner melden")}
            </button>
          )}
        </>
      )}

      <Sheet open={menu} onClose={() => { setMenu(false); setConfirmResign(false); }} title={t("Optionen")}>
        <div className="space-y-2 pb-2">
          {canDecline && (
            <button disabled={busy} onClick={() => run(async () => { await actions.decline!(); setMenu(false); }, t("Duell abgelehnt"))} className="press flex h-14 w-full items-center gap-3 rounded-2xl bg-raised px-4 text-left font-semibold">
              <X size={18} /> {t("Duell ablehnen")}
            </button>
          )}
          {!closed && !canDecline && (
            confirmResign ? (
              <button disabled={busy} onClick={() => run(async () => { await actions.resign(); setMenu(false); })} className="press flex h-14 w-full items-center gap-3 rounded-2xl bg-bad/10 px-4 text-left font-semibold text-bad">
                <Flag size={18} /> {view.opponent.joined ? t("Wirklich aufgeben? Das zählt als Niederlage.") : t("Wirklich löschen?")}
              </button>
            ) : (
              <button onClick={() => setConfirmResign(true)} className="press flex h-14 w-full items-center gap-3 rounded-2xl bg-raised px-4 text-left font-semibold">
                <Flag size={18} /> {view.opponent.joined ? t("Aufgeben") : t("Duell löschen")}
              </button>
            )
          )}
          {actions.report && view.opponent.joined && (
            <>
              <p className="pt-3 text-xs font-semibold uppercase tracking-wider text-muted">{t("Gegner melden")}</p>
              {([["name", t("Unangemessener Name")], ["cheating", t("Schummeln")], ["other", t("Etwas anderes")]] as const).map(([reason, label]) => (
                <button key={reason} disabled={busy} onClick={() => run(async () => { await actions.report!(reason); setMenu(false); }, t("Gemeldet – ihr werdet nicht mehr zusammen gelost."))} className="press flex h-12 w-full items-center rounded-2xl bg-raised px-4 text-left text-sm font-semibold">
                  {label}
                </button>
              ))}
            </>
          )}
        </div>
      </Sheet>
    </div>
  );
}

// ---------- the page: list, new duels, one open duel ----------
export default function DuelPage() {
  const { auth, items, state, ready, toast } = useStore();
  const t = useT();
  const locale = state.settings.locale;
  const live = auth.mode === "live";
  const blocked = live && isChild(state.ageBand); // under 13: no duels against other people
  const pool = useMemo(() => duelPool(items), [items]);

  const [list, setList] = useState<DuelSummary[] | null>(null);
  const [practice, setPractice] = useState<PracticeDuel[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<DuelView | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");

  // ----- online duels -----
  const loadList = useCallback(async () => {
    if (!live || blocked || !auth.userId) return;
    try {
      setList(await api.fetchMyDuels());
    } catch (e) {
      toast(explain(e, t));
      setList((l) => l ?? []);
    }
  }, [live, blocked, auth.userId, toast, t]);

  const open = useCallback(async (id: string) => {
    setOpenId(id);
    window.history.replaceState(null, "", `/duel/?d=${id}`);
    window.scrollTo(0, 0);
  }, []);
  const close = useCallback(() => {
    setOpenId(null);
    setView(null);
    window.history.replaceState(null, "", "/duel/");
    void loadList();
  }, [loadList]);

  // ----- practice duels (demo mode) -----
  const practiceDuel = openId ? practice.find((p) => p.id === openId) : undefined;
  const storePractice = useCallback((d: PracticeDuel) => {
    setPractice((list) => {
      const next = [d, ...list.filter((x) => x.id !== d.id)];
      savePractice(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const known = new Set(pool.map((i) => i.id));
    // a practice duel whose questions are gone (other age level) cannot be shown any more
    setPractice(loadPractice().filter((d) => d.rounds.every((r) => (r.questionIds ?? []).every((id) => known.has(id)))));
    const params = new URLSearchParams(window.location.search);
    const join = params.get("join");
    const d = params.get("d");
    if (d) setOpenId(d);
    else if (join && live && !blocked && auth.userId) {
      setBusy(true);
      api.joinDuel(join).then(open, (e) => toast(explain(e, t))).finally(() => setBusy(false));
    } else if (join && !live) toast(t("Duelle gegen andere gibt es nur in der Live-Version."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, auth.userId]);

  useEffect(() => {
    if (ready) void loadList();
  }, [ready, loadList]);

  const refresh = useCallback(async () => {
    if (!openId) return;
    if (openId.startsWith("p")) return; // practice: derived from local state below
    try {
      setView(await api.fetchDuel(openId, locale));
    } catch (e) {
      toast(explain(e, t));
      close();
    }
  }, [openId, locale, toast, t, close]);

  useEffect(() => {
    if (openId && !openId.startsWith("p") && live) void refresh();
  }, [openId, live, refresh]);

  // the practice opponent takes its turn after a short pause
  useEffect(() => {
    if (!practiceDuel) return;
    const v = practiceView(practiceDuel, pool, locale);
    if (v.status !== "active" || v.next.role !== "b") return;
    const timer = window.setTimeout(() => storePractice(practiceBot(practiceDuel, pool)), 900);
    return () => window.clearTimeout(timer);
  }, [practiceDuel, pool, locale, storePractice]);

  const shown: DuelView | null = practiceDuel ? practiceView(practiceDuel, pool, locale) : view;
  const actions: Actions | null = useMemo(() => {
    if (practiceDuel) {
      let current = practiceDuel;
      return {
        pick: async (c) => {
          current = practicePick(current, c, pool);
          storePractice(current);
        },
        answer: async (round, idx, selected) => {
          const { duel, result } = practiceAnswer(current, "a", round, idx, selected, pool, locale);
          current = duel;
          storePractice(duel);
          return result;
        },
        resign: async () => storePractice({ ...current, resigned: true }),
        rematch: async () => {
          const d = createPractice(pool);
          storePractice(d);
          setOpenId(d.id);
        },
        refresh: async () => {},
      };
    }
    if (!openId || !view) return null;
    return {
      pick: (c) => api.pickDuelTopic(openId, c).then(refresh),
      answer: (round, idx, selected) => api.answerDuel(openId, round, idx, selected, locale),
      resign: async () => {
        await api.resignDuel(openId);
        if (view.opponent.joined) await refresh();
        else close();
      },
      decline: async () => {
        await api.declineDuel(openId);
        await refresh();
      },
      report: (reason) => api.reportDuel(openId, reason),
      rematch: async () => open(await api.rematchDuel(openId)),
      refresh,
    };
    // `current` must follow the stored duel, so the actions are rebuilt whenever it changes
  }, [practiceDuel, openId, view, pool, locale, storePractice, refresh, open, close]);

  const start = async (kind: "invite" | "random") => {
    setBusy(true);
    try {
      const r = await api.createDuel(kind);
      if (kind === "random") toast(r.joined ? t("Gegner gefunden!") : t("Du spielst schon mal vor – dein Gegner folgt."));
      await open(r.id);
    } catch (e) {
      toast(explain(e, t));
    } finally {
      setBusy(false);
    }
  };
  const startPractice = () => {
    if (pool.length < PER_ROUND * 3) return toast(t("Für ein Duell gibt es noch zu wenige Fragen."));
    const d = createPractice(pool);
    storePractice(d);
    void open(d.id);
  };
  const joinByCode = async () => {
    setBusy(true);
    try {
      await open(await api.joinDuel(code));
      setCode("");
    } catch (e) {
      toast(explain(e, t));
    } finally {
      setBusy(false);
    }
  };

  if (shown && actions) return <DuelScreen key={shown.id} view={shown} actions={actions} onBack={close} t={t} />;
  if (openId && !shown && live) return <p className="py-16 text-center text-sm text-muted" aria-busy>{t("Lädt")}</p>;

  const practiceList: DuelSummary[] = practice.map((p) => practiceView(p, pool, locale));
  const all = live ? list ?? [] : practiceList;
  const mine = all.filter((d) => (d.status === "open" || d.status === "active") && d.next.mine);
  const waiting = all.filter((d) => (d.status === "open" || d.status === "active") && !d.next.mine);
  const done = all.filter((d) => d.status !== "open" && d.status !== "active").slice(0, 10);
  const record = duelRecord(all);

  const Row = ({ d }: { d: DuelSummary }) => (
    <li>
      <button onClick={() => open(d.id)} className="press flex w-full items-center gap-3 py-3 text-left">
        {d.kind === "practice" ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised"><Bot size={18} /></span>
        ) : (
          <Avatar name={d.opponent.name ?? "?"} color={colorFor(d.opponent.name)} />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{opponentName(d, t)}</span>
          <span className={`block truncate text-sm ${d.next.mine ? "font-semibold text-accent" : "text-muted"}`}>{statusLine(d, t)}</span>
        </span>
        <span className="tnum text-sm font-semibold">{d.score.mine} : {d.score.theirs}</span>
      </button>
    </li>
  );
  const Section = ({ title, rows }: { title: string; rows: DuelSummary[] }) =>
    rows.length ? (
      <section>
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>
        <ul className="card divide-y divide-line px-4">{rows.map((d) => <Row key={d.id} d={d} />)}</ul>
      </section>
    ) : null;

  return (
    <div className="space-y-4">
      <Link href="/explore/" className="press -ml-1 flex items-center gap-1.5 text-sm font-semibold text-muted">
        <ArrowLeft size={18} /> {t("Zurück zu Entdecken")}
      </Link>
      <header>
        <h1 className="font-display text-3xl font-semibold leading-tight">{t("Duell")}</h1>
        <p className="text-sm text-muted">{t("Drei Runden, je drei Fragen. Abwechselnd wählt ihr das Thema – wer mehr richtig hat, gewinnt.")}</p>
        {all.some((d) => d.result) && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-muted" data-testid="duel-record">
            <Trophy size={13} /> {t("{w} Siege · {d} Unentschieden · {l} Niederlagen", { w: record.win, d: record.draw, l: record.loss })}
          </p>
        )}
      </header>

      {blocked ? (
        <Empty icon={<Swords size={22} />} title={t("Duelle gibt es ab 13 Jahren")} text={t("Bis dahin kannst du allein im Quiz üben und Rätsel lösen.")}>
          <Link href="/quiz/" className="press inline-flex h-12 items-center rounded-full bg-ink px-6 text-[15px] font-semibold text-bg">{t("Zum Quiz")}</Link>
        </Empty>
      ) : live ? (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="accent" className="h-auto min-h-12 flex-col gap-1 py-3" disabled={busy} onClick={() => start("invite")}>
              <Link2 size={18} /> {t("Freund herausfordern")}
            </Button>
            <Button className="h-auto min-h-12 flex-col gap-1 py-3" disabled={busy} onClick={() => start("random")}>
              <Shuffle size={18} /> {t("Zufälliger Gegner")}
            </Button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (code.trim().length === 6) void joinByCode(); }} className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} placeholder={t("Code eingeben")} aria-label={t("Einladungscode")} className="tnum h-12 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-[15px] uppercase tracking-widest outline-none" />
            <Button variant="secondary" type="submit" disabled={busy || code.length !== 6}>{t("Beitreten")}</Button>
          </form>
          <p className="text-xs leading-relaxed text-muted">{t("Dein Gegner sieht deinen Anzeigenamen und eure Ergebnisse – bei privatem Profil oder unter 16 nur „Gegner“.")}</p>
        </>
      ) : (
        <>
          <Button variant="accent" className="w-full" onClick={startPractice}>
            <Bot size={18} /> {t("Übungsduell starten")}
          </Button>
          <p className="rounded-2xl bg-raised p-3.5 text-sm text-muted">{t("Demo: Du spielst gegen einen Übungsgegner auf diesem Gerät. Duelle gegen andere gibt es in der Live-Version.")}</p>
        </>
      )}

      {!blocked && (
        live && list === null ? (
          <p className="py-6 text-center text-sm text-muted" aria-busy>{t("Lädt")}</p>
        ) : all.length ? (
          <>
            <Section title={t("Du bist dran")} rows={mine} />
            <Section title={t("Warten")} rows={waiting} />
            <Section title={t("Beendet")} rows={done} />
          </>
        ) : (
          <Empty icon={<Swords size={22} />} title={t("Noch keine Duelle")} text={live ? t("Fordere einen Freund heraus oder lass dir einen Gegner zulosen.") : t("Starte ein Übungsduell.")} />
        )
      )}
    </div>
  );
}
