// Own drawings for "Blick ins Innere" (components/viz/RevealViz.tsx): each scene is the outside and the inside of
// the same thing in one 400 × 400 frame, so the slider can cut between them anywhere. Drawn after the sources named
// in content/visuals.json; simplifications are stated in each visual's `note`.
import type { ReactNode } from "react";
import { LAND } from "./globe";

export interface Scene { outside: (id: string) => ReactNode; inside: (id: string) => ReactNode }

// ---------- the Earth: true to scale except the crust (6371 km = 180 units; core boundary 2900 km deep, inner core from 5150 km) ----------
const R = 180;
const at = (depthKm: number) => (R * (6371 - depthKm)) / 6371;

const earth: Scene = {
  outside: (id) => (
    <>
      <defs>
        <radialGradient id={`${id}-sea`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#4f8fd6" />
          <stop offset="1" stopColor="#173f78" />
        </radialGradient>
        <radialGradient id={`${id}-shade`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r={R + 5} fill="none" stroke="#9cc9ff" strokeOpacity="0.45" strokeWidth="6" />
      <circle cx="200" cy="200" r={R} fill={`url(#${id}-sea)`} />
      <path d={LAND} transform={`translate(200 200) scale(${R / 100})`} fill="#6fae55" stroke="#4d8a3a" strokeWidth="0.35" />
      <circle cx="200" cy="200" r={R} fill={`url(#${id}-shade)`} />
    </>
  ),
  inside: (id) => (
    <>
      <defs>
        <radialGradient id={`${id}-mantle`} cx="50%" cy="50%" r="50%">
          <stop offset={at(2900) / R} stopColor="#d9542f" />
          <stop offset="1" stopColor="#f0a065" />
        </radialGradient>
        <radialGradient id={`${id}-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffd56b" />
          <stop offset="1" stopColor="#f39a2c" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r={R + 5} fill="none" stroke="#9cc9ff" strokeOpacity="0.45" strokeWidth="6" />
      {/* the crust is drawn 4 units thick – at true scale (5 to 60 km) it would be thinner than a hair */}
      <circle cx="200" cy="200" r={R} fill="#7a5a3c" />
      <circle cx="200" cy="200" r={R - 4} fill={`url(#${id}-mantle)`} />
      <circle cx="200" cy="200" r={at(2900)} fill={`url(#${id}-core)`} />
      <circle cx="200" cy="200" r={at(5150)} fill="#fff4c2" stroke="#ffe58a" strokeWidth="2" />
      <circle cx="200" cy="200" r={at(2900)} fill="none" stroke="#7a2a16" strokeOpacity="0.35" />
      <circle cx="200" cy="200" r="2.5" fill="#7a2a16" />
    </>
  ),
};

// ---------- the heart, seen from the front: the person's right is on the left of the drawing ----------
const BODY = "M128,168 C100,180 92,225 108,262 C125,305 185,355 262,386 C300,352 336,300 343,248 C350,198 330,160 296,150 C262,140 235,156 214,160 C190,150 156,152 128,168 Z";
const BLUE = "#5b74c9", RED = "#d24a43";

const vessels = (cut: boolean) => (
  <>
    {/* inferior vena cava (partly behind the heart), superior vena cava, the pulmonary artery to the person's right (behind the aorta) */}
    <path d="M128,268 L126,334 Q140,342 154,334 L152,274 Z" fill={BLUE} />
    <path d="M205,142 C180,128 160,126 140,128" stroke={BLUE} strokeWidth="16" fill="none" />
    <path d="M122,178 L122,50 Q136,40 150,50 L150,178 Z" fill={BLUE} />
    {/* aorta with the three vessels of its arch */}
    <path d="M238,74 L232,28 M258,68 L258,22 M280,70 L290,26" stroke={RED} strokeWidth="12" fill="none" />
    <path d="M214,178 C208,120 214,80 248,72 C285,64 312,84 314,122 L314,156" stroke={RED} strokeWidth="34" fill="none" />
    {/* pulmonary trunk and its branch to the person's left; pulmonary veins into the left atrium */}
    <path d="M190,196 C186,160 198,136 230,126 C262,118 292,126 332,130" stroke={BLUE} strokeWidth="26" fill="none" strokeLinejoin="round" />
    <path d="M330,172 L362,170 M332,196 L364,198" stroke={RED} strokeWidth="12" fill="none" />
    {cut && (
      <>
        <path d="M136,60 L136,176" stroke="#9fb3ec" strokeWidth="14" />
        <path d="M214,176 C208,120 214,82 248,74 C285,66 312,86 314,124 L314,156" stroke="#f08b80" strokeWidth="18" fill="none" />
        <path d="M190,194 C186,160 198,138 230,128 C262,120 292,128 332,132" stroke="#9fb3ec" strokeWidth="12" fill="none" strokeLinejoin="round" />
      </>
    )}
  </>
);

/** A pocket valve seen from above: three cusps meeting in the middle. */
const pocket = (x: number, y: number, r: number) => (
  <g stroke="#fff6ea" strokeWidth="2.5" fill="none">
    <circle cx={x} cy={y} r={r} fill="#f7e2d2" fillOpacity="0.5" />
    <path d={`M${x},${y} L${x},${y - r} M${x},${y} L${x - r * 0.87},${y + r / 2} M${x},${y} L${x + r * 0.87},${y + r / 2}`} />
  </g>
);

const heart: Scene = {
  outside: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}-muscle`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#df6a5d" />
          <stop offset="1" stopColor="#962d2a" />
        </linearGradient>
      </defs>
      {vessels(false)}
      <path d={BODY} fill={`url(#${id}-muscle)`} stroke="#7e2522" strokeWidth="2" />
      {/* right auricle; fat along the grooves; coronary artery and vein on the surface */}
      <path d="M120,176 C104,170 100,196 116,204 C124,206 132,194 130,182 Z" fill="#c9524a" stroke="#7e2522" strokeWidth="1.5" />
      <path d="M226,166 C230,232 240,300 262,380" stroke="#f1d9a6" strokeWidth="11" strokeOpacity="0.55" fill="none" strokeLinecap="round" />
      <path d="M224,168 C228,232 238,300 260,378" stroke="#f0785f" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M232,170 C238,232 248,296 268,370" stroke="#6f85d6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M150,178 C180,200 205,205 226,200" stroke="#f0785f" strokeWidth="3" fill="none" />
      <ellipse cx="170" cy="230" rx="38" ry="22" fill="#fff" fillOpacity="0.1" transform="rotate(-25 170 230)" />
    </>
  ),
  inside: (id) => (
    <>
      <defs>
        {["#22397f", "#7f1d1a"].map((c, i) => (
          <marker key={c} id={`${id}-tip${i}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill={c} />
          </marker>
        ))}
      </defs>
      {vessels(true)}
      <path d={BODY} fill="#b8443f" stroke="#7e2522" strokeWidth="2" />
      {/* the four chambers: oxygen-poor blood on the person's right (blue), oxygen-rich on the left (red); the left ventricle's wall is the thickest */}
      <ellipse cx="150" cy="198" rx="36" ry="30" fill="#8ea7e0" />
      <path d="M124,246 C128,292 178,334 236,356 C232,322 226,284 224,244 C196,236 150,236 124,246 Z" fill="#8ea7e0" />
      <ellipse cx="270" cy="180" rx="44" ry="22" fill="#ef8f86" />
      <path d="M250,222 C240,262 246,318 262,348 C284,322 296,282 294,240 C290,222 268,214 250,222 Z" fill="#ef8f86" />
      {/* valves: sail valves between atria and ventricles, pocket valves at the exits */}
      <path d="M140,232 L158,232 L150,258 Z M174,232 L194,232 L184,260 Z" fill="#fff6ea" />
      <path d="M252,204 L270,204 L262,230 Z M278,204 L294,204 L286,228 Z" fill="#fff6ea" />
      {pocket(214, 182, 10)}
      {pocket(190, 198, 9)}
      {/* the way of the blood */}
      <g fill="none" strokeWidth="3.5" strokeLinecap="round" stroke="#22397f" markerEnd={`url(#${id}-tip0)`}>
        <path d="M136,96 L136,168" />
        <path d="M150,214 C152,240 158,262 166,286" />
        <path d="M206,318 C214,270 204,232 194,212" />
      </g>
      <g fill="none" strokeWidth="3.5" strokeLinecap="round" stroke="#7f1d1a" markerEnd={`url(#${id}-tip1)`}>
        <path d="M352,184 L310,184" />
        <path d="M270,194 C272,220 274,244 276,270" />
        <path d="M262,320 C250,270 232,226 218,196" />
      </g>
    </>
  ),
};

export const SCENES: Record<string, Scene> = { earth, heart };
