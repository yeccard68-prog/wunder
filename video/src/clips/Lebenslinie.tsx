// A life on a timeline: name and dates, then four stations that appear one after another, each year counting up
// to its value. Used for the "Persönlichkeiten" clips (people.ts); every station is quoted from the linked article
// in the clip's content batch. Purely typographic – no portraits, so no picture rights are involved.
import { useCurrentFrame } from "remotion";
import { C, ease, FONT, SAFE_BOTTOM, Stage, type Locale } from "../theme";

export type Station = { year: number; approx?: boolean; de: string; en: string };
export type Person = {
  id: string;
  color: string;
  name: string;
  lived: { de: string; en: string };
  role: { de: string; en: string };
  topic: { de: string; en: string };
  stations: Station[];
};

const TOP = 300; // first station
const STEP = (SAFE_BOTTOM - 80 - TOP) / 3; // four stations above the app's captions; the last one keeps to one line
const START = 34; // frame when the first station appears
const EACH = 54; // frames between stations

export function Lebenslinie({ person, locale }: { person: Person; locale: Locale }) {
  const frame = useCurrentFrame();
  const n = person.stations.length;
  const lineEnd = TOP + STEP * (n - 1);
  const grow = ease(frame, START - 6, START + EACH * (n - 1) + 10);
  const first = person.stations[0].year;
  return (
    <Stage topic={person.topic[locale]} color={person.color}>
      {/* a large, faint initial as the only "picture" */}
      <div style={{ position: "absolute", right: -30, top: 120, fontFamily: FONT.display, fontWeight: 600, fontSize: 620, lineHeight: 1, color: person.color, opacity: 0.07 * ease(frame, 0, 30) }}>
        {person.name.split(" ").pop()![0]}
      </div>
      <div style={{ position: "absolute", top: 112, left: 64, right: 64, opacity: ease(frame, 2, 16), transform: `translateY(${(1 - ease(frame, 2, 16)) * 16}px)` }}>
        <div style={{ fontFamily: FONT.display, fontSize: person.name.length > 16 ? 56 : 64, fontWeight: 600, lineHeight: 1.05 }}>{person.name}</div>
        <div style={{ marginTop: 12, fontSize: 26, color: C.muted }}>
          {person.lived[locale]} · {person.role[locale]}
        </div>
      </div>
      <svg width={720} height={1280} style={{ position: "absolute", inset: 0 }}>
        <line x1={96} y1={TOP} x2={96} y2={lineEnd} stroke={C.line} strokeWidth={4} strokeLinecap="round" />
        <line x1={96} y1={TOP} x2={96} y2={TOP + (lineEnd - TOP) * grow} stroke={person.color} strokeWidth={4} strokeLinecap="round" />
      </svg>
      {person.stations.map((s, i) => {
        const at = START + i * EACH;
        const show = ease(frame, at, at + 12);
        const count = ease(frame, at, at + 22);
        // the first year counts up from 0 digits' worth, later ones from the previous station
        const from = i === 0 ? first - 40 : person.stations[i - 1].year;
        const year = Math.round(from + (s.year - from) * count);
        const y = TOP + i * STEP;
        return (
          <div key={i} style={{ position: "absolute", top: y - 26, left: 0, right: 0, opacity: show }}>
            <div style={{ position: "absolute", left: 96 - 14 * show, top: 26 - 14 * show, width: 28 * show, height: 28 * show, borderRadius: 14, background: person.color, boxShadow: `0 0 0 8px ${C.bg}` }} />
            <div style={{ position: "absolute", left: 140, right: 56, top: 0, transform: `translateX(${(1 - show) * 24}px)` }}>
              <div style={{ fontFamily: FONT.display, fontSize: 46, fontWeight: 600, lineHeight: 1, color: person.color, fontVariantNumeric: "tabular-nums" }}>
                {s.approx ? (locale === "de" ? "um " : "c. ") : ""}
                {year}
              </div>
              <div style={{ marginTop: 10, fontSize: 28, lineHeight: 1.25, color: C.ink }}>{s[locale]}</div>
            </div>
          </div>
        );
      })}
    </Stage>
  );
}
