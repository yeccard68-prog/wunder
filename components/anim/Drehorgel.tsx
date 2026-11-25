"use client";
// Barrel organ ("Drehorgel"): an isometric figure built with the anatomy kit (scripts/iso/drehorgel.mjs, MIT).
// Static parts come pre-drawn from components/anim/iso/drehorgel.json; this scene draws what moves: the barrel's
// pins, the keys they lift, the crank, the connecting rod and the feeder bellows. The pins hold the opening of
// "Ode an die Freude" (the same notes as the listening card mk98), one barrel turn = 16 beats.
// The barrel turns with the animation's clock; the learner can also drag the crank. Sound only after a tap on
// the sound button (no audio before a user gesture): recorded organ pipes (lib/organ.ts), fetched on that tap.
// Labels: 0 crank, 1 pinned barrel, 2 feeder bellows, 3 reservoir bellows, 4 wind chest, 5 pipes, 6 the tune,
// 7 "sound on", 8 "sound off".
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import fig from "@/components/anim/iso/drehorgel.json";
import type { SceneProps } from "@/components/anim/scenes";
import { createOrgan, type LoadingOrgan } from "@/lib/organ";

type V3 = [number, number, number];
const P = fig.P as { origin: [number, number]; scale: number; azimuth: number; elevation: number };
const RAD = Math.PI / 180, UNIT = Math.sqrt(1.6);
const sinA = Math.sin(P.azimuth * RAD), cosA = Math.cos(P.azimuth * RAD), sinE = Math.sin(P.elevation * RAD), cosE = Math.cos(P.elevation * RAD), K = P.scale * UNIT;
// same projection as the kit's iso() and depthOf()
const iso = ([x, y, z]: V3): [number, number] => [P.origin[0] + (x * sinA - y * cosA) * K, P.origin[1] + ((x * cosA + y * sinA) * sinE - z * cosE) * K];
const facing = ([x, y, z]: V3) => (x * cosA + y * sinA) * cosE + z * sinE > 0;
const seg = (a: V3, b: V3) => { const p = iso(a), q = iso(b); return `M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}`; };

const { notes, turn: TURN, keyX, bar, crank, ecc, feed, layers, anchors, hub, keyLift, pitches } = fig;
const GAP = 0.3; // beats of silence before a repeated note, so it sounds again
const AUTO = 1; // beats per second while the animation plays (one barrel turn = 16 s)
const LIT = "var(--anatomy-lit)";

/** Which keys a pin is lifting when the barrel has turned by `beat`. */
export const liftedAt = (beat: number) => keyX.map((_, i) => notes.some((n) => n.key === i && (((beat - n.at) % TURN) + TURN) % TURN < n.len - GAP));

function pinsPath(beat: number) {
  let path = "";
  for (const n of notes) {
    const x = keyX[n.key], from = n.at - beat;
    for (let b = from; b <= from + n.len - GAP + 1e-6; b += 0.1) {
      const a = (b / TURN) * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
      if (facing([0, s, c])) path += seg([x, bar.y + bar.r * s, bar.z + bar.r * c], [x, bar.y + (bar.r + 2.6) * s, bar.z + (bar.r + 2.6) * c]);
    }
  }
  return path;
}

// ---- sound: one pipe per open valve (lib/organ.ts: recorded pipes; until they have loaded, the button shows "…")
function useOrgan() {
  const ctx = useRef<AudioContext | null>(null);
  const organ = useRef<LoadingOrgan | null>(null);
  const [ready, setReady] = useState(false);
  const set = (i: number, on: boolean) => organ.current?.set(i, on);
  const silence = () => organ.current?.silence();
  const start = () => {
    if (!ctx.current) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return false;
      ctx.current = new AC();
      organ.current = createOrgan(ctx.current, pitches);
      void organ.current.ready.then(() => setReady(true));
    }
    void ctx.current.resume();
    return true;
  };
  useEffect(() => () => { organ.current?.close(); void ctx.current?.close(); }, []);
  return { set, silence, start, ready };
}

