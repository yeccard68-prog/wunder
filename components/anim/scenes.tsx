// Explainer scenes. Every scene is a pure function of (step, p, t): it draws one SVG frame for
// step number `step`, progress `p` (0–1) within that step and running time `t` (seconds, for motion
// that simply keeps going). All visible words come from `labels`, so scenes are language-independent.
// New scenes are registered in SCENES at the bottom; their texts live in content/animations.json.
import { useEffect, useState, type ReactNode } from "react";
import { around, loadWorld, type World } from "@/components/CountryMap";

export interface SceneProps {
  step: number;
  p: number;
  t: number;
  labels: string[];
  compare?: { shape: "square" | "peak" | "disc"; values: number[] }; // only for the size comparisons
  portrait?: { iso: string; flag: string; steps: ("map" | "flag" | "capital" | "area" | "peak" | "domain")[] }; // only for country portraits
}
type Pt = [number, number];

const BLUE = "#5b9bf5";
const RED = "#f0604f";
const INK = "#f4f1ea";
const DIM = "#8c8780";
const LINE = "#3a3733";
const YELLOW = "#ffd24a";

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (p: number) => p * p * (3 - 2 * p);
const frac = (v: number) => v - Math.floor(v);

/** Point at fraction u (0–1) along a polyline. */
function along(pts: Pt[], u: number): Pt {
  const len = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  let d = clamp(u) * len.reduce((a, b) => a + b, 0);
  for (let i = 0; i < len.length; i++) {
    if (d <= len[i] || i === len.length - 1) return [lerp(pts[i][0], pts[i + 1][0], len[i] ? d / len[i] : 0), lerp(pts[i][1], pts[i + 1][1], len[i] ? d / len[i] : 0)];
    d -= len[i];
  }
  return pts[0];
}
const d = (pts: Pt[]) => pts.map((q, i) => `${i ? "L" : "M"}${q[0]} ${q[1]}`).join(" ");

/** Dots travelling along a path; `color` may depend on the position (0–1). */
function Flow({ pts, phase, n = 5, color, r = 4.2, on = true }: { pts: Pt[]; phase: number; n?: number; color: string | ((u: number) => string); r?: number; on?: boolean }) {
  if (!on) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const u = frac(phase + i / n);
        const [x, y] = along(pts, u);
        return <circle key={i} cx={x} cy={y} r={r} fill={typeof color === "string" ? color : color(u)} />;
      })}
    </>
  );
}
const Vessel = ({ pts, color }: { pts: Pt[]; color: string }) => <path d={d(pts)} fill="none" stroke={color} strokeOpacity={0.28} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />;
const Label = ({ x, y, children, anchor = "middle", color = INK, size = 12, bold }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle" | "end"; color?: string; size?: number; bold?: boolean }) => (
  <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={size} fontWeight={bold ? 700 : 500} fontFamily="inherit">
    {children}
  </text>
);

