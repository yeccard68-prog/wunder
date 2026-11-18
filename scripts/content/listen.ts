// Builds content/listen.json – the melodies of the listening cards ("Hörproben").
// Each theme is read from a <score> tag (LilyPond) of an English Wikipedia article at a fixed revision, so the notes are
// exactly what Wikipedia prints; nothing is transcribed by hand. Only works whose composers died long ago (public domain
// worldwide) – the app plays the notes with its own synthesizer, no recordings are used.
//   npx tsx scripts/content/listen.ts            → fetch the latest revision of each article and write the file
//   npx tsx scripts/content/listen.ts --check    → re-read the stored revisions and compare (no write)
import fs from "node:fs";
import { parseScore, type Note } from "../../lib/lilypond";

type Spec = { id: string; title: string; score: number; from?: number; beats?: number; composer: string; died: number };

// id = the question the snippet belongs to; score = index of the <score> tag in the article; from/beats = the excerpt in quarter notes
export const SPECS: Spec[] = [
  { id: "mk98", title: "Ode to Joy", score: 0, beats: 16, composer: "Ludwig van Beethoven", died: 1827 },
  { id: "mk99", title: "Eine kleine Nachtmusik", score: 0, composer: "Wolfgang Amadeus Mozart", died: 1791 },
  { id: "mk100", title: "In the Hall of the Mountain King", score: 1, composer: "Edvard Grieg", died: 1907 },
  { id: "mk101", title: "Radetzky March", score: 0, composer: "Johann Strauss I", died: 1849 },
  { id: "mk102", title: "Symphony No. 5 (Beethoven)", score: 0, composer: "Ludwig van Beethoven", died: 1827 },
  { id: "mk103", title: "Symphony No. 40 (Mozart)", score: 0, composer: "Wolfgang Amadeus Mozart", died: 1791 },
  { id: "mk104", title: "Symphony No. 94 (Haydn)", score: 0, from: 16, composer: "Joseph Haydn", died: 1809 },
  { id: "mk105", title: "Wiegenlied (Brahms)", score: 0, beats: 21, composer: "Johannes Brahms", died: 1897 },
];

export type Snippet = { id: string; title: string; composer: string; url: string; revid: number; bpm: number; notes: Note[] };

const OUT = "content/listen.json";
const API = "https://en.wikipedia.org/w/api.php";

async function wikitext(title: string, revid?: number): Promise<{ revid: number; text: string }> {
  const q = revid ? `revids=${revid}` : `titles=${encodeURIComponent(title)}`;
  let body = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(`${API}?action=query&prop=revisions&rvprop=ids|content&rvslots=main&format=json&formatversion=2&${q}`, { headers: { "User-Agent": "wunder-content-build" } });
    body = await r.text();
    if (r.ok && body.startsWith("{")) break;
    await new Promise((res) => setTimeout(res, 15000 * (attempt + 1))); // rate limited: wait and try again
  }
  const page = JSON.parse(body).query.pages[0];
  const rev = page.revisions[0];
  return { revid: rev.revid, text: rev.slots.main.content };
}

/** The notes from beat `from` on, cut after `beats` (notes that start inside the window are kept whole). */
export function excerpt(notes: Note[], from = 0, beats = Infinity): Note[] {
  const out: Note[] = [];
  let t = 0;
  for (const n of notes) {
    if (t >= from && t < from + beats) out.push(n);
    t += n.beats;
  }
  while (out.length && !out[out.length - 1].midi.length) out.pop(); // no trailing rests
  while (out.length && !out[0].midi.length) out.shift(); // nor leading ones
  return out;
}

async function build(spec: Spec, revid?: number): Promise<Snippet> {
  const { revid: rev, text } = await wikitext(spec.title, revid);
  const scores = [...text.matchAll(/<score[^>]*>([\s\S]*?)<\/score>/g)];
  const src = scores[spec.score]?.[1];
  if (!src) throw new Error(`${spec.id}: no <score> #${spec.score} in ${spec.title}`);
  const mel = parseScore(src);
  if (!mel) throw new Error(`${spec.id}: score #${spec.score} of ${spec.title} is not a single melody`);
  const notes = excerpt(mel.notes, spec.from, spec.beats);
  return { id: spec.id, title: spec.title, composer: spec.composer, url: `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(spec.title.replace(/ /g, "_"))}&oldid=${rev}`, revid: rev, bpm: Math.round(mel.bpm), notes };
}

async function main() {
  const check = process.argv.includes("--check");
  const old: Snippet[] = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : [];
  const out: Snippet[] = [];
  for (const spec of SPECS) {
    if (spec.died > new Date().getFullYear() - 71) throw new Error(`${spec.id}: ${spec.composer} died ${spec.died} – not yet public domain everywhere`);
    if (out.length) await new Promise((r) => setTimeout(r, 2000)); // Wikipedia asks scripts to go slowly
    const prev = old.find((s) => s.id === spec.id);
    const snip = await build(spec, check ? prev?.revid : undefined);
    if (check && JSON.stringify(snip) !== JSON.stringify(prev)) { console.error(`DIFF ${spec.id}`); process.exitCode = 1; }
    const secs = snip.notes.reduce((a, n) => a + n.beats, 0) * 60 / snip.bpm;
    console.log(`${spec.id} ${spec.title}: ${snip.notes.length} notes, ${secs.toFixed(1)} s (rev ${snip.revid})`);
    out.push(snip);
  }
  if (!check) fs.writeFileSync(OUT, "[\n" + out.map((s) => JSON.stringify(s)).join(",\n") + "\n]\n"); // one snippet per line
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/content/listen.ts")) main();
