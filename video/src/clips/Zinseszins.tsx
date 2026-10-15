// Compound interest: 1,000 at 7 % a year for 30 years. Every number is computed here, nothing is typed in.
// Each bar splits into the starting amount, plain interest (70 a year) and interest on interest.
import { useCurrentFrame } from "remotion";
import { C, ease, fmt, FONT, Stage, type Locale } from "../theme";

const START = 1000;
const RATE = 0.07;
const YEARS = 30;
const valueAt = (years: number) => START * Math.pow(1 + RATE, years);
const money = (n: number, l: Locale) => (l === "de" ? `${fmt(n, l)} €` : `€${fmt(n, l)}`);

const T = {
  de: { topic: "Wirtschaft & Geld", rate: "7 % Zinsen pro Jahr", start: "Start", after: (n: number) => (n === 1 ? "nach 1 Jahr" : `nach ${n} Jahren`), legend: ["Startbetrag", "Zinsen", "Zinsen auf Zinsen"], simple: "ohne Zinseszins", years: "Jahre" },
  en: { topic: "Economy & Money", rate: "7% interest a year", start: "Start", after: (n: number) => (n === 1 ? "after 1 year" : `after ${n} years`), legend: ["Starting amount", "Interest", "Interest on interest"], simple: "without compounding", years: "years" },
};

// chart geometry
const X0 = 70, X1 = 650, Y_BASE = 800, CHART_H = 400;
const STEP = (X1 - X0) / (YEARS + 1);
const BAR = STEP * 0.72;
const y = (v: number) => Y_BASE - (v / valueAt(YEARS)) * CHART_H;
const GROW_FROM = 24, PER_YEAR = 6.6; // bar of year i appears at GROW_FROM + i * PER_YEAR

export function Zinseszins({ locale }: { locale: Locale }) {
  const frame = useCurrentFrame();
  const t = T[locale];
  const shownYears = Math.max(0, Math.min(YEARS, (frame - GROW_FROM) / PER_YEAR));
  const whole = Math.floor(shownYears);
  const simple = START + START * RATE * YEARS;
  const end = GROW_FROM + YEARS * PER_YEAR;
  const showSimple = ease(frame, end + 8, end + 26);

  return (
    <Stage topic={t.topic} color={C.economy}>
      {/* the running total */}
      <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 104, letterSpacing: -2, fontVariantNumeric: "tabular-nums" }}>{money(valueAt(whole), locale)}</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 4 }}>
          {whole === 0 ? t.start : t.after(whole)} · {t.rate}
        </div>
      </div>

      {/* legend */}
      <div style={{ position: "absolute", top: 318, width: "100%", display: "flex", justifyContent: "center", gap: 22, fontSize: 21, color: C.muted, opacity: ease(frame, 6, 18) }}>
        {[C.neutral, C.economy, C.accent].map((c, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 8, color: i === 2 ? C.ink : C.muted, fontWeight: i === 2 ? 600 : 400 }}>
            <span style={{ width: 16, height: 16, borderRadius: 4, background: c }} />
            {t.legend[i]}
          </span>
        ))}
      </div>

      <svg width={720} height={1280} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: YEARS + 1 }, (_, i) => {
          const grow = ease(frame, GROW_FROM + i * PER_YEAR, GROW_FROM + i * PER_YEAR + 10);
          if (grow <= 0) return null;
          const total = valueAt(i);
          const plain = START * RATE * i;
          const x = X0 + i * STEP + (STEP - BAR) / 2;
          const part = (from: number, to: number, color: string) => {
            const top = y(from + (to - from) * grow), bottom = y(from);
            return <rect x={x} y={top} width={BAR} height={Math.max(0, bottom - top)} fill={color} rx={2} />;
          };
          return (
            <g key={i}>
              {part(0, START, C.neutral)}
              {grow >= 1 && part(START, START + plain, C.economy)}
              {grow >= 1 && part(START + plain, total, C.accent)}
              {grow < 1 && part(START, START + (total - START) * grow, C.economy)}
            </g>
          );
        })}
        {/* the same money without interest on interest */}
        <g opacity={showSimple}>
          <line x1={X0} x2={X1} y1={y(simple)} y2={y(simple)} stroke={C.ink} strokeWidth={3} strokeDasharray="10 8" />
          <text x={X0 + 4} y={y(simple) - 14} fill={C.ink} fontSize={24} fontFamily={FONT.sans}>{t.simple}: {money(simple, locale)}</text>
        </g>
        {/* value labels at 10, 20, 30 years */}
        {[10, 20, 30].map((i) => {
          const o = ease(frame, GROW_FROM + i * PER_YEAR + 8, GROW_FROM + i * PER_YEAR + 16);
          const cx = X0 + i * STEP + STEP / 2;
          return (
            <text key={i} x={i === 30 ? cx + 6 : cx} y={y(valueAt(i)) - 14} textAnchor={i === 30 ? "end" : "middle"} fill={C.ink} fontSize={24} fontWeight={600} fontFamily={FONT.sans} opacity={o}>
              {money(valueAt(i), locale)}
            </text>
          );
        })}
        {/* axis */}
        <line x1={X0} x2={X1} y1={Y_BASE} y2={Y_BASE} stroke={C.line} strokeWidth={2} />
        {[0, 10, 20, 30].map((i) => (
          <text key={i} x={X0 + i * STEP + STEP / 2} y={Y_BASE + 36} textAnchor="middle" fill={C.muted} fontSize={22} fontFamily={FONT.sans}>{i}</text>
        ))}
        <text x={X1} y={Y_BASE + 66} textAnchor="end" fill={C.muted} fontSize={20} fontFamily={FONT.sans}>{t.years}</text>
      </svg>
    </Stage>
  );
}
