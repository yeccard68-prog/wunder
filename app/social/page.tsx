"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, CalendarCheck, Flag, Flame, Heart, Lock, Search, Swords, TrendingUp, Users } from "lucide-react";
import { Avatar, Button, Empty, Segmented, Sheet } from "@/components/ui";
import { categoryById } from "@/lib/categories";
import { daysLeftInWeek, leagueFor, levelInfo, today, weekKey } from "@/lib/gamification";
import { ACTIVITIES, PEOPLE, personById, weekXpOf, type Person } from "@/lib/people";
import { useStore, useT } from "@/lib/store";

const ICONS = { daily: CalendarCheck, level: TrendingUp, streak: Flame, like: Heart, badge: Award };
type T = (key: string, vars?: Record<string, string | number>) => string;
const ago = (h: number, t: T) => (h < 1 ? t("gerade eben") : h < 24 ? t("vor {n} Std.", { n: Math.round(h) }) : t("vor {n} T.", { n: Math.round(h / 24) }));

function FollowButton({ id }: { id: string }) {
  const { state, toggleFollow } = useStore();
  const t = useT();
  const on = state.following.includes(id);
  return (
    <Button variant={on ? "secondary" : "primary"} className="h-9 px-4 text-sm" onClick={() => toggleFollow(id)}>
      {on ? t("Gefolgt") : t("Folgen")}
    </Button>
  );
}

function PersonRow({ p, onOpen }: { p: Person; onOpen: () => void }) {
  const t = useT();
  return (
    <li className="flex items-center gap-3 py-3">
      <button onClick={onOpen} className="press flex min-w-0 flex-1 items-center gap-3 text-left">
        <Avatar name={p.name} color={p.color} />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{p.name}</span>
          <span className="block truncate text-sm text-muted">
            Level {levelInfo(p.xp).level} · {p.interests.map((i) => t(categoryById(i).name)).join(", ")}
          </span>
        </span>
      </button>
      <FollowButton id={p.id} />
    </li>
  );
}

