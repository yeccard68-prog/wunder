"use client";
// Music box ("Spieluhr"): an isometric figure built with the anatomy kit (scripts/iso/spieluhr.mjs, MIT).
// Static parts come pre-drawn from components/anim/iso/spieluhr.json; this scene draws what moves: the pins of the
// cylinder, the tines they lift and let go, the spring in its barrel, the key, the worm and the fly of the governor.
// The pins hold Brahms' "Wiegenlied" (the notes of the listening card mk105, one octave higher); one turn = 24 beats.
// The spring drives the cylinder: the animation winds it at the start, then it runs down while the music plays, and
// the tune slows down as it relaxes (the fly's vanes are rigid). The learner can wind it by dragging the key – from
// then on the box runs on its own clock until the spring has run down. Sound only after a tap on the sound button
// (no audio before a user gesture): lib/musicbox.ts.
// Labels: 0 key, 1 spring, 2 pinned cylinder, 3 comb, 4 lead weight, 5 "two tines, one note", 6 fly, 7 the tune,
// 8 "sound on", 9 "sound off".
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import fig from "@/components/anim/iso/spieluhr.json";
import type { SceneProps } from "@/components/anim/scenes";
import { createMusicBox, type MusicBox } from "@/lib/musicbox";

type V3 = [number, number, number];
type Pt = [number, number];
const P = fig.P as { origin: Pt; scale: number; azimuth: number; elevation: number };
const RAD = Math.PI / 180, UNIT = Math.sqrt(1.6), TAU = Math.PI * 2;
const sinA = Math.sin(P.azimuth * RAD), cosA = Math.cos(P.azimuth * RAD), sinE = Math.sin(P.elevation * RAD), cosE = Math.cos(P.elevation * RAD), K = P.scale * UNIT;
// same projection as the kit's iso() and depthOf()
const iso = ([x, y, z]: V3): Pt => [P.origin[0] + (x * sinA - y * cosA) * K, P.origin[1] + ((x * cosA + y * sinA) * sinE - z * cosE) * K];
const depth = ([x, y, z]: V3) => (x * cosA + y * sinA) * cosE + z * sinE;
const facing = (normal: V3) => depth(normal) > 0;
const xy = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
const pathOf = (ps: V3[], closed = false) => (ps.length ? `M${ps.map((p) => xy(iso(p))).join("L")}${closed ? "Z" : ""}` : "");

const { notes, turn: TURN, comb, tineX, len, tipY, tineZ, pluck: PLUCK, pin: PIN, bar, wheel, worm, fly, drum, key, weighted, layers, anchors, keyHub } = fig;
const LIT = "var(--anatomy-lit)";

// ---- the drive: the spring stores WMAX turns of the cylinder; how fast it turns depends on how far it is wound
export const WMAX = 4;
const RUN = WMAX * TURN; // beats from fully wound to run down
const V = fig.bpm / 60; // beats per second when fully wound: the tempo of the listening card
/** Beats per second at wind w (1 = fully wound, 0 = run down): the fly's vanes are rigid, so the tune slows as the spring relaxes. */
export const speed = (w: number) => (w > 0 ? V * (0.55 + 0.45 * Math.min(1, w)) : 0);
export const START = -0.7; // the box at rest: the first pin is just short of its tine
const WIND = [0.6, 3.6], WIND_TURNS = 3; // the animation turns the key three times during these seconds
const DT = 1 / 60, SPAN = 150;
// the animation's run, worked out once: the cylinder's beat and the spring's wind for every 1/60 s
const TABLE = (() => {
  const n = Math.round(SPAN / DT), beat = new Float64Array(n + 1), wind = new Float64Array(n + 1);
  let b = START, w = 0;
  for (let i = 0; i <= n; i++) {
    beat[i] = b;
    wind[i] = w;
    const t = i * DT;
    if (t >= WIND[0] && t < WIND[1]) w = Math.min(1, w + (DT * WIND_TURNS) / (WIND[1] - WIND[0]) / WMAX);
    const v = speed(w);
    b += v * DT;
    w = Math.max(0, w - (v * DT) / RUN);
  }
  return { beat, wind };
})();

