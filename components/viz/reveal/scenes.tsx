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

// ---------- a stratovolcano, cut open: layers of lava and ash, the conduit, the magma chamber (depth not to scale) ----------
const CONE = "M30,250 L172,92 L186,92 L193,104 L207,104 L214,92 L228,92 L370,250 Z";
const plume = (
  <g fill="#8d8a86">
    {[[200, 70, 18], [188, 52, 20], [214, 40, 22], [196, 24, 24], [226, 14, 20], [170, 30, 16]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} opacity={0.85 - i * 0.08} />)}
  </g>
);
const volcano: Scene = {
  outside: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1c2a3f" /><stop offset="1" stopColor="#40566e" /></linearGradient>
        <linearGradient id={`${id}-rock`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7a6658" /><stop offset="1" stopColor="#4a3d35" /></linearGradient>
      </defs>
      <rect width="400" height="250" fill={`url(#${id}-sky)`} />
      {plume}
      <path d={CONE} fill={`url(#${id}-rock)`} />
      <path d="M150,116 L172,92 L186,92 L193,104 L207,104 L214,92 L228,92 L252,118 L240,112 L230,122 L218,110 L206,120 L194,110 L182,122 L170,110 L160,120 Z" fill="#e9ecef" />
      <rect y="250" width="400" height="150" fill="#3b2f28" />
      <rect y="246" width="400" height="6" fill="#4f7a3a" />
    </>
  ),
  inside: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1c2a3f" /><stop offset="1" stopColor="#40566e" /></linearGradient>
        <radialGradient id={`${id}-magma`} cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#ffd56b" /><stop offset="0.6" stopColor="#ff7a2a" /><stop offset="1" stopColor="#b8321a" /></radialGradient>
        <clipPath id={`${id}-cone`}><path d={CONE} /></clipPath>
      </defs>
      <rect width="400" height="250" fill={`url(#${id}-sky)`} />
      {plume}
      {/* layers of lava (dark) and ash (light), one over the other like the cone grew */}
      <g clipPath={`url(#${id}-cone)`}>
        {Array.from({ length: 8 }, (_, i) => {
          const d = i * 19;
          return <path key={i} d={`M${30 + d * 0.9},250 L${172 + d * 0.15},${92 + d} L${228 - d * 0.15},${92 + d} L${370 - d * 0.9},250 Z`} fill={i % 2 ? "#8a7f74" : "#5a4038"} />;
        })}
      </g>
      <rect y="250" width="400" height="150" fill="#2e2420" />
      {[268, 292, 318].map((y, i) => <path key={i} d={`M0,${y} Q100,${y - 6} 200,${y} T400,${y}`} stroke="#3e322b" strokeWidth="3" fill="none" />)}
      {/* the magma chamber and the conduit up to the crater */}
      <ellipse cx="200" cy="352" rx="92" ry="34" fill={`url(#${id}-magma)`} />
      <path d="M193,104 L207,104 L210,322 L190,322 Z" fill="#ff7a2a" />
      <path d="M198,108 L202,108 L203,322 L197,322 Z" fill="#ffd56b" />
      <path d="M205,250 C240,226 262,206 276,186" stroke="#ff7a2a" strokeWidth="6" fill="none" strokeLinecap="round" />
    </>
  ),
};