export default function SocialPage() {
  const { state, items, block, setLaunch } = useStore();
  const router = useRouter();
  const t = useT();
  const [tab, setTab] = useState<"activity" | "league" | "people">("activity");
  const [scope, setScope] = useState<"all" | "friends">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const people = PEOPLE.filter((p) => !state.blocked.includes(p.id));
  const open = openId ? personById(openId) : undefined;
  const myWeek = state.week.key === weekKey() ? state.week.xp : 0;

  const activity = [
    ...ACTIVITIES.filter((a) => state.following.includes(a.userId)).map((a) => ({ key: a.id, person: personById(a.userId)!, text: a.text, hours: a.hoursAgo, type: a.type, itemId: a.itemId })),
    ...state.log.map((l, i) => ({ key: "me" + i, person: null, text: l.text, hours: (Date.now() - Date.parse(l.at)) / 3_600_000, type: (l.type === "challenge" ? "daily" : l.type) as keyof typeof ICONS, itemId: undefined })),
  ].sort((a, b) => a.hours - b.hours);

  const board = [
    ...people.filter((p) => scope === "all" || state.following.includes(p.id)).map((p) => ({ id: p.id, name: p.name, color: p.color, xp: weekXpOf(p), me: false })),
    ...(state.settings.privateProfile ? [] : [{ id: "me", name: state.username || t("Du"), color: "var(--accent)", xp: myWeek, me: true }]),
  ].sort((a, b) => b.xp - a.xp);

  const challenge = (p: Person) => {
    setLaunch({ mode: "challenge", opponentId: p.id });
    router.push("/quiz/");
  };
  const played = (id: string) => state.challenges.find((c) => c.opponentId === id && c.date === today());

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Community</h1>
        <span className="rounded-full bg-raised px-2.5 py-1 text-[11px] font-semibold text-muted">{t("Demo-Profile")}</span>
      </div>
      <Link href="/duel/" className="press card flex items-center gap-3 p-4 text-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white"><Swords size={18} /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t("Duell gegen echte Leute")}</span>
          <span className="text-muted">{t("Drei Runden, abwechselnd Themen wählen – per Link mit Freunden oder gegen Zufallsgegner.")}</span>
        </span>
      </Link>
      <Segmented value={tab} onChange={setTab} options={[{ value: "activity", label: t("Aktivität") }, { value: "league", label: t("Rangliste") }, { value: "people", label: t("Leute") }]} />

      {tab === "activity" && activity.length > 0 && !state.following.length && (
        <button onClick={() => setTab("people")} className="press card flex w-full items-center gap-3 p-4 text-left text-sm">
          <Users size={18} />
          <span className="flex-1">
            <span className="block font-semibold">{t("Folge ein paar Leuten")}</span>
            <span className="text-muted">{t("Dann siehst du hier, was sie lernen und gewinnen.")}</span>
          </span>
        </button>
      )}
      {tab === "activity" &&
        (activity.length ? (
          <ul className="card divide-y divide-line px-4">
            {activity.map((a) => {
              const Icon = ICONS[a.type];
              const item = a.itemId && items.find((i) => i.id === a.itemId);
              return (
                <li key={a.key} className="flex gap-3 py-3.5">
                  {a.person ? (
                    <button onClick={() => setOpenId(a.person!.id)} aria-label={a.person.name}>
                      <Avatar name={a.person.name} color={a.person.color} size={36} />
                    </button>
                  ) : (
                    <Avatar name={state.username} color="var(--accent)" size={36} />
                  )}
                  <div className="min-w-0 flex-1 text-sm">
                    <p>
                      <span className="font-semibold">{a.person ? a.person.name.split(" ")[0] : t("Du")}</span> {a.person ? t(a.text) : `– ${a.text}`}
                    </p>
                    {item && <p className="mt-1 line-clamp-2 border-l-2 border-line pl-2.5 font-display text-[15px] italic text-muted">{item.question}</p>}
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                      <Icon size={12} /> {ago(a.hours, t)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty icon={<Users size={22} />} title={t("Hier wird es lebendig")} text={t("Folge ein paar Leuten und sieh, was sie lernen, liken und gewinnen.")}>
            <Button onClick={() => setTab("people")}>{t("Leute entdecken")}</Button>
          </Empty>
        ))}

      {tab === "league" && (
        <>
          <div className="card flex items-center justify-between p-4">
            <div>
              <p className="font-display text-xl font-semibold">{t(leagueFor(state.xp))}</p>
              <p className="text-sm text-muted">{daysLeftInWeek() === 1 ? t("Diese Woche zählt jedes XP · endet in 1 Tag") : t("Diese Woche zählt jedes XP · endet in {n} Tagen", { n: daysLeftInWeek() })}</p>
            </div>
            <div className="w-36">
              <Segmented value={scope} onChange={setScope} options={[{ value: "all", label: t("Alle") }, { value: "friends", label: t("Freunde") }]} />
            </div>
          </div>
          {state.settings.privateProfile && (
            <p className="flex items-center gap-2 rounded-2xl bg-raised p-3.5 text-sm text-muted">
              <Lock size={15} /> {t("Dein Profil ist privat – du erscheinst nicht in Ranglisten.")}
            </p>
          )}
          {board.length > (state.settings.privateProfile ? 0 : 1) || scope === "all" ? (
            <ol className="card divide-y divide-line px-4">
              {board.map((r, i) => (
                <li key={r.id} className={`flex items-center gap-3 py-3 ${r.me ? "-mx-4 bg-accent/10 px-4" : ""}`}>
                  <span className={`tnum w-6 text-center text-sm font-bold ${i < 3 ? "text-accent" : "text-muted"}`}>{i + 1}</span>
                  <button disabled={r.me} onClick={() => setOpenId(r.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <Avatar name={r.name} color={r.color} size={36} />
                    <span className="truncate font-semibold">{r.me ? t("{name} (du)", { name: r.name }) : r.name}</span>
                  </button>
                  <span className="tnum text-sm font-semibold">{r.xp} XP</span>
                </li>
              ))}
            </ol>
          ) : (
            <Empty title={t("Noch keine Freunde")} text={t("Folge Leuten, um dich direkt mit ihnen zu vergleichen.")}>
              <Button onClick={() => setTab("people")}>{t("Leute entdecken")}</Button>
            </Empty>
          )}
        </>
      )}

      {tab === "people" && (
        <>
          <label className="flex h-12 items-center gap-2.5 rounded-full border border-line bg-surface px-4">
            <Search size={18} className="text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Namen suchen")} aria-label={t("Namen suchen")} className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
          </label>
          <ul className="card divide-y divide-line px-4">
            {people
              .filter((p) => (p.name + p.handle).toLowerCase().includes(query.toLowerCase()))
              .map((p) => (
                <PersonRow key={p.id} p={p} onOpen={() => setOpenId(p.id)} />
              ))}
          </ul>
        </>
      )}

      <Sheet open={!!open} onClose={() => setOpenId(null)} title={t("Profil")}>
        {open && (
          <div className="pb-2">
            <div className="flex items-center gap-4">
              <Avatar name={open.name} color={open.color} size={64} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold leading-tight">{open.name}</p>
                <p className="text-sm text-muted">@{open.handle}</p>
              </div>
              <FollowButton id={open.id} />
            </div>
            <p className="mt-4 text-[15px] leading-relaxed">{t(open.bio)}</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["Level", levelInfo(open.xp).level],
                ["Streak", open.streak],
                [t("Quote"), Math.round(open.accuracy * 100) + " %"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-raised py-3">
                  <dd className="tnum font-display text-xl font-semibold">{v}</dd>
                  <dt className="text-xs text-muted">{k}</dt>
                </div>
              ))}
            </dl>
            {played(open.id) && (
              <p className="mt-4 text-center text-sm text-muted">
                {t("Heutige Challenge: {a}:{b}", { a: played(open.id)!.mine, b: played(open.id)!.theirs })}
              </p>
            )}
            <Button variant="accent" className="mt-4 w-full" onClick={() => challenge(open)}>
              <Swords size={18} /> {played(open.id) ? t("Revanche (ohne Bonus)") : t("Herausfordern · 5 Fragen")}
            </Button>
            <button
              onClick={() => {
                block(open.id);
                setOpenId(null);
              }}
              className="press mx-auto mt-3 flex h-10 items-center gap-2 px-3 text-sm text-muted"
            >
              <Flag size={14} /> {t("Melden und blockieren")}
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
