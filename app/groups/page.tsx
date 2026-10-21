"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Crown, Link2, LogOut, Play, Plus, Trophy, UserMinus, Users } from "lucide-react";
import { Chat } from "@/components/Chat";
import { QuestionRound } from "@/components/QuestionRound";
import { Avatar, Button, Empty, Sheet } from "@/components/ui";
import { CATEGORIES, categoryById } from "@/lib/categories";
import { isChild } from "@/lib/content";
import { GROUP_NAME_MAX, GROUP_QUESTIONS, places, timeLeft, type GroupRound, type GroupState, type GroupSummary } from "@/lib/groups";
import { useFlags } from "@/lib/flags";
import { linkOrigin } from "@/lib/native";
import { nameAllowed } from "@/lib/names";
import { useStore, useT } from "@/lib/store";
import * as api from "@/lib/supabase";

type T = ReturnType<typeof useT>;

function explain(e: unknown, t: T) {
  const m = String((e as { message?: string })?.message ?? e);
  if (/not available for this age/.test(m)) return t("Gruppen gibt es ab 13 Jahren.");
  if (/name not allowed/.test(m)) return t("Bitte wähle einen anderen Gruppennamen.");
  if (/too many groups/.test(m)) return t("Du bist schon in 20 Gruppen.");
  if (/group full/.test(m)) return t("Diese Gruppe ist voll (50 Mitglieder).");
  if (/group not found|round not found/.test(m)) return t("Diese Gruppe gibt es nicht (mehr). Prüf den Code.");
  if (/already running/.test(m)) return t("Es läuft schon eine Runde.");
  if (/not enough questions/.test(m)) return t("Zu diesem Thema gibt es noch zu wenige Fragen.");
  if (/round closed/.test(m)) return t("Diese Runde ist schon vorbei.");
  if (/failed to fetch|network|load failed/i.test(m)) return t("Keine Verbindung zum Server.");
  return t("Das hat nicht geklappt. Bitte versuch es noch einmal.");
}

