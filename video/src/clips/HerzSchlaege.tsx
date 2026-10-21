// How often a heart beats: at about 70 beats a minute (the article gives it as the resting rate of a 70-year-old, as an example) that is
// 4,200 an hour, 100,800 a day, 36.8 million a year and about 2.9 billion in 80 years – computed, see the clip's
// content batch. A heart pulses at 70 bpm while the counters fill one after another.
import { useCurrentFrame } from "remotion";
import { C, ease, fmt, FONT, FPS, Stage, type Locale } from "../theme";

const BPM = 70;
const ROWS = [
  { de: "pro Minute", en: "a minute", value: BPM, unit: { de: "", en: "" } },
  { de: "pro Tag", en: "a day", value: BPM * 60 * 24, unit: { de: "", en: "" } },
  { de: "pro Jahr", en: "a year", value: (BPM * 60 * 24 * 365) / 1e6, unit: { de: " Mio.", en: " million" }, digits: 1 },
  { de: "in 80 Jahren", en: "in 80 years", value: (BPM * 60 * 24 * 365 * 80) / 1e9, unit: { de: " Mrd.", en: " billion" }, digits: 1 },
];
const T = { de: { topic: "Körper", title: "So oft schlägt dein Herz", note: "bei 70 Schlägen pro Minute" }, en: { topic: "Body", title: "How often your heart beats", note: "at 70 beats a minute" } };
const TIMING: [number, number][] = [[30, 70], [80, 130], [140, 190], [200, 262]];

export function HerzSchlaege({ locale }: { locale: Locale }) {
  const frame = useCurrentFrame();
  const t = T[locale];
  // one beat every 60/70 s: a quick swell and release
  const phase = ((frame / FPS) * BPM / 60) % 1;
  const beat = 1 + 0.12 * Math.exp(-((phase - 0.08) ** 2) / 0.004) + 0.06 * Math.exp(-((phase - 0.3) ** 2) / 0.004);
  return (
    <Stage topic={t.topic} color="#e58bb8">
      <div style={{ position: "absolute", top: 130, width: "100%", textAlign: "center", fontFamily: FONT.display, fontSize: 48, fontWeight: 600, opacity: ease(frame, 4, 18) }}>{t.title}</div>
      <svg width={720} height={240} viewBox="0 0 720 240" style={{ position: "absolute", top: 210 }}>
        <g transform={`translate(360 120) scale(${beat}) translate(-360 -120)`}>
          <path d="M360 205 C 250 140, 230 60, 300 45 C 335 38, 352 60, 360 80 C 368 60, 385 38, 420 45 C 490 60, 470 140, 360 205 Z" fill="#ff5a6e" />
          <path d="M318 70 C 300 78, 292 96, 296 112" stroke="#fff" strokeOpacity="0.35" strokeWidth="8" strokeLinecap="round" fill="none" />
        </g>
      </svg>
      <div style={{ position: "absolute", top: 430, left: 70, right: 70 }}>
        {ROWS.map((r, i) => {
          const [a, b] = TIMING[i];
          const p = ease(frame, a, b);
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "18px 0", borderBottom: `2px solid ${C.line}`, opacity: ease(frame, a - 10, a) }}>
              <span style={{ fontSize: 28, color: C.muted }}>{r[locale]}</span>
              <span style={{ fontFamily: FONT.display, fontSize: 52, fontWeight: 600, color: i === 3 ? "#ff5a6e" : C.ink }}>{fmt(r.value * p, locale, r.digits ?? 0)}{r.unit[locale]}</span>
            </div>
          );
        })}
        <div style={{ marginTop: 18, fontSize: 22, color: C.muted, textAlign: "right", opacity: ease(frame, 30, 45) }}>{t.note}</div>
      </div>
    </Stage>
  );
}
