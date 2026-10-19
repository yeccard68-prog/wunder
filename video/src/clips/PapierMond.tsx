// Folding paper to the Moon: every fold doubles the thickness. 0.1 mm × 2ⁿ, computed – with three heights to
// compare: Mount Everest (over 8,848 m), the ISS (about 400 km up) and the Moon (on average 384,400 km away).
// A logarithmic ruler, because the numbers grow so fast.
import { interpolate, useCurrentFrame } from "remotion";
import { C, ease, fmt, FONT, Stage, type Locale } from "../theme";

const SHEET_M = 0.0001; // 0.1 mm
const FOLDS = 42;
const thickness = (n: number) => SHEET_M * Math.pow(2, n);
const MARKS = [
  { m: 1, de: "1 Meter", en: "1 metre", deV: "1 m", enV: "1 m" },
  { m: 8848, de: "Mount Everest", en: "Mount Everest", deV: "8.848 m", enV: "8,848 m" },
  { m: 400_000, de: "Raumstation ISS", en: "Space station ISS", deV: "rund 400 km hoch", enV: "about 400 km up" },
  { m: 384_400_000, de: "Mond", en: "Moon", deV: "384.400 km entfernt", enV: "384,400 km away" },
];
const T = {
  de: { topic: "Mathe & Logik", folds: (n: number) => `${n} × gefaltet`, sheet: "Blatt Papier, 0,1 mm" },
  en: { topic: "Maths & Logic", folds: (n: number) => `folded ${n} ×`, sheet: "sheet of paper, 0.1 mm" },
};
const nice = (m: number, l: Locale) => (m < 0.01 ? `${fmt(m * 1000, l, 1)} mm` : m < 1 ? `${fmt(m * 100, l, 0)} cm` : m < 1000 ? `${fmt(m, l, 0)} m` : `${fmt(m / 1000, l, 0)} km`);

// ruler: log10 of metres from 10^-4 (0.1 mm) to 10^9 mapped onto the height
const Y_TOP = 300, Y_BOT = 860;
const yOf = (m: number) => Y_BOT - ((Math.log10(m) + 4) / 13) * (Y_BOT - Y_TOP);

export function PapierMond({ locale }: { locale: Locale }) {
  const frame = useCurrentFrame();
  const t = T[locale];
  const n = Math.floor(interpolate(frame, [20, 250], [0, FOLDS], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => x * x * (3 - 2 * x) }));
  const h = thickness(n);
  const top = yOf(h);
  return (
    <Stage topic={t.topic} color="#d6c35a">
      <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 92, fontVariantNumeric: "tabular-nums" }}>{nice(h, locale)}</div>
        <div style={{ fontSize: 30, color: C.muted }}>{n === 0 ? t.sheet : t.folds(n)}</div>
      </div>
      <svg width={720} height={1280} style={{ position: "absolute", inset: 0 }}>
        <line x1={250} x2={250} y1={Y_TOP} y2={Y_BOT} stroke={C.line} strokeWidth={3} />
        {/* the stack of paper, as tall as it would be */}
        <rect x={214} y={top} width={72} height={Math.max(4, Y_BOT - top)} rx={4} fill="#f4f1ec" opacity={0.92} />
        {MARKS.map((mk, i) => {
          const y = yOf(mk.m);
          const reached = h >= mk.m;
          const o = ease(frame, 10 + i * 6, 22 + i * 6);
          return (
            <g key={mk.m} opacity={o}>
              <line x1={300} x2={330} y1={y} y2={y} stroke={reached ? "#d6c35a" : C.muted} strokeWidth={3} />
              <text x={342} y={y + 9} fill={reached ? C.ink : C.muted} fontSize={28} fontWeight={reached ? 600 : 400} fontFamily={FONT.sans}>{mk[locale]}</text>
              <text x={342} y={y + 40} fill={C.muted} fontSize={21} fontFamily={FONT.sans}>{locale === "de" ? mk.deV : mk.enV}</text>
            </g>
          );
        })}
      </svg>
    </Stage>
  );
}
