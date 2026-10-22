// "On this day" clips for social media, one per event in content/days.json (already checked against the Wikipedia
// day article). The date, the year counting up on a moving ruler, then the event in one sentence, the source and
// the link. No "x years ago" in the picture, so a clip stays right every year. Rendered by days.mjs.
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { LINK } from "./Social";
import { C, ease, FONT, type Locale } from "./theme";

export const DAY_SECONDS = 8;

export type DayClipProps = { locale: Locale; date: string; year: number; text: string; source: string; color: string };

const T = {
  de: { kicker: "An diesem Tag", more: "Jeden Tag ein Stück Geschichte – mit Quelle" },
  en: { kicker: "On this day", more: "A piece of history every day – with sources" },
};

export function DayClip({ locale, date, year, text, source, color }: DayClipProps) {
  const frame = useCurrentFrame();
  const t = T[locale];
  const [m, d] = date.split("-").map(Number);
  const dayLabel = new Date(2001, m - 1, d).toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "long" });
  // the year runs up from a century earlier and settles
  const count = ease(frame, 12, 62);
  const shownYear = Math.round(year - 100 + 100 * count);
  const appear = (from: number, dist = 18) => ({ opacity: ease(frame, from, from + 10), transform: `translateY(${(1 - ease(frame, from, from + 10)) * dist}px)` });
  const end = ease(frame, 168, 182);
  const fade = interpolate(frame, [DAY_SECONDS * 30 - 10, DAY_SECONDS * 30], [1, 0], { extrapolateLeft: "clamp" });
  // ruler: one tick per year, the current year under the marker in the middle
  const PX = 9;
  const ticks = Array.from({ length: 121 }, (_, i) => shownYear - 60 + i);
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.ink, fontFamily: FONT.sans, opacity: fade }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: color }} />
      <div style={{ ...appear(0), position: "absolute", top: 120, left: 64, fontSize: 26, fontWeight: 600, letterSpacing: 4, color, textTransform: "uppercase" }}>{t.kicker}</div>
      <div style={{ ...appear(4), position: "absolute", top: 166, left: 64, fontFamily: FONT.display, fontSize: 64, fontWeight: 600 }}>{dayLabel}</div>
      <div style={{ ...appear(8), position: "absolute", top: 262, left: 56, fontFamily: FONT.display, fontSize: 210, fontWeight: 600, lineHeight: 1, color, fontVariantNumeric: "tabular-nums" }}>{shownYear}</div>
      <svg width={720} height={90} style={{ position: "absolute", top: 500, left: 0, opacity: ease(frame, 8, 18) * (1 - 0.6 * end) }}>
        {ticks.map((y) => {
          const x = 360 + (y - shownYear) * PX;
          if (x < -10 || x > 730) return null;
          const big = y % 10 === 0;
          return <line key={y} x1={x} x2={x} y1={big ? 18 : 32} y2={58} stroke={big ? C.muted : C.line} strokeWidth={big ? 3 : 2} />;
        })}
        <path d="M352 4 L368 4 L360 16 Z" fill={color} />
        <line x1={360} x2={360} y1={14} y2={66} stroke={color} strokeWidth={4} />
      </svg>
      <div style={{ position: "absolute", top: 630, left: 64, right: 64 }}>
        <div style={{ ...appear(66, 24), fontFamily: FONT.display, fontSize: text.length > 85 ? 46 : 52, fontWeight: 600, lineHeight: 1.16 }}>{text}</div>
        <div style={{ ...appear(84), marginTop: 22, fontSize: 24, color: C.muted }}>{source}</div>
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 150, opacity: end, transform: `translateY(${(1 - end) * 20}px)`, borderTop: `2px solid ${C.line}`, paddingTop: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 56 }}>
            Wunder<span style={{ color: C.accent }}>.</span>
          </span>
          <span style={{ fontSize: 28, color: C.muted }}>{LINK}</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 24, color: C.muted }}>{t.more}</div>
      </div>
    </AbsoluteFill>
  );
}