/** Where the animation's clock (seconds) has brought the box: the cylinder's beat and the spring's wind (0–1). */
export function stateAt(t: number) {
  const x = Math.max(0, Math.min(t, SPAN)) / DT, i = Math.min(Math.floor(x), TABLE.beat.length - 2), f = x - i;
  return { beat: TABLE.beat[i] + (TABLE.beat[i + 1] - TABLE.beat[i]) * f, w: TABLE.wind[i] + (TABLE.wind[i + 1] - TABLE.wind[i]) * f };
}

/** When (seconds of the animation) the cylinder first reached `beat`. */
export function timeOf(beat: number) {
  const b = TABLE.beat;
  if (beat <= b[0]) return 0;
  let lo = 0, hi = b.length - 1;
  if (beat > b[hi]) return SPAN;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (b[m] < beat) lo = m;
    else hi = m;
  }
  return (lo + (beat - b[lo]) / Math.max(1e-9, b[hi] - b[lo])) * DT;
}

/** The pins that let their tine go while the cylinder turns from b0 to b1 (b0 < b1), in order. */
export function plucks(b0: number, b1: number) {
  const out: { at: number; tine: number; midi: number }[] = [];
  for (const n of notes) for (let k = Math.floor((b0 - n.at) / TURN) + 1; n.at + k * TURN <= b1; k++) out.push({ at: n.at + k * TURN, tine: n.tine, midi: n.midi });
  return out.sort((a, b) => a.at - b.at);
}

/** The beat at which tine i was last let go (at or before `beat`, after `from`), or null. */
export function lastPluck(i: number, beat: number, from = START) {
  let best = -Infinity;
  for (const n of notes) if (n.tine === i) best = Math.max(best, n.at + Math.floor((beat - n.at) / TURN) * TURN);
  return best > from ? best : null;
}

// ---- the tines: lifted by a pin, let go, they swing (drawn far slower and larger than life) and glow while they sound
const PAIR = [2, 3]; // two tines tuned to the same G, side by side (the label in step 4 points between them)
const LIFT = 2.2, LIFT_BEATS = 0.45; // how far a pin lifts a tip (world units), over how much of a beat
const WOBBLE = 6, DECAY = 0.22, GLOW = 0.7; // the swing (Hz), how fast it dies down and how long the tine glows (s)

/** How far the pin coming up has lifted tine i (0 if none is under it). */
function liftOf(i: number, beat: number) {
  let lift = 0;
  for (const n of notes) {
    if (n.tine !== i) continue;
    const ahead = (((n.at - beat) % TURN) + TURN) % TURN;
    if (ahead > 0 && ahead < LIFT_BEATS) lift = Math.max(lift, LIFT * (1 - ahead / LIFT_BEATS));
  }
  return lift;
}

const U: Pt = [-cosA * sinE, sinA]; // a screen direction along which the world's x axis does not move
/** Tine i bent by `d` at its tip (up = positive): every point moves up in proportion to its distance from the root. */
function tineMatrix(i: number, d: number) {
  if (Math.abs(d) < 0.02) return undefined;
  const r = iso([tineX[i], tipY + len[i], tineZ]);
  const k = (cosE * d) / (len[i] * sinE);
  return `matrix(1 ${(k * U[0]).toFixed(5)} 0 ${(1 + k * U[1]).toFixed(5)} 0 ${(-k * (U[0] * r[0] + U[1] * r[1])).toFixed(3)})`;
}