// ---------- the eye from the side, light coming in from the left: cornea, iris, lens, vitreous body, retina, optic nerve ----------
const EYE = { cx: 215, cy: 200, r: 130 };
const nerve = <path d="M326,236 C350,250 372,266 398,282 L398,312 C368,294 346,280 318,262 Z" fill="#e8d8b0" stroke="#b9a77c" strokeWidth="2" />;
const eye: Scene = {
  outside: (id) => (
    <>
      <defs>
        <radialGradient id={`${id}-white`} cx="40%" cy="38%" r="70%"><stop offset="0" stopColor="#fbf8f2" /><stop offset="1" stopColor="#c9c0b2" /></radialGradient>
      </defs>
      {nerve}
      <circle cx={EYE.cx} cy={EYE.cy} r={EYE.r} fill={`url(#${id}-white)`} />
      {[["M300,130 C280,150 270,140 252,160", 2], ["M310,262 C288,250 276,266 258,252", 2], ["M240,86 C236,110 248,120 240,140", 1.5], ["M250,318 C246,296 258,288 250,268", 1.5]].map(([d, w], i) => <path key={i} d={d as string} stroke="#c96b6b" strokeWidth={w as number} fill="none" strokeLinecap="round" />)}
      {/* the front: cornea over the iris and the pupil, seen from the side */}
      <path d="M100,132 C64,160 64,240 100,268" fill="#dcecf3" fillOpacity="0.7" stroke="#9fc3d6" strokeWidth="3" />
      <ellipse cx="96" cy="200" rx="11" ry="50" fill="#4f86b8" />
      <ellipse cx="94" cy="200" rx="5" ry="20" fill="#14161c" />
      <ellipse cx="80" cy="170" rx="5" ry="12" fill="#fff" opacity="0.7" />
    </>
  ),
  inside: (id) => (
    <>
      {nerve}
      {/* the wall: white sclera, dark choroid, the retina inside */}
      <circle cx={EYE.cx} cy={EYE.cy} r={EYE.r} fill="#f4f1ea" />
      <circle cx={EYE.cx} cy={EYE.cy} r={EYE.r - 8} fill="#6e3434" />
      <circle cx={EYE.cx} cy={EYE.cy} r={EYE.r - 12} fill="#e98a5c" />
      <circle cx={EYE.cx} cy={EYE.cy} r={EYE.r - 16} fill="#d6e7ee" />
      {/* the front opens into the cornea; behind it the anterior chamber, the iris and the lens on its suspension */}
      <path d="M100,132 L120,150 L120,250 L100,268 Z" fill="#d6e7ee" />
      <path d="M100,132 C64,160 64,240 100,268" fill="#e3f2f8" stroke="#9fc3d6" strokeWidth="3" />
      <rect x="106" y="146" width="9" height="38" rx="3" fill="#4f86b8" />
      <rect x="106" y="216" width="9" height="38" rx="3" fill="#4f86b8" />
      <path d="M118,150 L136,166 M118,250 L136,234" stroke="#6e3434" strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="138" cy="200" rx="17" ry="38" fill="#f6e7b0" stroke="#d9c27a" strokeWidth="2" />
      {/* the optic nerve leaves where there are no light cells – the blind spot; the yellow spot is the sharpest place */}
      <path d="M318,238 L332,232 L330,252 L314,256 Z" fill="#e8d8b0" />
      <circle cx="345" cy="198" r="6" fill="#ffd24a" />
      {/* light through cornea and lens, bent onto the retina */}
      <g stroke="#ffd24a" strokeWidth="2" fill="none" strokeDasharray="6 5" opacity="0.9">
        <path d="M0,176 L84,176 L138,184 L345,198" />
        <path d="M0,224 L84,224 L138,216 L345,198" />
      </g>
    </>
  ),
};

// ---------- a hen's egg lying on its side, the blunt end left: shell, membrane, air cell, egg white, yolk, chalazae ----------
const EGG = "M50,200 C50,118 120,90 200,90 C285,90 355,150 365,200 C355,250 285,310 200,310 C120,310 50,282 50,200 Z";
const egg: Scene = {
  outside: (id) => (
    <>
      <defs>
        <radialGradient id={`${id}-shell`} cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#ecc08e" /><stop offset="1" stopColor="#b9773f" /></radialGradient>
      </defs>
      <ellipse cx="208" cy="326" rx="140" ry="14" fill="#000" opacity="0.35" />
      <path d={EGG} fill={`url(#${id}-shell)`} />
      {[[120, 150], [170, 128], [250, 140], [300, 190], [140, 240], [220, 270], [280, 250], [95, 200], [330, 220]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 2 : 3} fill="#9c5f2e" opacity="0.5" />)}
      <ellipse cx="140" cy="135" rx="38" ry="16" fill="#fff" opacity="0.25" transform="rotate(-20 140 135)" />
    </>
  ),
  inside: (id) => (
    <>
      <defs>
        <radialGradient id={`${id}-yolk`} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#ffd25e" /><stop offset="1" stopColor="#e8901c" /></radialGradient>
      </defs>
      <ellipse cx="208" cy="326" rx="140" ry="14" fill="#000" opacity="0.35" />
      {/* the shell in section, the membrane inside it; at the blunt end they part around the air cell */}
      <path d={EGG} fill="#f4ead8" />
      <path d="M57,200 C57,124 124,97 200,97 C282,97 348,152 358,200 C348,248 282,303 200,303 C124,303 57,276 57,200 Z" fill="#efe6d2" stroke="#d8ccb2" strokeWidth="2" />
      <path d="M62,200 C62,150 80,124 104,112 C92,140 90,170 92,200 C90,230 92,260 104,288 C80,276 62,250 62,200 Z" fill="#cfe1ea" stroke="#d8ccb2" strokeWidth="2" />
      {/* the chalazae hold the yolk in the middle of the egg white */}
      <path d="M143,200 c-6,-6 -12,6 -18,0 c-6,-6 -12,6 -18,0" stroke="#e2dcc6" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M267,200 c6,-6 12,6 18,0 c6,-6 12,6 18,0 c6,-6 12,6 18,0" stroke="#e2dcc6" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="205" cy="200" r="62" fill={`url(#${id}-yolk)`} />
      <circle cx="205" cy="146" r="6" fill="#fff8e6" stroke="#e8c27a" strokeWidth="1.5" />
      {/* pores in the shell */}
      {[[150, 99], [230, 100], [300, 128], [120, 290], [260, 296]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill="#b9a98a" />)}
    </>
  ),
};

