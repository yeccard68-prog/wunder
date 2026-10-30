"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import type { RevealConfig } from "@/lib/visuals";
import { useT } from "@/lib/store";
import { SCENES } from "./reveal/scenes";
import type { VizProps } from "./types";

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * „Blick ins Innere“ (30.10.2026, the operator's idea): one drawing, outside and inside. A line splits the picture –
 * the outside on its left, the inside on its right; drag it (or use the arrow keys) to look in. With a prediction
 * the picture stays closed until the guess is in. The labels name what is inside where the inside shows.
 */
export default function RevealViz({ visual, revealed, saved, onChange }: VizProps) {
  const t = useT();
  const id = useId().replace(/:/g, "");
  const c = visual.config as RevealConfig;
  const scene = SCENES[c.scene];
  const L = visual.labels;
  // share of the width that shows the outside; closed until the prediction, then it opens halfway by itself
  const [pos, setPos] = useState(() => (revealed ? (saved?.pos ?? 50) / 100 : 1));
  const opened = useRef(revealed);
  useEffect(() => {
    if (!revealed || opened.current) return;
    opened.current = true;
    const from = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - from) / 700);
      setPos(1 - 0.5 * (1 - (1 - k) ** 3));
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [revealed]);

  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; moving: boolean; mouse: boolean } | null>(null);
  const at = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    return clamp((clientX - r.left) / r.width);
  };
  const keep = (v: number) => onChange?.({ pos: Math.round(v * 100) });
  const down = (e: PointerEvent) => {
    if (!revealed) return;
    drag.current = { x: e.clientX, moving: e.pointerType === "mouse", mouse: e.pointerType === "mouse" };
    if (drag.current.moving) setPos(at(e.clientX));
    box.current!.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    // on touch, the line follows only a sideways drag – an upward swipe scrolls the feed (touch-action: pan-y)
    if (!d.moving && Math.abs(e.clientX - d.x) > 6) d.moving = true;
    if (d.moving) setPos(at(e.clientX));
  };
  const up = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const v = at(e.clientX); // a tap moves the line there too
    setPos(v);
    keep(v);
  };
  const key = (e: KeyboardEvent) => {
    if (!revealed) return;
    const next = e.key === "ArrowLeft" ? pos - 0.05 : e.key === "ArrowRight" ? pos + 0.05 : e.key === "Home" ? 0 : e.key === "End" ? 1 : null;
    if (next === null) return;
    e.preventDefault();
    setPos(clamp(next));
    keep(clamp(next));
  };

  const x = pos * 400;
  return (
    <div data-testid="viz-reveal">
      <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wider text-muted">
        <span>{L.outside}</span>
        <span>{L.inside}</span>
      </div>
      <div
        ref={box}
        className={`relative mx-auto aspect-square w-full max-w-[440px] select-none overflow-hidden rounded-2xl bg-[#14161c] ${revealed ? "cursor-ew-resize" : ""}`}
        style={{ touchAction: "pan-y" }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => (drag.current = null)}
      >
        <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <clipPath id={`${id}-out`}><rect x="0" y="0" width={x} height="400" /></clipPath>
            <clipPath id={`${id}-in`}><rect x={x} y="0" width={400 - x} height="400" /></clipPath>
          </defs>
          <g clipPath={`url(#${id}-out)`}>{scene.outside(`${id}o`)}</g>
          <g clipPath={`url(#${id}-in)`}>{scene.inside(`${id}i`)}</g>
          {pos > 0 && pos < 1 && <line x1={x} x2={x} y1="0" y2="400" stroke="#fff" strokeWidth="2" strokeOpacity="0.9" />}
        </svg>
        {c.parts.filter((p) => revealed || !p.late).map((p) => {
          const shown = p.x / 100 > pos + 0.01;
          return (
            <div key={p.key} className={`pointer-events-none absolute flex items-center gap-1.5 transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"} ${p.side === "left" ? "flex-row-reverse" : ""}`}
              // a label to the left is anchored at its right end, so it has the whole width to the left (and does not wrap)
              style={p.side === "left" ? { right: `${100 - p.x}%`, top: `${p.y}%`, transform: "translateY(-50%)", marginRight: -4 } : { left: `${p.x}%`, top: `${p.y}%`, transform: "translateY(-50%)", marginLeft: -4 }}
              data-testid="reveal-label" data-shown={shown}>
              <span className="h-2 w-2 shrink-0 rounded-full bg-white shadow ring-2 ring-black/40" />
              <span className="whitespace-nowrap rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold leading-tight text-white">{L[p.key]}</span>
            </div>
          );
        })}
        {revealed ? (
          <div role="slider" tabIndex={0} aria-label={L.slider} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((1 - pos) * 100)} aria-valuetext={`${Math.round((1 - pos) * 100)} %`}
            onKeyDown={key} data-testid="reveal-handle"
            className="absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/50 text-white shadow-lg outline-none backdrop-blur focus-visible:ring-4 focus-visible:ring-accent/60"
            style={{ left: `${pos * 100}%` }}>
            <ChevronLeft size={15} className="-mr-1" /><ChevronRight size={15} className="-ml-1" />
          </div>
        ) : (
          <p className="absolute inset-x-0 bottom-3 mx-auto flex w-fit items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white" data-testid="reveal-locked">
            <Lock size={13} /> {t("Erst schätzen, dann hineinschauen")}
          </p>
        )}
      </div>
    </div>
  );
}
