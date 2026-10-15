// Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.
// To scale: Cheops reigned about 2620–2580 BC (the pyramid is placed at 2600 BC), Cleopatra was born in
// 69 BC, Apollo 11 landed in 1969. There is no year 0, so BC → AD spans subtract one year.
import { useCurrentFrame } from "remotion";
import { C, ease, fmt, FONT, Stage, type Locale } from "../theme";

const PYRAMID = -2600, CLEOPATRA = -69, MOON = 1969;
const span = (a: number, b: number) => b - a - (a < 0 && b > 0 ? 1 : 0);
const TOP = 210, BOTTOM = 800, AXIS_X = 250;
const yOf = (year: number) => TOP + (span(PYRAMID, year) / span(PYRAMID, MOON)) * (BOTTOM - TOP);

const T = {
  de: { topic: "Geschichte", events: [["Cheops-Pyramide", "um 2600 v. Chr."], ["Kleopatra", "geboren 69 v. Chr."], ["Mondlandung", "1969"]], years: "Jahre", closer: "näher an der Mondlandung" },
  en: { topic: "History", events: [["Great Pyramid", "around 2600 BC"], ["Cleopatra", "born 69 BC"], ["Moon landing", "1969"]], years: "years", closer: "closer to the Moon landing" },
};

function Icon({ kind, color }: { kind: number; color: string }) {
  if (kind === 0) return <path d="M-26 18 L0 -22 L26 18 Z M-13 0 L13 0 M-19 9 L19 9" fill="none" stroke={color} strokeWidth={3.5} strokeLinejoin="round" />;
  if (kind === 1) return <path d="M-24 14 L-24 -10 L-12 2 L0 -18 L12 2 L24 -10 L24 14 Z" fill="none" stroke={color} strokeWidth={3.5} strokeLinejoin="round" />;
  return (
    <g>
      <circle r={20} fill="none" stroke={color} strokeWidth={3.5} />
      <circle cx={-6} cy={-5} r={4} fill={color} />
      <circle cx={7} cy={6} r={3} fill={color} />
    </g>
  );
}

export function PyramideMond({ locale }: { locale: Locale }) {
  const frame = useCurrentFrame();
  const t = T[locale];
  const draw = ease(frame, 10, 150); // the time axis grows downwards
  const axisEnd = TOP + (BOTTOM - TOP) * draw;
  const years = [PYRAMID, CLEOPATRA, MOON];
  const appear = (i: number) => ease(frame, i === 0 ? 8 : 10 + 140 * ((yOf(years[i]) - TOP) / (BOTTOM - TOP)), (i === 0 ? 8 : 10 + 140 * ((yOf(years[i]) - TOP) / (BOTTOM - TOP))) + 12);
  const gap1 = span(PYRAMID, CLEOPATRA), gap2 = span(CLEOPATRA, MOON);
  const b1 = ease(frame, 165, 195), b2 = ease(frame, 200, 230), win = ease(frame, 240, 258);
  const round = (n: number) => Math.round(n / 500) * 500;

  const bracket = (from: number, to: number, o: number, label: string, color: string) => {
    const y1 = yOf(from) + 26, y2 = yOf(to) - 26, x = AXIS_X - 54;
    return (
      <g opacity={o}>
        <path d={`M${x + 14} ${y1} L${x} ${y1} L${x} ${y2} L${x + 14} ${y2}`} fill="none" stroke={color} strokeWidth={4} />
        <text x={x - 16} y={(y1 + y2) / 2 - 6} textAnchor="end" fill={color} fontSize={34} fontWeight={600} fontFamily={FONT.sans}>≈ {label}</text>
        <text x={x - 16} y={(y1 + y2) / 2 + 28} textAnchor="end" fill={color} fontSize={24} fontFamily={FONT.sans}>{t.years}</text>
      </g>
    );
  };

  return (
    <Stage topic={t.topic} color={C.history}>
      <svg width={720} height={1280} style={{ position: "absolute", inset: 0 }}>
        <line x1={AXIS_X} x2={AXIS_X} y1={TOP} y2={axisEnd} stroke={C.line} strokeWidth={6} strokeLinecap="round" />
        {years.map((year, i) => {
          const o = appear(i);
          const yy = yOf(year);
          const highlight = i === 1 ? win : 0;
          return (
            <g key={i} opacity={o} transform={`translate(0 ${(1 - o) * 12})`}>
              <circle cx={AXIS_X} cy={yy} r={34} fill={C.bg} stroke={i === 1 ? C.history : C.muted} strokeWidth={3} />
              <g transform={`translate(${AXIS_X} ${yy})`}><Icon kind={i} color={i === 1 ? C.history : C.ink} /></g>
              <text x={AXIS_X + 58} y={yy - 4} fill={C.ink} fontSize={38} fontWeight={600} fontFamily={FONT.display}>{t.events[i][0]}</text>
              <text x={AXIS_X + 58} y={yy + 32} fill={C.muted} fontSize={26} fontFamily={FONT.sans}>{t.events[i][1]}</text>
              {i === 1 && (
                <text x={AXIS_X + 58} y={yy + 74} fill={C.accent} fontSize={26} fontWeight={600} fontFamily={FONT.sans} opacity={highlight}>↓ {t.closer}</text>
              )}
            </g>
          );
        })}
        {bracket(PYRAMID, CLEOPATRA, b1, fmt(round(gap1), locale), C.muted)}
        {bracket(CLEOPATRA, MOON, b2, fmt(round(gap2), locale), win > 0 ? C.accent : C.muted)}
      </svg>
    </Stage>
  );
}