// ------------------------------------------------------------------ heart
// labels: 0 lung, 1 body, 2 right atrium, 3 right ventricle, 4 left atrium, 5 left ventricle
function Heart({ step, p, t, labels }: SceneProps) {
  const cava: Pt[] = [[135, 362], [40, 362], [40, 155], [72, 155]];
  const lungVein: Pt[] = [[228, 45], [320, 45], [320, 155], [288, 155]];
  const lungArtery: Pt[] = [[150, 250], [180, 228], [180, 68]];
  const aorta: Pt[] = [[243, 300], [243, 362], [226, 362]];
  const beat = step === 3 ? frac(t / 1.6) : p; // last step: the whole cycle keeps running
  const atria = step === 1 || (step === 3 && beat < 0.4);
  const ventricles = step === 2 || (step === 3 && beat >= 0.4);
  const squeeze = Math.sin(Math.PI * (step === 3 ? (atria ? beat / 0.4 : (beat - 0.4) / 0.6) : p));
  const sa = atria ? 1 - 0.12 * squeeze : 1;
  const sv = ventricles ? 1 - 0.13 * squeeze : 1;
  const chamber = (x: number, y: number, w: number, h: number, color: string, s: number, label: string) => (
    <g transform={`translate(${x + w / 2} ${y + h / 2}) scale(${s}) translate(${-(x + w / 2)} ${-(y + h / 2)})`}>
      <rect x={x} y={y} width={w} height={h} rx={16} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={2} />
      <Label x={x + w / 2} y={y + h / 2 + 4} size={11}>{label}</Label>
    </g>
  );
  const valve = (x: number, y: number, open: boolean, vertical = false) => {
    const g = open ? 13 : 1.5;
    return vertical ? (
      <path d={`M${x} ${y - 17}L${x} ${y - g}M${x} ${y + g}L${x} ${y + 17}`} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
    ) : (
      <path d={`M${x - 17} ${y}L${x - g} ${y}M${x + g} ${y}L${x + 17} ${y}`} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
    );
  };
  const ph = t / 3.2;
  return (
    <>
      <Vessel pts={cava} color={BLUE} />
      <Vessel pts={lungArtery} color={BLUE} />
      <Vessel pts={lungVein} color={RED} />
      <Vessel pts={aorta} color={RED} />
      <rect x={130} y={22} width={100} height={46} rx={14} fill="#2a2724" stroke={LINE} />
      <Label x={180} y={57}>{labels[0]}</Label>
      <rect x={130} y={340} width={100} height={44} rx={14} fill="#2a2724" stroke={LINE} />
      <Label x={180} y={362}>{labels[1]}</Label>

      {chamber(72, 118, 92, 82, BLUE, sa, labels[2])}
      {chamber(72, 214, 92, 100, BLUE, sv, labels[3])}
      {chamber(196, 118, 92, 82, RED, sa, labels[4])}
      {chamber(196, 214, 92, 100, RED, sv, labels[5])}
      {valve(118, 207, atria)}
      {valve(242, 207, atria)}
      {valve(168, 237, ventricles, true)}
      {valve(243, 318, ventricles)}

      <Flow pts={cava} phase={ph} color={BLUE} on={step === 0 || step === 3} />
      <Flow pts={lungVein} phase={ph} color={RED} on={step === 0 || step === 3} />
      <Flow pts={[[118, 170], [118, 262]]} phase={beat} n={3} color={BLUE} on={atria} />
      <Flow pts={[[242, 170], [242, 262]]} phase={beat} n={3} color={RED} on={atria} />
      <Flow pts={lungArtery} phase={beat} n={4} color={BLUE} on={ventricles} />
      <Flow pts={aorta} phase={beat} n={3} color={RED} on={ventricles} />
      {step === 3 && (
        <>
          <Flow pts={[[150, 34], [210, 34]]} phase={ph * 1.5} n={3} color={(u) => (u < 0.5 ? BLUE : RED)} />
          <Flow pts={[[210, 374], [150, 374]]} phase={ph * 1.5} n={3} color={(u) => (u < 0.5 ? RED : BLUE)} />
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------ four-stroke engine
// labels: 0 intake valve, 1 exhaust valve, 2 spark plug, 3 piston, 4 crankshaft, 5–8 names of the four strokes
function Engine({ step, p, labels }: SceneProps) {
  const theta = (step + p) * Math.PI;
  const R = 50, L = 112, CX = 180, CY = 322;
  const pin = CY - (R * Math.cos(theta) + Math.sqrt(L * L - (R * Math.sin(theta)) ** 2));
  const top = pin - 24; // upper edge of the piston
  const crank: Pt = [CX + R * Math.sin(theta), CY - R * Math.cos(theta)];
  const intake = step === 0, exhaust = step === 3;
  const gas = step === 0 ? "#7fb6ff" : step === 1 ? lerpColor("#7fb6ff", "#3f7fe0", p) : step === 2 ? lerpColor("#ffe07a", "#e8662e", clamp(p * 1.4)) : "#8d8a86";
  const gasOpacity = step === 0 ? 0.25 + 0.3 * p : step === 1 ? 0.55 + 0.35 * p : step === 2 ? 0.95 - 0.35 * p : 0.6 - 0.3 * p;
  const spark = step === 2 && p < 0.18;
  const valve = (x: number, open: boolean) => {
    const y = 108 + (open ? 12 : 0);
    return <path d={`M${x} 84L${x} ${y}M${x - 15} ${y}L${x + 15} ${y}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />;
  };
  return (
    <>
      <Label x={180} y={34} size={17} bold>{labels[5 + step]}</Label>
      {/* ducts */}
      <path d="M40 78H150V104" fill="none" stroke="#7fb6ff" strokeOpacity={0.3} strokeWidth={22} strokeLinejoin="round" />
      <path d="M210 104V78H320" fill="none" stroke="#8d8a86" strokeOpacity={0.3} strokeWidth={22} strokeLinejoin="round" />
      <Flow pts={[[40, 78], [150, 78], [150, 118]]} phase={p * 2} n={5} color="#7fb6ff" on={intake} />
      <Flow pts={[[210, 118], [210, 78], [320, 78]]} phase={p * 2} n={5} color="#a8a5a0" on={exhaust} />
      {/* combustion chamber */}
      <rect x={122} y={106} width={116} height={Math.max(0, top - 106)} fill={gas} fillOpacity={gasOpacity} />
      {/* cylinder */}
      <path d="M120 104V300M240 104V300M120 104H135M165 104H195M225 104H240" stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none" />
      {valve(150, intake)}
      {valve(210, exhaust)}
      <path d="M180 86V110" stroke={spark ? YELLOW : DIM} strokeWidth={5} strokeLinecap="round" />
      {spark && <path d="M180 112l-9 12 9-3-6 14 15-17-9 3 6-9z" fill={YELLOW} />}
      {/* piston, rod, crank */}
      <rect x={123} y={top} width={114} height={40} rx={5} fill="#b9b4ab" />
      <path d={`M127 ${top + 9}H233M127 ${top + 17}H233`} stroke="#6b675f" strokeWidth={2} />
      <path d={`M${CX} ${pin}L${crank[0]} ${crank[1]}`} stroke="#d8d3c8" strokeWidth={9} strokeLinecap="round" />
      <circle cx={CX} cy={CY} r={R + 9} fill="none" stroke={LINE} strokeWidth={2} strokeDasharray="4 6" />
      <path d={`M${CX} ${CY}L${crank[0]} ${crank[1]}`} stroke="#8c8780" strokeWidth={12} strokeLinecap="round" />
      <circle cx={CX} cy={CY} r={9} fill={INK} />
      <circle cx={crank[0]} cy={crank[1]} r={6} fill={INK} />
      {/* direction arrow */}
      <path d={step % 2 === 0 ? `M268 ${top + 6}v26m-7-8l7 9 7-9` : `M268 ${top + 34}v-26m-7 8l7-9 7 9`} stroke={step === 2 ? YELLOW : INK} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Label x={42} y={56} anchor="start" size={11} color={intake ? INK : DIM}>{labels[0]}</Label>
      <Label x={318} y={56} anchor="end" size={11} color={exhaust ? INK : DIM}>{labels[1]}</Label>
      <Label x={180} y={74} size={11} color={spark ? YELLOW : DIM}>{labels[2]}</Label>
      <Label x={112} y={top + 25} anchor="end" size={11} color={DIM}>{labels[3]}</Label>
      <Label x={180} y={396} size={11} color={DIM}>{labels[4]}</Label>
    </>
  );
}
function lerpColor(a: string, b: string, p: number) {
  const n = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [n(a), n(b)];
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], p))).join(",")})`;
}

// ------------------------------------------------------------------ thunderstorm
// labels: 0 warm, moist air, 1 ice crystals, 2 graupel, 3 lightning temperature, 4 cloud height
function Storm({ step, p, t, labels }: SceneProps) {
  const grow = step === 0 ? 0.25 * ease(p) : step === 1 ? 0.25 + 0.75 * ease(p) : 1;
  const topY = lerp(250, 70, grow);
  const charge = step === 2 ? ease(p) : step > 2 ? 1 : 0;
  const strike = step === 3 && (frac(p * 3) < 0.22 || (frac(p * 3) > 0.3 && frac(p * 3) < 0.36));
  const puffs: [number, number, number][] = [[120, 262, 44], [180, 250, 54], [242, 262, 46], [150, lerp(250, 190, grow), 46 * (0.6 + 0.4 * grow)], [212, lerp(250, 185, grow), 50 * (0.6 + 0.4 * grow)], [180, lerp(250, 130, grow), 56 * grow], [140, topY + 22, 50 * grow], [222, topY + 22, 52 * grow], [180, topY + 14, 40 * grow]];
  const sign = (x: number, y: number, s: string, color: string, o: number) => <Label x={x} y={y} size={19} bold color={color}><tspan opacity={o}>{s}</tspan></Label>;
  return (
    <>
      <rect x={0} y={0} width={360} height={400} fill={strike ? "#3b4470" : "#161a2b"} />
      <rect x={0} y={350} width={360} height={50} fill="#2c3a25" />
      {puffs.map(([x, y, r], i) => r > 2 && <circle key={i} cx={x} cy={y} r={r} fill={step >= 2 ? "#5a6078" : "#8f97b3"} />)}
      {step <= 1 &&
        [90, 150, 210, 270].map((x, i) => {
          const y = 340 - frac(t / 2.4 + i * 0.27) * 60;
          return <path key={x} d={`M${x} ${y}v-20m-6 7l6-8 6 8`} stroke="#ffb46b" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />;
        })}
      {step === 0 && <Label x={180} y={385} color="#ffb46b">{labels[0]}</Label>}
      {step === 1 && (
        <>
          {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={150 + i * 16} cy={lerp(250, topY + 30, frac(t / 3 + i * 0.21))} r={2.6} fill="#fff" />)}
          {[0, 1, 2].map((i) => <circle key={i} cx={165 + i * 22} cy={lerp(topY + 40, 255, frac(t / 2.2 + i * 0.3))} r={4.5} fill="#c9cede" />)}
          <path d={`M300 ${topY - 20}V350m-5-6l5 7 5-7M295 ${topY - 13}l5-7 5 7`} stroke={DIM} strokeWidth={1.5} fill="none" />
          <text transform={`translate(318 ${(topY + 350) / 2}) rotate(-90)`} textAnchor="middle" fill={DIM} fontSize={11} fontFamily="inherit">{labels[4]}</text>
        </>
      )}
      {step >= 2 && (
        <>
          {[130, 165, 200, 235].map((x) => sign(x, topY + 32, "+", "#ff8f7a", charge))}
          {[125, 160, 195, 230].map((x) => sign(x, 282, "–", "#8ec1ff", charge))}
          {[70, 130, 190, 250, 300].map((x) => sign(x, 378, "+", "#ff8f7a", charge))}
        </>
      )}
      {step === 2 && (
        <>
          <Label x={284} y={topY + 30} anchor="start" size={11}>{labels[1]}</Label>
          <Label x={284} y={280} anchor="start" size={11}>{labels[2]}</Label>
        </>
      )}
      {strike && <path d="M186 296l-22 22 16 2-24 30 34-22-14-4 22-22z" fill="#fff6c9" stroke={YELLOW} strokeWidth={2} strokeLinejoin="round" />}
      {step === 3 && <Label x={180} y={34} size={15} bold color={YELLOW}>{labels[3]}</Label>}
    </>
  );
}

// ------------------------------------------------------------------ battery
// labels: 0 negative terminal, 1 positive terminal, 2 electrolyte, 3 electrons, 4 ions, 5 lamp
function Battery({ step, p, t, labels }: SceneProps) {
  const wire: Pt[] = [[122, 190], [122, 80], [162, 80], [198, 80], [238, 80], [238, 190]];
  const current = step === 2 ? ease(clamp(p * 2)) : step === 3 ? 1 : 0;
  return (
    <>
      <path d={d(wire)} fill="none" stroke={DIM} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={180} cy={80} r={24} fill={YELLOW} fillOpacity={0.12 + 0.75 * current} stroke={current > 0.1 ? YELLOW : DIM} strokeWidth={2.5} />
      {current > 0.3 && [0, 45, 90, 135, 180, 225, 270, 315].map((a) => <path key={a} d={`M${180 + 31 * Math.cos((a * Math.PI) / 180)} ${80 + 31 * Math.sin((a * Math.PI) / 180)}L${180 + 39 * Math.cos((a * Math.PI) / 180)} ${80 + 39 * Math.sin((a * Math.PI) / 180)}`} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" opacity={current} />)}
      <Label x={180} y={36} size={11} color={DIM}>{labels[5]}</Label>

      <rect x={84} y={176} width={192} height={176} rx={14} fill="#23303a" stroke={INK} strokeWidth={3} />
      <rect x={108} y={190} width={28} height={146} rx={5} fill="#9aa3ad" />
      <rect x={224} y={190} width={28} height={146} rx={5} fill="#c98a4b" />
      <Label x={122} y={170} size={20} bold color="#8ec1ff">–</Label>
      <Label x={238} y={170} size={20} bold color="#ff8f7a">+</Label>
      <Label x={76} y={268} anchor="end" size={11} color={step === 0 || step === 1 ? INK : DIM}>{labels[0]}</Label>
      <Label x={284} y={268} anchor="start" size={11} color={step === 0 ? INK : DIM}>{labels[1]}</Label>
      <Label x={180} y={376} size={11} color={step === 0 || step === 3 ? INK : DIM}>{labels[2]}</Label>

      {step === 1 && [0, 1, 2, 3].map((i) => <circle key={i} cx={122} cy={lerp(320, 200, frac(t / 2.5 + i / 4))} r={4} fill={YELLOW} />)}
      {step === 1 && <Label x={150} y={130} anchor="start" size={11} color={YELLOW}>{labels[3]}</Label>}
      <Flow pts={wire} phase={t / 3} n={7} color={YELLOW} r={4} on={step >= 2} />
      {step === 2 && <Label x={254} y={130} anchor="start" size={11} color={YELLOW}>{labels[3]}</Label>}
      {step === 3 && (
        <>
          {[0, 1, 2].map((i) => <Flow key={i} pts={[[140, 220 + i * 45], [220, 220 + i * 45]]} phase={t / 3 + i * 0.3} n={2} color="#ff8f7a" r={5} />)}
          <Label x={180} y={206} size={11} color="#ff8f7a">{labels[4]}</Label>
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------ plate tectonics
// labels: 0 plate, 1 mantle, 2 magma, 3 mid-ocean ridge, 4 volcano, 5 earthquake, 6 ocean
function Plates({ step, p, t, labels }: SceneProps) {
  const e = ease(p);
  if (step === 3) {
    // seen from above: two plates slide past each other
    const off = 46 * e;
    const jolt = p > 0.72 ? Math.sin(p * 90) * 3 : 0;
    return (
      <>
        <rect x={30} y={50} width={148} height={300} fill="#6f6658" />
        <rect x={182} y={50} width={148} height={300} fill="#857a69" />
        <g transform={`translate(${jolt} ${-off})`}>
          <path d="M30 200H178" stroke="#e9e3d6" strokeWidth={7} strokeDasharray="14 9" />
        </g>
        <g transform={`translate(${-jolt} ${off})`}>
          <path d="M182 200H330" stroke="#e9e3d6" strokeWidth={7} strokeDasharray="14 9" />
        </g>
        <path d="M104 320V280m-8 9l8-10 8 10M256 80v40m-8-9l8 10 8-10" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {p > 0.72 && [0, 1, 2].map((i) => <circle key={i} cx={180} cy={200} r={12 + frac((p - 0.72) * 4 + i / 3) * 70} fill="none" stroke={YELLOW} strokeWidth={2.5} opacity={1 - frac((p - 0.72) * 4 + i / 3)} />)}
        {p > 0.72 && <Label x={180} y={34} size={15} bold color={YELLOW}>{labels[5]}</Label>}
      </>
    );
  }
  const drift = step === 0 ? Math.sin(t / 2) * 4 : 0;
  const gap = step === 1 ? 44 * e : 0;
  const dive = step === 2 ? e : 0;
  return (
    <>
      <rect x={0} y={0} width={360} height={190} fill="#15202e" />
      <rect x={0} y={172} width={360} height={34} fill="#2a5d8a" fillOpacity={0.75} />
      <Label x={24} y={164} anchor="start" size={11} color="#8ec1ff">{labels[6]}</Label>
      <rect x={0} y={200} width={360} height={200} fill="#b5512c" />
      <rect x={0} y={330} width={360} height={70} fill="#d06a2e" />
      {/* convection currents in the mantle */}
      {[100, 260].map((cx, k) => (
        <g key={cx}>
          <ellipse cx={cx} cy={315} rx={62} ry={40} fill="none" stroke="#ffd9a8" strokeOpacity={0.35} strokeWidth={2} strokeDasharray="5 7" />
          {[0, 1, 2].map((i) => {
            const a = (frac(t / 7 + i / 3) * 2 * Math.PI) * (k ? 1 : -1);
            return <circle key={i} cx={cx + 62 * Math.cos(a)} cy={315 + 40 * Math.sin(a)} r={4} fill="#ffd9a8" />;
          })}
        </g>
      ))}
      <Label x={180} y={388} size={11} color="#ffe6c7">{labels[1]}</Label>
      {/* rising magma at a spreading ridge */}
      {step === 1 && (
        <>
          <path d={`M${180 - gap / 2 - 2} 236L180 ${206 - 14 * e}L${180 + gap / 2 + 2} 236z`} fill="#ff7b3a" />
          <Flow pts={[[180, 300], [180, 212]]} phase={t / 2} n={3} color="#ffb24a" r={4.5} />
          <Label x={180} y={150} size={12} bold color="#ffb24a">{labels[3]}</Label>
        </>
      )}
      {/* left plate: drifts, spreads or dives under the right one */}
      <g transform={`translate(${-drift - gap / 2 + 26 * dive} 0) rotate(${16 * dive} 181 200)`}>
        <rect x={-60} y={200} width={241} height={36} fill="#6f6658" />
        <Label x={70} y={223} size={11}>{labels[0]}</Label>
      </g>
      <g transform={`translate(${drift + gap / 2} 0)`}>
        <rect x={181} y={200 - 8 * dive} width={241} height={36 + 8 * dive} fill="#857a69" />
        <Label x={280} y={222} size={11}>{labels[0]}</Label>
        {step === 2 && (
          <>
            <path d={`M226 ${200 - 8 * dive}l26 ${-46 * dive} 26 ${46 * dive}z`} fill="#857a69" />
            {dive > 0.6 && <Flow pts={[[252, 140], [252, 96]]} phase={t / 1.5} n={3} color="#ff7b3a" r={4} />}
            {dive > 0.6 && <Label x={252} y={76} size={12} bold color="#ffb24a">{labels[4]}</Label>}
            <Flow pts={[[214, 262], [246, 205]]} phase={t / 3} n={2} color="#ffb24a" r={3.5} on={dive > 0.5} />
          </>
        )}
      </g>
      <path d={step === 1 ? "M96 190h-30m9-7l-10 7 10 7M264 190h30m-9-7l10 7-10 7" : step === 2 ? "M70 190h30m-9-7l10 7-10 7" : "M70 190h24m-8-6l9 6-9 6M290 190h-24m8-6l-9 6 9 6"} stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={step === 0 ? 0.5 : 1} />
    </>
  );
}

// ------------------------------------------------------------------ electric motor (seen along the axis)
// labels: 0 north pole, 1 south pole, 2 coil, 3 commutator, 4 battery, 5 force
function Motor({ step, p, t, labels }: SceneProps) {
  const deg = step === 0 ? 25 : step === 1 ? lerp(25, 78, ease(p)) : step === 2 ? lerp(78, 192, ease(p)) : 192 + (t % 1000) * 150;
  const a = (deg * Math.PI) / 180;
  const C: Pt = [180, 190];
  const R = 62;
  const end = (s: number): Pt => [C[0] + s * R * Math.cos(a), C[1] + s * R * Math.sin(a)];
  const on = step >= 1;
  // the commutator keeps the current direction fixed in space: the wire on the left always carries current "out"
  const left = Math.cos(a) < 0 ? 1 : -1;
  const wire = (s: number) => {
    const [x, y] = end(s);
    const out = s === left;
    const up = out ? -1 : 1; // force: up on one side, down on the other → torque
    return (
      <g key={s}>
        <circle cx={x} cy={y} r={11} fill="#c98a4b" stroke={INK} strokeWidth={2} />
        {on && (out ? <circle cx={x} cy={y} r={3} fill="#11100e" /> : <path d={`M${x - 5} ${y - 5}l10 10m0-10l-10 10`} stroke="#11100e" strokeWidth={2.5} />)}
        {on && <path d={`M${x} ${y + up * 16}v${up * 26}m-6 ${-up * 8}l6 ${up * 9} 6 ${-up * 9}`} stroke={YELLOW} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      </g>
    );
  };
  const flip = step === 2 && Math.abs(deg - 90) < 16; // passing the dead point
  return (
    <>
      <rect x={22} y={110} width={62} height={160} rx={8} fill="#d9534a" />
      <rect x={276} y={110} width={62} height={160} rx={8} fill="#4a7fd9" />
      <Label x={53} y={196} size={22} bold>N</Label>
      <Label x={307} y={196} size={22} bold>S</Label>
      <Label x={53} y={100} size={11} color={DIM}>{labels[0]}</Label>
      <Label x={307} y={100} size={11} color={DIM}>{labels[1]}</Label>
      {[150, 190, 230].map((y) => <path key={y} d={`M92 ${y}H268`} stroke={LINE} strokeWidth={1.5} strokeDasharray="3 7" />)}
      <circle cx={C[0]} cy={C[1]} r={R} fill="none" stroke={LINE} strokeWidth={1.5} />
      <path d={`M${end(-1)[0]} ${end(-1)[1]}L${end(1)[0]} ${end(1)[1]}`} stroke="#c98a4b" strokeWidth={7} strokeLinecap="round" />
      {wire(-1)}
      {wire(1)}
      {/* commutator: split ring turning with the coil, two fixed brushes */}
      <g transform={`rotate(${deg} ${C[0]} ${C[1]})`}>
        <path d={`M${C[0] - 15} ${C[1] - 4}A16 16 0 0 1 ${C[0] + 15} ${C[1] - 4}`} fill="none" stroke={flip ? YELLOW : INK} strokeWidth={6} />
        <path d={`M${C[0] - 15} ${C[1] + 4}A16 16 0 0 0 ${C[0] + 15} ${C[1] + 4}`} fill="none" stroke={flip ? YELLOW : INK} strokeWidth={6} />
      </g>
      <path d={`M${C[0]} ${C[1] + 21}V330H150M${C[0]} ${C[1] - 21}V${C[1] - 34}H250V330H210`} fill="none" stroke={DIM} strokeWidth={3} strokeLinejoin="round" />
      <rect x={150} y={316} width={60} height={28} rx={6} fill="#23303a" stroke={INK} strokeWidth={2} />
      <Label x={180} y={335} size={11}>{labels[4]}</Label>
      {on && <Flow pts={[[210, 330], [250, 330], [250, 156], [180, 156], [180, 169]]} phase={t / 2.5} n={4} color={YELLOW} r={3.5} />}
      <Label x={180} y={60} size={12} color={step === 0 ? INK : DIM}>{labels[2]}</Label>
      {step === 2 && <Label x={180} y={388} size={12} bold color={flip ? YELLOW : INK}>{labels[3]}</Label>}
      {step === 1 && <Label x={180} y={388} size={12} color={YELLOW}>{labels[5]}</Label>}
      <path d="M235 118a70 70 0 0 1 18 30m-10-4l11 6 2-13" stroke={on ? INK : "none"} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

// ------------------------------------------------------------------ neural network
// labels: 0 input, 1 hidden layer, 2 output, 3 cat, 4 dog, 5 "random weights", 6 "after training"
function Neural({ step, p, t, labels }: SceneProps) {
  const layers: Pt[][] = [[60, 130, 200, 270].map((y) => [62, y] as Pt), [90, 150, 210, 270, 330].map((y) => [180, y - 10] as Pt), [150, 250].map((y) => [298, y] as Pt)];
  const rnd = (i: number, k: number) => frac(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);
  const train = step === 3 ? ease(p) : 0;
  const edges: { a: Pt; b: Pt; w: number; i: number; l: number }[] = [];
  layers.slice(0, 2).forEach((layer, l) => layer.forEach((a, i) => layers[l + 1].forEach((b, j) => {
    const k = l * 100 + i * 10 + j;
    edges.push({ a, b, w: lerp(rnd(k, 1), rnd(k, 2) > 0.55 ? 1 : 0.12, train), i: k, l });
  })));
  const cat = step < 2 ? 0 : step === 2 ? 0.38 * ease(clamp(p * 2)) : lerp(0.38, 0.93, train);
  const dog = step < 2 ? 0 : step === 2 ? 0.62 * ease(clamp(p * 2)) : lerp(0.62, 0.07, train);
  const bar = (y: number, v: number, name: string, good: boolean) => (
    <g>
      <rect x={316} y={y - 6} width={36} height={12} rx={3} fill="#2a2724" />
      <rect x={316} y={y - 6} width={36 * v} height={12} rx={3} fill={good ? "#3fbd87" : "#f2716d"} />
      <Label x={334} y={y - 14} size={11}>{name}</Label>
      {step >= 2 && <Label x={334} y={y + 22} size={11} color={DIM}>{Math.round(v * 100)} %</Label>}
    </g>
  );
  return (
    <>
      {edges.map((e) => <path key={e.i} d={`M${e.a[0]} ${e.a[1]}L${e.b[0]} ${e.b[1]}`} stroke={step === 3 ? lerpColor("#8c8780", "#ffd24a", train * e.w) : "#8c8780"} strokeOpacity={0.25 + 0.6 * e.w} strokeWidth={0.6 + 3 * e.w} />)}
      {(step === 1 || step === 2) && edges.filter((e) => e.i % 3 === 0).map((e) => {
        const u = frac(t / 2 + e.i * 0.13);
        const [x, y] = along([e.a, e.b], u);
        return <circle key={e.i} cx={x} cy={y} r={3} fill={YELLOW} />;
      })}
      {step === 3 && edges.filter((e) => e.i % 3 === 1).map((e) => {
        const u = 1 - frac(t / 2 + e.i * 0.13); // the error travels backwards
        const [x, y] = along([e.a, e.b], u);
        return <circle key={e.i} cx={x} cy={y} r={3} fill="#f2716d" />;
      })}
      {layers.map((layer, l) => layer.map(([x, y], i) => <circle key={`${l}-${i}`} cx={x} cy={y} r={13} fill={l === 0 ? "#5b9bf5" : l === 1 ? "#3a3733" : "#b9b4ab"} stroke={INK} strokeWidth={2} />))}
      <Label x={62} y={36} size={12} bold color={step === 1 ? INK : DIM}>{labels[0]}</Label>
      <Label x={180} y={36} size={12} bold color={step === 0 ? INK : DIM}>{labels[1]}</Label>
      <Label x={298} y={36} size={12} bold color={step >= 2 ? INK : DIM}>{labels[2]}</Label>
      {/* the picture that goes in: a cat, drawn very simply */}
      <g transform="translate(40 318)" opacity={step === 0 ? 0.4 : 1}>
        <rect x={0} y={0} width={44} height={44} rx={8} fill="#2a2724" stroke={LINE} />
        <path d="M11 30V17l6 6h10l6-6v13a11 9 0 0 1-22 0z" fill="#e2ab4f" />
        <circle cx={18} cy={28} r={1.6} fill="#11100e" />
        <circle cx={26} cy={28} r={1.6} fill="#11100e" />
      </g>
      <path d="M62 312V290m-5 7l5-8 5 8" stroke={DIM} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {bar(150, cat, labels[3], true)}
      {bar(250, dog, labels[4], false)}
      {step === 2 && p > 0.6 && <Label x={180} y={388} size={12} bold color="#f2716d">{labels[5]}</Label>}
      {step === 3 && <Label x={180} y={388} size={12} bold color="#3fbd87">{labels[6]}</Label>}
    </>
  );
}

// ------------------------------------------------------------------ birth of a star
// labels: 0 cloud of gas and dust, 1 gravity, 2 protostar, 3 disc, 4 nuclear fusion, 5 hydrogen → helium
function Star({ step, p, t, labels }: SceneProps) {
  const rnd = (i: number, k: number) => frac(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);
  const pull = step === 0 ? 0 : step === 1 ? ease(p) : 1;
  const flat = step < 2 ? 0 : step === 2 ? ease(p) : 1;
  const shine = step === 3 ? ease(clamp(p * 2.5)) : 0;
  const core = step === 1 ? 6 * pull : step === 2 ? lerp(6, 20, ease(p)) : step === 3 ? 20 + 8 * shine + Math.sin(t * 3) * 1.5 : 0;
  const dots = Array.from({ length: 90 }, (_, i) => {
    const r0 = 30 + rnd(i, 1) * 150;
    const a0 = rnd(i, 2) * Math.PI * 2;
    const r = lerp(r0, 26 + rnd(i, 3) * 95, pull) * (step === 3 ? 1 + shine * 0.25 : 1);
    const spin = step === 0 ? t * 0.03 : (t * (0.25 + 0.9 * pull)) / Math.max(0.5, r / 60);
    const a = a0 + spin;
    return { x: 180 + r * Math.cos(a), y: 200 + r * Math.sin(a) * lerp(1, 0.28, flat), s: 1.2 + rnd(i, 4) * 2.2, o: 0.35 + rnd(i, 5) * 0.6, i };
  });
  return (
    <>
      <rect x={0} y={0} width={360} height={400} fill="#0b0d1a" />
      {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={rnd(i, 7) * 360} cy={rnd(i, 8) * 400} r={0.9} fill="#fff" opacity={0.25 + rnd(i, 9) * 0.5} />)}
      {step === 3 && <circle cx={180} cy={200} r={core * 3.2} fill="#ffd24a" opacity={0.12 + 0.1 * shine} />}
      {step === 3 && <circle cx={180} cy={200} r={core * 1.9} fill="#ffb24a" opacity={0.25} />}
      {dots.map((q) => <circle key={q.i} cx={q.x} cy={q.y} r={q.s} fill={step >= 2 ? "#e9b98a" : "#9fb4e8"} opacity={q.o * (step === 3 ? 1 - 0.5 * shine : 1)} />)}
      {core > 0 && <circle cx={180} cy={200} r={core} fill={step === 3 ? lerpColor("#ff8a3a", "#fff3c4", shine) : "#ff8a3a"} />}
      {step === 1 && [0, 90, 180, 270].map((d0) => {
        const a = (d0 * Math.PI) / 180;
        const r1 = 150 - 26 * frac(t / 2);
        return <path key={d0} d={`M${180 + r1 * Math.cos(a)} ${200 + r1 * Math.sin(a)}L${180 + (r1 - 24) * Math.cos(a)} ${200 + (r1 - 24) * Math.sin(a)}`} stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.8} />;
      })}
      {step === 3 && shine > 0.5 && [0, 45, 90, 135, 180, 225, 270, 315].map((d0) => {
        const a = (d0 * Math.PI) / 180;
        return <path key={d0} d={`M${180 + (core + 12) * Math.cos(a)} ${200 + (core + 12) * Math.sin(a)}L${180 + (core + 30) * Math.cos(a)} ${200 + (core + 30) * Math.sin(a)}`} stroke="#fff3c4" strokeWidth={3} strokeLinecap="round" />;
      })}
      <Label x={180} y={34} size={14} bold color={step === 3 ? YELLOW : INK}>{labels[step === 0 ? 0 : step === 1 ? 1 : step === 2 ? 2 : 4]}</Label>
      {step === 2 && flat > 0.6 && <Label x={300} y={252} size={11} color="#e9b98a">{labels[3]}</Label>}
      {step === 3 && shine > 0.5 && <Label x={180} y={380} size={12} color="#fff3c4">{labels[5]}</Label>}
    </>
  );
}

// ------------------------------------------------------------------ size comparison
// Four things to scale (lib/compare.ts). labels: 0–3 names, 4–7 values as text. Step 0 asks (sizes hidden), steps 1–4
// grow one thing each, step 5 marks the largest. Squares (area) and circles (diameter) stand side by side with widths
// to scale and a legend below; peaks (height) stand in equal slots with the names underneath.
const CMP_COLORS = ["#5b9bf5", "#f0604f", "#4fc28b", "#c58cf2"];
/** A name in at most two lines of about `width` characters. */
function lines(name: string, width: number): string[] {
  const out: string[] = [];
  for (const w of name.split(" ")) {
    if (out.length && (out[out.length - 1] + " " + w).length <= width) out[out.length - 1] += " " + w;
    else out.push(w);
  }
  return out.length > 2 ? [out[0], out.slice(1).join(" ").slice(0, width - 1) + "…"] : out;
}
function Compare({ step, p, labels, compare }: SceneProps) {
  if (!compare) return null;
  const { shape, values } = compare;
  const n = values.length;
  const grow = (i: number) => (step > i + 1 ? 1 : step === i + 1 ? ease(p) : 0);
  const max = Math.max(...values);
  const top = values.indexOf(max);
  const end = step >= n + 1;
  const mark = (i: number) => (end ? { stroke: i === top ? YELLOW : "none", strokeWidth: 3, opacity: i === top ? 1 : 0.5 } : { stroke: "none", strokeWidth: 0, opacity: 1 });
  if (shape === "peak") {
    const base = 290;
    return (
      <>
        <line x1={10} y1={base} x2={350} y2={base} stroke={LINE} strokeWidth={2} />
        {values.map((v, i) => {
          const cx = 45 + i * 90, h = (225 * v) / max * grow(i);
          const name = lines(labels[i], 13);
          return (
            <g key={i}>
              {h > 0 && <path d={`M${cx - 42} ${base} L${cx} ${base - h} L${cx + 42} ${base}Z`} fill={CMP_COLORS[i]} {...mark(i)} />}
              {h > 0 && h > 40 && <path d={`M${cx - 42 * (18 / h)} ${base - h + 18} L${cx} ${base - h} L${cx + 42 * (18 / h)} ${base - h + 18}Z`} fill="#fff" opacity={0.85 * mark(i).opacity} />}
              {grow(i) > 0.6 ? <Label x={cx} y={base - h - 10} size={12} bold color={end && i === top ? YELLOW : INK}>{labels[n + i]}</Label> : grow(i) === 0 && <Label x={cx} y={base - 20} size={22} bold color={DIM}>?</Label>}
              {name.map((l, k) => <Label key={k} x={cx} y={base + 20 + k * 14} size={11} color={end && i === top ? YELLOW : INK}>{l}</Label>)}
            </g>
          );
        })}
      </>
    );
  }
  // squares and circles: widths to scale, side by side on one line
  const size = values.map((v) => (shape === "square" ? Math.sqrt(v) : v));
  const gap = 10, sum = size.reduce((a, b) => a + b, 0), big = Math.max(...size);
  const scale = Math.min((340 - gap * (n - 1)) / sum, 230 / big);
  const base = 262;
  let x = (360 - (scale * sum + gap * (n - 1))) / 2;
  const at = size.map((s) => { const x0 = x; x += s * scale + gap; return x0; });
  return (
    <>
      <line x1={10} y1={base} x2={350} y2={base} stroke={LINE} strokeWidth={2} />
      {step === 0 && <Label x={180} y={180} size={72} bold color={DIM}>?</Label>}
      {size.map((s, i) => {
        const w = s * scale, g = grow(i), c = w * g;
        if (g <= 0) return null;
        return shape === "square"
          ? <rect key={i} x={at[i] + (w - c) / 2} y={base - c} width={c} height={c} rx={2} fill={CMP_COLORS[i]} {...mark(i)} />
          : <circle key={i} cx={at[i] + w / 2} cy={base - c / 2} r={c / 2} fill={CMP_COLORS[i]} {...mark(i)} />;
      })}
      {values.map((_, i) => {
        const lx = i % 2 ? 190 : 20, ly = 296 + Math.floor(i / 2) * 50;
        const shown = grow(i) > 0.6;
        return (
          <g key={i} opacity={end && i !== top ? 0.6 : 1}>
            <rect x={lx} y={ly - 11} width={12} height={12} rx={2} fill={CMP_COLORS[i]} />
            <Label x={lx + 18} y={ly} anchor="start" size={12} bold color={end && i === top ? YELLOW : INK}>{lines(labels[i], 22)[0]}</Label>
            <Label x={lx + 18} y={ly + 17} anchor="start" size={12} color={shown ? INK : DIM}>{shown ? labels[n + i] : "?"}</Label>
          </g>
        );
      })}
    </>
  );
}

// ------------------------------------------------------------------ country portrait
// lib/portraits.ts. The map (Natural Earth, public/map/world.json) flies from the whole world to the country in the
// first step and stays above; below, one fact per step. labels: 0 name, 1 continent, 2 capital, 3 area, 4 peak,
// 5 web ending, 6–9 headings (capital, area, highest point, web), 10 height of the peak.
function Portrait({ step, p, labels, portrait }: SceneProps) {
  const [world, setWorld] = useState<World | null>(null);
  useEffect(() => {
    let live = true;
    loadWorld().then((w) => live && setWorld(w));
    return () => {
      live = false;
    };
  }, []);
  if (!portrait) return null;
  const kind = portrait.steps[Math.min(step, portrait.steps.length - 1)];
  const z = step === 0 ? ease(clamp((p - 0.15) / 0.7)) : 1;
  const show = step === 0 ? 1 : ease(clamp(p * 3));
  let box = "0 0 1000 394";
  if (world) {
    const to = around(world, [portrait.iso], 9).split(" ").map(Number);
    box = [0, 0, world.width, world.height].map((v, i) => lerp(v, to[i], z).toFixed(1)).join(" ");
  }
  const big = (text: string, y: number, max = 34) => <Label x={180} y={y} size={Math.min(max, Math.floor(600 / Math.max(8, text.length)))} bold>{text}</Label>;
  return (
    <>
      <Label x={180} y={28} size={18} bold>{labels[0]}</Label>
      <rect x={10} y={40} width={340} height={180} rx={10} fill="#1d1b19" />
      {world && (
        <svg x={10} y={40} width={340} height={180} viewBox={box} preserveAspectRatio="xMidYMid meet">
          {[...Object.entries(world.paths), ...Object.entries(world.wrap ?? {})].map(([iso, d], i) => <path key={i} d={d} fill={iso === portrait.iso ? YELLOW : LINE} stroke="#1d1b19" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />)}
          {world.dots[portrait.iso] && <circle cx={world.dots[portrait.iso][0]} cy={world.dots[portrait.iso][1]} r={4} fill={YELLOW} />}
        </svg>
      )}
      <g opacity={show}>
        {kind === "map" && big(labels[1], 316)}
        {kind === "flag" && <image href={portrait.flag} x={70} y={238} width={220} height={140} preserveAspectRatio="xMidYMid meet" />}
        {kind === "capital" && <><Label x={180} y={280} size={13} color={DIM}>{labels[6]}</Label>{big(labels[2], 322)}</>}
        {kind === "area" && <><Label x={180} y={280} size={13} color={DIM}>{labels[7]}</Label>{big(labels[3], 322)}</>}
        {kind === "peak" && <>
          <path d="M150 300 L180 252 L210 300Z" fill={BLUE} /><path d="M168 271 L180 252 L192 271Z" fill="#fff" opacity={0.85} />
          <Label x={180} y={322} size={13} color={DIM}>{labels[8]}</Label>{big(labels[4], 352, 26)}
          {labels[10] ? <Label x={180} y={376} size={14} color={INK}>{labels[10]}</Label> : null}
        </>}
        {kind === "domain" && <><Label x={180} y={280} size={13} color={DIM}>{labels[9]}</Label>{big(labels[5], 330, 44)}</>}
      </g>
    </>
  );
}

export const SCENES: Record<string, (props: SceneProps) => ReactNode> = { heart: Heart, engine: Engine, storm: Storm, battery: Battery, plates: Plates, motor: Motor, neural: Neural, star: Star, compare: Compare, portrait: Portrait };
