// A life on a timeline: name and dates, then four stations that appear one after another, each year counting up
// to its value. Used for the "Persönlichkeiten" clips (people.ts); every station is quoted from the linked article
// in the clip's content batch. Purely typographic – no portraits, so no picture rights are involved.
// Layout: the app lays its title and text over the lower half of a clip and its buttons (like, share, …) along the
// right edge, so everything sits in the upper half and the station texts end well left of the buttons.
import { useCurrentFrame } from "remotion";
import { C, ease, FONT, Stage, type Locale } from "../theme";

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

const TOP = 300; // centre of the first station
const STEP = 102; // between stations: the last one ends at about y = 640, above the app's texts
const DOT_X = 76;
const YEAR_X = 112;
const TEXT_X = 284;
const TEXT_RIGHT = 585; // the app's buttons cover x > 610 on a phone
const START = 34; // frame when the first station appears
const EACH = 54; // frames between stations
const LEAVE = 10; // frames after a dot appears until the line sets off to the next one

export function Lebenslinie({ person, locale }: { person: Person; locale: Locale }) {
  const frame = useCurrentFrame();
  const n = person.stations.length;
  const lineEnd = TOP + STEP * (n - 1);
  // the line travels from dot to dot and arrives exactly when the next dot appears (slowing down into it)
  const smooth = (t: number) => t * t * (3 - 2 * t);
  let travelled = 0;
  for (let i = 0; i < n - 1; i++) {
    const from = START + i * EACH + LEAVE;
    travelled += smooth(Math.min(1, Math.max(0, (frame - from) / (START + (i + 1) * EACH - from))));
  }
  const head = TOP + STEP * travelled;
  const moving = travelled > 0 && travelled < n - 1 && travelled % 1 !== 0;
  const first = person.stations[0].year;
  const intro = ease(frame, 2, 16);
  return (
    <Stage topic={person.topic[locale]} color={person.color}>
      <div style={{ position: "absolute", top: 112, left: 64, right: 64, opacity: intro, transform: `translateY(${(1 - intro) * 16}px)` }}>
        <div style={{ fontFamily: FONT.display, fontSize: person.name.length > 22 ? 42 : person.name.length > 20 ? 46 : person.name.length > 16 ? 54 : 62, fontWeight: 600, lineHeight: 1.05 }}>{person.name}</div>
        <div style={{ marginTop: 10, fontSize: 25, color: C.muted }}>
          {person.lived[locale]} · {person.role[locale]}
        </div>
      </div>
      <svg width={720} height={720} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={DOT_X} y1={TOP} x2={DOT_X} y2={lineEnd} stroke={C.line} strokeWidth={4} strokeLinecap="round" />
        <line x1={DOT_X} y1={TOP} x2={DOT_X} y2={head} stroke={person.color} strokeWidth={4} strokeLinecap="round" />
        {moving && <circle cx={DOT_X} cy={head} r={7} fill={person.color} style={{ filter: `drop-shadow(0 0 8px ${person.color})` }} />}
      </svg>
      {person.stations.map((s, i) => {
        const at = START + i * EACH;
        const show = ease(frame, at, at + 12);
        const count = ease(frame, at, at + 22);
        // the first year counts up over a few decades, later ones from the previous station
        const from = i === 0 ? first - 40 : person.stations[i - 1].year;
        const year = Math.round(from + (s.year - from) * count);
        const y = TOP + i * STEP;
        return (
          <div key={i} style={{ opacity: show }}>
            <div style={{ position: "absolute", left: DOT_X - 13 * show, top: y - 13 * show, width: 26 * show, height: 26 * show, borderRadius: 13, background: person.color, boxShadow: `0 0 0 7px ${C.bg}` }} />
            <div style={{ position: "absolute", left: YEAR_X, top: y - 24, width: TEXT_X - YEAR_X - 8, fontFamily: FONT.display, fontWeight: 600, color: person.color, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
              {s.approx && <span style={{ fontSize: 22, marginRight: 6 }}>{locale === "de" ? "um" : "c."}</span>}
              <span style={{ fontSize: 42, lineHeight: "48px" }}>{year}</span>
            </div>
            <div style={{ position: "absolute", left: TEXT_X, width: TEXT_RIGHT - TEXT_X, top: y - 17, fontSize: 25, lineHeight: 1.25, color: C.ink, transform: `translateX(${(1 - show) * 20}px)` }}>{s[locale]}</div>
          </div>
        );
      })}
    </Stage>
  );
}
