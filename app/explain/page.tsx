"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Play, Target } from "lucide-react";
import AnimationPlayer from "@/components/anim/AnimationPlayer";
import KnowledgeCard from "@/components/KnowledgeCard";
import { Empty } from "@/components/ui";
import { animationsFor, MODEL_CREDITS, type Animation } from "@/lib/animations";
import { useAsking } from "@/lib/quizGate";
import { categoryById } from "@/lib/categories";
import { useStore, useT } from "@/lib/store";

/** "So funktioniert's": explainer animations – overview and player. */
export default function ExplainPage() {
  const { state } = useStore();
  const t = useT();
  const animations = useMemo(() => animationsFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  const [openId, setOpenId] = useState<string | null>(null);
  const current = animations.find((a) => a.id === openId);
  // an animation can be opened directly: /explain/?a=a-dna (links from books)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("a");
    if (id) setOpenId(id);
  }, []);

  if (current) return <Detail key={current.id} current={current} onBack={() => setOpenId(null)} />;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-semibold leading-tight">{t("So funktioniert’s")}</h1>
        <p className="text-sm text-muted">{t("Kurze Animationen, die Schritt für Schritt zeigen, wie etwas funktioniert.")}</p>
      </header>
      {!animations.length && <Empty icon={<Play size={22} />} title={t("Noch keine Animationen")} text={t("Für deine Altersstufe gibt es hier noch nichts. Neue Animationen folgen.")} />}
      {animations.map((a) => {
        const cat = categoryById(a.categoryId);
        const done = !!a.quizId && !!state.answers[a.quizId];
        return (
          <button key={a.id} onClick={() => { setOpenId(a.id); window.scrollTo(0, 0); }} className="press card flex w-full items-center gap-4 p-4 text-left">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white" style={{ background: cat.color }}>
              {done ? <Check size={20} /> : <Play size={18} fill="currentColor" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg font-semibold leading-tight">{a.title}</span>
              <span className="block text-sm text-muted">{a.summary}</span>
              <span className="mt-1 block text-xs font-semibold text-muted">{t(cat.name)} · {t("{n} Sek.", { n: a.seconds })} · {t("{n} Schritte", { n: a.steps.length })}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** One animation with its check question. */
function Detail({ current, onBack }: { current: Animation; onBack: () => void }) {
  const { items, state } = useStore();
  const t = useT();
  const [seen, setSeen] = useState(false);
  const cat = categoryById(current.categoryId);
  const quiz = current.quizId ? items.find((i) => i.id === current.quizId) : undefined;
  const shown = !!quiz && (seen || !!state.answers[quiz.id]);
  // while the question is open the animation (its captions show the answer) steps aside
  const asking = useAsking(quiz, shown && seen, state);
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="press -ml-1 flex items-center gap-1.5 text-sm font-semibold text-muted">
        <ArrowLeft size={18} /> {t("Alle Animationen")}
      </button>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: cat.color }}>{t(cat.name)}</p>
        <h1 className="font-display text-2xl font-semibold leading-tight">{current.title}</h1>
      </header>
      {asking ? (
        <p className="card flex items-center gap-2 p-4 text-sm text-muted" data-testid="animation-aside"><Check size={16} className="shrink-0 text-good" /> {t("Angesehen. Jetzt die Frage – danach kannst du die Animation noch einmal ansehen.")}</p>
      ) : (
        <AnimationPlayer animation={current} onFinished={() => setSeen(true)} />
      )}
      <p className="card flex gap-3 p-4 text-sm leading-relaxed">
        <Target size={18} className="mt-0.5 shrink-0 text-accent" />
        <span>{current.goal}</span>
      </p>
      {quiz && shown && (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t("Verstanden?")}</p>
          <KnowledgeCard item={quiz} />
        </section>
      )}
      <footer className="space-y-1.5 text-xs leading-relaxed text-muted">
        {current.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 underline">
            {s.name} <ExternalLink size={12} />
          </a>
        ))}
        {MODEL_CREDITS[current.scene] && (
          <p>
            {t("3D-Modell:")} {MODEL_CREDITS[current.scene]} ·{" "}
            <Link href="/legal/" className="underline">{t("Lizenzen")}</Link>
          </p>
        )}
        <p>{current.verification === "verified" ? t("Redaktionell geprüft") : t("Von KI geprüft, noch nicht redaktionell bestätigt.")}</p>
      </footer>
    </div>
  );
}