// ---------- a classic light bulb: frosted glass outside; inside the filament on its supports, the lead-in wires, the screw base ----------
const BULB = "M200,30 C272,30 318,82 318,146 C318,196 282,222 262,250 L258,268 L142,268 L138,250 C118,222 82,196 82,146 C82,82 128,30 200,30 Z";
const base = (
  <>
    <path d="M144,268 L256,268 L252,326 L148,326 Z" fill="#a9a9a9" />
    {[278, 292, 306, 320].map((y) => <path key={y} d={`M146,${y} Q200,${y + 8} 254,${y}`} stroke="#7d7d7d" strokeWidth="4" fill="none" />)}
    <path d="M160,326 L240,326 L226,340 L174,340 Z" fill="#2b2a28" />
    <path d="M186,340 L214,340 L208,352 L192,352 Z" fill="#c9a24a" />
  </>
);
const bulb: Scene = {
  outside: (id) => (
    <>
      <defs>
        <radialGradient id={`${id}-frost`} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#d9d6cf" /></radialGradient>
      </defs>
      <path d={BULB} fill={`url(#${id}-frost)`} stroke="#c2bdb3" strokeWidth="2" />
      <ellipse cx="160" cy="96" rx="22" ry="34" fill="#fff" opacity="0.6" transform="rotate(25 160 96)" />
      {base}
    </>
  ),
  inside: (id) => (
    <>
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#fff2b0" stopOpacity="0.9" /><stop offset="1" stopColor="#ffd24a" stopOpacity="0" /></radialGradient>
      </defs>
      {/* clear glass with its fill gas */}
      <path d={BULB} fill="#e9f1f5" fillOpacity="0.16" stroke="#9fc3d6" strokeWidth="3" />
      <circle cx="200" cy="130" r="70" fill={`url(#${id}-glow)`} />
      {/* stem, lead-in wires and supports, the glowing coil between them */}
      <path d="M186,268 L186,214 Q200,200 214,214 L214,268 Z" fill="#dfe8ec" fillOpacity="0.6" stroke="#9fc3d6" strokeWidth="2" />
      <path d="M192,214 L170,130 M208,214 L230,130 M200,206 L200,108" stroke="#8b8b8b" strokeWidth="2.5" fill="none" />
      <path d="M170,130 C172,120 176,140 180,130 C182,120 186,140 190,130 C192,120 196,140 200,130 C202,120 206,140 210,130 C212,120 216,140 220,130 C222,120 226,140 230,130" stroke="#ffb020" strokeWidth="3" fill="none" />
      <path d="M192,268 L192,330 L200,346 M208,268 L208,300 L252,300" stroke="#c9a24a" strokeWidth="2.5" fill="none" />
      <g opacity="0.55">{base}</g>
    </>
  ),
};

