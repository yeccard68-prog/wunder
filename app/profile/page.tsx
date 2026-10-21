"use client";

import { useEffect, useState } from "react";
import { isChild } from "@/lib/content";
import Link from "next/link";
import { Bookmark, ChevronRight, Clapperboard, Lock, Settings, Share2, ShieldCheck } from "lucide-react";

import Account from "@/components/Account";
import KnowledgeCard from "@/components/KnowledgeCard";
import { Avatar, Bar, Button, Chip, Empty, Ring, Segmented, Sheet, Toggle } from "@/components/ui";
import { CATEGORIES } from "@/lib/categories";
import { recallStats } from "@/lib/books";
import { ACHIEVEMENTS, leagueFor, levelInfo, liveStreak, mastery, nextAchievement, retention, stats, type Achievement } from "@/lib/gamification";
import Badge from "@/components/Badge";
import { OFFERED_AGE_BANDS } from "@/lib/content";
import { LOCALES } from "@/lib/i18n";
import { nameAllowed } from "@/lib/names";
import { useStore, useT } from "@/lib/store";
import { isAdmin } from "@/lib/supabase";
import type { Theme } from "@/lib/types";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="tnum font-display text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { state, items, clips, update, reset, share, toast } = useStore();
  const t = useT();
  const [sheet, setSheet] = useState<"settings" | "saved" | null>(null);
  const [badge, setBadge] = useState<Achievement | null>(null);
  const upcoming = nextAchievement(state);
  const [confirm, setConfirm] = useState(false);
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    isAdmin().then(setAdmin).catch(() => {});
  }, []);
  const lvl = levelInfo(state.xp);
  const s = stats(state);
  const kept = retention(state, Object.fromEntries(clips.map((c) => [c.id, c.quiz?.id])));
  const ideas = recallStats(state);
  const saved = items.filter((i) => state.saves.includes(i.id));
  const savedClips = clips.filter((c) => state.saves.includes(c.id));
  const toggleInterest = (id: string) => {
    const next = state.interests.includes(id) ? state.interests.filter((x) => x !== id) : [...state.interests, id];
    if (next.length) update({ interests: next });
  };

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <div className="flex items-center gap-4">
          <Ring value={lvl.progress} size={76} stroke={4}>
            <Avatar name={state.username} color="var(--accent)" size={60} />
          </Ring>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-1.5 truncate font-display text-2xl font-semibold tracking-tight">
              {state.username} {state.settings.privateProfile && <Lock size={15} className="text-muted" />}
            </h1>
            <p className="text-sm text-muted">
              Level {lvl.level} · {t(leagueFor(state.xp))}
            </p>
          </div>
          <button onClick={() => setSheet("settings")} aria-label={t("Einstellungen")} className="press flex h-11 w-11 items-center justify-center rounded-full bg-raised">
            <Settings size={19} />
          </button>
        </div>
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-xs text-muted">
            <span className="tnum">{t("{n} XP gesamt", { n: state.xp })}</span>
            <span className="tnum">{t("noch {n} XP bis Level {level}", { n: lvl.needed - lvl.current, level: lvl.level + 1 })}</span>
          </div>
          <Bar value={lvl.progress} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Stat label={t("Tage-Streak")} value={liveStreak(state)} />
        <Stat label={t("Längste Streak")} value={state.streak.best} />
        <Stat label={t("Fragen beantwortet")} value={s.answered} />
        <Stat label={t("Trefferquote")} value={s.answered ? `${Math.round(s.accuracy * 100)} %` : "–"} />
      </section>

      <section className="card space-y-3 p-5" data-testid="retention">
        <div>
          <h2 className="font-display text-xl font-semibold">{t("Was hängen geblieben ist")}</h2>
          <p className="text-xs text-muted">{t("Gezählt wird, was du nach einer Pause noch wusstest – nicht, was du nur angesehen hast.")}</p>
        </div>
        <dl className="divide-y divide-line text-sm">
          {[
            [t("Fragen nach einer Pause wieder gewusst"), kept.recalled],
            [t("Offene Lücken (kommen zur Wiederholung)"), kept.gaps],
            [t("Buch-Ideen nach einer Pause gewusst"), `${ideas.retained} / ${ideas.recalled}`],
            [t("Clips angesehen – Frage dazu richtig"), `${kept.clipsWatched} – ${kept.clipsUnderstood}`],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-muted">{label}</dt>
              <dd className="tnum font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        {kept.due + ideas.due > 0 && (
          <Link href={kept.due > 0 ? "/quiz/" : "/books/"} className="press flex h-11 items-center justify-center rounded-full bg-ink text-sm font-semibold text-bg">
            {t("{n} Wiederholungen fällig", { n: kept.due + ideas.due })}
          </Link>
        )}
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-xl font-semibold">{t("Wissensstand")}</h2>
        {CATEGORIES.map((c) => {
          const m = mastery(items, state, c.id);
          return (
            <div key={c.id}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-semibold">{t(c.name)}</span>
                <span className="tnum text-muted">{Math.round(m * 100)} %</span>
              </div>
              <Bar value={m} color={c.color} />
            </div>
          );
        })}
      </section>

      <section className="card p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold">{t("Abzeichen")}</h2>
          <span className="tnum text-sm text-muted">
            {state.achievements.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
        {upcoming && (
          <button onClick={() => setBadge(upcoming.achievement)} className="press mb-5 flex w-full items-center gap-4 rounded-2xl bg-raised p-3.5 text-left" data-testid="next-badge">
            <Badge icon={upcoming.achievement.icon} color={upcoming.achievement.color} earned={false} progress={upcoming.current / upcoming.target} size={56} />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{t("Nächstes Abzeichen")}</span>
              <span className="block font-display text-lg font-semibold leading-tight">{t(upcoming.achievement.name)}</span>
              <span className="mt-1.5 block"><Bar value={upcoming.current / upcoming.target} color={upcoming.achievement.color} /></span>
              <span className="mt-1 block text-xs text-muted">{t(upcoming.achievement.description)} · {upcoming.current}/{upcoming.target}</span>
            </span>
          </button>
        )}
        <ul className="grid grid-cols-3 gap-x-2 gap-y-5" data-testid="badges">
          {ACHIEVEMENTS.map((a) => {
            const has = state.achievements.includes(a.id);
            const [cur, target] = a.progress(state);
            return (
              <li key={a.id}>
                <button onClick={() => setBadge(a)} className="press flex w-full flex-col items-center text-center" aria-label={`${t(a.name)}: ${has ? t("erreicht") : `${Math.min(cur, target)}/${target}`}`}>
                  <Badge icon={a.icon} color={a.color} earned={has} progress={Math.min(1, cur / target)} />
                  <span className={`mt-1.5 text-xs font-semibold leading-tight ${has ? "" : "text-muted"}`}>{t(a.name)}</span>
                  {!has && target > 1 && <span className="tnum text-[11px] text-muted">{Math.min(cur, target)}/{target}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <Sheet open={!!badge} onClose={() => setBadge(null)} title={badge ? t(badge.name) : ""}>
        {badge && (() => {
          const has = state.achievements.includes(badge.id);
          const [cur, target] = badge.progress(state);
          return (
            <div className="flex flex-col items-center gap-3 pb-4 text-center">
              <span className={has ? "pop" : ""}><Badge icon={badge.icon} color={badge.color} earned={has} progress={Math.min(1, cur / target)} size={112} /></span>
              <p className="text-[15px]">{t(badge.description)}</p>
              <p className={`text-sm font-semibold ${has ? "text-good" : "text-muted"}`}>{has ? t("Erreicht!") : t("Noch {n} bis zum Abzeichen", { n: Math.max(0, target - cur) })}</p>
            </div>
          );
        })()}
      </Sheet>

      <button onClick={() => setSheet("saved")} className="press card flex w-full items-center gap-3 p-4 text-left">
        <Bookmark size={19} />
        <span className="flex-1 font-semibold">{t("Gemerkte Karten")}</span>
        <span className="tnum text-sm text-muted">{saved.length + savedClips.length}</span>
        <ChevronRight size={18} className="text-muted" />
      </button>

      {admin && (
        <Link href="/admin/" className="press card flex w-full items-center gap-3 p-4">
          <ShieldCheck size={19} />
          <span className="flex-1 font-semibold">{t("Inhalte prüfen")}</span>
          <ChevronRight size={18} className="text-muted" />
        </Link>
      )}

      <Button variant="secondary" className="w-full" onClick={() => share(t("Ich bin Level {level} auf Wunder – {xp} XP, {days} Tage Streak. Mach mit!", { level: lvl.level, xp: state.xp, days: liveStreak(state) }))}>
        <Share2 size={17} /> {t("Profil teilen")}
      </Button>

      <Sheet open={sheet === "saved"} onClose={() => setSheet(null)} title={t("Gemerkte Karten")}>
        {saved.length + savedClips.length ? (
          <div className="space-y-4 pb-2">
            {savedClips.map((c) => (
              <Link key={c.id} href="/clips/" className="press card flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised">
                  <Clapperboard size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted">Clip</span>
                  <span className="block font-semibold leading-snug">{c.title}</span>
                </span>
              </Link>
            ))}
            {saved.map((i) => (
              <KnowledgeCard key={i.id} item={i} />
            ))}
          </div>
        ) : (
          <Empty icon={<Bookmark size={22} />} title={t("Noch nichts gemerkt")} text={t("Tippe im Feed auf das Lesezeichen, um Karten für später aufzuheben.")} />
        )}
      </Sheet>

      <Sheet open={sheet === "settings"} onClose={() => { setSheet(null); setConfirm(false); }} title={t("Einstellungen")}>
        <div className="space-y-6 pb-2">
          <div>
            <label htmlFor="uname" className="mb-2 block text-sm font-semibold">{t("Anzeigename")}</label>
            <input id="uname" defaultValue={state.username} maxLength={20} onBlur={(e) => {
              const v = e.target.value.trim();
              if (!v) return;
              if (!nameAllowed(v)) {
                toast(t("Dieser Name ist nicht erlaubt – andere sehen ihn im Duell."));
                e.target.value = state.username;
                return;
              }
              update({ username: v });
            }} className="h-12 w-full rounded-2xl border border-line bg-surface px-4 outline-none focus:border-ink" />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">{t("Interessen")}</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Chip key={c.id} color={c.color} active={state.interests.includes(c.id)} onClick={() => toggleInterest(c.id)}>
                  {t(c.name)}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">{t("Tagesziel")}</p>
            <Segmented value={String(state.goalMinutes) as "3" | "5" | "10"} onChange={(v) => update({ goalMinutes: Number(v) as 3 | 5 | 10 })} options={[{ value: "3", label: "3 min" }, { value: "5", label: "5 min" }, { value: "10", label: "10 min" }]} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">{t("Sprache")}</p>
            <Segmented value={state.settings.locale} onChange={(locale) => update({ settings: { ...state.settings, locale } })} options={LOCALES.map((l) => ({ value: l.id as string, label: l.name }))} />
          </div>
          {OFFERED_AGE_BANDS.length > 1 && (
            <div>
              <p className="mb-2 text-sm font-semibold">{t("Altersstufe")}</p>
              <Segmented value={state.ageBand ?? "16+"} onChange={(ageBand) => update({ ageBand })} options={OFFERED_AGE_BANDS.map((b) => ({ value: b, label: b }))} />
              <p className="mt-1.5 text-xs text-muted">{t("Bestimmt, welche Inhalte angezeigt werden. Ab 16 wird alles gezeigt.")}</p>
            </div>
          )}
          <div>
            <p className="mb-2 text-sm font-semibold">{t("Darstellung")}</p>
            <Segmented<Theme> value={state.settings.theme} onChange={(theme) => update({ settings: { ...state.settings, theme } })} options={[{ value: "system", label: t("System") }, { value: "light", label: t("Hell") }, { value: "dark", label: t("Dunkel") }]} />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold">{t("Privates Profil")}</p>
              <p className="text-sm text-muted">{t("Du erscheinst nicht in Ranglisten und Suchergebnissen.")}</p>
            </div>
            <Toggle label={t("Privates Profil")} checked={state.settings.privateProfile} onChange={(v) => update({ settings: { ...state.settings, privateProfile: v } })} />
            {!isChild(state.ageBand) && (
              <div>
                <Toggle label={t("Nutzungsstatistik teilen")} checked={!!state.settings.analytics} onChange={(v) => update({ settings: { ...state.settings, analytics: v } })} />
                <p className="mt-1 text-xs leading-relaxed text-muted">{t("Hilft uns zu sehen, welche Inhalte angesehen und abgeschlossen werden. Gespeichert wird nur, was du geöffnet oder beendet hast – keine Texte, kein Standort. Jederzeit abschaltbar.")}</p>
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">{t("Konto")}</p>
            <Account />
          </div>
          <div className="border-t border-line pt-4">
            {confirm ? (
              <div className="rounded-2xl bg-bad/10 p-4">
                <p className="text-sm font-semibold">{t("Wirklich alles löschen?")}</p>
                <p className="mt-1 text-sm text-muted">{t("XP, Streak, Abzeichen und Konto werden unwiderruflich entfernt.")}</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" className="h-10 flex-1" onClick={() => setConfirm(false)}>{t("Abbrechen")}</Button>
                  <Button className="h-10 flex-1 !bg-bad !text-white" onClick={reset}>{t("Endgültig löschen")}</Button>
                </div>
              </div>
            ) : (
              <>
                <Link href="/legal/" className="press flex h-10 items-center text-sm font-semibold text-muted underline">{t("Quellen, Lizenzen & Daten")}</Link>
                <button onClick={() => setConfirm(true)} className="press h-10 text-sm font-semibold text-bad">{t("Konto und Daten löschen")}</button>
              </>
            )}
          </div>
        </div>
      </Sheet>
    </div>
  );
}
