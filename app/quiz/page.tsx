"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CalendarCheck, Check, RotateCcw } from "lucide-react";
import Session, { type SessionMode } from "@/components/Session";
import { Bar, Button, Chip, Segmented } from "@/components/ui";
import { CATEGORIES } from "@/lib/categories";
import { dailyItems, dueReviews, mastery, scheduledReviews, today } from "@/lib/gamification";
import { personById, type Person } from "@/lib/people";
import { useStore, useT } from "@/lib/store";
import type { Item } from "@/lib/types";

interface Active {
  title: string;
  items: Item[];
  mode: SessionMode;
  opponent?: Person;
}
const ROUND = 7;

export default function QuizPage() {
  const { items, state, launch, setLaunch, toast } = useStore();
  const t = useT();
  const [active, setActive] = useState<Active | null>(null);
  const [cats, setCats] = useState<string[]>(state.interests);
  const [level, setLevel] = useState<"0" | "1" | "2" | "3">("0");

  const daily = dailyItems(items, state.interests);
  const dailyDone = state.dailyChallenge.date === today();
  const due = dueReviews(items, state);
  const scheduled = scheduledReviews(state);

  const startDaily = () => setActive({ title: "Daily Challenge", items: daily, mode: "daily" });
  const startReview = () => due.length && setActive({ title: t("Wiederholung"), items: due.slice(0, 10), mode: "review" });

  // Sessions requested from other screens (home banner, friend profile).
  useEffect(() => {
    if (!launch) return;
    if (launch.mode === "daily" && !dailyDone) startDaily();
    else if (launch.mode === "review") startReview();
    else if (launch.mode === "challenge") {
      const opponent = personById(launch.opponentId);
      if (opponent) setActive({ title: t("Challenge gegen {name}", { name: opponent.name.split(" ")[0] }), items: dailyItems(items, opponent.interests, today() + opponent.id), mode: "challenge", opponent });
    }
    setLaunch(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launch]);

  const startPractice = () => {
    const pool = items.filter((i) => i.kind === "question" && !state.hidden.includes(i.id) && (!cats.length || cats.includes(i.categoryId)) && (level === "0" || i.difficulty === Number(level)));
    if (!pool.length) return toast(t("Für diese Auswahl gibt es noch keine Fragen"));
    // New questions first (they earn XP), then known ones for practice.
    const sorted = [...pool].sort((a, b) => Number(!!state.answers[a.id]) - Number(!!state.answers[b.id]) || a.difficulty - b.difficulty);
    setActive({ title: t("Übungsrunde"), items: sorted.slice(0, ROUND), mode: "practice" });
  };

  if (active) return <Session {...active} onExit={() => setActive(null)} />;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Quiz</h1>

      <section className="card overflow-hidden">
        <div className="p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
            <CalendarCheck size={14} /> {t("Heute")}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Daily Challenge</h2>
          <p className="mt-1 text-sm text-muted">{t("Fünf Fragen, für alle dieselben. +4 Bonus-XP pro richtiger Antwort, +10 für fünf von fünf.")}</p>
        </div>
        <div className="border-t border-line p-4">
          {dailyDone ? (
            <p className="flex items-center gap-2 px-1 text-sm font-semibold text-good">
              <Check size={16} /> {t("Heute erledigt: {a}/5 – morgen gibt es neue Fragen.", { a: state.dailyChallenge.score ?? 0 })}
            </p>
          ) : (
            <Button variant="accent" className="w-full" onClick={startDaily}>
              {t("Jetzt spielen")} <ArrowRight size={17} />
            </Button>
          )}
        </div>
      </section>

      <button onClick={startReview} disabled={!due.length} className="press card flex w-full items-center gap-4 p-4 text-left disabled:opacity-100">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-raised">
          <RotateCcw size={19} />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">{t("Wiederholen")}</span>
          <span className="text-sm text-muted">
            {due.length ? t("{n} fällig · +5 XP pro geschlossener Lücke", { n: due.length }) : scheduled ? t("{n} geplant – wir melden uns, wenn es Zeit ist", { n: scheduled }) : t("Falsch beantwortete Fragen tauchen hier wieder auf.")}
          </span>
        </span>
        {due.length > 0 && <span className="tnum flex h-7 min-w-7 items-center justify-center rounded-full bg-accent px-2 text-xs font-bold text-white">{due.length}</span>}
      </button>

      <section className="card p-5">
        <h2 className="font-display text-xl font-semibold">{t("Freies Üben")}</h2>
        <p className="mb-3 mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{t("Themen")}</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c.id} color={c.color} active={cats.includes(c.id)} onClick={() => setCats((v) => (v.includes(c.id) ? v.filter((x) => x !== c.id) : [...v, c.id]))}>
              {t(c.name)}
            </Chip>
          ))}
        </div>
        <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wider text-muted">{t("Schwierigkeit")}</p>
        <Segmented value={level} onChange={setLevel} options={[{ value: "0", label: t("Alle") }, { value: "1", label: t("Leicht") }, { value: "2", label: t("Mittel") }, { value: "3", label: t("Schwer") }]} />
        <Button className="mt-5 w-full" onClick={startPractice}>
          {t("Runde starten")}
        </Button>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-xl font-semibold">{t("Dein Wissensstand")}</h2>
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
    </div>
  );
}
