// The Sun holds 99.86 % of the solar system's mass. Shown as 1,000 squares: 998.6 of them belong to the Sun,
// the last 1.4 to all planets, moons, asteroids and comets together. Computed from the percentage.
import { useCurrentFrame } from "remotion";
import { C, ease, FONT, Stage, type Locale } from "../theme";

const SUN_SHARE = 0.9986;
const COLS = 40, ROWS = 25, CELL = 14, GAP = 2.5;
const T = {
  de: { topic: "Wissenschaft", sun: "Sonne", rest: "alles andere", unit: "von 1.000 Teilen" },
  en: { topic: "Science", sun: "Sun", rest: "everything else", unit: "of 1,000 parts" },
};

export function SonneMasse({ locale }: { locale: Locale }) {
  const frame = useCurrentFrame();
  const t = T[locale];
  const total = COLS * ROWS; // 1000
  const sunCells = SUN_SHARE * total; // 998.6
  const filled = ease(frame, 20, 200) * total;
  const showRest = ease(frame, 205, 235);
  const x0 = (720 - (COLS * (CELL + GAP) - GAP)) / 2, y0 = 250;
  return (
    <Stage topic={t.topic} color="#41c7b4">
      <svg width={720} height={1280} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: total }, (_, i) => {
          const col = i % COLS, row = Math.floor(i / COLS);
          const sunPart = Math.max(0, Math.min(1, sunCells - i)); // the last sun square is 0.6 full
          const on = i < filled;
          return (
            <g key={i} transform={`translate(${x0 + col * (CELL + GAP)} ${y0 + row * (CELL + GAP)})`}>
              <rect width={CELL} height={CELL} rx={3} fill={C.raised} />
              {on && sunPart > 0 && <rect width={CELL * sunPart} height={CELL} rx={3} fill="#ffc94a" />}
              {sunPart < 1 && <rect x={CELL * sunPart} width={CELL * (1 - sunPart)} height={CELL} rx={3} fill="#6db3f2" opacity={showRest} />}
            </g>
          );
        })}
        {/* the tiny rest is easy to miss: a ring around it */}
        <circle cx={x0 + (COLS - 1.2) * (CELL + GAP)} cy={y0 + (ROWS - 0.5) * (CELL + GAP)} r={34 - 8 * showRest} fill="none" stroke="#6db3f2" strokeWidth={4} opacity={showRest} />
      </svg>
      <div style={{ position: "absolute", top: 700, width: "100%", display: "flex", justifyContent: "center", gap: 46, fontFamily: FONT.sans }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: FONT.display, fontSize: 54, fontWeight: 600, color: "#ffc94a" }}>{locale === "de" ? "99,86 %" : "99.86%"}</div>
          <div style={{ fontSize: 26, color: C.ink }}>{t.sun}</div>
        </div>
        <div style={{ textAlign: "center", opacity: showRest }}>
          <div style={{ fontFamily: FONT.display, fontSize: 54, fontWeight: 600, color: "#6db3f2" }}>{locale === "de" ? "0,14 %" : "0.14%"}</div>
          <div style={{ fontSize: 26, color: C.ink }}>{t.rest}</div>
        </div>
      </div>
    </Stage>
  );
}
