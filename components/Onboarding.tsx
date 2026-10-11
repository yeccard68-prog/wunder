"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Compass, Globe, Swords, TrendingUp } from "lucide-react";
import { CATEGORIES, categoryById } from "@/lib/categories";
import { AGE_BANDS } from "@/lib/content";
import { goalQuestions } from "@/lib/gamification";
import { LOCALES } from "@/lib/i18n";
import { useStore, useT } from "@/lib/store";
import type { AgeBand, Motivation } from "@/lib/types";
import Account from "./Account";
import KnowledgeCard from "./KnowledgeCard";
import { Button, Sheet, Wordmark } from "./ui";

const BLURBS: Record<string, string> = {
  science: "Vom Atom bis zum Universum",
  technology: "Wie Computer und KI wirklich funktionieren",
  history: "Die Geschichten hinter dem Heute",
  earth: "Länder, Tiere, Klima und Naturwunder",
  economy: "Wie Märkte, Geld und Finanzen ticken",
  culture: "Kunst, Politik und Zusammenleben",
};
const AGES: { band: AgeBand; title: string; text: string }[] = [
  { band: "6-9", title: "6 bis 9 Jahre", text: "Einfache Fragen für Grundschulkinder" },
  { band: "10-12", title: "10 bis 12 Jahre", text: "Für neugierige Kinder" },
  { band: "13-15", title: "13 bis 15 Jahre", text: "Für Jugendliche" },
  { band: "16+", title: "16 Jahre und älter", text: "Alle Inhalte" },
];
const GOALS: { min: 3 | 5 | 10; label: string }[] = [
  { min: 3, label: "Locker" },
  { min: 5, label: "Regelmäßig" },
  { min: 10, label: "Ambitioniert" },
];
const MOTIVES: { id: Motivation; title: string; text: string; Icon: typeof Compass }[] = [
  { id: "discover", title: "Neues entdecken", text: "Ich will überrascht werden." },
  { id: "improve", title: "Besser werden", text: "Ich will Lücken schließen und es behalten." },
  { id: "compete", title: "Mich messen", text: "Ich will Freunde und Ranglisten schlagen." },
].map((m, i) => ({ ...m, Icon: [Compass, TrendingUp, Swords][i] })) as { id: Motivation; title: string; text: string; Icon: typeof Compass }[];
const STEPS = 6;

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active} className={`press flex w-full items-center gap-4 rounded-2xl border px-4 py-2.5 text-left ${active ? "border-ink bg-surface shadow-sm" : "border-line bg-surface/60"}`}>
      {children}
      <span className={`ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${active ? "border-ink bg-ink text-bg" : "border-line"}`}>{active && <Check size={14} />}</span>
    </button>
  );
}