const Html = ({ html, className }: { html: string; className?: string }) => <g className={className} dangerouslySetInnerHTML={{ __html: html }} />;

/** A label: a leader from the part (yellow dot) to the near end of the text, which sits left or right of (x, y). */
function Tag({ at, x, y, text, side = "right" }: { at: number[]; x: number; y: number; text: string; side?: "left" | "right" }) {
  return (
    <g>
      <path d={`M${at[0]} ${at[1]}L${x} ${y - 4}`} stroke="#f4f1ea" strokeOpacity={0.5} strokeWidth={0.8} fill="none" />
      <circle cx={at[0]} cy={at[1]} r={1.8} fill="#ffd24a" />
      <text x={x + (side === "left" ? -4 : 4)} y={y} textAnchor={side === "left" ? "end" : "start"} fill="#f4f1ea" fontSize={12} fontWeight={600}>{text}</text>
    </g>
  );
}

export default function Drehorgel({ step, t, labels }: SceneProps) {
  const [extra, setExtra] = useState(0); // beats the learner turned by hand
  const [sound, setSound] = useState(false);
  const organ = useOrgan();
  const drag = useRef<{ a: number } | null>(null);
  const beat = t * AUTO + extra;
  const up = liftedAt(beat);
  const key = up.join();

  useEffect(() => { if (sound) up.forEach((on, i) => organ.set(i, on)); }, [key, sound]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSound = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (sound) { organ.silence(); setSound(false); } else if (organ.start()) setSound(true);
  };
  // drag around the crank hub: the angle travelled turns the barrel (either direction turns it forward). A busy
  // browser merges several moves into one event; its coalesced points keep the whole path of a quick turn.
  const angleAt = (svg: SVGSVGElement, x: number, y: number) => {
    const m = svg.getScreenCTM();
    if (!m) return 0;
    const p = new DOMPoint(x, y).matrixTransform(m.inverse());
    return Math.atan2(p.y - hub[1], p.x - hub[0]);
  };
  const onDown = (e: ReactPointerEvent<SVGElement>) => {
    e.stopPropagation(); (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { a: angleAt((e.currentTarget as SVGElement).ownerSVGElement!, e.clientX, e.clientY) };
  };
  const onMove = (e: ReactPointerEvent<SVGElement>) => {
    if (!drag.current) return;
    const svg = (e.currentTarget as SVGElement).ownerSVGElement!, ne = e.nativeEvent;
    const pts = typeof ne.getCoalescedEvents === "function" ? ne.getCoalescedEvents() : [];
    let total = 0;
    for (const q of pts.length ? pts : [ne]) {
      const a = angleAt(svg, q.clientX, q.clientY);
      let d = a - drag.current.a;
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      drag.current = { a };
      total += Math.abs(d);
    }
    setExtra((x) => x + (total / (2 * Math.PI)) * TURN);
  };
  const onUp = () => { drag.current = null; };

  // moving parts
  const ca = (beat / TURN) * Math.PI * 2;
  const pin: V3 = [crank.x, bar.y + crank.r * Math.sin(ca), bar.z + crank.r * Math.cos(ca)];
  const ea = ca * 2; // two strokes of the feeder bellows per barrel turn
  const eccPt: V3 = [ecc.x, bar.y + ecc.r * Math.sin(ea), bar.z + ecc.r * Math.cos(ea)];
  const share = 0.5 + 0.5 * Math.cos(ea);
  const top = feed.low + (feed.high - feed.low) * share;
  const frame = Math.round(share * (layers.feeder.length - 1));
  const eccScreen = iso(eccPt);

  // which parts the current step is about (the others step back)
  const focus = [
    ["crank", "barrel"],
    ["crank", "bellows"],
    ["barrel", "keys", "pipes"],
    ["crank", "barrel", "keys", "pipes", "bellows"],
  ][Math.min(step, 3)];
  const dim = (part: string) => ({ opacity: focus.includes(part) ? 1 : 0.35, transition: "opacity 400ms" });

  return (
    <g>
      <style>{fig.css}</style>
      <g className="iso iso-svg" style={{ ["--anatomy-paper" as string]: "#11100e", ["--anatomy-card" as string]: "#11100e" }}>
        <Html html={layers.base} />
        <g style={dim("bellows")}><Html html={layers.bellows} /></g>
        <g style={dim("pipes")}>
          <Html html={layers.chest} />
          {layers.pipes.map((p, i) => <Html key={i} html={p} />)}
          {layers.breath.map((p, i) => <path key={i} className="iso-line" d={p} style={{ stroke: LIT, strokeWidth: 1.2, opacity: up[i] ? 1 : 0 }} data-testid={up[i] ? "pipe-open" : undefined} />)}
        </g>
        <Html html={layers.supports} />
        <g style={dim("barrel")}>
          <Html html={layers.barrel} />
          <path className="iso-line" d={pinsPath(beat)} style={{ stroke: LIT, strokeWidth: 1.6 }} />
        </g>
        <g style={dim("keys")}>{layers.keys.map((k, i) => <g key={i} transform={up[i] ? `translate(${keyLift[0]} ${keyLift[1]})` : undefined}><Html html={k} /></g>)}</g>
        <g style={dim("bellows")}><Html html={layers.feeder[frame]} /></g>
        <g style={dim("crank")}><Html html={layers.axle} /></g>
        <g style={dim("bellows")}>
          <path className="iso-line" d={seg(eccPt, [ecc.x, bar.y, top])} style={{ stroke: LIT, strokeWidth: 2.2 }} />
          <circle cx={eccScreen[0]} cy={eccScreen[1]} r={2.2} fill={LIT} />
        </g>
        <g style={dim("crank")}>
          <path className="iso-line" d={seg([crank.x, bar.y, bar.z], pin)} style={{ stroke: LIT, strokeWidth: 3 }} />
          <path className="iso-line" d={seg(pin, [crank.x + 16, pin[1], pin[2]])} style={{ stroke: LIT, strokeWidth: 6 }} />
          <circle cx={hub[0]} cy={hub[1]} r={2} fill="#11100e" />
        </g>
        {/* grab area for the crank */}
        <circle cx={hub[0]} cy={hub[1]} r={46} fill="transparent" style={{ cursor: "grab", touchAction: "none" }} data-testid="organ-crank"
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onClick={(e) => e.stopPropagation()} />
      </g>

      {step === 0 && <><Tag at={hub} x={286} y={336} text={labels[0]} /><Tag at={anchors.barrel} x={84} y={292} text={labels[1]} side="left" /></>}
      {step === 1 && <><Tag at={anchors.feeder} x={228} y={340} text={labels[2]} /><Tag at={anchors.reservoir} x={344} y={184} text={labels[3]} side="left" /></>}
      {step === 2 && <><Tag at={anchors.barrel} x={84} y={292} text={labels[1]} side="left" /><Tag at={anchors.chest} x={132} y={140} text={labels[4]} side="left" /><Tag at={anchors.pipes} x={124} y={58} text={labels[5]} side="left" /></>}
      {step >= 3 && <text x={180} y={26} textAnchor="middle" fill="#ffd24a" fontSize={14} fontWeight={700}>{labels[6]}</text>}

      <g role="button" aria-label={sound ? labels[8] : labels[7]} aria-pressed={sound} aria-busy={sound && !organ.ready} tabIndex={0} data-testid="organ-sound"
        data-state={sound ? (organ.ready ? "on" : "loading") : "off"} onClick={toggleSound}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSound(e); } }} style={{ cursor: "pointer" }}>
        <rect x={250} y={364} width={98} height={28} rx={14} fill={sound ? "#ffd24a" : "transparent"} stroke="#ffd24a" strokeWidth={1.2} />
        <text x={299} y={382} textAnchor="middle" fill={sound ? "#11100e" : "#ffd24a"} fontSize={12} fontWeight={700}>{sound ? (organ.ready ? labels[8] : "…") : labels[7]}</text>
      </g>
    </g>
  );
}