function pinsPath(beat: number) {
  let d = "";
  for (const n of notes) {
    const a = PLUCK + (((((n.at - beat) % TURN) + TURN) % TURN) / TURN) * TAU; // turning up towards the tines
    const s = Math.sin(a), c = Math.cos(a), x = tineX[n.tine];
    if (facing([0, s, c])) d += pathOf([[x, bar.y + bar.r * s, bar.z + bar.r * c], [x, bar.y + (bar.r + PIN) * s, bar.z + (bar.r + PIN) * c]]);
  }
  return d;
}

function teethPath(rot: number) {
  let d = "";
  const x = bar.x0 + (wheel.s0 + wheel.s1) / 2;
  for (let k = 0; k < wheel.teeth; k++) {
    const a = rot + (k / wheel.teeth) * TAU, s = Math.sin(a), c = Math.cos(a);
    if (facing([0, s, c])) d += pathOf([[x, bar.y + wheel.r * s, bar.z + wheel.r * c], [x, bar.y + (wheel.r + 1.3) * s, bar.z + (wheel.r + 1.3) * c]]);
  }
  return d;
}

// ---- the spring on the barrel's end, as if its cover were glass: the inner end on the key's arbor, the outer end on
// the barrel; winding adds turns and packs them round the arbor
const N0 = 1.5; // turns of the relaxed spring
const FACE = bar.x0 + drum.s1 + 0.15;
function springPath(rot: number, w: number) {
  const n = N0 + WMAX * w, r0 = 2.6, r1 = drum.r - 1.8, steps = Math.ceil(n * 36), ps: V3[] = [];
  for (let j = 0; j <= steps; j++) {
    const u = j / steps, a = rot - TAU * n * (1 - u), r = r0 + (r1 - r0) * u ** (1 + 1.8 * w);
    ps.push([FACE, bar.y + r * Math.sin(a), bar.z + r * Math.cos(a)]);
  }
  return pathOf(ps);
}
const windowPath = pathOf(Array.from({ length: 48 }, (_, j): V3 => [FACE, bar.y + (drum.r - 1) * Math.sin((j / 48) * TAU), bar.z + (drum.r - 1) * Math.cos((j / 48) * TAU)]), true);

function keyWing(angle: number) {
  const x0 = bar.x0 + key.s0, x1 = bar.x0 + key.s1, s = Math.sin(angle), c = Math.cos(angle);
  const at = (x: number, r: number): V3 => [x, bar.y + r * s, bar.z + r * c];
  return pathOf([at(x0, -2), at(x0 + 1.5, -key.r), at(x1, -key.r), at(x1, key.r), at(x0 + 1.5, key.r), at(x0, 2)], true);
}

// ---- the governor: a worm on the fly's arbor, turned by the wheel on the cylinder; the fly's two vanes brake by air
function threadPath(psi: number) {
  const pitch = 2.2, steps = Math.ceil(((worm.z1 - worm.z0) / pitch) * 28);
  let d = "", open = false;
  for (let j = 0; j <= steps; j++) {
    const z = worm.z0 + ((worm.z1 - worm.z0) * j) / steps, a = psi + (TAU * (z - worm.z0)) / pitch, c = Math.cos(a), s = Math.sin(a);
    if (c * cosA + s * sinA > 0.05) {
      d += `${open ? "L" : "M"}${xy(iso([worm.x + worm.r * c, worm.y + worm.r * s, z]))}`;
      open = true;
    } else open = false;
  }
  return d;
}
function vanes(psi: number) {
  return [0, Math.PI]
    .map((o) => {
      const a = psi + o, c = Math.cos(a), s = Math.sin(a);
      const at = (r: number, z: number): V3 => [worm.x + r * c, worm.y + r * s, z];
      const shade = Math.abs(-s * cosA + c * sinA); // how squarely the vane faces us
      return { d: pathOf([at(fly.r0, fly.z0), at(fly.r1, fly.z0), at(fly.r1, fly.z1), at(fly.r0, fly.z1)], true), z: depth(at(fly.r1 / 2, fly.z0)), shade };
    })
    .sort((p, q) => p.z - q.z);
}

