// A marathon (42.195 km, fixed in 1921) on a 400 m track: 105 laps and 195 metres – computed, not typed in.
// The track has the proportions of the standard 400 m track (World Athletics): straights of 84.39 m, bends with a radius of 36.5 m.
import { interpolate, useCurrentFrame } from "remotion";
import { C, ease, fmt, FONT, Stage, type Locale } from "../theme";

const MARATHON_M = 42195;
const LAP_M = 400;
const LAPS = MARATHON_M / LAP_M; // 105.4875
const S = 3.0; // pixels per metre
const L = 84.39 * S, R = 36.5 * S; // ≈ 400 m on the inside line
const CX = 360, CY = 590;
const RUN_FROM = 26, RUN_TO = 250;

const T = {
  de: { topic: "Sport", track: "400-m-Bahn", lap: "Runde", result: (laps: number, rest: number) => `${laps} Runden + ${rest} m` },
  en: { topic: "Sport", track: "400 m track", lap: "Lap", result: (laps: number, rest: number) => `${laps} laps + ${rest} m` },
};

/** Point in the first lane after `laps` laps from the finish line, running anticlockwise like on a real track. */
function at(laps: number, r = R + 6): [number, number] {
  const perim = 2 * L + 2 * Math.PI * r;
  const s = ((-laps * perim) % perim + perim) % perim; // the path below runs clockwise, so walk it backwards
  if (s < L) return [CX + L / 2 - s, CY + r]; // home straight
  if (s < L + Math.PI * r) { const a = (s - L) / r; return [CX - L / 2 - r * Math.sin(a), CY + r * Math.cos(a)]; }
  if (s < 2 * L + Math.PI * r) return [CX - L / 2 + (s - L - Math.PI * r), CY - r]; // back straight
  const a = (s - 2 * L - Math.PI * r) / r;
  return [CX + L / 2 + r * Math.sin(a), CY - r * Math.cos(a)];
}
const oval = (r: number) => `M${CX + L / 2} ${CY + r} L${CX - L / 2} ${CY + r} A${r} ${r} 0 0 1 ${CX - L / 2} ${CY - r} L${CX + L / 2} ${CY - r} A${r} ${r} 0 0 1 ${CX + L / 2} ${CY + r} Z`;

// slow first lap, then faster and faster
const lapsAt = (frame: number) => LAPS * Math.pow(interpolate(frame, [RUN_FROM, RUN_TO], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 3);

export function MarathonRunden({ locale }: { locale: Locale }) {
  const frame = useCurrentFrame();
  const t = T[locale];
  const laps = lapsAt(frame);
  const speed = laps - lapsAt(frame - 1); // laps per frame
  const done = ease(frame, RUN_TO + 4, RUN_TO + 20);
  const [x, y] = at(laps);
  const blur = Math.min(1, speed / 0.35); // once the runner is a blur, the whole lane lights up

  return (
    <Stage topic={t.topic} color={C.sport}>
      <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 112, letterSpacing: -2, fontVariantNumeric: "tabular-nums" }}>
          {fmt(Math.min(MARATHON_M, laps * LAP_M) / 1000, locale, frame >= RUN_TO ? 3 : 1)} km
        </div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
          {frame < RUN_TO ? `${t.lap} ${Math.floor(laps) + 1} · ` : ""}{t.track}
        </div>
      </div>

      <svg width={720} height={1280} style={{ position: "absolute", inset: 0 }}>
        {/* infield and lanes */}
        <path d={oval(R - 6)} fill="#1d2a1f" />
        {[0, 1, 2, 3].map((i) => <path key={i} d={oval(R + i * 13)} fill="none" stroke={C.line} strokeWidth={2} />)}
        <path d={oval(R + 6)} fill="none" stroke={C.sport} strokeWidth={10} opacity={0.15 + 0.6 * blur} />
        {/* finish line */}
        <line x1={CX + L / 2} x2={CX + L / 2} y1={CY + R - 4} y2={CY + R + 44} stroke={C.ink} strokeWidth={4} />
        {/* runner with a short trail */}
        {Array.from({ length: 8 }, (_, k) => {
          const [tx, ty] = at(laps - k * Math.min(speed, 0.02));
          return <circle key={k} cx={tx} cy={ty} r={12 - k} fill={C.accent} opacity={(1 - k / 8) * (1 - blur * 0.7) * (k === 0 ? 1 : 0.5)} />;
        })}
        <circle cx={x} cy={y} r={13} fill={C.accent} opacity={1 - blur * 0.5} />
      </svg>

      <div style={{ position: "absolute", top: 800, width: "100%", textAlign: "center", opacity: done, transform: `translateY(${(1 - done) * 16}px)` }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 52, color: C.ink }}>= {t.result(Math.floor(LAPS), Math.round((LAPS % 1) * LAP_M))}</span>
      </div>
    </Stage>
  );
}
