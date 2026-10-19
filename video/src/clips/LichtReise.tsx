// How long light travels: to the Moon (384,400 km → 1.3 s), from the Sun (149,597,871 km → 8 min 19 s) and
// from the nearest star, Proxima Centauri (4.247 light-years → about 4.2 years). Times computed from
// c = 299,792.458 km/s and the distances in the linked articles. One row per trip, a pulse of light runs
// along each, its clock counts up to the real time (the clip itself is of course much faster).
import { useCurrentFrame } from "remotion";
import { C, ease, FONT, Stage, type Locale } from "../theme";

const T = {
  de: {
    topic: "Wissenschaft",
    title: "So lange ist Licht unterwegs",
    rows: [
      { from: "Erde", to: "Mond", dist: "384.400 km", time: (p: number) => `${(1.28 * p).toFixed(1).replace(".", ",")} s` },
      { from: "Sonne", to: "Erde", dist: "149,6 Mio. km", time: (p: number) => clock(499 * p, "de") },
      { from: "Proxima Centauri", to: "Erde", dist: "4,2 Lichtjahre", time: (p: number) => `${(4.2 * p).toFixed(1).replace(".", ",")} Jahre` },
    ],
  },
  en: {
    topic: "Science",
    title: "How long light is on its way",
    rows: [
      { from: "Earth", to: "Moon", dist: "384,400 km", time: (p: number) => `${(1.28 * p).toFixed(1)} s` },
      { from: "Sun", to: "Earth", dist: "149.6 million km", time: (p: number) => clock(499 * p, "en") },
      { from: "Proxima Centauri", to: "Earth", dist: "4.2 light-years", time: (p: number) => `${(4.2 * p).toFixed(1)} years` },
    ],
  },
};

function clock(seconds: number, locale: Locale) {
  const m = Math.floor(seconds / 60), s = Math.floor(seconds % 60);
  return locale === "de" ? `${m} min ${s} s` : `${m} min ${s} s`;
}

const COLORS = ["#cfd6e0", "#ffc94a", "#ff8a6b"];
const TIMING: [number, number][] = [[24, 70], [86, 160], [176, 262]];

export function LichtReise({ locale }: { locale: Locale }) {
  const frame = useCurrentFrame();
  const t = T[locale];
  return (
    <Stage topic={t.topic} color="#41c7b4">
      <div style={{ position: "absolute", top: 130, width: "100%", textAlign: "center", fontFamily: FONT.display, fontSize: 46, fontWeight: 600, opacity: ease(frame, 4, 18) }}>{t.title}</div>
      {t.rows.map((row, i) => {
        const [a, b] = TIMING[i];
        const show = ease(frame, a - 14, a);
        const p = ease(frame, a, b);
        const y = 270 + i * 205;
        const x0 = 90, x1 = 630;
        return (
          <div key={i} style={{ position: "absolute", top: y, left: 0, width: 720, height: 180, opacity: show }}>
            <div style={{ position: "absolute", left: x0 - 30, top: 0, fontSize: 25, color: C.muted }}>{row.from}</div>
            <div style={{ position: "absolute", right: 720 - x1 - 30, top: 0, fontSize: 25, color: C.muted, textAlign: "right" }}>{row.to}</div>
            <svg width={720} height={120} style={{ position: "absolute", top: 34, left: 0 }}>
              <line x1={x0} y1={46} x2={x1} y2={46} stroke={C.line} strokeWidth={4} strokeDasharray="2 10" strokeLinecap="round" />
              <line x1={x0} y1={46} x2={x0 + (x1 - x0) * p} y2={46} stroke={COLORS[i]} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
              <circle cx={x0} cy={46} r={i === 1 ? 26 : 16} fill={i === 1 ? "#ffc94a" : i === 2 ? "#ff8a6b" : "#4f8fe0"} />
              <circle cx={x1} cy={46} r={i === 0 ? 11 : 16} fill={i === 0 ? "#cfd6e0" : "#4f8fe0"} />
              <circle cx={x0 + (x1 - x0) * p} cy={46} r={9} fill="#fff" opacity={p > 0 && p < 1 ? 1 : 0} style={{ filter: "drop-shadow(0 0 10px #fff)" }} />
            </svg>
            <div style={{ position: "absolute", top: 118, width: "100%", display: "flex", justifyContent: "space-between", padding: `0 ${720 - x1 - 30}px 0 ${x0 - 30}px`, boxSizing: "border-box" }}>
              <span style={{ fontSize: 23, color: C.muted }}>{row.dist}</span>
              <span style={{ fontFamily: FONT.display, fontSize: 40, fontWeight: 600, color: COLORS[i] }}>{row.time(p)}</span>
            </div>
          </div>
        );
      })}
    </Stage>
  );
}