// ---- sound: one note per pin that lets its tine go
function useMusicBox() {
  const ctx = useRef<AudioContext | null>(null);
  const box = useRef<MusicBox | null>(null);
  const start = () => {
    if (!ctx.current) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return false;
      ctx.current = new AC();
      box.current = createMusicBox(ctx.current);
    }
    void ctx.current.resume();
    return true;
  };
  useEffect(() => () => { box.current?.close(); void ctx.current?.close(); }, []);
  return { start, pluck: (midi: number) => box.current?.pluck(midi) };
}

// the outline of every solid in a layer: drawn opaque beneath a part, so a part that steps back (faded) still hides
// what lies behind it
const fillsOf = (html: string) => [...html.matchAll(/class="iso-fill" d="([^"]+)"/g)].map((x) => x[1]);
const BACK: Record<string, string[]> = Object.fromEntries(Object.entries(layers).map(([k, v]) => [k, typeof v === "string" ? fillsOf(v) : []]));
const TINE_BACK = layers.tines.map((h, i) => [...(weighted.includes(i) ? fillsOf(layers.weights[weighted.indexOf(i)]) : []), ...fillsOf(h)]);
const backOf = (d: string[]) => d.map((p, i) => <path key={i} d={p} fill="#11100e" />);

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

type Hand = { beat: number; w: number; now: number; plucked: number[] };

