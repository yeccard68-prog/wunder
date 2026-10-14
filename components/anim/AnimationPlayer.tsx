"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from "lucide-react";
import { SCENES } from "@/components/anim/scenes";
import Stage3D from "@/components/three/Stage3D";
import { track } from "@/lib/analytics";
import type { Animation } from "@/lib/animations";
import { useStore, useT } from "@/lib/store";

const SPEEDS = [0.75, 1, 1.5];

/**
 * Plays one explainer animation: a scene drawn step by step, with a caption per step.
 * The learner can pause, jump between steps and replay; with "reduce motion" switched on
 * nothing starts by itself and the steps are shown as still images. `active` = currently on screen.
 * Once per viewing the animation stops before one step and asks what will happen next; the step
 * that follows shows the answer. `mounted` = false keeps the 3D stage (and its WebGL context) unbuilt.
 */
export default function AnimationPlayer({ animation, onFinished, active = true, compact, mounted = true }: { animation: Animation; onFinished?: () => void; active?: boolean; compact?: boolean; mounted?: boolean }) {
  const t = useT();
  const { state } = useStore();
  const [no3d, setNo3d] = useState(false); // WebGL missing or lost → 2D drawing, or text only
  const three = animation.renderer === "three" && !no3d;
  const Scene = (SCENES as Record<string, (typeof SCENES)[string] | undefined>)[animation.renderer === "three" ? (animation.fallback ?? "") : animation.scene];
  const durations = animation.steps.map((s) => s.seconds);
  const total = durations.reduce((a, b) => a + b, 0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [still, setStill] = useState(false); // reduced motion
  const finished = useRef(false);
  // playback speed, remembered on this device (a convenience – nothing breaks without it)
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(1);
  speedRef.current = speed;
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem("wunder.anim.speed"));
      if (SPEEDS.includes(saved)) setSpeed(saved);
    } catch {
      /* storage blocked */
    }
  }, []);
  const nextSpeed = () => {
    const value = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(value);
    try {
      localStorage.setItem("wunder.anim.speed", String(value));
    } catch {
      /* storage blocked */
    }
  };
  const predict = animation.predict;
  const predictAt = predict ? durations.slice(0, predict.step).reduce((a, b) => a + b, 0) : Infinity;
  const [asking, setAsking] = useState(false); // stopped for the prediction
  const [guess, setGuess] = useState<number | null>(null);
  const asked = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStill(reduced);
    // inside a feed the animation only runs while it is on screen
    setPlaying(active && !reduced && !finished.current && !askingRef.current);
  }, [animation.id, active]);
  const askingRef = useRef(false);
  askingRef.current = asking;

  // stop once, right before the step that answers the prediction (only while it plays by itself)
  useEffect(() => {
    if (!predict || asked.current || !playing || time < predictAt - 0.25 || time > predictAt + 0.5) return;
    asked.current = true;
    setPlaying(false);
    setAsking(true);
    setTime(predictAt - 0.02); // stay in the step before: the next one would show the answer
  }, [time, playing, predict, predictAt]);
  const choose = (i: number) => {
    if (guess !== null || !predict) return;
    setGuess(i);
    track("animation_predict", animation.id, "animation");
  };
  const resume = () => {
    setAsking(false);
    setPlaying(true);
  };

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); // a hidden tab must not jump ahead
      last = now;
      setTime((v) => Math.min(total, v + dt * speedRef.current));
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
    if (asking) return resume();
    if (done) setTime(0);
    setPlaying((v) => !v || done);
  };

  return (
    <div data-testid="animation-player" data-step={step} data-playing={playing} data-seconds={total} data-asking={asking} data-renderer={three ? "three" : Scene ? "svg" : "text"}>
      <div className="overflow-hidden rounded-3xl bg-[#11100e] text-white">
        {three ? (
          <Stage3D scene={animation.scene} step={step} p={p} t={time * animation.motion} into={time - before} labels={animation.labels} title={animation.title} compact={compact} mounted={mounted} onUnavailable={() => setNo3d(true)} />
        ) : Scene ? (
          <svg viewBox="0 0 360 400" role="img" aria-label={animation.title} className={`mx-auto block w-full ${compact ? "max-h-[38dvh]" : ""}`} style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }} onClick={toggle}>
            <Scene step={step} p={p} t={time * animation.motion} labels={animation.labels} />
          </svg>
        ) : (
          <p role="status" className="px-5 py-10 text-center text-sm text-white/75">{t("Die 3D-Ansicht ist auf diesem Gerät nicht verfügbar. Die Erklärung kannst du trotzdem Schritt für Schritt lesen.")}</p>
        )}
        <div className="h-1 bg-white/15">
          <div className="h-full bg-white/80" style={{ width: `${(time / total) * 100}%` }} />
        </div>
      </div>

      {asking && predict ? (
        <div className={`pop rounded-2xl bg-raised p-3.5 ${compact ? "mt-3" : "mt-4"}`} role="group" aria-label={t("Was passiert als Nächstes?")} data-testid="predict">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{t("Was passiert als Nächstes?")}</p>
          <p className="mt-1 text-sm font-semibold leading-snug">{predict.question}</p>
          <div className="mt-2.5 space-y-1.5">
            {predict.options.map((option, i) => {
              const right = guess !== null && i === predict.correct;
              const wrong = guess === i && i !== predict.correct;
              return (
                <button key={option} onClick={() => choose(i)} disabled={guess !== null} aria-pressed={guess === i} className={`press flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium ${right ? "border-good bg-good/10" : wrong ? "border-bad bg-bad/10" : guess !== null ? "border-line opacity-50" : "border-line bg-surface"}`}>
                  <span className="flex-1">{option}</span>
                  {right && <Check size={16} className="text-good" />}
                  {wrong && <X size={16} className="text-bad" />}
                </button>
              );
            })}
          </div>
          {guess !== null && (
            <div className="mt-2.5 flex items-center gap-3" role="status">
              <p className="flex-1 text-xs font-semibold text-muted">{guess === predict.correct ? t("Gut vermutet – sieh es dir an.") : t("Nicht ganz – achte jetzt genau darauf.")}</p>
              <button onClick={resume} className="press flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-bg"><Play size={14} fill="currentColor" /> {t("Weiter")}</button>
            </div>
          )}
        </div>
      ) : (
        <p aria-live="polite" className={compact ? "mt-3 min-h-[5.25rem] text-sm leading-snug" : "mt-4 min-h-[6rem] text-[15px] leading-relaxed"}>
          <span className="tnum mr-2 text-xs font-bold uppercase tracking-wider text-muted">{step + 1}/{durations.length}</span>
          {animation.steps[step].text}
        </p>
      )}

      <div className="relative mt-2 flex items-center justify-center gap-3">
        <button onClick={nextSpeed} aria-label={t("Tempo: {n}-fach", { n: String(speed).replace(".", ",") })} data-testid="speed" className="press absolute left-0 h-9 rounded-full border border-line px-3 text-xs font-bold tnum">{String(speed).replace(".", state.settings.locale === "en" ? "." : ",")}×</button>
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
      <div className={compact ? "hidden" : "mt-3 flex justify-center gap-2"}>
        {durations.map((_, i) => (
          <button key={i} onClick={() => go(i)} aria-label={t("Schritt {n}", { n: i + 1 })} aria-current={i === step ? "step" : undefined} className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-ink" : "w-2 bg-line"}`} />
        ))}
      </div>
    </div>
  );
}
