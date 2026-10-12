// Explainer scenes. Every scene is a pure function of (step, p, t): it draws one SVG frame for
// step number `step`, progress `p` (0–1) within that step and running time `t` (seconds, for motion
// that simply keeps going). All visible words come from `labels`, so scenes are language-independent.
// New scenes are registered in SCENES at the bottom; their texts live in content/animations.json.
import type { ReactNode } from "react";

export interface SceneProps {
  step: number;
  p: number;
  t: number;
  labels: string[];
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

export const SCENES: Record<string, (props: SceneProps) => ReactNode> = { heart: Heart, engine: Engine, storm: Storm, battery: Battery, plates: Plates };