export default function Spieluhr({ step, t, labels }: SceneProps) {
  const [sound, setSound] = useState(false);
  const soundOn = useRef(false);
  const box = useMusicBox();
  // once the learner takes the key, the box runs on its own clock (`hand`), no longer on the animation's
  const hand = useRef<Hand | null>(null);
  const [handOn, setHandOn] = useState(false);
  const [, redraw] = useState(0);
  const drag = useRef<{ a: number } | null>(null);
  const last = useRef<number | null>(null);

  const auto = stateAt(t);
  const m = hand.current;
  const beat = m ? m.beat : auto.beat, w = m ? m.w : auto.w;

  // sound while the animation runs: every pin that passed its tine since the last frame (not after a jump)
  useEffect(() => {
    if (hand.current) return;
    const prev = last.current;
    last.current = beat;
    if (!soundOn.current || prev === null || beat <= prev || beat - prev > 2) return;
    for (const p of plucks(prev, beat)) box.pluck(p.midi);
  }, [beat]); // eslint-disable-line react-hooks/exhaustive-deps

  // the box's own clock, once the learner has taken the key
  useEffect(() => {
    if (!handOn) return;
    let raf = 0, prev = performance.now();
    const frame = (ms: number) => {
      const h = hand.current!;
      const dt = Math.min(0.05, Math.max(0, (ms - prev) / 1000));
      prev = ms;
      h.now += dt;
      const v = speed(h.w), b1 = h.beat + v * dt;
      if (v > 0) for (const p of plucks(h.beat, b1)) {
        h.plucked[p.tine] = h.now;
        if (soundOn.current) box.pluck(p.midi);
      }
      h.beat = b1;
      h.w = Math.max(0, h.w - (v * dt) / RUN);
      if (v > 0 || drag.current || h.now - Math.max(...h.plucked) < 3) redraw((x) => x + 1);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [handOn]); // eslint-disable-line react-hooks/exhaustive-deps

  const takeKey = () => {
    if (hand.current) return hand.current;
    const plucked = comb.map((_, i) => { const b = lastPluck(i, auto.beat); return b === null ? -Infinity : timeOf(b); });
    hand.current = { beat: auto.beat, w: auto.w, now: t, plucked };
    setHandOn(true);
    return hand.current;
  };
  const wind = (radians: number) => {
    const h = takeKey();
    h.w = Math.min(1, h.w + radians / (TAU * WMAX)); // the spring takes no more than WMAX turns
    redraw((x) => x + 1);
  };

  const toggleSound = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (sound) { soundOn.current = false; setSound(false); } else if (box.start()) { soundOn.current = true; setSound(true); }
  };
  // drag around the key's hub: the angle travelled winds the spring (either direction winds it). A busy browser
  // merges several moves into one event; its coalesced points keep the whole path, so a quick circle still counts
  // in full instead of as one big jump (which the wrap-around would shorten).
  const angleAt = (svg: SVGSVGElement, x: number, y: number) => {
    const mx = svg.getScreenCTM();
    if (!mx) return 0;
    const p = new DOMPoint(x, y).matrixTransform(mx.inverse());
    return Math.atan2(p.y - keyHub[1], p.x - keyHub[0]);
  };
  const onDown = (e: ReactPointerEvent<SVGElement>) => {
    e.stopPropagation(); (e.currentTarget as Element).setPointerCapture(e.pointerId); takeKey();
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
      if (d > Math.PI) d -= TAU;
      if (d < -Math.PI) d += TAU;
      drag.current = { a };
      total += Math.abs(d);
    }
    wind(total);
  };
  const onUp = () => { drag.current = null; };
  const onKey = (e: ReactKeyboardEvent<SVGElement>) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); wind(TAU / 4); } };

  // what moves
  const rot = -(beat / TURN) * TAU; // the cylinder, its wheel and the spring barrel
  const keyAngle = rot - TAU * (N0 + WMAX * w); // the key holds still while the box plays, and turns only when wound
  const psi = (beat / TURN) * wheel.teeth * TAU; // the worm and the fly: one turn per tooth of the wheel
  const now = m ? m.now : t;
  const tines = comb.map((_, i) => {
    let since = Infinity;
    if (m) since = now - m.plucked[i];
    else {
      const b = lastPluck(i, beat);
      if (b !== null) since = t - timeOf(b);
    }
    const ring = since < 3 ? LIFT * Math.exp(-since / DECAY) * Math.cos(TAU * WOBBLE * since) : 0;
    return { bend: liftOf(i, beat) + ring, glow: since < 3 ? Math.exp(-since / GLOW) : 0 };
  });

  // which parts the current step is about (the others step back)
  const focus = [["key", "spring", "barrel"], ["barrel", "comb"], ["comb"], ["barrel", "comb"], ["key", "spring", "barrel", "comb", "governor"]][Math.min(step, 4)];
  const dim = (part: string) => ({ opacity: focus.includes(part) ? 1 : 0.35, transition: "opacity 400ms" });
  const hub = iso([bar.x0 + key.s0 + 0.5, bar.y, bar.z]);
  const part = (name: string, back: string[], children: ReactNode) => (
    <>
      {backOf(back.flatMap((k) => BACK[k]))}
      <g style={dim(name)}>{children}</g>
    </>
  );

  return (
    <g>
      <style>{fig.css}</style>
      <g className="iso iso-svg" style={{ ["--anatomy-paper" as string]: "#11100e", ["--anatomy-card" as string]: "#11100e" }}>
        <Html html={layers.base} />
        {part("barrel", ["supportLeft"], <Html html={layers.supportLeft} />)}
        {part("governor", ["wheel"], <>
          <Html html={layers.wheel} />
          <path className="iso-line" d={teethPath(rot)} style={{ stroke: "var(--anatomy-hi)", strokeWidth: 1.1 }} />
        </>)}
        {part("barrel", ["barrel", "supportMiddle"], <>
          <Html html={layers.barrel} />
          <path className="iso-line" d={pinsPath(beat)} style={{ stroke: LIT, strokeWidth: 1.5 }} />
          <Html html={layers.supportMiddle} />
        </>)}
        {part("spring", ["drum"], <>
          <Html html={layers.drum} />
          <path d={windowPath} fill="#0b0a09" fillOpacity={0.9} />
          <path className="iso-line" d={springPath(rot, w)} style={{ stroke: LIT, strokeWidth: 1.1 }} data-testid="musicbox-spring" data-wind={w.toFixed(3)} />
        </>)}
        {part("key", ["arbor"], <>
          <Html html={layers.arbor} />
          <path d={keyWing(keyAngle)} fill="#f4f1ea" stroke="var(--anatomy-mid)" strokeWidth={0.8} strokeLinejoin="round" />
          <circle cx={hub[0]} cy={hub[1]} r={1.6} fill="#11100e" />
        </>)}
        {part("governor", ["wormPost"], <>
          <Html html={layers.wormPost} />
          <path className="iso-line" d={threadPath(psi)} style={{ stroke: "var(--anatomy-hi)", strokeWidth: 1 }} />
          {vanes(psi).map((v, i) => (
            <path key={i} d={v.d} fill={`rgb(${Array(3).fill(Math.round(30 + 90 * v.shade)).join(",")})`} stroke="var(--anatomy-hi)" strokeWidth={0.7} strokeLinejoin="round" />
          ))}
        </>)}
        {comb.map((_, i) => (
          <g key={i} transform={tineMatrix(i, tines[i].bend)}>
            {backOf(TINE_BACK[i])}
            <g style={dim("comb")}>
              {weighted.includes(i) && <Html html={layers.weights[weighted.indexOf(i)]} />}
              <Html html={layers.tines[i]} />
              {step === 3 && PAIR.includes(i) && <path d={layers.tineTops[i]} fill="#ffd24a" fillOpacity={0.3} stroke="#ffd24a" strokeWidth={1.6} strokeLinejoin="round" />}
              <path className="iso-line" d={layers.tineTops[i]} style={{ stroke: LIT, strokeWidth: 1.4, opacity: tines[i].glow }} data-testid={tines[i].glow > 0.5 ? "tine-ringing" : undefined} />
            </g>
          </g>
        ))}
        {part("comb", ["block", "plate"], <>
          <Html html={layers.block} />
          <Html html={layers.plate} />
        </>)}
        {/* grab area for the key */}
        <circle cx={hub[0]} cy={hub[1]} r={40} fill="transparent" style={{ cursor: "grab", touchAction: "none" }} data-testid="musicbox-key"
          role="button" tabIndex={0} aria-label={labels[0]} onKeyDown={onKey}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onClick={(e) => e.stopPropagation()} />
      </g>

      {step === 0 && <><Tag at={hub} x={334} y={262} text={labels[0]} side="left" /><Tag at={anchors.spring} x={318} y={140} text={labels[1]} side="left" /></>}
      {step === 1 && <><Tag at={anchors.barrel} x={210} y={70} text={labels[2]} /><Tag at={anchors.comb} x={34} y={292} text={labels[3]} /></>}
      {step === 2 && <><Tag at={anchors.comb} x={34} y={292} text={labels[3]} /><Tag at={anchors.weights} x={236} y={276} text={labels[4]} /></>}
      {step === 3 && <Tag at={anchors.pair} x={110} y={296} text={labels[5]} />}
      {step === 4 && <><Tag at={anchors.fly} x={140} y={40} text={labels[6]} /><text x={20} y={383} fill="#ffd24a" fontSize={14} fontWeight={700}>{labels[7]}</text></>}

      <g role="button" aria-label={sound ? labels[9] : labels[8]} aria-pressed={sound} tabIndex={0} data-testid="musicbox-sound" data-state={sound ? "on" : "off"}
        onClick={toggleSound} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSound(e); } }} style={{ cursor: "pointer" }}>
        <rect x={250} y={364} width={98} height={28} rx={14} fill={sound ? "#ffd24a" : "transparent"} stroke="#ffd24a" strokeWidth={1.2} />
        <text x={299} y={382} textAnchor="middle" fill={sound ? "#11100e" : "#ffd24a"} fontSize={12} fontWeight={700}>{sound ? labels[9] : labels[8]}</text>
      </g>
    </g>
  );
}