const colorFor = (name: string | null) => {
  if (!name) return "var(--muted)";
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 45% 48%)`;
};

function Ranking({ round, t }: { round: GroupRound; t: T }) {
  if (!round.ranking) return null;
  const place = places(round.ranking);
  return (
    <ol className="divide-y divide-line">
      {round.ranking.map((r, i) => (
        <li key={i} className={`flex items-center gap-3 py-2 text-sm ${r.me ? "font-semibold" : ""}`}>
          <span className="tnum w-5 text-center text-muted">{place[i]}.</span>
          <span className="min-w-0 flex-1 truncate">{r.me ? t("Du") : r.name ?? t("Mitspieler")}{!r.done && <span className="text-muted"> · {t("noch nicht fertig")}</span>}</span>
          <span className="tnum">{r.score} / {GROUP_QUESTIONS}</span>
        </li>
      ))}
    </ol>
  );
}

function GroupScreen({ group, onBack, refresh, t }: { group: GroupState; onBack: () => void; refresh: () => Promise<void>; t: T }) {
  const { toast, share, state } = useStore();
  const locale = state.settings.locale;
  const [playing, setPlaying] = useState<GroupRound | null>(null);
  const [picking, setPicking] = useState(false);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const current = group.rounds.find((r) => r.open) ?? null;
  const past = group.rounds.filter((r) => r !== current);
  const link = `${linkOrigin()}/groups/?join=${group.code}`;

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
  const startRound = (category?: string) => run(async () => {
    await api.startGroupRound(group.id, category);
    setPicking(false);
    await refresh();
  }, t("Neue Runde gestartet – alle haben drei Tage Zeit."));

  if (playing) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold leading-tight">{group.name}</h1>
        <QuestionRound
          category={playing.category}
          start={playing.played}
          count={GROUP_QUESTIONS}
          t={t}
          onOpen={(idx) => api.openGroupQuestion(playing.id, idx, locale)}
          onAnswer={(idx, selected) => api.answerGroupQuestion(playing.id, idx, selected, locale)}
          onDone={async () => {
            await refresh();
            setPlaying(null);
          }}
        />
      </div>
    );
  }

  const left = current ? timeLeft(current.closesAt) : null;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="press -ml-1 flex items-center gap-1.5 text-sm font-semibold text-muted">
          <ArrowLeft size={18} /> {t("Alle Gruppen")}
        </button>
        <button onClick={() => setMenu(true)} className="press rounded-full px-3 py-1.5 text-sm font-semibold text-muted">{t("Optionen")}</button>
      </div>
      <header>
        <h1 className="font-display text-2xl font-semibold leading-tight" data-testid="group-name">{group.name}</h1>
        <p className="text-sm text-muted">{t("{n} Mitglieder", { n: group.members.length })}</p>
      </header>

      <section className="card space-y-3 p-4">
        {current ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold" style={{ color: categoryById(current.category).color }}>{t(categoryById(current.category).name)}</span>
              <span className="text-xs text-muted">{left && left.days > 0 ? t("noch {n} Tage", { n: left.days }) : t("noch {n} Std.", { n: left?.hours ?? 0 })}</span>
            </div>
            {current.played < GROUP_QUESTIONS ? (
              <Button variant="accent" className="w-full" onClick={() => setPlaying(current)}>
                <Play size={17} /> {current.played ? t("Weiterspielen") : t("Runde spielen ({n} Fragen)", { n: GROUP_QUESTIONS })}
              </Button>
            ) : (
              <p className="text-sm text-muted">{t("Du hast gespielt. {n} von {m} sind fertig.", { n: current.ranking?.filter((r) => r.done).length ?? current.players, m: group.members.length })}</p>
            )}
            <Ranking round={current} t={t} />
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed">{t("Startet eine Runde: alle bekommen dieselben {n} Fragen und haben drei Tage Zeit. Danach gibt es eine Rangliste.", { n: GROUP_QUESTIONS })}</p>
            <Button variant="accent" className="w-full" disabled={busy} onClick={() => setPicking(true)}>
              <Plus size={17} /> {t("Neue Runde")}
            </Button>
          </>
        )}
      </section>

      {group.members.length < 2 && (
        <section className="card space-y-3 p-4">
          <p className="text-sm leading-relaxed">{t("Lade andere mit dem Code oder dem Link ein.")}</p>
          <p className="tnum rounded-2xl bg-raised py-3 text-center font-display text-2xl font-semibold tracking-[0.25em]" data-testid="group-code">{group.code}</p>
          <Button variant="secondary" className="w-full" onClick={() => share(t("Komm in meine Quiz-Gruppe „{name}“: {link}", { name: group.name, link }))}>
            <Link2 size={17} /> {t("Einladung teilen")}
          </Button>
        </section>
      )}

      <Chat place={{ group: group.id }} title={t("Gruppenchat")} />

      {past.length > 0 && (
        <section>
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{t("Letzte Runden")}</h2>
          <ul className="space-y-2">
            {past.map((r) => (
              <li key={r.id} className="card p-4">
                <p className="mb-1 flex items-center gap-2 text-sm font-semibold"><Trophy size={14} /> {t(categoryById(r.category).name)}</p>
                {r.ranking ? <Ranking round={r} t={t} /> : <p className="text-sm text-muted">{t("Ergebnis siehst du, sobald die Runde vorbei ist.")}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{t("Mitglieder")}</h2>
        <ul className="card divide-y divide-line px-4">
          {group.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2.5">
              <Avatar name={m.name ?? "?"} color={colorFor(m.name)} size={32} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{m.me ? t("Du") : m.name ?? t("Mitspieler")}</span>
              {m.owner && <Crown size={15} className="text-muted" aria-label={t("Gruppenleitung")} />}
              {group.owner && !m.me && (
                <button disabled={busy} onClick={() => run(async () => { await api.removeGroupMember(group.id, m.id); await refresh(); }, t("Aus der Gruppe entfernt"))} className="press p-1 text-muted" aria-label={t("Aus der Gruppe entfernen")}>
                  <UserMinus size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs leading-relaxed text-muted">{t("Mitglieder sehen deinen Anzeigenamen und deine Ergebnisse in der Gruppe – bei privatem Profil oder unter 16 nur „Mitspieler“.")}</p>
      </section>

      <Sheet open={picking} onClose={() => setPicking(false)} title={t("Thema der Runde")}>
        <div className="space-y-2 pb-2">
          <button disabled={busy} onClick={() => startRound()} className="press flex h-12 w-full items-center rounded-2xl bg-ink px-4 text-left text-sm font-semibold text-bg">{t("Zufälliges Thema")}</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} disabled={busy} onClick={() => startRound(c.id)} className="press flex h-12 w-full items-center gap-3 rounded-2xl bg-raised px-4 text-left text-sm font-semibold">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} /> {t(c.name)}
            </button>
          ))}
        </div>
      </Sheet>
      <Sheet open={menu} onClose={() => setMenu(false)} title={t("Optionen")}>
        <div className="space-y-2 pb-2">
          <button onClick={() => share(t("Komm in meine Quiz-Gruppe „{name}“: {link}", { name: group.name, link }))} className="press flex h-14 w-full items-center gap-3 rounded-2xl bg-raised px-4 text-left font-semibold">
            <Link2 size={18} /> {t("Einladen (Code {code})", { code: group.code })}
          </button>
          <button disabled={busy} onClick={() => run(async () => { await api.leaveGroup(group.id); setMenu(false); onBack(); }, t("Gruppe verlassen"))} className="press flex h-14 w-full items-center gap-3 rounded-2xl bg-bad/10 px-4 text-left font-semibold text-bad">
            <LogOut size={18} /> {t("Gruppe verlassen")}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

export default function GroupsPage() {
  const { auth, state, ready, toast } = useStore();
  const t = useT();
  const live = auth.mode === "live";
  const flags = useFlags();
  const off = live && flags?.groups === false;
  const blocked = live && isChild(state.ageBand);
  const [list, setList] = useState<GroupSummary[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupState | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    if (!live || blocked || !auth.userId) return;
    try {
      setList(await api.fetchMyGroups());
    } catch (e) {
      toast(explain(e, t));
      setList((l) => l ?? []);
    }
  }, [live, blocked, auth.userId, toast, t]);

  const open = useCallback((id: string) => {
    setOpenId(id);
    window.history.replaceState(null, "", `/groups/?g=${id}`);
    window.scrollTo(0, 0);
  }, []);
  const close = useCallback(() => {
    setOpenId(null);
    setGroup(null);
    window.history.replaceState(null, "", "/groups/");
    void loadList();
  }, [loadList]);
  const refresh = useCallback(async () => {
    if (!openId) return;
    try {
      setGroup(await api.fetchGroup(openId));
    } catch (e) {
      toast(explain(e, t));
      close();
    }
  }, [openId, toast, t, close]);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    const g = params.get("g");
    const join = params.get("join");
    if (g) setOpenId(g);
    else if (join && live && !blocked && auth.userId) {
      setBusy(true);
      api.joinGroup(join).then(open, (e) => toast(explain(e, t))).finally(() => setBusy(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, auth.userId]);
  useEffect(() => {
    if (ready) void loadList();
  }, [ready, loadList]);
  useEffect(() => {
    if (openId && live) void refresh();
  }, [openId, live, refresh]);

  const create = async () => {
    setBusy(true);
    try {
      const r = await api.createGroup(name.trim());
      setName("");
      open(r.id);
    } catch (e) {
      toast(explain(e, t));
    } finally {
      setBusy(false);
    }
  };
  const joinByCode = async () => {
    setBusy(true);
    try {
      open(await api.joinGroup(code));
      setCode("");
    } catch (e) {
      toast(explain(e, t));
    } finally {
      setBusy(false);
    }
  };

  if (group && openId) return <GroupScreen key={group.id} group={group} onBack={close} refresh={refresh} t={t} />;
  if (openId && live) return <p className="py-16 text-center text-sm text-muted" aria-busy>{t("Lädt")}</p>;
  const badName = name.trim() !== "" && !nameAllowed(name);

  return (
    <div className="space-y-4">
      <Link href="/duel/" className="press -ml-1 flex items-center gap-1.5 text-sm font-semibold text-muted">
        <ArrowLeft size={18} /> {t("Zurück zum Duell")}
      </Link>
      <header>
        <h1 className="font-display text-3xl font-semibold leading-tight">{t("Gruppen")}</h1>
        <p className="text-sm text-muted">{t("Spielt als Gruppe dieselben Fragen und vergleicht euch in einer Rangliste.")}</p>
      </header>

      {off ? (
        <Empty icon={<Users size={22} />} title={t("Gruppen kommen bald")} text={t("Bis dahin: Fordere Freunde im Duell heraus.")} />
      ) : blocked ? (
        <Empty icon={<Users size={22} />} title={t("Gruppen gibt es ab 13 Jahren")} text={t("Bis dahin kannst du allein im Quiz üben und Rätsel lösen.")} />
      ) : !live ? (
        <p className="rounded-2xl bg-raised p-3.5 text-sm text-muted" data-testid="groups-demo">{t("Gruppen gibt es in der Live-Version – dort braucht es andere Mitspieler.")}</p>
      ) : (
        <>
          <form onSubmit={(e) => { e.preventDefault(); if (name.trim() && !badName) void create(); }} className="space-y-1.5">
            <div className="flex gap-2">
              <input value={name} onChange={(e) => setName(e.target.value.slice(0, GROUP_NAME_MAX))} placeholder={t("Name der neuen Gruppe")} aria-label={t("Gruppenname")} className="h-12 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-[15px] outline-none" />
              <Button variant="accent" type="submit" disabled={busy || !name.trim() || badName}><Plus size={17} /> {t("Erstellen")}</Button>
            </div>
            {badName && <p className="px-2 text-xs text-bad">{t("Bitte wähle einen anderen Gruppennamen.")}</p>}
          </form>
          <form onSubmit={(e) => { e.preventDefault(); if (code.trim().length === 6) void joinByCode(); }} className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} placeholder={t("Code eingeben")} aria-label={t("Gruppencode")} className="tnum h-12 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-[15px] uppercase tracking-widest outline-none" />
            <Button variant="secondary" type="submit" disabled={busy || code.length !== 6}>{t("Beitreten")}</Button>
          </form>

          {list === null ? (
            <p className="py-6 text-center text-sm text-muted" aria-busy>{t("Lädt")}</p>
          ) : list.length ? (
            <ul className="card divide-y divide-line px-4">
              {list.map((g) => (
                <li key={g.id}>
                  <button onClick={() => open(g.id)} className="press flex w-full items-center gap-3 py-3 text-left">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised"><Users size={18} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{g.name}</span>
                      <span className={`block truncate text-sm ${g.openRound ? "font-semibold text-accent" : "text-muted"}`}>
                        {g.openRound ? t("Neue Runde – du bist dran") : t("{n} Mitglieder", { n: g.members })}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon={<Users size={22} />} title={t("Noch keine Gruppe")} text={t("Erstelle eine Gruppe für Freunde, Familie oder die Klasse – oder tritt mit einem Code bei.")} />
          )}
        </>
      )}
    </div>
  );
}