export default function Onboarding() {
  const { items, state, auth, update } = useStore();
  const t = useT();
  const [step, setStep] = useState(0);
  const [age, setAge] = useState<AgeBand | null>(state.ageBand);
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState<3 | 5 | 10>(5);
  const [motivation, setMotivation] = useState<Motivation>("discover");
  const [answered, setAnswered] = useState(false);
  const [name, setName] = useState("");
  const [signIn, setSignIn] = useState(false);
  const locale = state.settings.locale;

  // `items` already match the chosen language and – once picked – the age level.
  const sample = items.find((i) => i.id === "s2") ?? items.find((i) => i.kind === "question") ?? items[0];
  const preview = items.find((i) => i.id === "hf1") ?? items.find((i) => i.kind === "fact");
  const next = () => setStep((s) => s + 1);
  const pickAge = (band: AgeBand) => {
    setAge(band);
    update({ ageBand: band }); // content is filtered from the next step on
  };
  const finish = () => update({ onboarded: true, interests, goalMinutes: goal, motivation, ageBand: age, username: name.trim() || t("Neugierig") });
  const canNext = step === 1 ? !!age : step === 2 ? interests.length > 0 : step === 5 ? answered || !sample : true;

  if (step === 0)
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-[max(env(safe-area-inset-top),24px)]">
        <div className="flex items-center justify-between">
          <Wordmark className="text-2xl" />
          <label className="flex h-9 items-center gap-1.5 rounded-full bg-raised pl-3 pr-1 text-sm font-semibold">
            <Globe size={15} />
            <select aria-label={t("Sprache")} value={locale} onChange={(e) => update({ settings: { ...state.settings, locale: e.target.value } })} className="bg-transparent py-1 pr-1 outline-none">
              {LOCALES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-1 flex-col justify-center py-8">
          {preview && (
            <div className="rise relative mb-10">
              <div className="card absolute inset-x-6 -bottom-3 h-full opacity-50" />
              <div className="card relative -rotate-1 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: categoryById(preview.categoryId).color }}>
                  {t(categoryById(preview.categoryId).name)} · {t("Stimmt das?")}
                </p>
                <p className="mt-3 font-display text-xl font-semibold leading-snug">{preview.question}</p>
              </div>
            </div>
          )}
          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight">
            {t("Jeden Tag ein bisschen")} <em className="text-accent">{t("klüger.")}</em>
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">{t("Kurze Clips, überraschende Fakten und schnelle Quizfragen – von Wissenschaft bis Wirtschaft, in fünf Minuten am Tag, alles mit Quelle.")}</p>
        </div>
        <Button onClick={next} className="h-14 w-full text-base">
          {t("Los geht's")} <ArrowRight size={18} />
        </Button>
        {auth.mode === "live" ? (
          <button onClick={() => setSignIn(true)} className="mt-3 h-10 text-center text-sm font-semibold text-muted underline">
            {t("Ich habe schon ein Konto")}
          </button>
        ) : (
          <p className="mt-3 text-center text-xs text-muted">{t("Demo-Modus · Beispieldaten, nichts wird übertragen")}</p>
        )}
        <Sheet open={signIn} onClose={() => setSignIn(false)} title={t("Anmelden")}>
          <div className="pb-2">
            <Account initialMode="signin" />
          </div>
        </Sheet>
      </div>
    );

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-[max(env(safe-area-inset-top),16px)]">
      <div className="mb-5 flex items-center gap-3">
        <button onClick={() => setStep(step - 1)} aria-label={t("Zurück")} className="press -ml-2 flex h-10 w-10 items-center justify-center rounded-full text-muted">
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: STEPS }, (_, n) => (
            <span key={n} className={`h-1 flex-1 rounded-full transition-colors ${n < step ? "bg-ink" : "bg-line"}`} />
          ))}
        </div>
      </div>

      <div key={step} className="rise flex-1">
        {step === 1 && (
          <>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{t("Wie alt bist du?")}</h1>
            <p className="mb-4 mt-1.5 text-sm text-muted">{t("Damit die Inhalte zu dir passen. Wir speichern nur die Altersgruppe, kein Geburtsdatum.")}</p>
            <div className="space-y-2">
              {AGES.map((a) => (
                <Option key={a.band} active={age === a.band} onClick={() => pickAge(a.band)}>
                  <span>
                    <span className="block font-semibold">{t(a.title)}</span>
                    <span className="block text-[13px] leading-tight text-muted">{t(a.text)}</span>
                  </span>
                </Option>
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{t("Was interessiert dich?")}</h1>
            <p className="mb-4 mt-1.5 text-sm text-muted">{t("Wähle mindestens ein Thema. Du kannst das jederzeit ändern.")}</p>
            <div className="space-y-2">
              {CATEGORIES.map((c) => (
                <Option key={c.id} active={interests.includes(c.id)} onClick={() => setInterests((v) => (v.includes(c.id) ? v.filter((x) => x !== c.id) : [...v, c.id]))}>
                  <span className="h-8 w-1.5 rounded-full" style={{ background: c.color }} />
                  <span>
                    <span className="block font-semibold">{t(c.name)}</span>
                    <span className="block text-[13px] leading-tight text-muted">{t(BLURBS[c.id])}</span>
                  </span>
                </Option>
              ))}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{t("Wie viel Zeit nimmst du dir?")}</h1>
            <p className="mb-6 mt-2 text-muted">{t("Kleine Ziele hält man durch. Erhöhen geht immer.")}</p>
            <div className="space-y-3">
              {GOALS.map((g) => (
                <Option key={g.min} active={goal === g.min} onClick={() => setGoal(g.min)}>
                  <span className="w-16 font-display text-2xl font-semibold">{g.min} min</span>
                  <span>
                    <span className="block font-semibold">{t(g.label)}</span>
                    <span className="text-sm text-muted">{t("ca. {n} Fragen am Tag", { n: goalQuestions(g.min) })}</span>
                  </span>
                </Option>
              ))}
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{t("Was treibt dich an?")}</h1>
            <p className="mb-6 mt-2 text-muted">{t("Damit wir wissen, was wir dir zuerst zeigen.")}</p>
            <div className="space-y-3">
              {MOTIVES.map(({ id, title, text, Icon }) => (
                <Option key={id} active={motivation === id} onClick={() => setMotivation(id)}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-raised">
                    <Icon size={20} />
                  </span>
                  <span>
                    <span className="block font-semibold">{t(title)}</span>
                    <span className="text-sm text-muted">{t(text)}</span>
                  </span>
                </Option>
              ))}
            </div>
          </>
        )}
        {step === 5 && sample && (
          <>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{t("Deine erste Frage")}</h1>
            <p className="mb-5 mt-2 text-muted">{t("So fühlt sich Wunder an. Die XP gehören schon dir.")}</p>
            <KnowledgeCard item={sample} onAnswered={() => setAnswered(true)} />
          </>
        )}
        {step === 6 && (
          <>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{t("Fast geschafft.")}</h1>
            <p className="mb-6 mt-2 text-muted">
              {state.xp > 0 ? t("Du startest mit {n} XP.", { n: state.xp }) + " " : ""}
              {t("Wie sollen dich andere sehen?")}
            </p>
            <label className="mb-2 block text-sm font-semibold" htmlFor="name">
              {t("Anzeigename")}
            </label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder={t("z. B. Alex")} className="mb-8 h-14 w-full rounded-2xl border border-line bg-surface px-4 text-lg outline-none focus:border-ink" />
            <p className="mb-2 text-sm font-semibold">{t("Fortschritt sichern (optional)")}</p>
            <Account allowSignIn={false} />
          </>
        )}
      </div>

      <Button onClick={step === STEPS ? finish : next} disabled={!canNext} className="sticky bottom-6 mt-6 h-14 w-full text-base shadow-lg">
        {step === STEPS ? t("Zum Feed") : t("Weiter")} <ArrowRight size={18} />
      </Button>
    </div>
  );
}