// ---------- an animal cell: the membrane outside; inside nucleus, mitochondria, ribosomes and the cytoskeleton ----------
const CELL = "M200,52 C268,48 338,92 348,164 C358,232 330,312 262,340 C200,364 120,350 82,300 C44,250 46,170 82,118 C112,76 150,54 200,52 Z";
const mito = (x: number, y: number, rot: number) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <ellipse cx="0" cy="0" rx="26" ry="12" fill="#e98a5c" stroke="#b9562d" strokeWidth="2" />
    <path d="M-18,-6 L-12,6 L-6,-6 L0,6 L6,-6 L12,6 L18,-6" stroke="#b9562d" strokeWidth="1.8" fill="none" />
  </g>
);
const cell: Scene = {
  outside: (id) => (
    <>
      <defs>
        <radialGradient id={`${id}-skin`} cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#f7c9d6" /><stop offset="1" stopColor="#c76f8c" /></radialGradient>
      </defs>
      <path d={CELL} fill={`url(#${id}-skin)`} />
      {[[140, 110], [250, 96], [310, 170], [290, 280], [180, 320], [100, 220], [210, 200], [160, 170], [240, 250]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 4 : 3} fill="#a85274" opacity="0.5" />)}
      <ellipse cx="150" cy="110" rx="40" ry="18" fill="#fff" opacity="0.25" transform="rotate(-25 150 110)" />
    </>
  ),
  inside: () => (
    <>
      {/* the membrane in section, the cell plasma inside */}
      <path d={CELL} fill="#f3e1e7" stroke="#c76f8c" strokeWidth="6" />
      {/* the cytoskeleton: a net of fine fibres */}
      <g stroke="#d9b3c2" strokeWidth="1.5" fill="none">
        <path d="M90,160 C150,150 230,120 330,140" /><path d="M100,270 C170,240 260,260 320,230" /><path d="M150,70 C160,150 140,250 170,340" /><path d="M280,80 C260,170 290,250 250,330" />
      </g>
      {/* the nucleus with its envelope; the DNA inside */}
      <circle cx="190" cy="196" r="58" fill="#c9b7e8" stroke="#7d64b8" strokeWidth="4" />
      <circle cx="205" cy="186" r="16" fill="#7d64b8" />
      <path d="M160,180 c10,-10 20,10 30,0 M162,212 c10,-8 22,8 32,-2 M176,232 c8,-6 18,6 26,0" stroke="#9b85cf" strokeWidth="2.5" fill="none" />
      {mito(290, 150, -20)}{mito(120, 270, 25)}{mito(270, 286, 10)}
      {/* ribosomes: hundreds to thousands of tiny dots */}
      {[[110, 140], [128, 160], [300, 210], [312, 228], [240, 120], [258, 110], [150, 300], [210, 310], [96, 210], [330, 190], [230, 260], [140, 240], [270, 230], [180, 110], [320, 260]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#5a4f6e" />)}
    </>
  ),
};

// ---------- the ear, cut through from the side of the head: outer, middle and inner ear (not to scale) ----------
const PINNA = "M108,128 C70,110 30,140 30,200 C30,262 66,300 104,296 C96,276 92,258 98,240 L110,214 L110,186 C100,170 98,148 108,128 Z";
const ear: Scene = {
  outside: () => (
    <>
      <rect x="100" y="40" width="300" height="320" rx="18" fill="#e8b996" />
      <path d="M100,40 L400,40 L400,92 C320,104 210,96 100,108 Z" fill="#5a4636" />
      <path d={PINNA} fill="#e3a982" stroke="#b97a56" strokeWidth="3" />
      <path d="M90,150 C60,160 52,210 70,250 C78,268 90,276 96,262" stroke="#b97a56" strokeWidth="3" fill="none" />
      <ellipse cx="106" cy="200" rx="5" ry="10" fill="#7a4a34" />
    </>
  ),
  inside: () => (
    <>
      {/* skin and the bone of the skull around the hearing organs */}
      <rect x="100" y="40" width="300" height="320" rx="18" fill="#efe3cc" />
      <rect x="100" y="40" width="34" height="320" fill="#e8b996" />
      <path d={PINNA} fill="#e3a982" stroke="#b97a56" strokeWidth="3" />
      {/* outer ear canal up to the eardrum */}
      <path d="M100,190 L196,182 L196,214 L100,210 Z" fill="#f6d9c8" stroke="#c99a7e" strokeWidth="2" />
      <ellipse cx="200" cy="198" rx="4" ry="22" fill="#f2b8a0" stroke="#c46a4e" strokeWidth="2" />
      {/* middle ear: the air-filled cavity with hammer, anvil and stirrup; the Eustachian tube down to the throat */}
      <path d="M204,168 L268,168 L272,232 L206,232 Z" fill="#fbf3e6" stroke="#d9c7a6" strokeWidth="2" />
      <path d="M206,190 L222,180 L230,186 L218,200 Z" fill="#c9a24a" />
      <path d="M228,180 L248,176 L252,192 L236,200 Z" fill="#c9a24a" />
      <path d="M250,190 L268,186 L270,206 L252,204 M254,196 L266,196" stroke="#c9a24a" strokeWidth="3" fill="none" />
      <path d="M228,232 C220,268 206,300 186,340" stroke="#d9c7a6" strokeWidth="12" fill="none" strokeLinecap="round" />
      {/* inner ear: the cochlea, the semicircular canals of the balance organ, the nerve to the brain */}
      <path d="M310,214 m-30,0 a30,30 0 1,1 60,0 a24,24 0 1,1 -48,0 a18,18 0 1,1 36,0 a12,12 0 1,1 -24,0 a6,6 0 1,1 12,0" stroke="#e98a5c" strokeWidth="7" fill="none" />
      <path d="M278,186 C266,150 290,124 312,138 C330,150 318,176 300,180" stroke="#7cc4f0" strokeWidth="6" fill="none" />
      <path d="M290,180 C300,140 344,140 346,166 C348,186 324,190 306,182" stroke="#7cc4f0" strokeWidth="6" fill="none" />
      <path d="M298,170 C300,150 326,150 326,168" stroke="#7cc4f0" strokeWidth="5" fill="none" />
      <path d="M338,214 C360,212 380,206 400,206" stroke="#ffd24a" strokeWidth="7" fill="none" />
    </>
  ),
};

export const SCENES: Record<string, Scene> = { earth, heart, volcano, eye, egg, bulb, cell, ear };
