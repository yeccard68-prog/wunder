"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { SCENES } from "@/components/anim/scenes";
import type { Animation } from "@/lib/animations";
import { useT } from "@/lib/store";

/**
 * Plays one explainer animation: a scene drawn step by step, with a caption per step.
 * The learner can pause, jump between steps and replay; with "reduce motion" switched on
 * nothing starts by itself and the steps are shown as still images. `active` = currently on screen.
 */
export default function AnimationPlayer({ animation, onFinished, active = true }: { animation: Animation; onFinished?: () => void; active?: boolean }) {
  const t = useT();
  const Scene = SCENES[animation.scene];
  const durations = animation.steps.map((s) => s.seconds ?? 6);
  const total = durations.reduce((a, b) => a + b, 0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [still, setStill] = useState(false); // reduced motion
  const finished = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStill(reduced);
    // inside a feed the animation only runs while it is on screen
    setPlaying(active && !reduced && !finished.current);
  }, [animation.id, active]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); // a hidden tab must not jump ahead
      last = now;
      setTime((v) => Math.min(total, v + dt));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, total]);

  useEffect(() => {
    if (time < total) return;
    setPlaying(false);
    if (!finished.current) {
      finished.current = true;
      onFinished?.();
    }
  }, [time, total, onFinished]);

  // which step are we in, and how far
  let step = 0;
  let before = 0;
  while (step < durations.length - 1 && time >= before + durations[step]) before += durations[step++];
  const p = Math.min(1, (time - before) / durations[step]);
  const go = useCallback(
    (i: number) => {
      const target = Math.max(0, Math.min(durations.length - 1, i));
      const start = durations.slice(0, target).reduce((a, b) => a + b, 0);
      // still images show a late moment of the step, where the scene is most telling
      setTime(start + (still ? durations[target] * 0.6 : 0));
      if (target === durations.length - 1 && still && !finished.current) {
        finished.current = true;
        onFinished?.();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [still, animation.id],
  );
  const done = time >= total;
  const toggle = () => {
    if (done) setTime(0);
    setPlaying((v) => !v || done);
  };

  if (!Scene) return <p role="alert" className="card p-4 text-sm">{t("Diese Animation kann gerade nicht angezeigt werden.")}</p>;
  return (
    <div data-testid="animation-player" data-step={step} data-playing={playing}>
      <div className="overflow-hidden rounded-3xl bg-[#11100e] text-white">
        <svg viewBox="0 0 360 400" role="img" aria-label={animation.title} className="block w-full" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }} onClick={toggle}>
          <Scene step={step} p={p} t={time} labels={animation.labels} />
        </svg>
        <div className="h-1 bg-white/15">
          <div className="h-full bg-white/80" style={{ width: `${(time / total) * 100}%` }} />
        </div>
      </div>

      <p aria-live="polite" className="mt-4 min-h-[6rem] text-[15px] leading-relaxed">
        <span className="tnum mr-2 text-xs font-bold uppercase tracking-wider text-muted">{step + 1}/{durations.length}</span>
        {animation.steps[step].text}
      </p>

      <div className="mt-2 flex items-center justify-center gap-3">
        <button onClick={() => go(step - (p > 0.25 && !still ? 0 : 1))} disabled={step === 0 && time === 0} aria-label={t("Schritt zurück")} className="press flex h-12 w-12 items-center justify-center rounded-full bg-raised disabled:opacity-40">
          <ChevronLeft size={22} />
        </button>
        <button onClick={toggle} aria-label={done ? t("Noch einmal ansehen") : playing ? t("Pause") : t("Abspielen")} className="press flex h-14 w-14 items-center justify-center rounded-full bg-ink text-bg">
          {done ? <RotateCcw size={22} /> : playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
        </button>
        <button onClick={() => go(step + 1)} disabled={step === durations.length - 1} aria-label={t("Schritt weiter")} className="press flex h-12 w-12 items-center justify-center rounded-full bg-raised disabled:opacity-40">
          <ChevronRight size={22} />
        </button>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {durations.map((_, i) => (
          <button key={i} onClick={() => go(i)} aria-label={t("Schritt {n}", { n: i + 1 })} aria-current={i === step ? "step" : undefined} className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-ink" : "w-2 bg-line"}`} />
        ))}
      </div>
    </div>
  );
}
